import { Camera } from '../Camera.js';
import { CameraBusyError, LiveViewNotStartedError, LiveViewAlreadyStartedError, CameraError } from '../Error.js';

// Interface for an API endpoint with supported methods
interface ApiEndpoint {
    path: string;
    get: boolean;
    post: boolean;
    put: boolean;
    delete: boolean;
    version: string;
}

// Interface for API version features
interface ApiVersionFeatures {
    [version: string]: ApiEndpoint[];
}

interface CanonContent {
    name?: string;
    path: string;
}

interface CanonContents {
    name?: string;
    path: string[];
}

interface CanonMessage {
    message: string;
}

interface CanonDeviceInformation {
    manufacturer: string;
    productname: string;
    guid: string;
    serialnumber: string;
    firmwareversion: string;
    macaddress: string;
}

interface CanonDeviceStatusBattery {
    kind: string;
    name: string;
    quality: string;
    level: string;
}

interface CanonLiveViewFlipDetailResponse {
    info: {
        liveviewdata: {
            histogram: number[][];
            afframe: any[];
            image: {
                positionx: number;
                positiony: number;
                positionwidth: number;
                positionheight: number;
                sizex: number;
                sizey: number;
            };
            visible: any;
            zoom: any;
            diorama: any;
            systemtime: any;
        };
        angleinformation: {
            cameraposture: number;
            rolling: number;
            pitching: number;
        };
    };
}

interface CanonStorageStatus {
    storagelist: {
        name: string;
        url: string;
        accesscapability: string;
        maxsize: number;
        spacesize: number;
        contentsnumber: number;
    }[];
}

interface CanonDateTimeSetting {
    datetime: string;
    dst: boolean;
}

interface CanonTemperatureStatus {
    status: string;
}

interface CanonLensInformation {
    mount: boolean;
    name: string;
}

interface CanonLiveViewImageFlipDetail {
    info?: any;
    image?: string;
}

interface CanonSetting {
    value: string;
    ability: string[];
}

interface CanonExposureCompensationSetting {
    value: string;
    ability: string[];
}

export interface CanonWhiteBalanceSetting {
    value: string;
    ability: string[];
}

interface CanonColorTemperatureSetting {
    value: number;
    ability: {
        min: number;
        max: number;
        step: number;
    };
}

export enum CanonHDRMode {
    OFF = 'off',
    PQ = 'pq',
}

export interface CanonHdrMode {
    value: string;
    ability: string[];
}
interface CanonShootingModeSetting {
    value: string;
    ability: string[];
}

export interface CanonShootingSettings {
    shootingmode?: {
        value: string;
        ability: string[];
    };
    shootingmodedial?: {
        value: string;
        ability: string[];
    };
    shootingmodedial_movie?: {
        value: string;
        ability: string[];
    };
    av?: {
        value: string;
        ability: string[];
    };
    tv?: {
        value: string;
        ability: string[];
    };
    iso?: {
        value: string;
        ability: string[];
    };
    exposure?: {
        value: string;
        ability: string[];
    };
    wb?: {
        value: string;
        ability: string[];
    };
    colortemperature?: {
        value: number;
        ability: {
            min: number;
            max: number;
            step: number;
        };
    };
    afoperation?: {
        value: string;
        ability: string[];
    };
    afmethod?: {
        value: string;
        ability: string[];
    };
    stillimagequality?: {
        value: {
            jpeg: CanonJpegQuality;
            raw: CanonRawQuality;
        };
        ability: {
            jpeg: string[];
            raw: string[];
        };
    };
    stillimageaspectratio?: {
        value: string;
        ability: string[];
    };
    flash?: {
        value: string;
        ability: string[];
    };
    metering?: {
        value: string;
        ability: string[];
    };
    drive?: {
        value: string;
        ability: string[];
    };
    aeb?: {
        value: string;
        ability: string[];
    };
    focusbracketing?: {
        value: string;
        ability: string[];
    };
    focusbracketing_exposuresmoothing?: {
        value: string;
        ability: string[];
    };
    focusbracketing_focusincrement?: {
        value: string;
        ability: string[];
    };
    focusbracketing_numberofshots?: {
        value: string;
        ability: string[];
    };
    wbshift?: {
        value: string;
        ability: string[];
    };
    wbbracket?: {
        value: string;
        ability: string[];
    };
    colorspace?: {
        value: string;
        ability: string[];
    };
    picturestyle?: {
        value: string;
        ability: string[];
    };
    picturestyle_auto?: {
        value: string;
        ability: string[];
    };
    picturestyle_standard?: {
        value: string;
        ability: string[];
    };
    picturestyle_portrait?: {
        value: string;
        ability: string[];
    };
    picturestyle_landscape?: {
        value: string;
        ability: string[];
    };
    picturestyle_finedetail?: {
        value: string;
        ability: string[];
    };
    picturestyle_neutral?: {
        value: string;
        ability: string[];
    };
    picturestyle_faithful?: {
        value: string;
        ability: string[];
    };
    picturestyle_monochrome?: {
        value: string;
        ability: string[];
    };
    picturestyle_userdef1?: {
        value: string;
        ability: string[];
    };
    picturestyle_userdef1_basepicturestyle?: {
        value: string;
        ability: string[];
    };
    picturestyle_userdef2?: {
        value: string;
        ability: string[];
    };
    picturestyle_userdef2_basepicturestyle?: {
        value: string;
        ability: string[];
    };
    picturestyle_userdef3?: {
        value: string;
        ability: string[];
    };
    picturestyle_userdef3_basepicturestyle?: {
        value: string;
        ability: string[];
    };
    moviequality?: {
        value: string;
        ability: string[];
    };
    soundrecording?: {
        value: string;
        ability: string[];
    };
    soundrecording_level?: {
        value: string;
        ability: string[];
    };
    soundrecording_windfilter?: {
        value: string;
        ability: string[];
    };
    soundrecording_attenuator?: {
        value: string;
        ability: string[];
    };
}

export enum CanonContentType {
    ALL = 'all',
    JPEG = 'jpeg',
    CR2 = 'cr2',
    CR3 = 'cr3',
    WAV = 'wav',
    MP4 = 'mp4',
    MOV = 'mov',
}

enum CanonFeatures {
    DEVICE_INFORMATION = 'deviceinformation',
    DEVICE_STATUS_BATTERY = 'devicestatus/battery',
}

export enum CanonVersion {
    VER100 = 'ver100',
    VER110 = 'ver110',
    VER120 = 'ver120',
    VER130 = 'ver130',
    VER140 = 'ver140',
}

export enum CanonShootingMode {
    MANUAL = 'm',
    APERTURE_PRIORITY = 'av',
    SHUTTER_PRIORITY = 'tv',
    PROGRAM_AE = 'p',
    FLEXIBLE_PRIORITY = 'fv',
    SCENE_INTELLIGENT_AUTO = 'a+',
    CUSTOM_MODE_3 = 'c3',
    CUSTOM_MODE_2 = 'c2',
    CUSTOM_MODE_1 = 'c1',
    BULB = 'bulb',
}

export enum CanonShutterButtonAction {
    Release = 'release',
    HalfPress = 'half_press',
    FullPress = 'full_press',
}

export enum CanonShutterMode {
    ELECTRONIC_FIRST_CURTAIN = 'elec_1st_curtain',
    MECHANICAL = 'mechanical',
    ELECTRONIC = 'electronic',
}

export enum CanonWhiteBalanceMode {
    AUTO = 'auto', // Auto: Ambience priority
    AWB_WHITE = 'awbwhite', // Auto: White priority
    DAYLIGHT = 'daylight', // Sunlight
    SHADE = 'shade', // Shade
    CLOUDY = 'cloudy', // Cloudy
    TUNGSTEN = 'tungsten', // Incandescent light bulb
    WHITE_FLUORESCENT = 'whitefluorescent', // White fluorescent light
    FLASH = 'flash', // Flash
    CUSTOM = 'custom', // Custom
    COLOR_TEMP = 'colortemp', // Color temp.
}

export enum CanonLiveViewImageDetail {
    INFO = 'info',
    IMAGE = 'image',
    BOTH = 'both',
}

interface CanonConnectOptions {
    startLiveView?: boolean;
}

interface CanonOwnerName {
    name: string;
}

export enum CanonLiveViewSize {
    OFF = 'off',
    SMALL = 'small',
    MEDIUM = 'medium',
}

export enum CanonContentKind {
    /**
     * Main data (Default when kind is not designated)
     */
    MAIN = 'main',
    /**
     * An Exif compliant small 160 x 120 pixel image.
     */
    THUMBNAIL = 'thumbnail',
    /**
     * A short side 1080 pixel display image consisting of a Multi Picture
     * Format (MPF) compliant display image embedded in a RAW image or
     * a JPEG image.
     */
    DISPLAY = 'display',
    /**
     * An L size equivalent JPEG image embedded in a RAW image.
     */
    EMBEDDED = 'embedded',
    /**
     * File information
     */
    INFO = 'info',
}

export interface CanonContentInfo {
    filesize: number;
    protect: 'enable' | 'disable';
    archive: 'enable' | 'disable';
    rotate: '0' | '90' | '180' | '270';
    rating: 'off' | '1' | '2' | '3' | '4' | '5';
    lastmodifieddate: string;
    playtime: number | null;
    hdr: 'on' | 'off';
}

export enum CanonJpegQuality {
    NONE = 'none',
    LARGE_FINE = 'large_fine',
    LARGE_NORMAL = 'large_normal',
    MEDIUM_FINE = 'medium_fine',
    MEDIUM_NORMAL = 'medium_normal',
    LARGE = 'large',
    MEDIUM = 'medium',
    MEDIUM1 = 'medium1',
    MEDIUM2 = 'medium2',
    SMALL = 'small',
    SMALL1 = 'small1',
    SMALL1_FINE = 'small1_fine',
    SMALL1_NORMAL = 'small1_normal',
    SMALL2 = 'small2',
}

export enum CanonRawQuality {
    NONE = 'none',
    RAW = 'raw',
    CRAW = 'craw',
}

export enum CanonFlashMode {
    AUTO = 'auto',
    ON = 'on',
    SLOW_SYNCHRO = 'slowsynchro',
    OFF = 'off',
}

