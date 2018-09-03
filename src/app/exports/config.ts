
declare const InstallTrigger: any;

export const Config = {
    DEBUG: false,
    serverURL: "localhost:8080",//"https://enotes.site",
    isFirefox: typeof InstallTrigger !== 'undefined'
}