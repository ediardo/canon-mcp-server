import { Camera } from './Camera.js';
import * as fs from 'fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

enum CanonContentType {
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

enum CanonVersion {
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

const DELAY_AFTER_SHUTTER_BUTTON = 500;

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

    constructor(ipAddress: string, port: number = 443, https: boolean, username?: string, password?: string) {
        super();
        this.ipAddress = ipAddress;
        this.port = port;
        this.https = https;
        this.username = username;
        this.password = password;
        this.baseUrl = `${this.https ? 'https' : 'http'}://${this.ipAddress}:${this.port}`;
    }

    async connect(): Promise<any> {
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

            return {
                currentDirectory: this.currentDirectory,
                shootingSettings: this.shootingSettings,
                manufacturer: this.manufacturer,
                modelName: this.modelName,
                serialNumber: this.serialNumber,
                firmwareVersion: this.firmwareVersion,
                macAddress: this.macAddress,
            };
        } catch (error) {
            throw error;
        }
    }

    async takePicture(): Promise<string[]> {
        try {
            const base64Images: string[] = [];

            await this.shutterbutton();
            await new Promise((resolve) => setTimeout(resolve, DELAY_AFTER_SHUTTER_BUTTON));
            const events = await this.startEventPolling();
            if (events && events.addedcontents) {
                for (const content of events.addedcontents) {
                    const image = await this.downloadImage(content, 'display');
                    const arrayBuffer = await image.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    base64Images.push(base64);
                }
            }

            return base64Images;
        } catch (error) {
            throw error;
        }
    }

