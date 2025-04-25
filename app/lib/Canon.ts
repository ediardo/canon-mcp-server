import { Camera } from './Camera';
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

    constructor(ipAddress: string, port: number = 443, https: boolean, username?: string, password?: string) {
        super();
        this.ipAddress = ipAddress;
        this.port = port;
        this.https = https;
        this.username = username;
        this.password = password;
        this.baseUrl = `${this.https ? 'https' : 'http'}://${this.ipAddress}:${this.port}`;
    }

    async connect() {
        console.log(`Canon[${this.ipAddress}:${this.port}]: Connecting to ${this.baseUrl}...`);

        const headers = new Headers();

        try {
            const response = await fetch(`${this.baseUrl}/ccapi`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                const errorMessage = `HTTP error! status: ${response.status} for ${this.baseUrl}`;
                console.error(`Canon[${this.ipAddress}:${this.port}]: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            console.log(`Canon[${this.ipAddress}:${this.port}]: Connection successful to ${this.baseUrl}`);
            this.features = (await response.json()) as ApiVersionFeatures;

            this.currentDirectory = await this.getCurrentDirectory();
            const deviceInformation = await this.getDeviceInformation();
            this.manufacturer = deviceInformation.manufacturer;
            this.modelName = deviceInformation.productname;
            this.serialNumber = deviceInformation.serialnumber;
            this.firmwareVersion = deviceInformation.firmwareversion;
            this.macAddress = deviceInformation.macaddress;
            const { contentsNumber, pageNumber } = await this.getContentsNumber(this.currentDirectory!.path);
            this.contentsNumber = contentsNumber;
            this.pageNumber = pageNumber;
            this.lastPageContents = await this.getLastPageContents();
            console.log(`Canon[${this.ipAddress}:${this.port}]: Current directory: ${this.currentDirectory!.path}`);
            console.log(`Canon[${this.ipAddress}:${this.port}]: Contents number: ${this.contentsNumber}`);
            console.log(`Canon[${this.ipAddress}:${this.port}]: Page number: ${this.pageNumber}`);
            console.log(`Canon[${this.ipAddress}:${this.port}]: Device Name: ${this.modelName}`);
        } catch (error) {
            console.error(`Canon[${this.ipAddress}:${this.port}]: Connection failed for ${this.baseUrl}:`, error);
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
     * Stream the event monitoring data
     * @returns 
     */
    async getEventMonitoring(): Promise<any> {
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
            const {done, value} = await reader.read();
            
            if (done) {
                break;
            }

            // value is a Uint8Array containing the chunk data
            if (value) {
                console.log('Received chunk size:', value.length);
                
                // Parse the binary data
                let pos = 0;
                while (pos < value.length) {
                    // Look for start marker: 0xFF followed by 0x00
                    if (value[pos] === 0xFF && pos + 1 < value.length && value[pos + 1] === 0x00) {
                        // Found marker, move past it
                        pos += 2;
                        
                        if (pos >= value.length) break;
                        
                        // Get type
                        const type = value[pos];
                        pos++;
                        
                        if (pos + 4 >= value.length) break;
                        
                        // Get data length (4 bytes, big-endian)
                        const length = (value[pos] << 24) | (value[pos+1] << 16) | (value[pos+2] << 8) | value[pos+3];
                        pos += 4;
                        
                        if (pos + length > value.length) break;
                        
                        // Extract the data bytes and convert to string
                        const dataBytes = value.slice(pos, pos + length);
                        const dataText = new TextDecoder().decode(dataBytes);
                        
                        console.log(`Event type: ${type}, Length: ${length}, Data: ${dataText}`);
                        
                        if (type === 0x02) {
                            try {
                                const jsonData = JSON.parse(dataText);
                                console.log("Parsed event data:", jsonData);
                            } catch (e) {
                                console.log("Not valid JSON data");
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

    async getEventPolling(): Promise<any> {
        const url = this.getFeatureUrl('event/polling');

        if (!url) {
            throw new Error('Event monitoring feature not found');
        }

        const fullUrl = new URL(url.path);

        if (url.version === CanonVersion.VER100) {
            const timemout = "immediate";
            fullUrl.searchParams.append('timeout', timemout);
        }
        console.log(fullUrl.toString());
        const response = await fetch(fullUrl.toString());

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

    async sync(callback?: (any: any) => void, frequency: number = 5) {
        console.log(`Canon[${this.ipAddress}:${this.port}]: Syncing with frequency ${frequency} seconds`);
        this.isSyncActive = true;

        while (this.isSyncActive) {
            console.log('Waiting for', frequency, 'seconds');

            // Wait for the specified frequency in seconds
            await new Promise((resolve) => setTimeout(resolve, frequency * 1000));
            // If sync was cancelled during the wait, exit the loop
            if (!this.isSyncActive) break;

            // const { contentsNumber, pageNumber } = await this.getContentsNumber(this.currentDirectory!.path);

            // if (this.contentsNumber !== contentsNumber || this.pageNumber !== pageNumber) {
            //     this.contentsNumber = contentsNumber;
            //     this.pageNumber = pageNumber;
            //     const lastPageContents = await this.getLastPageContents();
            //     const images = await this.downloadImages(lastPageContents);
            //     callback(images)
            // }

            // const eventMonitoring = await this.getEventMonitoring();
            // console.log(eventMonitoring);
            // const eventPolling = await this.getEventPolling();
            // console.log(eventPolling);

            const flipDetail = await this.flipDetail();
            console.log(flipDetail);
        }

        console.log(`Canon[${this.ipAddress}:${this.port}]: Sync process stopped`);
    }

    cancelSync() {
        console.log(`Canon[${this.ipAddress}:${this.port}]: Cancelling sync process`);
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

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }

        return response.blob();
    }

    async downloadImages(contents: CanonContents): Promise<Blob[]> {
        console.log(`Canon[${this.ipAddress}:${this.port}]: Downloading images from paths:`, contents.path);

        if (!contents) {
            throw new Error('Contents are empty');
        }

        // Compare the current contents with the last page contents
        const newFiles = contents.path.filter((newEntry) => {
            // Check if this entry exists in lastPageContents
            return !this.lastPageContents?.path.some((existingEntry) => existingEntry === newEntry);
        });

        const blobs: Blob[] = [];

        if (newFiles.length > 0) {
            console.log(
                `Canon[${this.ipAddress}:${this.port}]: Found ${newFiles.length} new files to download:`,
                newFiles
            );

            for (const file of newFiles) {
                const blob = await this.downloadImage(file, 'display');
                blobs.push(blob);
            }
        }

        // Update lastPageContents with current contents
        this.lastPageContents = contents;

        return blobs;
    }

    async startLiveView() {
        console.debug('startLiveView');
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

    async flipDetail(kind: string = 'info'): Promise<{info?: any, image?: ArrayBuffer}> {
        console.debug('flipDetail', kind);
        const endpoint = this.getFeatureUrl('shooting/liveview/flipdetail');

        if (!endpoint) {
            console.error('Flip detail feature not found');
            throw new Error('Flip detail feature not found');
        }

        const url = new URL(endpoint.path);
        url.searchParams.append('kind', kind);
        
        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'Content-Type': 'application/octet-stream' },
            });
            
            // Use streaming approach to keep connection open
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body reader not available');
            }

            const result: { info?: any, image?: ArrayBuffer } = {};
            let buffer = new Uint8Array(0);
            
            console.log('Starting to stream live view data...');
            
            // Keep reading chunks indefinitely to maintain the connection
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    console.log('Stream closed by server');
                    break;
                }
                
                if (!value || value.length === 0) {
                    continue;
                }
                
                console.log(`Received chunk of ${value.length} bytes`);
                
                // Append the new chunk to our buffer
                const newBuffer = new Uint8Array(buffer.length + value.length);
                newBuffer.set(buffer);
                newBuffer.set(value, buffer.length);
                buffer = newBuffer;
                
                // Process all complete frames in the buffer
                let pos = 0;
                while (pos < buffer.length - 1) {
                    // Find start marker 0xFF,0x00
                    if (buffer[pos] === 0xFF && buffer[pos + 1] === 0x00) {
                        // Need at least 7 bytes: marker(2) + type(1) + length(4)
                        if (pos + 6 >= buffer.length) break;
                        
                        pos += 2; // Skip marker
                        
                        // Get type (0x00 for image, 0x01 for info)
                        const type = buffer[pos];
                        pos++;
                        
                        // Get data length (4 bytes, big-endian)
                        const length = (buffer[pos] << 24) | (buffer[pos + 1] << 16) | 
                                      (buffer[pos + 2] << 8) | buffer[pos + 3];
                        pos += 4;
                        
                        // Check if we have enough data to extract the full frame
                        if (pos + length + 2 > buffer.length) {
                            pos = pos - 7; // Reset position to before this frame
                            break;  // Wait for more data
                        }
                        
                        // Extract data based on type
                        if (type === 0x00) { // Image data
                            console.log('Found image data with length', length);
                            const imageData = buffer.slice(pos, pos + length);
                            result.image = imageData.buffer.slice(imageData.byteOffset, imageData.byteOffset + imageData.byteLength);
                        } else if (type === 0x01) { // Info data
                            console.log('Found info data with length', length);
                            const infoData = buffer.slice(pos, pos + length);
                            const text = new TextDecoder().decode(infoData);
                            try {
                                result.info = JSON.parse(text);
                                console.log('Parsed info:', result.info);
                            } catch (e) {
                                console.error('Failed to parse info JSON:', e);
                            }
                        }
                        
                        pos += length;
                        
                        // Check for end marker 0xFF,0xFF
                        if (pos + 1 < buffer.length && buffer[pos] === 0xFF && buffer[pos + 1] === 0xFF) {
                            pos += 2;  // Skip end marker
                        }
                    } else {
                        pos++;
                    }
                }
                
                // Remove processed data from buffer
                if (pos > 0) {
                    buffer = buffer.slice(pos);
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error in flipDetail:', error);
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

async function main() {
    const ipAddress = '10.0.0.241';
    const canon = new Canon(ipAddress, 8080, false);
    await canon.connect();
    // const eventPolling = await canon.getEventPolling();
    // console.log(eventPolling);


    // await canon.getEventMonitoring();
    //await canon.startLiveView();
    await canon.sync(undefined, 5);

    
}

main();
