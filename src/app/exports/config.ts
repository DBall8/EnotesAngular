
declare const InstallTrigger: any;

export const Config = {
    DEBUG: false,
    serverURL: "https://enotes.site",
    isFirefox: typeof InstallTrigger !== 'undefined'
}