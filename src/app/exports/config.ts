
declare const InstallTrigger: any;

export const Config = {
    DEBUG: true,
    serverURL: "https://enotes.site",
    isFirefox: typeof InstallTrigger !== 'undefined'
}