export interface CanonConnectResult {
    currentDirectory: CanonContent;
    shootingSettings: CanonShootingSettings;
    manufacturer: string;
    modelName: string;
    serialNumber: string;
    firmwareVersion: string;
    macAddress: string;
    lensInformation: CanonLensInformation;
}

export enum CanonStillImageAspectRatio {
    THREE_TWO = '3:2',
    X1_6 = 'x1.6',
    FOUR_THREE = '4:3',
    SIXTEEN_NINE = '16:9',
    ONE_ONE = '1:1',
}

export type CanonEnableDisable = 'enable' | 'disable';

export class Canon extends Camera {
    baseUrl: string;
    ipAddress: string;
    port: number;
    https: boolean;
    username?: string;
    password?: string;
    features?: ApiVersionFeatures;
    storages?: CanonContents;
    directories?: CanonContents;
    contentsNumber?: number;
    pageNumber?: number;
    currentStorage?: CanonContent;
    currentDirectory?: CanonContent;
    lastPageContents?: CanonContents;
    isSyncActive: boolean = false;
    shootingMode?: string;
    ignoreShootingModeDial: boolean = false;
    shootingSettings?: any;
    apertureSetting?: string;
    shutterSpeedSetting?: string;
    isoSetting?: string;
    autoFocusSetting?: string;
    lensInformation?: CanonLensInformation;
    intervalMode: boolean = false;
    intervalInterval: number = 0;
    intervalRepeat: number = 0;
    firmwareVersion?: string;

    constructor(ipAddress: string, port: number = 443, https: boolean, username?: string, password?: string) {
        super();
        this.ipAddress = ipAddress;
        this.port = port;
        this.https = https;
        this.username = username;
        this.password = password;
        this.baseUrl = `${this.https ? 'https' : 'http'}://${this.ipAddress}:${this.port}`;
    }

    async connect({ startLiveView = false }: CanonConnectOptions = {}): Promise<CanonConnectResult> {
        const headers = new Headers();

        try {
            const response = await fetch(`${this.baseUrl}/ccapi`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                const errorMessage = `HTTP error! status: ${response.status} for ${this.baseUrl}`;
                throw new Error(errorMessage);
            }

            this.features = (await response.json()) as ApiVersionFeatures;

            this.currentDirectory = await this.getCurrentDirectory();
            const deviceInformation = await this.getDeviceInformation();
            this.shootingSettings = await this.getShootingSettings();
            this.manufacturer = deviceInformation.manufacturer;
            this.modelName = deviceInformation.productname;
            this.serialNumber = deviceInformation.serialnumber;
            this.firmwareVersion = deviceInformation.firmwareversion;
            this.macAddress = deviceInformation.macaddress;
            this.lensInformation = await this.getLensInformation();

            if (startLiveView) {
                await this.startLiveView(CanonLiveViewSize.SMALL, 'keep');
            }

            return {
                currentDirectory: this.currentDirectory,
                shootingSettings: this.shootingSettings,
                manufacturer: this.manufacturer,
                modelName: this.modelName,
                serialNumber: this.serialNumber,
                firmwareVersion: this.firmwareVersion,
                macAddress: this.macAddress,
                lensInformation: this.lensInformation,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Disconnect from the camera.
     *
     * This will stop the live view stream, stop the event polling, stop the event monitoring, and stop the interval photos. CCAPI does not support disconnecting from the camera per se, so this is a best effort.
     */
    async disconnect(): Promise<any> {
        this.stopLiveViewImageScroll();
        this.stopEventPolling();
        this.stopEventMonitoring();
        this.stopIntervalPhotos();
    }

    /**
     * Processes a live view stream from the camera by reading chunks of JPEG data.
     * Each chunk starts with a hex size followed by newline, then contains the JPEG bytes.
     * Calls the provided callback with each JPEG frame as a Blob.
     *
     * @param stream - ReadableStream containing chunked JPEG data from the camera
     * @param onFrame - Callback function that receives each JPEG frame as a Blob
     * @returns Promise that resolves when the stream is fully processed
     */
    public static async processLiveViewStream(
        stream: ReadableStream<Uint8Array>,
        onFrame: (blob: Blob) => void
    ): Promise<void> {
        const reader = stream.getReader();
        let buffer = new Uint8Array();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (!value) continue;

            // Append to buffer
            const newBuffer = new Uint8Array(buffer.length + value.length);
            newBuffer.set(buffer);
            newBuffer.set(value, buffer.length);
            buffer = newBuffer;

            // Scan for JPEG start (0xFFD8) and end (0xFFD9) markers
            let start = buffer.indexOf(0xff);
            while (start !== -1 && start < buffer.length - 1) {
                if (buffer[start + 1] === 0xd8) break; // Found JPEG SOI
                start = buffer.indexOf(0xff, start + 1);
            }

            if (start === -1) {
                buffer = new Uint8Array(); // Clear buffer if no SOI
                continue;
            }

            // Find EOI (0xFFD9)
            let end = start + 2;
            while (end < buffer.length - 1) {
                if (buffer[end] === 0xff && buffer[end + 1] === 0xd9) {
                    end += 2; // Include EOI
                    const jpegData = buffer.slice(start, end);
                    onFrame(new Blob([jpegData], { type: 'image/jpeg' }));
                    buffer = buffer.slice(end); // Trim processed data
                    start = buffer.indexOf(0xff); // Look for next JPEG
                    end = start + 2;
                } else {
                    end++;
                }
            }

            // If no full JPEG found, keep buffer and continue
        }
    }

    /**
     * Processes the multipart stream of JPEG images from the camera live view.
     *
     * @param stream ReadableStream<Uint8Array> - the stream from startLiveViewImageMultipart()
     * @param onImage Callback function that receives each decoded JPEG image as Uint8Array
     */
    public static async processLiveViewImageMultipart(
        stream: ReadableStream<Uint8Array>,
        onImage: (data: Uint8Array) => Promise<void> | void
    ): Promise<void> {
        const reader = stream.getReader();
        const decoder = new TextDecoder('utf-8');
        const boundary = '--boundary';
        let buffer = new Uint8Array();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            // Append new data to the buffer
            if (value) {
                const newBuffer = new Uint8Array(buffer.length + value.length);
                newBuffer.set(buffer);
                newBuffer.set(value, buffer.length);
                buffer = newBuffer;
            }

            while (true) {
                const text = decoder.decode(buffer, { stream: true });

                const boundaryIndex = text.indexOf(boundary);
                if (boundaryIndex === -1) break;

                const nextBoundaryIndex = text.indexOf(boundary, boundaryIndex + boundary.length);
                if (nextBoundaryIndex === -1) break;

                // Extract the multipart chunk
                const chunkText = text.slice(boundaryIndex, nextBoundaryIndex);
                const chunkStart = boundaryIndex;
                const chunkEnd = nextBoundaryIndex;

                const headersEnd = chunkText.indexOf('\r\n\r\n');
                if (headersEnd === -1) break;

                // Parse headers to find content-length
                const headerSection = chunkText.slice(0, headersEnd);
                const contentLengthMatch = headerSection.match(/Content-Length:\s*(\d+)/i);
                if (!contentLengthMatch) break;

                const contentLength = parseInt(contentLengthMatch[1]);
                const contentStartIndex = text.indexOf('\r\n\r\n', boundaryIndex) + 4;

                const binaryStart = buffer.indexOf(0xff, contentStartIndex); // JPEG start marker
                const binaryEnd = binaryStart + contentLength;

                if (binaryEnd > buffer.length) break;

                const imageData = buffer.slice(binaryStart, binaryEnd);

                try {
                    await onImage(imageData);
                } catch (e) {
                    console.error('Error processing image chunk:', e);
                }

                buffer = buffer.slice(chunkEnd);
            }
        }
    }

    public static async processEventMonitoringStream(
        stream: ReadableStream<Uint8Array>,
        onEvent: (event: any) => void
    ): Promise<void> {
        const reader = stream.getReader();
        let buffer = new Uint8Array();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (!value) continue;

            // Append new data to existing buffer
            const newBuffer = new Uint8Array(buffer.length + value.length);
            newBuffer.set(buffer);
            newBuffer.set(value, buffer.length);
            buffer = newBuffer;

            // Process complete events
            while (buffer.length >= 6) {
                // Minimum event size (2 marker + 1 type + 4 length)
                // Look for start marker 0xFF 0x00
                if (buffer[0] !== 0xff || buffer[1] !== 0x00) {
                    buffer = buffer.slice(1);
                    continue;
                }

                // Get event type and length
                const type = buffer[2];
                const length = (buffer[3] << 24) | (buffer[4] << 16) | (buffer[5] << 8) | buffer[6];

                // Check if we have complete event
                if (buffer.length < length + 7) break;

                // Extract event data
                const eventData = buffer.slice(7, length + 7);
                const decoder = new TextDecoder();
                try {
                    const jsonStr = decoder.decode(eventData);
                    const event = JSON.parse(jsonStr);
                    onEvent(event);
                } catch (e) {
                    console.error('Failed to parse event data:', e);
                }

                // Remove processed event from buffer
                buffer = buffer.slice(length + 7);
            }
        }
    }

    private static getSDPIpAddress(sdp: string): string | null {
        const lines = sdp.split('\n');
        for (const line of lines) {
            if (line.startsWith('o=')) {
                const parts = line.split(' ');
                // IP address is the last part in the 'o=' line
                return parts[parts.length - 1];
            }
        }
        return null;
    }

    async takePhoto(): Promise<any> {
        try {
            //await this.startEventPolling();
            const response = await this.shutterbutton();

            return response;
        } catch (error) {
            throw error;
        }
    }

    async startIntervalPhotos(interval: number, repeat: number) {
        this.intervalMode = true;
        this.intervalInterval = interval;
        this.intervalRepeat = repeat;

        while (this.intervalMode && this.intervalRepeat > 0) {
            await this.shutterbutton();
            await new Promise((resolve) => setTimeout(resolve, this.intervalInterval));
            this.intervalRepeat--;
        }
    }

    async getIntervalPhotosStatus() {
        return {
            intervalMode: this.intervalMode,
            intervalInterval: this.intervalInterval,
            intervalRepeat: this.intervalRepeat,
        };
    }

