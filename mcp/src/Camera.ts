
export abstract class Camera {
    manufacturer!: string;
    modelName!: string;
    serialNumber!: string;
    firmwareVersion!: string;
    macAddress!: string;

    abstract connect(): Promise<boolean>;
    abstract takePicture(): Promise<string[]>;
}
