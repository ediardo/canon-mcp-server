

/**
 * Abstract class for a camera.
 * 
 * @abstract
 */
export abstract class Camera {
    /**
     * The manufacturer of the camera.
     */
    manufacturer!: string;

    /**
     * The model name of the camera.
     */
    modelName!: string;

    /**
     * The serial number of the camera.
     */
    serialNumber!: string;

    /**
     * The MAC address of the camera.
     */
    macAddress!: string;

    /**
     * Connect to the camera.
     * 
     * @returns {Promise<boolean>} True if the connection was successful, false otherwise.
     */
    abstract connect(): Promise<any>;

    /**
     * Disconnect from the camera.
     */
    abstract disconnect(): Promise<any>;

    /**
     * Take a photo.
     * 
     * @returns {Promise<string[]>} The path to the photo.
     */
    abstract takePhoto(): Promise<any>;
}
