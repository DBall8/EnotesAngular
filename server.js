var http = require('http')
	, https = require('https')
	, fs = require('fs')
	, qs = require('querystring')
    , url = require('url')
    , express = require('express')
    , rHTTPS = require('express-http-to-https').redirectToHTTPS
    , sessions = require('client-sessions')
	, crypto = require('crypto')
	, pg = require('pg')
	, port = process.env.PORT || 8080


if (process.env.DATABASE_URL){
    var dbURL = process.env.DATABASE_URL;
}
else {
    var dbURL = require('./secrets.js').dbURL
}

// open the database
var db = new pg.Client(dbURL);
db.connect().then(() => {
    db.query('CREATE TABLE IF NOT EXISTS users (username VARCHAR(252), hash VARCHAR(252), salt VARCHAR(252), key VARCHAR(252) PRIMARY KEY)');
db.query('CREATE TABLE IF NOT EXISTS notes (key VARCHAR(252) REFERENCES users(key), tag VARCHAR(252), content VARCHAR(4096), x INTEGER, y INTEGER, width INTEGER, height INTEGER, zindex INTEGER, colors VARCHAR(512))')
    console.log("Successfully connected to database.");
}, (err) =>{
    console.error("Failed to connect to database.")
	console.error(err)
})

/*
var options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
};
*/

var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

var secretStr = process.env.SECRET_STR ? process.env.SECRET_STR : "kuayborn98uno9y8vor8yaionvol ya";
app.use(sessions({
    cookieName: 'session',
    secret: secretStr,
    duration: 3 * 24 * 60 * 60 * 1000,
    activeDuration: 3 * 24 * 60 * 60 * 1000,
}));

app.use(rHTTPS([/localhost:(\d{4})/], [/\/insecure/]));

app.use((req, res, next) => {

    var data = '';
    req.on('data', (d) => data += d);
    req.on('end', () => {
        req.body = data;
        next();
    });
})

app.use((req, res, next) => {
    if (req.session && req.session.username && req.session.key) {
        req.user = req.session.username;
        req.userkey = req.session.key;
    }
    next();
})

function requireLogin(req, res, next) {
    if (!req.user) {
        if(req.method == 'GET' && req.url == '/'){
            res.redirect('/login');
            res.end();
            return;
        }
        console.log("Redirect");
        //res.redirect("/login");
        res.end(JSON.stringify({ sessionExpired: true }));
    }
    else {
        next();
    }
}

app.get('/api', requireLogin, (req, res) => {
    getNotes(req, res);
})

app.post('/api', requireLogin, (req, res) => {
    addNote(req, res);
})

app.put('/api', requireLogin, (req, res) => {
    updateNote(req, res);
})

app.delete('/api', requireLogin, (req, res) => {
    deleteNote(req, res);
})

app.post('/login', (req, res) => {
    login(req, res);
})

app.post('/logout', requireLogin, (req, res) => {
    logout(req, res);
})

app.post('/newuser', (req, res) => {
    createNewUser(req, res);
})

app.all("*", (req, res, next) => {

    var uri = url.parse(req.url);
    var path =  './dist/notes' + uri.pathname

    if(uri.pathname !== '/' && fs.existsSync(path)){
        sendFile(res, path);
    }
    else{
        sendFile(res, './dist/notes/index.html');
    }
    
})

var activeClients = {};

// Set up sockets for updating active connections when data changes elsewhere
io.on('connect', (socket) => {
    console.log("Connected to " + socket.id);
    // tell the client its id
    socket.emit("ready", socket.id);

    socket.on("ready", (username) => {
        activeClients[socket.id] = { username: username, socket: socket };
        console.log(username + " is ready");
    })

    socket.on('disconnect', () => {
        console.log(socket.id + " disconnected.");
        if (activeClients[socket.id]) {
            delete activeClients[socket.id]
        }
    })
})


// start the server
server.listen(port, () => {
    console.log('Listening on :' + port);
});