    async getDeviceStatusBattery(): Promise<CanonDeviceStatusBattery> {
        const url = this.getFeatureUrl('devicestatus/battery');

        if (!url) {
            throw new Error('Device status battery feature not found');
        }

        const response = await fetch(url.path);

        return response.json();
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

    /**
     * Start the event monitoring in chunk format
     * 
     * 
     * @returns
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
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body reader not available');
        }

        // Process chunks as they arrive
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // value is a Uint8Array containing the chunk data
            if (value) {
                // Parse the binary data
                let pos = 0;
                while (pos < value.length) {
                    // Look for start marker: 0xFF followed by 0x00
                    if (value[pos] === 0xff && pos + 1 < value.length && value[pos + 1] === 0x00) {
                        // Found marker, move past it
                        pos += 2;

                        if (pos >= value.length) break;

                        // Get type
                        const type = value[pos];
                        pos++;

                        if (pos + 4 >= value.length) break;

                        // Get data length (4 bytes, big-endian)
                        const length =
                            (value[pos] << 24) | (value[pos + 1] << 16) | (value[pos + 2] << 8) | value[pos + 3];
                        pos += 4;

                        if (pos + length > value.length) break;

                        // Extract the data bytes and convert to string
                        const dataBytes = value.slice(pos, pos + length);
                        const dataText = new TextDecoder().decode(dataBytes);

                        if (type === 0x02) {
                            try {
                                const jsonData = JSON.parse(dataText);
                            } catch (e) {
                                continue;
                            }
                        }

                        pos += length;
                    } else {
                        // Not a marker, skip to next byte
                        pos++;
                    }
                }
            }
        }

        return {};
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

        if (url.version === CanonVersion.VER100) {
            const timemout = 'immediate';
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
    
    async getLastPageContents(): Promise<any> {
        const contents = await this.getContents({
            directoryPath: this.currentDirectory!.path,
            type: CanonContentType.JPEG,
            kind: 'list',
            page: this.pageNumber,
        });

        return contents;
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

    async downloadImage(path: string, kind: string) {
        const url = new URL(path, this.baseUrl);
        const params = new URLSearchParams();
        if (kind) params.append('kind', kind);

        // Construct the full URL with query parameters
        const queryString = params.toString();

        if (queryString) {
            url.search = queryString;
        }

        // save the url to a file
        fs.writeFileSync(`/tmp/canon-${Date.now()}.url`, url.toString());
        const response = await fetch(url.toString());
        // save the response to a file
        if (!response.ok) {
            // save the response to a file
            fs.writeFileSync(`/tmp/canon-${Date.now()}.json`, JSON.stringify(response, null, 2));
            // save the status text to a file
            fs.writeFileSync(`/tmp/canon-${Date.now()}.status`, response.statusText);
            throw new Error(`Failed to download image: ${response.statusText}`);
        }

        return response.blob();
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
                const blob = await this.downloadImage(file, 'display');
                blobs.push(blob);
            }
        }

        this.lastPageContents = contents;

        return blobs;
    }

    async startLiveView() {
        const endpoint = this.getFeatureUrl('shooting/liveview');

        if (!endpoint) {
            throw new Error('Live view feature not found');
        }

        const response = await fetch(endpoint.path, {
            method: 'POST',
            body: JSON.stringify({
                liveviewsize: 'medium',
                cameradisplay: 'on',
            }),
        });

        return response.json();
    }

    async flip(savePath?: string): Promise<ArrayBuffer> {
        const endpoint = this.getFeatureUrl('shooting/liveview/flip');

        if (!endpoint) {
            throw new Error('Flip  feature not found');
        }

        const response = await fetch(endpoint.path, { method: 'GET', headers: { 'Content-Type': 'image/jpeg' } });

        // check if the response is an image
        if (response.headers.get('content-type')?.includes('image/jpeg')) {
            const buffer = await response.arrayBuffer();

            return buffer;
        }

        return response.json();
    }

    async shutterbutton(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/control/shutterbutton');

        if (!endpoint) {
            throw new Error('Shutter button feature not found');
        }

        const body = {
            af: true,
        };

        try {
            const response = await fetch(endpoint.path, {
                method: 'POST',
                body: JSON.stringify(body),
            });

            return response.json();
        } catch (error) {
            if (error instanceof Response) {
                const status = error.status;
                return { status };
            }
            throw error;
        }
    }

    async getApertureSetting(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/av');

        if (!endpoint) {
            throw new Error('Aperture setting feature not found');
        }

        const response = await fetch(endpoint.path);

        return response.json();
    }

    async setApertureSetting(value: string): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/av');

        if (!endpoint) {
            throw new Error('Aperture setting feature not found');
        }

        const body = {
            value,
        };

        const response = await fetch(endpoint.path, { method: 'PUT', body: JSON.stringify(body) });

        return response.json();
    }

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


    async getShootingSettings(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings');

        if (!endpoint) {
            throw new Error('Shooting settings feature not found');
        }

        const response = await fetch(endpoint.path);

        const data = await response.json();

        this.shootingSettings = data;

        return this.shootingSettings;
    }

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
    
    async setIsoSetting(value: string): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/iso');

        if (!endpoint) {
            throw new Error('ISO setting feature not found');
        }

        const body = {
            value,
        };

        const response = await fetch(endpoint.path, { method: 'PUT', body: JSON.stringify(body) });
        this.isoSetting = value;
        return response.json();
    }

    async getAutoFocusSetting(): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/af');

        if (!endpoint) {
            throw new Error('Auto focus setting feature not found');
        }

        try {
            const response = await fetch(endpoint.path);

            const data = await response.json();

            this.autoFocusSetting = data.value;

            return this.autoFocusSetting;
        } catch (error) {
            throw error;
        }
    }
    
    
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

    async setShootingMode(mode: CanonShootingMode): Promise<any> {
        const endpoint = this.getFeatureUrl('shooting/settings/shootingmode');

        if (!endpoint) {
            throw new Error('Shooting mode feature not found');
        }

        const body = {
            value: mode,
        };

        const response = await fetch(endpoint.path, { method: 'PUT', body: JSON.stringify(body) });

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

    async flipDetail(kind: string = 'info'): Promise<{ info?: any; image?: ArrayBuffer }> {
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

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body reader not available');
            }

            const result: { info?: any; image?: ArrayBuffer } = {};
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
                            result.image = imageData.buffer.slice(
                                imageData.byteOffset,
                                imageData.byteOffset + imageData.byteLength
                            );
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

    private buildFeatureUrl(feature: ApiEndpoint) {
        const url = new URL(feature.path, this.baseUrl);

        return url.toString();
    }
}