    async pauseIntervalPhotos() {
        this.intervalMode = false;
    }

    async resumeIntervalPhotos() {
        this.intervalMode = true;
    }

    async stopIntervalPhotos() {
        this.intervalMode = false;
        this.intervalInterval = 0;
        this.intervalRepeat = 0;
    }

    /**
     * Get the owner name set in the camera
     *
     * Makes a GET request to /functions/registeredname/ownername to retrieve the owner name
     * Note: Not supported on cameras with AVF - check camera compatibility
     *
     * @returns {Promise<CanonOwnerName>} Object containing the owner name
     * Example response:
     * {
     *   "ownername": "John Smith"
     * }
     * @throws {Error} When owner name feature not found or request fails
     */
    async getOwnerName(): Promise<CanonOwnerName> {
        const endpoint = this.getFeatureUrl('functions/registeredname/ownername');

        if (!endpoint) {
            throw new Error('Owner name feature not found');
        }

        const response = await fetch(endpoint.path);

        if (!response.ok) {
            throw new Error(`Failed to get owner name: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Set the owner name in the camera
     *
     * Makes a PUT request to /functions/registeredname/ownername to update the owner name
     * Note: Not supported on cameras with AVF - check camera compatibility
     * The camera cannot be operated while updating is in progress.
     * The set value will be recorded in Exif and other image metadata of shot images.
     *
     * @param {string} name - New owner name (ASCII only, max 31 characters)
     * @returns {Promise<CanonOwnerName>} Object containing the updated owner name
     * Example response:
     * {
     *   "ownername": "John Smith"
     * }
     * @throws {Error} When:
     * - Owner name feature not found
     * - Invalid parameter (non-ASCII chars, >31 chars)
     * - Device is busy
     * - Mode not supported
     */
    async setOwnerName(name: string): Promise<CanonOwnerName> {
        const endpoint = this.getFeatureUrl('functions/registeredname/ownername');

        if (!endpoint) {
            throw new Error('Owner name feature not found');
        }

        const response = await fetch(endpoint.path, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ownername: name,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to set owner name: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get the date and time settings from the camera
     *
     * Makes a GET request to /functions/datetime to retrieve the current date/time settings
     *
     * @returns {Promise<CanonDateTimeSetting>} Object containing date/time settings
     * Example response:
     * {
     *   "datetime": "Tue, 01 Jan 2019 01:23:45 +0900", // RFC1123 compliant date/time string
     *   "dst": false                                    // Daylight savings time enabled/disabled
     * }
     * @throws {Error} When datetime feature not found or request fails
     */
    async getDateTimeSetting(): Promise<CanonDateTimeSetting> {
        const url = this.getFeatureUrl('functions/datetime');

        if (!url) {
            throw new Error('Device status datetime feature not found');
        }

        const response = await fetch(url.path);

        if (!response.ok) {
            throw new Error(`Failed to get date/time settings: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get battery status information
     *
     * Makes a GET request to /devicestatus/battery to retrieve information about the battery mounted in the camera
     * Note: When battery grip is attached, this API cannot get detailed battery information - use getBatteryList() instead
     *
     * @returns {Promise<CanonDeviceStatusBattery>} Object containing battery information
     * Example response:
     * {
     *   "name": "LP-E12",        // Battery name or "unknown"
     *   "kind": "battery",       // Type: battery, ac_adapter, dc_coupler, batterygrip, not_inserted, unknown
     *   "level": "full",         // Level: full, high, half, quarter, low, charge, chargestop, chargecomp, none, unknown
     *   "quality": "good"        // Quality: good, normal, bad, unknown
     * }
     * @throws {Error} When battery status feature not found or request fails
     */
    async getBatteryStatus(): Promise<CanonDeviceStatusBattery> {
        const url = this.getFeatureUrl('devicestatus/battery');

        if (!url) {
            throw new Error('Device status battery feature not found');
        }

        try {
            const response = await fetch(url.path);

            if (!response.ok) {
                throw new Error(`Failed to get battery status: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    }

    async getContentsNumber(directoryPath: string) {
        const contents = await this.getContents({
            directoryPath,
            type: CanonContentType.JPEG,
            kind: 'number',
        });

        return {
            contentsNumber: contents.contentsnumber,
            pageNumber: contents.pagenumber,
        };
    }

    async getCurrentStorage(): Promise<CanonContent> {
        const url = this.getFeatureUrl('devicestatus/currentstorage');

        if (!url) {
            throw new Error('Current storage feature not found');
        }

        const response = await fetch(url.path);

        return response.json();
    }

    async getCurrentDirectory(): Promise<CanonContent> {
        const url = this.getFeatureUrl('devicestatus/currentdirectory');

        if (!url) {
            throw new Error('Current directory feature not found');
        }

        const response = await fetch(url.path);

        return response.json();
    }

    async getContents({
        directoryPath,
        type,
        kind,
        order,
        page,
    }: {
        directoryPath: string;
        type?: CanonContentType;
        kind?: string;
        order?: string;
        page?: number;
    }) {
        const url = this.baseUrl;

        // Create URLSearchParams object for query parameters
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (kind) params.append('kind', kind);
        if (order) params.append('order', order);
        if (page) params.append('page', page.toString());

        // Construct the full URL with query parameters
        const queryString = params.toString();
        const fullUrl = new URL(directoryPath, url);
        if (queryString) {
            fullUrl.search = queryString;
        }
        const requestUrl = fullUrl.toString();

        const response = await fetch(requestUrl);

        return response.json();
    }

    async getDirectories(storagePath: string) {
        const url = this.baseUrl;

        const response = await fetch(`${url}${storagePath}`);

        this.directories = (await response.json()) as CanonContents;

        return this.directories;
    }

    async getDeviceInformation(): Promise<CanonDeviceInformation> {
        const url = this.getFeatureUrl('deviceinformation');

        if (!url) {
            throw new Error('Device information feature not found');
        }

        const response = await fetch(url.path);

        return response.json();
    }

    async getStorageStatus(): Promise<CanonStorageStatus> {
        const url = this.getFeatureUrl('devicestatus/storage');

        if (!url) {
            throw new Error('Storage status feature not found');
        }

        const response = await fetch(url.path);

        return response.json();
    }

    async getTemperatureStatus(): Promise<CanonTemperatureStatus> {
        const url = this.getFeatureUrl('devicestatus/temperature');

        if (!url) {
            throw new Error('Temperature status feature not found');
        }

        const response = await fetch(url.path);

        return response.json();
    }

    async getSDP(): Promise<string> {
        const url = this.getFeatureUrl('shooting/liveview/rtpsessiondesc');

        if (!url) {
            throw new Error('SDP feature not found');
        }

        const response = await fetch(url.path);

        return response.text();
    }

    /**
     * Start event monitoring in chunk format
     *
     * Makes a GET request to /event/monitoring to start receiving event data in binary chunks.
     * Each chunk contains event data in a binary format with markers and length fields.
     *
     * The binary format is:
     * - Start marker: 0xFF 0x00
     * - Type byte
     * - 4 byte length (big-endian)
     * - Data bytes
     *
     * @returns {Promise<any>} Empty object on success
     * @throws {Error} When:
     * - Event monitoring feature not found
     * - Response body reader not available
     * - Event monitoring already started (503 status)
     */
    async startEventMonitoring(): Promise<any> {
        const url = this.getFeatureUrl('event/monitoring');

        if (!url) {
            throw new Error('Event monitoring feature not found');
        }

        const response = await fetch(url.path, {
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to get live view image scroll');
        }

        if (!response.body) {
            throw new Error('No response body received');
        }

        return response.body;
    }

    /**
     * Stop the event monitoring
     *
     * @returns
     */
    async stopEventMonitoring(): Promise<any> {
        const url = this.getFeatureUrl('event/monitoring');

        if (!url) {
            throw new Error('Event monitoring feature not found');
        }

        const response = await fetch(url.path, { method: 'DELETE' });

        return response.json();
    }

    /**
     * Start the event polling
     *
     * @returns
     */
    async startEventPolling(): Promise<any> {
        const url = this.getFeatureUrl('event/polling');

        if (!url) {
            throw new Error('Event monitoring feature not found');
        }

        const fullUrl = new URL(url.path);

        if (url.version === CanonVersion.VER110) {
            const timemout = 'immediately';
            fullUrl.searchParams.append('timeout', timemout);
        }
        //console.log(fullUrl.toString());
        const response = await fetch(fullUrl.toString());

        return response.json();
    }

    async stopEventPolling(): Promise<any> {
        const url = this.getFeatureUrl('event/polling');

        if (!url) {
            throw new Error('Event monitoring feature not found');
        }

        const response = await fetch(url.path, { method: 'DELETE' });

        return response.json();
    }

    async startRTP(): Promise<any> {
        const url = this.getFeatureUrl('shooting/liveview/rtp');

        if (!url) {
            throw new Error('RTP feature not found');
        }

        const body = {
            action: 'start',
            ipaddress: this.ipAddress,
        };
        const response = await fetch(url.path, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        });

        return response.json();
    }

    async stopRTP(): Promise<any> {
        const url = this.getFeatureUrl('shooting/liveview/rtp');

        if (!url) {
            throw new Error('RTP feature not found');
        }

        const response = await fetch(url.path, { method: 'POST', body: JSON.stringify({ action: 'stop' }) });

        return response.json();
    }

    async getLastPageContents(): Promise<any> {
        const contents = await this.getContents({
            directoryPath: this.currentDirectory!.path,
            type: CanonContentType.JPEG,
            kind: 'list',
            page: this.pageNumber,
        });

        return contents;
    }

    /**
     * Get the lens information
     * @returns {Promise<any>}
     */
    async getLensInformation(): Promise<CanonLensInformation> {
        const url = this.getFeatureUrl('devicestatus/lens');

        if (!url) {
            throw new Error('Lens information feature not found');
        }

        const response = await fetch(url.path);

        return response.json();
    }

    async getStorages(): Promise<CanonContents> {
        const url = this.getFeatureUrl('contents');

        if (!url) {
            throw new Error('Contents feature not found');
        }

        const response = await fetch(url.path);

        this.storages = (await response.json()) as CanonContents;

        return this.storages;
    }

    async getWifiSetting(): Promise<any> {
        const url = this.getFeatureUrl('wifisetting');

        if (!url) {
            throw new Error('Wifi setting feature not found');
        }

        const response = await fetch(url.path);

        return response.json();
    }

    async sync(callback?: (any?: any) => void, frequency: number = 5) {
        this.isSyncActive = true;

        while (this.isSyncActive) {
            if (!this.isSyncActive) break;

            callback && callback();
            await new Promise((resolve) => setTimeout(resolve, frequency * 1000));
        }
    }

    cancelSync() {
        this.isSyncActive = false;
    }

    /**
     * Downloads an image or other content from the camera.
     *
     * Makes a GET request to /contents/[storage]/[directory]/[file] to download content.
     *
     * @param path - Path to the content file on the camera
     * @param kind - Optional content kind parameter:
     *   - main: Main data (Default when kind not specified)
     *   - thumbnail: Thumbnail image
     *   - display: Display image
     *   - embedded: Embedded image (RAW only)
     *   - info: File information
     * @returns Promise resolving to a Blob containing the downloaded content
     * @throws Error when:
     *   - Invalid query parameter (400)
     *   - Content not found (404)
     *   - Range request invalid (416)
     *   - Device busy during shooting/recording (503)
     */
    async downloadImage(path: string, kind: CanonContentKind = CanonContentKind.MAIN) {
        const url = new URL(path, this.baseUrl);
        const params = new URLSearchParams();
        if (kind) params.append('kind', kind);

        // Construct the full URL with query parameters
        const queryString = params.toString();

        if (queryString) {
            url.search = queryString;
        }

        const response = await fetch(url.toString());

        return response.blob();
    }

    /**
     * Get content from the camera
     *
     * Makes a GET request to /contents/[storage]/[directory]/[file] to retrieve content.
     * This API is unavailable while shooting, recording, movie mode, or get contents is in progress.
     *
     * @param path - Path to the content file on the camera (e.g. /card1/100CANON/IMG_0001.HIF)
     * @param kind - Optional content kind parameter:
     *   - main: Main data (Default when kind not specified)
     *   - thumbnail: Thumbnail image
     *   - display: Display image
     *   - embedded: Embedded image (RAW only)
     *   - info: File information
     * @returns Promise resolving to a Blob containing the content data
     * @throws Error when:
     *   - Invalid query parameter (400) - e.g. requesting thumbnail for WAV file
     *   - Content not found (404) - URL not present in storage
     *   - Range request invalid (416) - Content range outside allowable range
     *   - Device busy (503) - Function temporarily unavailable
     *   - During shooting/recording (503) - Function unavailable during capture
     */
    async getContent(path: string, kind: CanonContentKind = CanonContentKind.MAIN): Promise<Blob> {
        const url = new URL(path, this.baseUrl);
        const params = new URLSearchParams();
        if (kind) params.append('kind', kind);

        const queryString = params.toString();

        if (queryString) {
            url.search = queryString;
        }

        try {
            const response = await fetch(url.toString());

            if (!response.ok) {
                switch (response.status) {
                    case 400:
                        throw new Error('Illegal query parameter');
                    case 404:
                        throw new Error('URL not found');
                    case 416:
                        throw new Error('Requested range not satisfiable');
                    case 503:
                        throw new Error(
                            response.headers.get('Content-Type') === 'application/json'
                                ? 'Device busy'
                                : 'During shooting or recording'
                        );
                    default:
                        throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            return response.blob();
        } catch (error) {
            throw error;
        }
    }

    async downloadImages(contents: CanonContents): Promise<Blob[]> {
        if (!contents) {
            throw new Error('Contents are empty');
        }

        const newFiles = contents.path.filter((newEntry) => {
            return !this.lastPageContents?.path.some((existingEntry) => existingEntry === newEntry);
        });

        const blobs: Blob[] = [];

        if (newFiles.length > 0) {
            for (const file of newFiles) {
                const blob = await this.downloadImage(file, CanonContentKind.DISPLAY);
                blobs.push(blob);
            }
        }

        this.lastPageContents = contents;

        return blobs;
    }

    /**
     * Get HDR (High Dynamic Range) settings from the camera
     *
     * Makes a GET request to /shooting/settings/hdr to retrieve current HDR value and available options
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing:
     *   - value: Current HDR setting ('pq' or 'off')
     *   - ability: Array of available HDR options
     * Example response:
     * {
     *   "value": "pq",
     *   "ability": ["pq", "off"]
     * }
     * @throws {Error} When:
     *   - Device is busy
     *   - Camera is shooting/recording
     *   - Mode not supported (e.g. in Movie mode on EOS-1D X Mark III)
     */
    async getHDRSettings(): Promise<{ value: string; ability: string[] }> {
        const endpoint = this.getFeatureUrl('shooting/settings/hdr');

        if (!endpoint) {
            throw new Error('HDR settings feature not found');
        }

        const response = await fetch(endpoint.path);

        if (!response.ok) {
            if (response.status === 503) {
                const error = await response.json();
                throw new Error(`Failed to get HDR settings: ${error.message}`);
            }
            throw new Error(`Failed to get HDR settings: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Set HDR (High Dynamic Range) settings on the camera
     *
     * Makes a PUT request to /shooting/settings/hdr to update the HDR setting
     *
     * @param {string} value - HDR setting value ('pq' or 'off'). Must be one of the values returned in ability array from getHDRSettings()
     * @returns {Promise<{value: string}>} Object containing the updated HDR value
     * Example response:
     * {
     *   "value": "pq"
     * }
     * @throws {Error} When:
     *   - Invalid parameter (illegal value or value not in ability array)
     *   - Device is busy
     *   - Camera is shooting/recording
     *   - Mode not supported (e.g. in Movie mode on EOS-1D X Mark III)
     */
    async setHDRSettings(value: string): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/hdr');

        if (!endpoint) {
            throw new Error('HDR settings feature not found');
        }

        const response = await fetch(endpoint.path, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                value,
            }),
        });

        if (!response.ok) {
            if (response.status === 400) {
                const error = await response.json();
                throw new Error(`Invalid HDR setting: ${error.message}`);
            }
            if (response.status === 503) {
                const error = await response.json();
                throw new Error(`Failed to set HDR setting: ${error.message}`);
            }
            throw new Error(`Failed to set HDR setting: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }
    /**
     * Start Live View on the camera
     *
     * Makes a POST request to /shooting/liveview to start live view streaming
     *
     * @param {CanonLiveViewSize} [liveViewSize=CanonLiveViewSize.MEDIUM] - Live View output size control:
     *   - 'off': Does not perform Live View output
     *   - 'small': Performs Live View output at small size
     *   - 'medium': Performs Live View output at medium size
     * @param {string} [cameraDisplay='keep'] - Camera LCD display control:
     *   - 'on': Camera LCD display ON
     *   - 'off': Camera LCD display OFF
     *   - 'keep': Maintain current Camera LCD display
     * @returns {Promise<object>} Empty object on success
     * @throws {Error} When:
     * - Live view feature not found
     * - Invalid parameter (illegal liveviewsize/cameradisplay value)
     * - Device busy (during shooting/recording)
     * - Mode not supported (e.g. cameradisplay=off in Movie mode)
     */
    async startLiveView(
        liveViewSize: CanonLiveViewSize = CanonLiveViewSize.MEDIUM,
        cameraDisplay: string = 'keep'
    ): Promise<object> {
        const endpoint = this.getFeatureUrl('shooting/liveview');

        if (!endpoint) {
            throw new Error('Live view feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    liveviewsize: liveViewSize,
                    cameradisplay: cameraDisplay,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 503) {
                    if (error.message === 'Device busy') {
                        throw new CameraBusyError();
                    } else if (error.message === 'Live view not started') {
                        throw new LiveViewNotStartedError();
                    } else if (error.message === 'Already started') {
                        throw new LiveViewAlreadyStartedError();
                    }
                }
                throw new Error(error.message || 'Failed to start live view');
            }

            return response.json();
        } catch (error) {
            if (error instanceof CameraError) {
                throw error;
            }
            throw new Error('Failed to start live view');
        }
    }

    /**
     * Stop Live View on the camera. This is a wrapper around the startLiveView method.
     *
     * Makes a POST request to /shooting/liveview to stop live view streaming
     *
     * @returns {Promise<object>} Empty object on success
     */
    async stopLiveView(): Promise<any> {
        this.startLiveView(CanonLiveViewSize.OFF);
    }

    async getLiveViewImageFlip(): Promise<string> {
        const endpoint = this.getFeatureUrl('shooting/liveview/flip');

        if (!endpoint) {
            throw new Error('Flip  feature not found');
        }

        const response = await fetch(endpoint.path, { method: 'GET', headers: { 'Content-Type': 'image/jpeg' } });

        if (!response.ok) {
            throw new Error('Failed to get live view image');
        }

        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return base64;
    }

    /**
     * Execute still image shooting
     *
     * Makes a POST request to /shooting/control/shutterbutton to take a photo
     *
     * @param {boolean} [af=true] - Enable/disable autofocus during shooting
     * @returns {Promise<object>} Empty object on success
     * @throws {Error} When:
     * - Invalid parameter (af is not a boolean)
     * - Device is busy (during shooting/recording)
     * - Mode not supported
     * - Service in preparation
     * - AF focusing failed
     * - Cannot write to storage card
     */
    async shutterbutton(af: boolean = true): Promise<object> {
        const endpoint = this.getFeatureUrl('shooting/control/shutterbutton');

        if (!endpoint) {
            throw new Error('Shutter button feature not found');
        }

        const body = {
            af,
        };

        try {
            const response = await fetch(endpoint.path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Failed to take photo: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to take photo');
        }
    }

    /**
     * Execute manual shutter button control
     *
     * Makes a POST request to /shooting/control/shutterbutton/manual to control shutter button
     *
     * @param {string} action - Shutter button operation: 'release', 'half_press', or 'full_press'
     * @param {boolean} [af=true] - Enable/disable autofocus during operation
     * @returns {Promise<object>} Empty object on success
     * @throws {Error} When:
     * - Invalid parameter (action is not valid string, af is not boolean)
     * - Device is busy (during shooting/recording)
     * - Mode not supported
     * - Service in preparation
     * - AF focusing failed
     * - Cannot write to storage card
     */
    async shutterbuttonManual(action: CanonShutterButtonAction, af: boolean = true): Promise<object> {
        const endpoint = this.getFeatureUrl('shooting/control/shutterbutton/manual');

        if (!endpoint) {
            throw new Error('Manual shutter button feature not found');
        }

        const body = {
            action,
            af,
        };

        try {
            const response = await fetch(endpoint.path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to control shutter: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to control shutter');
        }
    }
    /**
     * Get the aperture (AV) setting
     *
     * Makes a GET request to /shooting/settings/av to retrieve the current aperture value and available options
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing current aperture value and available options
     * Example:
     * {
     *   "value": "f4.0",
     *   "ability": ["f3.4","f4.0","f4.5","f5.0","f5.6","f6.3","f7.1","f8.0"]
     * }
     * @throws {Error} When:
     * - Device is busy
     * - Mode not supported (e.g. during movie mode)
     */
    async getApertureSetting(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/av');

        if (!endpoint) {
            throw new Error('Aperture setting feature not found');
        }

        const response = await fetch(endpoint.path);

        return response.json();
    }

    /**
     * Set the aperture (AV) setting
     *
     * Makes a PUT request to /shooting/settings/av to change the aperture value
     *
     * @param value - The aperture value to set (e.g. "f5.6", "f8.0", etc)
     * @returns {Promise<{value: string}>} Object containing the new aperture value
     * @throws {Error} When:
     * - Invalid parameter (nonexistent value, non-string value, or value not in ability list)
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. movie mode)
     */
    async setApertureSetting(value: string): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/av');

        if (!endpoint) {
            throw new Error('Aperture setting feature not found');
        }

        const body = {
            value,
        };

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 400) {
                throw new Error('Invalid parameter - value must be a valid aperture setting');
            }

            if (response.status === 503) {
                throw new Error('Device busy - camera is currently shooting or recording');
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get the shutter speed setting (TV)
     *
     * Makes a GET request to /shooting/settings/tv to retrieve the current shutter speed value and available options
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing current shutter speed value and available options
     * Example:
     * {
     *   "value": "1/125",
     *   "ability": ["15\"","13\"","10\"","8\"","6\"","5\"","4\"","3\"2","2\"5","2\"",
     *               "1\"6","1\"3","1\"","0\"8","0\"6","0\"5","0\"4","0\"3","1/4","1/5",
     *               "1/6","1/8","1/10","1/13","1/15","1/20","1/25","1/30","1/40","1/50",
     *               "1/60","1/80","1/100","1/125","1/160","1/200","1/250","1/320","1/400",
     *               "1/500","1/640","1/800","1/1000","1/1250","1/1600","1/2000"]
     * }
     * @throws {Error} When device is busy or mode not supported (e.g. during movie mode)
     */
    async getShutterSpeedSetting(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/tv');

        if (!endpoint) {
            throw new Error('Shutter speed setting feature not found');
        }

        const response = await fetch(endpoint.path);

        const data = await response.json();

        this.shutterSpeedSetting = data.value;

        return this.shutterSpeedSetting;
    }

    /**
     * Set the shutter speed (TV) setting
     *
     * Makes a PUT request to /shooting/settings/tv to set the shutter speed value
     *
     * @param value - The shutter speed value to set (e.g. "1/125", "5\"", etc)
     * @returns {Promise<{value: string}>} Object containing the new shutter speed value
     * @throws {Error} When:
     * - Invalid parameter (nonexistent value, non-string value, or value not in ability list)
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. movie mode)
     */
    async setShutterSpeedSetting(value: string): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/tv');

        if (!endpoint) {
            throw new Error('Shutter speed setting feature not found');
        }

        const body = {
            value,
        };

        try {
            const response = await fetch(endpoint.path, { method: 'PUT', body: JSON.stringify(body) });
            this.shutterSpeedSetting = value;
            return response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get the exposure compensation setting
     *
     * Makes a GET request to /shooting/settings/exposure to retrieve the current exposure compensation value and available options
     *
     * @returns {Promise<CanonExposureCompensationSetting>} Object containing current exposure compensation value and available options
     * Example:
     * {
     *   "value": "+0.0",
     *   "ability": ["-3.0", "-2_2/3", "-2_1/3", "-2.0", "-1_2/3", "-1_1/3", "-1.0",
     *               "-0_2/3", "-0_1/3", "+0.0", "+0_1/3", "+0_2/3", "+1.0",
     *               "+1_1/3", "+1_2/3", "+2.0", "+2_1/3", "+2_2/3", "+3.0"]
     * }
     */
    async getExposureCompensationSetting(): Promise<CanonExposureCompensationSetting> {
        const endpoint = this.getFeatureUrl('shooting/settings/exposure');

        if (!endpoint) {
            throw new Error('Exposure compensation setting feature not found');
        }

        const response = await fetch(endpoint.path);

        return response.json();
    }

    /**
     * Set the exposure compensation setting
     *
     * Makes a PUT request to /shooting/settings/exposurecompensation to set the exposure compensation value
     *
     * @param value - The exposure compensation value to set (e.g. "+0.0", "-1.0", etc)
     * @returns {Promise<any>} Response from the camera
     */
    async setExposureCompensationSetting(value: string): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/exposure');

        if (!endpoint) {
            throw new Error('Exposure compensation setting feature not found');
        }

        const body = {
            value,
        };

        const response = await fetch(endpoint.path, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        return response.json();
    }

    /**
     * Get the white balance setting
     *
     * Makes a GET request to /shooting/settings/wb to get the current white balance value and available options
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing current value and array of possible values
     */
    async getWhiteBalanceSetting(): Promise<CanonWhiteBalanceSetting> {
        const endpoint = this.getFeatureUrl('shooting/settings/wb');

        if (!endpoint) {
            throw new Error('White balance setting feature not found');
        }

        const response = await fetch(endpoint.path);
        return response.json();
    }

    /**
     * Set the white balance setting
     *
     * Makes a PUT request to /shooting/settings/wb to set the white balance value
     *
     * @param value - The white balance value to set (e.g. "auto", "daylight", "shade", etc)
     * @returns {Promise<Pick<CanonWhiteBalanceSetting, 'value'>>} Response from the camera
     */
    async setWhiteBalanceSetting(value: CanonWhiteBalanceMode): Promise<Pick<CanonWhiteBalanceSetting, 'value'>> {
        const endpoint = this.getFeatureUrl('shooting/settings/wb');

        if (!endpoint) {
            throw new Error('White balance setting feature not found');
        }

        const body = {
            value,
        };

        const response = await fetch(endpoint.path, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        return response.json();
    }

    /**
     * Get the color temperature setting
     *
     * Makes a GET request to /shooting/settings/colortemperature to get the current value and available range
     *
     * @returns {Promise<CanonColorTemperatureSetting>} Object containing current value and range
     */
    async getColorTemperatureSetting(): Promise<CanonColorTemperatureSetting> {
        const endpoint = this.getFeatureUrl('shooting/settings/colortemperature');

        if (!endpoint) {
            throw new Error('Color temperature setting feature not found');
        }

        const response = await fetch(endpoint.path);
        return response.json();
    }

    /**
     * Set the color temperature value
     *
     * Makes a PUT request to /shooting/settings/colortemperature to set the color temperature
     *
     * @param value - The color temperature value to set (in Kelvin)
     * @returns {Promise<Pick<CanonColorTemperatureSetting, 'value'>>} Response from the camera
     */
    async setColorTemperatureSetting(value: number): Promise<Pick<CanonColorTemperatureSetting, 'value'>> {
        const endpoint = this.getFeatureUrl('shooting/settings/colortemperature');

        if (!endpoint) {
            throw new Error('Color temperature setting feature not found');
        }

        const body = {
            value,
        };

        const response = await fetch(endpoint.path, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        return response.json();
    }

    /**
     * Get all of the present values and ability values of the shooting parameters that can be
     * acquired by Ver.1.0.0 APIs supported by the Canon camera.
     *
     * @returns {Promise<Partial<CanonShootingSettings>>} Object containing all shooting settings
     */
    async getShootingSettings(): Promise<Partial<CanonShootingSettings>> {
        const endpoint = this.getFeatureUrl('shooting/settings');

        if (!endpoint) {
            throw new Error('Shooting settings feature not found');
        }

        const response = await fetch(endpoint.path);

        const data = await response.json();

        this.shootingSettings = data;

        return this.shootingSettings;
    }

    async getLastPhoto(): Promise<string> {
        const events = await this.startEventPolling();

        if (!events || !events.addedcontents || events.addedcontents.length === 0) {
            throw new Error('No photo added');
        }

        const { addedcontents }: { addedcontents: string[] } = events;
        const path = addedcontents.filter((ad) => ad.endsWith('.JPG'))[0];
        const image = await this.downloadImage(path, CanonContentKind.MAIN);
        const buffer = await image.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return base64;
    }

    /**
     * Get the aperture value level increment information
     *
     * Makes a GET request to /customfunction/exposureincrements/av to retrieve the current
     * aperture value increment setting
     *
     * @returns {Promise<{value: string}>} Object containing the aperture increment value
     * Example response:
     * {
     *   "value": "1/3"
     * }
     * @throws {Error} When:
     * - Feature not found
     * - Request fails
     */
    async getApertureIncrements(): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('customfunction/exposureincrements/av');

        if (!endpoint) {
            throw new Error('Aperture increments feature not found');
        }

        const response = await fetch(endpoint.path);

        if (!response.ok) {
            throw new Error(`Failed to get aperture increments: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get the shutter speed level increment information
     *
     * Makes a GET request to /customfunction/exposureincrements/tv to retrieve the current
     * shutter speed increment setting
     *
     * @returns {Promise<{value: string}>} Object containing the shutter speed increment value
     * Example response:
     * {
     *   "value": "1/3"
     * }
     * @throws {Error} When:
     * - Feature not found
     * - Request fails
     */
    async getShutterSpeedIncrements(): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('customfunction/exposureincrements/tv');

        if (!endpoint) {
            throw new Error('Shutter speed increments feature not found');
        }

        const response = await fetch(endpoint.path);

        if (!response.ok) {
            throw new Error(`Failed to get shutter speed increments: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get the ISO speed level increment information
     *
     * Makes a GET request to /customfunction/isoincrements to retrieve the current
     * ISO speed increment setting
     *
     * @returns {Promise<{value: string}>} Object containing the ISO speed increment value
     * Example response:
     * {
     *   "value": "1/3"
     * }
     * @throws {Error} When:
     * - Feature not found
     * - Request fails
     */
    async getIsoSpeedIncrements(): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('customfunction/isoincrements');

        if (!endpoint) {
            throw new Error('ISO speed increments feature not found');
        }

        const response = await fetch(endpoint.path);

        if (!response.ok) {
            throw new Error(`Failed to get ISO speed increments: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get the ISO setting
     *
     * Makes a GET request to /shooting/settings/iso to retrieve the current ISO value and available options
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing current ISO value and available options
     * Example:
     * {
     *   "value": "100",
     *   "ability": ["auto", "100", "125", "160", "200", "250", "320", "400", "500",
     *               "640", "800", "1000", "1250", "1600", "2000", "2500", "3200"]
     * }
     * @throws {Error} When:
     * - Device is busy
     * - Mode not supported (e.g. during movie mode)
     */
    async getIsoSetting(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/iso');

        if (!endpoint) {
            throw new Error('ISO setting feature not found');
        }

        const response = await fetch(endpoint.path);

        const data = await response.json();

        this.isoSetting = data.value;

        return this.isoSetting;
    }

    /**
     * Set the ISO setting
     *
     * Makes a PUT request to /shooting/settings/iso to change the ISO value
     *
     * @param value - The ISO value to set (e.g. "auto", "100", "200", etc)
     * @returns {Promise<{value: string}>} Object containing the new ISO value
     * @throws {Error} When:
     * - Invalid parameter (nonexistent value, non-string value, or value not in ability list)
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async setIsoSetting(value: string): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/iso');

        if (!endpoint) {
            throw new Error('ISO setting feature not found');
        }

        const body = {
            value,
        };

        const response = await fetch(endpoint.path, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.isoSetting = value;
        return response.json();
    }

    /**
     * Get the present value of the AF operation setting
     *
     * Makes a GET request to /shooting/settings/afoperation to retrieve the current AF operation value
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing current AF operation value and available options
     * Example:
     * {
     *   "value": "oneshot",  // One-shot AF
     *   "ability": ["oneshot", "servo", "aifocus", "manual"]
     * }
     *
     * Possible values:
     * - oneshot: One-shot AF
     * - servo: Servo AF
     * - aifocus: AI Focus AF
     * - manual: Manual focus
     */
    async getAutofocusOperationSetting(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/afoperation');

        if (!endpoint) {
            throw new Error('Auto focus setting feature not found');
        }

        try {
            const response = await fetch(endpoint.path);

            const data = await response.json();

            this.autoFocusSetting = data;

            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Set the AF operation setting
     *
     * Makes a PUT request to /shooting/settings/afoperation to change the autofocus mode
     *
     * @param value - The AF operation value to set (e.g. "oneshot", "servo", "aifocus", "manual")
     * @returns {Promise<{value: string}>} Object containing the new AF operation value
     * @throws {Error} When:
     * - Invalid parameter (nonexistent value, non-string value, or value not in ability list)
     * - Device is busy
     * - During shooting/recording
     */
    async setAutofocusOperationSetting(value: string): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/afoperation');

        if (!endpoint) {
            throw new Error('Auto focus setting feature not found');
        }

        const body = {
            value,
        };

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 400) {
                throw new Error('Invalid parameter - value must be a valid AF operation setting');
            }

            if (response.status === 503) {
                throw new Error('Device busy - camera is currently shooting or recording');
            }

            const data = await response.json();
            this.autoFocusSetting = data.value;
            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Execute auto focus control
     *
     * Makes a POST request to /shooting/control/af to start or stop auto focus
     * This API only issues a focusing instruction and does not return focusing results.
     * Check focus frame information in Live View incidental information for results.
     *
     * @param action - The auto focus action to perform ("start" or "stop")
     * @returns {Promise<object>} Empty object on success
     * @throws {Error} When:
     * - Invalid parameter (action must be "start" or "stop")
     * - Device is busy (during shooting/recording)
     * - Service in preparation
     * - AF already started
     */
    async executeAutofocus(action: 'start' | 'stop'): Promise<object> {
        const endpoint = this.getFeatureUrl('shooting/control/af');

        if (!endpoint) {
            throw new Error('Auto focus control feature not found');
        }

        const body = {
            action,
        };

        try {
            const response = await fetch(endpoint.path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to control auto focus: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to control auto focus');
        }
    }

    /**
     * Get the shooting mode from the camera's mode dial
     *
     * Makes a GET request to /shooting/settings/shootingmodedial to retrieve the current shooting mode
     *
     * @returns {Promise<string>} The current shooting mode value
     * Example values:
     * - "m" - Manual exposure
     * - "av" - Aperture priority AE
     * - "tv" - Shutter speed priority
     * - "p" - Program AE
     * - "auto" - Auto
     * - "plus_movie_auto" - Plus movie auto
     * - "panoramic_shot" - Panoramic shot
     * - "sports" - Sports
     * - "fv" - Flexible AE
     * - "a+" - Scene intelligent auto
     * - "scn" - Special scene
     * - "creativefilter" - Creative filter
     * - "movie" - Movie
     * - "c3" - Custom shooting mode 3
     * - "c2" - Custom shooting mode 2
     * - "c1" - Custom shooting mode 1
     * - "bulb" - Bulb
     *
     * @throws {Error} When:
     * - Camera does not have a shooting mode dial
     * - Feature not found
     * - Device is busy
     */
    async getShootingMode(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/shootingmodedial');

        if (!endpoint) {
            throw new Error('Shooting mode feature not found');
        }
        try {
            const response = await fetch(endpoint.path);

            const data = await response.json();

            this.shootingMode = data.value;

            return this.shootingMode;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Set the shooting mode
     *
     * Makes a PUT request to /shooting/settings/shootingmodedial to change the shooting mode.
     * Note: You must call setIgnoreShootingModeDial(true) before using this method.
     *
     * @param mode - The shooting mode value to set (e.g. "p", "av", "tv", etc)
     * @returns {Promise<{value: string}>} Object containing the new shooting mode value
     * @throws {Error} When:
     * - Invalid parameter (nonexistent value, non-string value, or value not in ability list)
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported
     * - Ignore shooting mode dial mode not started
     */
    async setShootingMode(mode: CanonShootingMode): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/shootingmode');

        if (!endpoint) {
            throw new Error('Shooting mode feature not found');
        }

        const body = {
            value: mode,
        };

        const response = await fetch(endpoint.path, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.json();
    }

    /**
     * Get the shutter mode setting
     *
     * Makes a GET request to /shooting/settings/shuttermode to retrieve the current shutter mode value and available options
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing current shutter mode value and available options
     * Example:
     * {
     *   "value": "elec_1st_curtain",
     *   "ability": ["elec_1st_curtain", "mechanical", "electronic"]
     * }
     * @throws {Error} When device is busy or during shooting/recording
     */
    async getShutterMode(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/shuttermode');

        if (!endpoint) {
            throw new Error('Shutter mode feature not found');
        }

        const response = await fetch(endpoint.path);

        const data = await response.json();

        return data;
    }

    /**
     * Set the shutter mode setting
     *
     * Makes a PUT request to /shooting/settings/shuttermode to change the shutter mode
     *
     * @param {string} value - The shutter mode value to set (e.g. "electronic", "mechanical", "elec_1st_curtain")
     * @returns {Promise<{value: string}>} Object containing the new shutter mode value
     * @throws {Error} When device is busy, during shooting/recording, or if invalid value provided
     */
    async setShutterMode(value: CanonShutterMode): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/shuttermode');

        if (!endpoint) {
            throw new Error('Shutter mode feature not found');
        }

        const body = {
            value,
        };

        const response = await fetch(endpoint.path, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.json();
    }

    async getIgnoreShootingModeDial(): Promise<boolean> {
        const endpoint = this.getFeatureUrl('shooting/control/ignoreshootingmodedialmode');

        if (!endpoint) {
            throw new Error('Ignore shooting mode dial feature not found');
        }

        const response = await fetch(endpoint.path);

        const data = await response.json();

        this.ignoreShootingModeDial = data.status === 'on';

        return this.ignoreShootingModeDial;
    }

    async setIgnoreShootingModeDial(status: boolean): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/control/ignoreshootingmodedialmode');

        if (!endpoint) {
            throw new Error('Ignore shooting mode dial feature not found');
        }

        try {
            const body = {
                action: status ? 'on' : 'off',
            };
            const response = await fetch(endpoint.path, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                this.ignoreShootingModeDial = status;
                return status;
            }
        } catch (error) {
            throw error;
        }
    }

    async changeShootingMode(mode: CanonShootingMode): Promise<void> {
        if (!this.ignoreShootingModeDial) {
            await this.setIgnoreShootingModeDial(true);
        }

        return this.setShootingMode(mode);
    }

    async restoreDialMode(): Promise<void> {
        await this.setIgnoreShootingModeDial(false);
    }

    async getLiveViewImageFlipDetail(
        kind: CanonLiveViewImageDetail = CanonLiveViewImageDetail.IMAGE
    ): Promise<CanonLiveViewImageFlipDetail> {
        const endpoint = this.getFeatureUrl('shooting/liveview/flipdetail');

        if (!endpoint) {
            throw new Error('Flip detail feature not found');
        }

        const url = new URL(endpoint.path);
        url.searchParams.append('kind', kind);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'Content-Type': 'application/octet-stream' },
            });

            //console.log(response);
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body reader not available');
            }

            const result: CanonLiveViewImageFlipDetail = {};
            let buffer = new Uint8Array(0);

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                if (!value || value.length === 0) {
                    continue;
                }

                const newBuffer = new Uint8Array(buffer.length + value.length);
                newBuffer.set(buffer);
                newBuffer.set(value, buffer.length);
                buffer = newBuffer;

                let pos = 0;
                while (pos < buffer.length - 1) {
                    if (buffer[pos] === 0xff && buffer[pos + 1] === 0x00) {
                        if (pos + 6 >= buffer.length) break;

                        pos += 2;

                        const type = buffer[pos];
                        pos++;

                        const length =
                            (buffer[pos] << 24) | (buffer[pos + 1] << 16) | (buffer[pos + 2] << 8) | buffer[pos + 3];
                        pos += 4;

                        if (pos + length + 2 > buffer.length) {
                            pos = pos - 7;
                            break;
                        }
                        if (type === 0x00) {
                            const imageData = buffer.slice(pos, pos + length);
                            const base64Image = Buffer.from(imageData).toString('base64');
                            // save the image to a file

                            result.image = base64Image;
                        } else if (type === 0x01) {
                            const infoData = buffer.slice(pos, pos + length);
                            const text = new TextDecoder().decode(infoData);
                            try {
                                result.info = JSON.parse(text);
                            } catch (e) {
                                throw new Error('Failed to parse info JSON');
                            }
                        }

                        pos += length;

                        if (pos + 1 < buffer.length && buffer[pos] === 0xff && buffer[pos + 1] === 0xff) {
                            pos += 2;
                        }
                    } else {
                        pos++;
                    }
                }

                if (pos > 0) {
                    buffer = buffer.slice(pos);
                }
            }

            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Gets the Live View image in chunk format from the camera.
     * When the camera is displaying a menu, a 160x120 black image is sent.
     * May need to retry if Live View image cannot be acquired immediately after settings change.
     *
     * @returns A Promise that resolves to a ReadableStream containing the chunked JPEG data
     * @throws Error if Live View is not started or device is busy
     */
    async startLiveViewImageScroll(): Promise<ReadableStream<Uint8Array>> {
        const endpoint = this.getFeatureUrl('shooting/liveview/scroll');
        if (!endpoint) {
            throw new Error('Live view scroll feature not supported');
        }

        const response = await fetch(endpoint.path, {
            method: 'GET',
            headers: { 'Content-Type': 'image/octet-stream' },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to get live view image scroll');
        }

        if (!response.body) {
            throw new Error('No response body received');
        }

        return response.body;
    }

    /**
     * Stops transmission of the Live View image in chunk format.
     *
     * @returns Promise that resolves to an empty object on success
     * @throws Error if Live View is not started or device is busy
     */
    async stopLiveViewImageScroll(): Promise<object> {
        const endpoint = this.getFeatureUrl('shooting/liveview/scroll');
        if (!endpoint) {
            throw new Error('Live view scroll feature not supported');
        }

        const response = await fetch(endpoint.path, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to stop live view scroll');
        }

        return response.json();
    }

    /**
     * Starts transmission of the Live View image in multipart format.
     *
     * Makes a GET request to /shooting/liveview/multipart to start the Live View image transmission.
     * If the Live View image cannot be sent due to reasons like the camera displaying the menu,
     * a 160 x 120 size black image is sent. If the Live View image is not acquired immediately,
     * this API should be executed again.
     *
     * @returns A Promise that resolves to a ReadableStream containing the chunked JPEG data
     * @throws Error if:
     * - Live View is not started
     * - Device is busy
     * - Live View already started
     */
    async startLiveViewImageMultipart(): Promise<ReadableStream<Uint8Array>> {
        const endpoint = this.getFeatureUrl('shooting/liveview/multipart');
        if (!endpoint) {
            throw new Error('Live view multipart feature not supported');
        }

        const response = await fetch(endpoint.path, {
            method: 'GET',
            headers: { 'Content-Type': 'multipart/x-mixed-replace;boundary=boundary' },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to start live view image multipart');
        }

        if (!response.body) {
            throw new Error('No response body received');
        }

        return response.body;
    }

    /**
     * Stops transmission of the Live View image in multipart format.
     *
     * Makes a DELETE request to /shooting/liveview/multipart to stop the Live View image transmission.
     *
     * @returns A Promise that resolves to an empty object on success
     * @throws Error if:
     * - Live View is not started
     * - Device is busy
     */
    async stopLiveViewImageMultipart(): Promise<object> {
        const endpoint = this.getFeatureUrl('shooting/liveview/multipart');
        if (!endpoint) {
            throw new Error('Live view multipart feature not supported');
        }

        const response = await fetch(endpoint.path, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to stop live view image multipart');
        }

        return response.json();
    }

    /**
     * Get the still image shooting quality settings
     *
     * Makes a GET request to /shooting/settings/stillimagequality to retrieve the current
     * image quality settings and available options
     *
     * @returns {Promise<{
     *   value: {
     *     raw: "none" | "raw" | "craw",
     *     jpeg: "none" | "large_fine" | "large_normal" | "medium_fine" | "medium_normal" | "small"
     *   },
     *   ability: {
     *     raw: string[],
     *     jpeg: string[]
     *   }
     * }>} Object containing:
     * - value: Current RAW and JPEG quality settings
     * - ability: Arrays of available RAW and JPEG quality options
     *
     * @throws {Error} When:
     * - Feature not found
     * - Device is busy
     * - Mode not supported (e.g. during movie recording)
     */
    async getStillImageQuality(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/stillimagequality');

        if (!endpoint) {
            throw new Error('Still image quality feature not found');
        }

        try {
            const response = await fetch(endpoint.path);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to get still image quality: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get still image quality settings');
        }
    }

    /**
     * Set the still image shooting quality settings
     *
     * Makes a PUT request to /shooting/settings/stillimagequality to update the
     * image quality settings
     *
     * @param {Object} quality - The quality settings to apply
     * @param {CanonRawQuality} quality.raw - RAW quality setting ('none', 'raw', or 'craw')
     * @param {CanonJpegQuality} quality.jpeg - JPEG quality setting ('none', 'large_fine', etc)
     *
     * @returns {Promise<{
     *   value: {
     *     raw: CanonRawQuality,
     *     jpeg: CanonJpegQuality
     *   }
     * }>} Object containing the updated quality settings
     *
     * @throws {Error} When:
     * - Feature not found
     * - Invalid parameters provided
     * - Device is busy
     * - Mode not supported (e.g. during movie recording)
     */
    async setStillImageQuality(quality: { raw: CanonRawQuality; jpeg: CanonJpegQuality }): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/stillimagequality');

        if (!endpoint) {
            throw new Error('Still image quality feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value: quality,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to set still image quality: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to set still image quality settings');
        }
    }

    /**
     * Get the current still image aspect ratio setting and available options
     *
     * @returns {Promise<{
     *   value: string,
     *   ability: string[]
     * }>} Object containing current aspect ratio and available options
     *
     * @throws {Error} When:
     * - Feature not found
     * - Device is busy
     * - Mode not supported (e.g. during movie recording)
     */
    async getStillImageAspectRatio(): Promise<{ value: string; ability: string[] }> {
        const endpoint = this.getFeatureUrl('shooting/settings/stillimageaspectratio');

        if (!endpoint) {
            throw new Error('Still image aspect ratio feature not found');
        }

        try {
            const response = await fetch(endpoint.path);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to get still image aspect ratio: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get still image aspect ratio settings');
        }
    }

    /**
     * Set the still image aspect ratio
     *
     * @param {string} value - Aspect ratio value ('3:2', '4:3', '16:9', '1:1', or 'x1.6')
     *
     * @returns {Promise<{
     *   value: string
     * }>} Object containing the updated aspect ratio setting
     *
     * @throws {Error} When:
     * - Feature not found
     * - Invalid parameters provided
     * - Device is busy
     * - Mode not supported (e.g. during movie recording)
     */
    async setStillImageAspectRatio(value: string): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/stillimageaspectratio');

        if (!endpoint) {
            throw new Error('Still image aspect ratio feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to set still image aspect ratio: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to set still image aspect ratio');
        }
    }

    /**
     * Get the current flash settings
     *
     * @returns {Promise<{
     *   value: string,
     *   ability: string[]
     * }>} Object containing current flash value and available options
     *
     * @throws {Error} When:
     * - Feature not found
     * - Device is busy
     * - Mode not supported (e.g. during movie recording)
     */
    async getFlashSetting(): Promise<{ value: string; ability: string[] }> {
        const endpoint = this.getFeatureUrl('shooting/settings/flash');

        if (!endpoint) {
            throw new Error('Flash feature not found');
        }

        try {
            const response = await fetch(endpoint.path);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to get flash settings: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get flash settings');
        }
    }

    /**
     * Set the flash settings
     *
     * @param {string} value - Flash mode ('auto', 'on', 'slowsynchro', or 'off')
     *
     * @returns {Promise<{
     *   value: string
     * }>} Object containing the updated flash setting
     *
     * @throws {Error} When:
     * - Feature not found
     * - Invalid parameters provided
     * - Device is busy
     * - Mode not supported (e.g. during movie recording)
     */
    async setFlashSetting(value: CanonFlashMode): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/flash');

        if (!endpoint) {
            throw new Error('Flash feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to set flash settings: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to set flash settings');
        }
    }

    private getFeatureUrl(feature: string): ApiEndpoint | undefined {
        for (const version in this.features) {
            const endpoints = this.features[version];
            const endpoint = endpoints.find((ep) => ep.path.includes(feature));

            if (endpoint) {
                endpoint.path = this.buildFeatureUrl(endpoint);
                // get the version from the path
                endpoint.version = version;
                return endpoint;
            }
        }
    }

    /**
     * Get the current focus bracketing settings and available options
     *
     * @returns Object containing current value and available options
     * @throws Error if:
     * - Feature not supported
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async getFocusBracketingStatus(): Promise<{ value: CanonEnableDisable; ability: string[] }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing');

        if (!endpoint) {
            throw new Error('Focus bracketing feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        `Failed to get focus bracketing settings: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get focus bracketing settings');
        }
    }

    /**
     * Set the focus bracketing mode
     *
     * @param value - 'enable' or 'disable'
     * @returns Object containing the new value
     * @throws Error if:
     * - Invalid parameter provided
     * - Feature not supported
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async setFocusBracketingStatus(value: CanonEnableDisable): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing');

        if (!endpoint) {
            throw new Error('Focus bracketing feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to set focus bracketing: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to set focus bracketing');
        }
    }

    /**
     * Get the current number of shots in focus bracketing setting.
     *
     * @returns Object containing the current value and ability range
     * @throws Error if:
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async getFocusBracketingNumberOfShots(): Promise<{
        value: number;
        ability: { min: number; max: number; step: number };
    }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing/numberofshots');

        if (!endpoint) {
            throw new Error('Focus bracketing number of shots feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        `Failed to get focus bracketing number of shots: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get focus bracketing number of shots');
        }
    }

    /**
     * Set the number of shots in focus bracketing setting. Accepts values between 2 and 999.
     *
     * @param value - The number of shots to set
     * @returns Object containing the new value
     * @throws Error if:
     * - Invalid parameter provided
     * - Feature not supported
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async setFocusBracketingNumberOfShots(value: number): Promise<{ value: number }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing/numberofshots');

        if (!endpoint) {
            throw new Error('Focus bracketing number of shots feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        `Failed to set focus bracketing number of shots: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to set focus bracketing number of shots');
        }
    }

    /**
     * Get the current focus bracketing focus increment and its ability range, with a minimum of 1 and a maximum of 10.
     *
     * @returns Object containing the current value and ability range
     * @throws Error if:
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async getFocusBracketingFocusIncrement(): Promise<{
        value: number;
        ability: { min: number; max: number; step: number };
    }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing/focusincrement');

        if (!endpoint) {
            throw new Error('Focus bracketing focus increment feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        `Failed to get focus bracketing focus increment: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get focus bracketing focus increment');
        }
    }

    /**
     * Set the focus bracketing focus increment. Accepts values between 1 and 10.
     *
     * @param value - The focus increment value to set
     * @returns Object containing the new value
     * @throws Error if:
     * - Invalid parameter provided
     * - Feature not supported
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async setFocusBracketingFocusIncrement(value: number): Promise<{ value: number }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing/focusincrement');

        if (!endpoint) {
            throw new Error('Focus bracketing focus increment feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        `Failed to set focus bracketing focus increment: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to set focus bracketing focus increment');
        }
    }

    /**
     * Get the current focus bracketing exposure smoothing setting and its abilities.
     *
     * @returns Object containing the current value and ability options
     * @throws Error if:
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async getFocusBracketingExposureSmoothing(): Promise<{ value: string; ability: string[] }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing/exposuresmoothing');

        if (!endpoint) {
            throw new Error('Focus bracketing exposure smoothing feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        `Failed to get focus bracketing exposure smoothing: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get focus bracketing exposure smoothing');
        }
    }

    /**
     * Set the focus bracketing exposure smoothing.
     *
     * @param value - The exposure smoothing value to set ('enable' or 'disable')
     * @returns Object containing the new value
     * @throws Error if:
     * - Invalid parameter provided
     * - Feature not supported
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async setFocusBracketingExposureSmoothing(value: string): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing/exposuresmoothing');

        if (!endpoint) {
            throw new Error('Focus bracketing exposure smoothing feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        `Failed to set focus bracketing exposure smoothing: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to set focus bracketing exposure smoothing');
        }
    }

    /**
     * Get the current value and ability values of the Focus bracketing (depth composition).
     *
     * @returns Object containing the current value and ability values
     * @throws Error if:
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async getFocusBracketingDepthComposition(): Promise<{ value: string; ability: string[] }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing/depthcomposite');

        if (!endpoint) {
            throw new Error('Focus bracketing depth composition feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        `Failed to get focus bracketing depth composition: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get focus bracketing depth composition');
        }
    }

    /**
     * Set the Focus bracketing (depth composition).
     *
     * @param value - The depth composition value to set ('enable' or 'disable')
     * @returns Object containing the new value
     * @throws Error if:
     * - Invalid parameter provided
     * - Feature not supported
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported (e.g. during movie mode)
     */
    async setFocusBracketingDepthComposition(value: CanonEnableDisable): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/focusbracketing/depthcomposite');

        if (!endpoint) {
            throw new Error('Focus bracketing depth composition feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        `Failed to set focus bracketing depth composition: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to set focus bracketing depth composition');
        }
    }

    /**
     * Set the AF frame information.
     *
     * @returns Object containing AF frame information including the number of AF frames,
     *          details of each AF frame, and visible region information.
     * @throws Error if:
     * - Device is busy
     * - Mode not supported (e.g. during live view or movie mode)
     */
    async setAfFramePosition(positionx: number, positiony: number): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/liveview/afframeposition');

        if (!endpoint) {
            throw new Error('AF frame information feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    positionx,
                    positiony,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `Failed to get AF frame information: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get AF frame information');
        }
    }

    
    private buildFeatureUrl(feature: ApiEndpoint) {
        const url = new URL(feature.path, this.baseUrl);

        return url.toString();
    }

    /**
     * Get the exposure bracket (AEB) setting.
     *
     * Makes a GET request to /shooting/settings/aeb to retrieve the current exposure bracket value and available options.
     *
     * @returns {Promise<{ value: string; ability: string[] }>} Object containing current value and ability values
     * @throws {Error} When device is busy, mode not supported, or feature not found
     * Example response:
     * {
     *   "value": "+0.0",
     *   "ability": ["+0.0", "+0_1/3", "+0_2/3", "+1.0", "+1_1/3", "+1_2/3", "+2.0"]
     * }
     */
    async getExposureBracketSetting(): Promise<{ value: string; ability: string[] }> {
        const endpoint = this.getFeatureUrl('shooting/settings/aeb');
        if (!endpoint) {
            throw new Error('Exposure bracket setting feature not found');
        }
        try {
            const response = await fetch(endpoint.path);
            if (!response.ok) {
                if (response.status === 503) {
                    const error = await response.json();
                    throw new Error(error.message || 'Device busy or mode not supported');
                }
                throw new Error(`Failed to get exposure bracket setting: ${response.status} ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Set the exposure bracket (AEB) setting.
     *
     * Makes a PUT request to /shooting/settings/aeb to set the exposure bracket value.
     *
     * @param value - The exposure bracket value to set (e.g. "+0.0", "+1.0", etc)
     * @returns {Promise<{ value: string }>} Object containing the new exposure bracket value
     * @throws {Error} When invalid parameter, device is busy, or mode not supported
     * Example response:
     * {
     *   "value": "+2.0"
     * }
     */
    async setExposureBracketSetting(value: string): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/aeb');
        if (!endpoint) {
            throw new Error('Exposure bracket setting feature not found');
        }
        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ value }),
            });
            if (!response.ok) {
                const error = await response.json();
                if (response.status === 400) {
                    throw new Error(error.message || 'Invalid parameter');
                }
                if (response.status === 503) {
                    throw new Error(error.message || 'Device busy or mode not supported');
                }
                throw new Error(error.message || `Failed to set exposure bracket setting: ${response.status} ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get the present value and ability values of the AF method setting.
     *
     * Makes a GET request to /shooting/settings/afmethod to retrieve the current AF method value and available options.
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing current AF method value and available options.
     * @throws {Error} When the device is busy or during shooting/recording.
     */
    async getAfMethodSetting(): Promise<{ value: string, ability: string[] }> {
        const endpoint = this.getFeatureUrl('shooting/settings/afmethod');

        if (!endpoint) {
            throw new Error('AF method setting feature not found');
        }

        try {
            const response = await fetch(endpoint.path, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 503) {
                    throw new Error(error.message || 'Device busy or during shooting/recording');
                }
                throw new Error(`Failed to get AF method setting: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Set the AF method setting.
     *
     * Makes a PUT request to /shooting/settings/afmethod to change the AF method value.
     *
     * @param value - The AF method value to set (e.g. "face+tracking", "spot", etc).
     * @returns {Promise<{ value: string }>} Object containing the new AF method value.
     * @throws {Error} When invalid parameter, device is busy, or during shooting/recording.
     */
    async setAfMethodSetting(value: string): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/afmethod');

        if (!endpoint) {
            throw new Error('AF method setting feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ value }),
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 400) {
                    throw new Error(error.message || 'Invalid parameter - value must be a valid AF method setting');
                }
                if (response.status === 503) {
                    throw new Error(error.message || 'Device busy or during shooting/recording');
                }
                throw new Error(`Failed to set AF method setting: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get the current continuous shooting mode setting.
     *
     * Makes a GET request to /shooting/settings/drive to retrieve the current continuous shooting mode value and available options.
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing current continuous shooting mode value and available options.
     * @throws {Error} When:
     * - Device is busy
     * - Mode not supported
     */
    async getContinuousShootingMode(): Promise<{ value: string; ability: string[] }> {
        const endpoint = this.getFeatureUrl('shooting/settings/drive');

        if (!endpoint) {
            throw new Error('Continuous shooting mode feature not found');
        }

        try {
            const response = await fetch(endpoint.path, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            if (!response.ok) {
                if (response.status === 503) {
                    const error = await response.json();
                    throw new Error(error.message || 'Device busy or mode not supported');
                }
                throw new Error(`Failed to get continuous shooting mode: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Set the continuous shooting mode setting.
     *
     * Makes a PUT request to /shooting/settings/drive to change the continuous shooting mode value.
     *
     * @param value - The continuous shooting mode value to set (e.g. "single", "highspeed", etc).
     * @returns {Promise<{ value: string }>} Object containing the new continuous shooting mode value.
     * @throws {Error} When:
     * - Invalid parameter
     * - Device is busy
     * - During shooting/recording
     * - Mode not supported
     */
    async setContinuousShootingMode(value: string): Promise<{ value: string }> {
        const endpoint = this.getFeatureUrl('shooting/settings/drive');

        if (!endpoint) {
            throw new Error('Continuous shooting mode feature not found');
        }

        try {
            const response = await fetch(endpoint.path, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ value }),
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 400) {
                    throw new Error(error.message || 'Invalid parameter - value must be a valid continuous shooting mode setting');
                }
                if (response.status === 503) {
                    throw new Error(error.message || 'Device busy, during shooting/recording, or mode not supported');
                }
                throw new Error(`Failed to set continuous shooting mode: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    }
}

export default Canon;