function login(req, res) {

    // convert to json
    var input = JSON.parse(req.body);

    // search the users table of the database to see if the username is present
    var key = ''; // replace with a key if a username and password match a saved user 

    // (should only be called once)
    db.query("SELECT * FROM users WHERE username=$1", [input.username], function(err, resp){
        if(err){
            console.error("ERROR: could not access usernames\n" + err);
        }
        else{

            resp.rows.map((row) => {
                // hash the password with the same salt and see if it matches the hash saved for that username
                var hash = crypto.createHmac('sha512', row.salt);
                hash.update(input.password);
                var hashVal = hash.digest('hex');
                if(hashVal === row.hash){
                    console.log("LOGIN ACCEPTED: " + row.username)
                    req.session.username = row.username;
                    req.session.key = row.key;
                    key = row.key // save this key
                }
                else{
                    console.log("LOGIN FAILED: " + row.username)
                }
            })
			
			var response = {}
            // if a login was accepted then a key other than '' will have been stored
            if(key){
                // build a response object stating that the login was successful and send the generated sessionID
                res.writeHead(200);
                response = { successful: true };
                res.end(JSON.stringify(response));
                return;
            }
            else{
                // if no key stored, all logins failed, so send a response stating it was unsuccessful
                response = {successful: false};
            }
            // send response
            res.writeHead(200);
            res.end(JSON.stringify(response));
        }
    })
}

// logs the user sessionID out
function logout(req, res) {

    // get the sessionID in the request
    req.session.reset();
    // send response
    res.end();
}


// add a new user to the database
function createNewUser(req, res){
    var input = JSON.parse(req.body);

    // search db to see if username already exists
    var userExists = false;
    db.query("SELECT * FROM users WHERE username=$1", [input.username], function(err, resp){
        if(err){
            console.log(err);
        }
        else{
            // if the username already exists, say so in the response message
            if(resp.rows.length > 0){
                res.writeHead(200);
                res.end(JSON.stringify({
                    userAlreadyExists: true
                }))
                console.log("USER '" + input.username + "' ALREADY EXISTS")
            }
            else{
                // if username not found, create a new user
                newUser(input.username, input.password, req, res);
            }
        }
    });
	
}

// create a new user and send a response
function newUser(username, password, req, res){

    // generate a 128 byte salt
    var salt = crypto.randomBytes(128).toString('base64');
    // create a hash with the salt
    var hash = crypto.createHmac('sha512', salt);
    // update the hash with the password
    hash.update(password);

    // add a row to the users db table with the username, the hashed value, the salt used, and a unique key generated for this user
    var hashVal = hash.digest('hex');
    // gerenate a unique key and then insert the row 
    generateKey().then((key) => {
        db.query("INSERT INTO users VALUES($1, $2, $3, $4)", [username, hashVal, salt, key]).then(() => {
            // it worked so send a good response
			
            req.session.username = username;
            req.session.key = key;
            // send repsonse indicating that the user did not already exist so it was successful
            res.writeHead(200);
            res.end(JSON.stringify({
                userAlreadyExists: false,
            }));
            console.log("User: " + username + " successfully added.")
        }, (err) => { // on rejection
            // send an error response
            console.error("ERROR could not insert new user:\n" + err);
            res.writeHead(500);
        });
    });
}


// generates a unique key for each user for using to access that user's database
// A different database might be good to make this more efficient
function generateKey(){
    return new Promise((res, rej) => {getNewKey(res, rej)});
}

// generates a random number and sees if its already used, and repeats until a new one is found
function getNewKey(res, rej){
    // crypto safe random number
    var key = crypto.randomBytes(128).toString('base64');
    // search database to see if the key is already in use
    var alreadyExists = false;
    db.query("SELECT * FROM users WHERE key=$1", [key], function(error, resp){
        if(error){
            rej(error)
        }
        else{
            // if key in use, loop again recursively
            if(resp.rows.length > 0){
                getNewKey(res, rej);
            }
                // if key wasnt in use, resolve with the key
            else{
                res(key);
            }
        }
    })
}

