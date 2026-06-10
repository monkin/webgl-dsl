declare module "*.png" {
    const fileName: string;
    export default fileName;
}

declare module "*?url" {
    const url: string;
    export default url;
}

declare module "*.json" {
    const json: any;
    export default json;
}
