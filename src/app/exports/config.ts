
declare const InstallTrigger: any;

/**
    Simple object for getting system configurations
*/
export const Config = {
    DEBUG: false,
    serverURL: "https://enotes.site",
    isFirefox: typeof InstallTrigger !== 'undefined'
}