// add a note to the database
function addNote(req, res) {

    var input = JSON.parse(req.body);

    // get the key corresponding to the supplied sessionID
    var key = req.userkey;

    // add the note to the database
    var values = [key, input.tag, input.content, input.x, input.y, input.width, input.height, input.zindex, input.colors]
        
    db.query('INSERT INTO notes VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', values).then(() =>{
        // successful
        console.log(input.tag + " successfully added")

        // notifty active connections that the note has been created
        Object.keys(activeClients).map((key => {
            if (activeClients[key].username == req.user && activeClients[key].socket.id != input.socketid) {
                activeClients[key].socket.emit("create", req.body);
            }
        }))

        res.writeHead(200);
        var response = {
            successful: true,
            sessionExpired: false
        }
        res.end(JSON.stringify(response));
        }, (err) =>{
            // rejected
            console.error("Could not insert new note:")
            console.error(err)
                res.writeHead(500);
            res.end();
        });	
}

// delete a note from the database
    function deleteNote(req, res){
    console.log(req.body);
    var input = JSON.parse(req.body);

    // get key stored with sessionID
    var key = req.userkey;
        
    // delete note from database
    db.query("DELETE FROM notes WHERE key=$1 AND tag=$2", [key, input.tag]).then(() => {
        console.log(input.tag + " successfully deleted")

        // notifty active connections that the note has been deleted
        Object.keys(activeClients).map((key => {
            if (activeClients[key].username == req.user && activeClients[key].socket.id != input.socketid) {
                activeClients[key].socket.emit("delete", input.tag);
            }
        }))

        res.writeHead(200)
        var response = {
            successful: true,
            sessionExpired: false
        }
        res.end(JSON.stringify(response));
    }, (err) =>{
            console.error("ERROR Could not delete note:\n" + err);
            res.writeHead(500)
            res.end();
    })
	
}


// update a note in the database
function updateNote(req, res){
    var input = JSON.parse(req.body);

    // get the key stored with the sessionID
    var key = req.userkey;

    // update contents of the note
    var arr = [input.newcontent, input.newx, input.newy, input.newW, input.newH, input.newZ, input.newColors, key, input.tag]
    db.query("UPDATE notes SET content=$1, x=$2, y=$3, width=$4, height=$5, zindex=$6, colors=$7 WHERE key=$8 AND tag=$9", arr).then(() => {

        // notifty active connections that the note has updated
        Object.keys(activeClients).map((key => {
            if (activeClients[key].username == req.user && activeClients[key].socket.id != input.socketid) {
                activeClients[key].socket.emit("update", req.body);
            }
        }))
        

            res.writeHead(200)
            var response = {
                successful: true,
                sessionExpired: false
            }
            res.end(JSON.stringify(response));
        }, (err) => {
            console.error("ERROR could not update note" + input.tag + ":\n" + err);
            res.writeHead(500)
            res.end()
        });
}

// send all the notes stored for a user
function getNotes(req, res) {
    var uri = url.parse(req.url)
    // read query sessionID
    var input = qs.parse(uri.query);
    var result = [];

    var key = req.session.key;
	
    // collect all notes stored for the user in an array
    db.query("SELECT tag, content, x, y, width, height, zindex, colors FROM notes WHERE key=$1", [key], function(error, resp){
        // send the array
        res.writeHead(200, {'Content-type': 'application/json'});
        var response = {
            username: req.user,
            notes: resp.rows,
            successful: true,
            sessionExpired: false
        }
        res.end(JSON.stringify(response))
    })
	
}


// send a file
function sendFile(res, filename, type) {
    type = type || 'text/html'
    fs.readFile(filename, function (error, content) {
        if (error) {
            console.log(error);
        }
        res.writeHead(200, { 'Content-type': type });
        res.end(content, 'utf-8');

    })
}


