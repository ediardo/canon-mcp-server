import { Camera } from './Camera.js';
import * as fs from 'fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var CanonContentType;
(function (CanonContentType) {
    CanonContentType["ALL"] = "all";
    CanonContentType["JPEG"] = "jpeg";
    CanonContentType["CR2"] = "cr2";
    CanonContentType["CR3"] = "cr3";
    CanonContentType["WAV"] = "wav";
    CanonContentType["MP4"] = "mp4";
    CanonContentType["MOV"] = "mov";
})(CanonContentType || (CanonContentType = {}));
var CanonFeatures;
(function (CanonFeatures) {
    CanonFeatures["DEVICE_INFORMATION"] = "deviceinformation";
    CanonFeatures["DEVICE_STATUS_BATTERY"] = "devicestatus/battery";
})(CanonFeatures || (CanonFeatures = {}));
var CanonVersion;
(function (CanonVersion) {
    CanonVersion["VER100"] = "ver100";
    CanonVersion["VER110"] = "ver110";
    CanonVersion["VER120"] = "ver120";
    CanonVersion["VER130"] = "ver130";
    CanonVersion["VER140"] = "ver140";
})(CanonVersion || (CanonVersion = {}));
export var CanonShootingMode;
(function (CanonShootingMode) {
    CanonShootingMode["MANUAL"] = "m";
    CanonShootingMode["APERTURE_PRIORITY"] = "av";
    CanonShootingMode["SHUTTER_PRIORITY"] = "tv";
    CanonShootingMode["PROGRAM_AE"] = "p";
    CanonShootingMode["FLEXIBLE_PRIORITY"] = "fv";
    CanonShootingMode["SCENE_INTELLIGENT_AUTO"] = "a+";
    CanonShootingMode["CUSTOM_MODE_3"] = "c3";
    CanonShootingMode["CUSTOM_MODE_2"] = "c2";
    CanonShootingMode["CUSTOM_MODE_1"] = "c1";
    CanonShootingMode["BULB"] = "bulb";
})(CanonShootingMode || (CanonShootingMode = {}));
const DELAY_AFTER_SHUTTER_BUTTON = 500;
export class Canon extends Camera {
    baseUrl;
    ipAddress;
    port;
    https;
    username;
    password;
    features;
    storages;
    directories;
    contentsNumber;
    pageNumber;
    currentStorage;
    currentDirectory;
    lastPageContents;
    isSyncActive = false;
    shootingMode;
    ignoreShootingModeDial = false;
    shootingSettings;
    apertureSetting;
    shutterSpeedSetting;
    isoSetting;
    autoFocusSetting;
    lensInformation;
    intervalMode = false;
    intervalInterval = 0;
    intervalRepeat = 0;
    constructor(ipAddress, port = 443, https, username, password) {
        super();
        this.ipAddress = ipAddress;
        this.port = port;
        this.https = https;
        this.username = username;
        this.password = password;
        this.baseUrl = `${this.https ? 'https' : 'http'}://${this.ipAddress}:${this.port}`;
    }
    async connect({ startLiveView = false } = {}) {
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
            this.features = (await response.json());
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
                await this.startLiveView();
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
        }
        catch (error) {
            throw error;
        }
    }
    static getSDPIpAddress(sdp) {
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
    async takePhoto() {
        try {
            const base64Images = [];
            await this.startEventPolling();
            const response = await this.shutterbutton();
            return response;
            //await new Promise((resolve) => setTimeout(resolve, DELAY_AFTER_SHUTTER_BUTTON));
            // const events = await this.startEventPolling();
            // if (events && events.addedcontents) {
            //     for (const content of events.addedcontents) {
            //         const image = await this.downloadImage(content, 'display');
            //         const arrayBuffer = await image.arrayBuffer();
            //         const base64 = Buffer.from(arrayBuffer).toString('base64');
            //         base64Images.push(base64);
            //     }
            // }
            // return base64Images;
        }
        catch (error) {
            throw error;
        }
    }
    async startIntervalPhotos(interval, repeat) {
        this.intervalMode = true;
        this.intervalInterval = interval;
        this.intervalRepeat = repeat;
        while (this.intervalMode && this.intervalRepeat > 0) {
            await this.takePhoto();
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
    async stopIntervalPhotos() {
        this.intervalMode = false;
        this.intervalInterval = 0;
        this.intervalRepeat = 0;
    }
    async getDateTimeSetting() {
        const url = this.getFeatureUrl('functions/datetime');
        if (!url) {
            throw new Error('Device status datetime feature not found');
        }
        const response = await fetch(url.path);
        return response.json();
    }
    async getBatteryStatus() {
        const url = this.getFeatureUrl('devicestatus/battery');
        if (!url) {
            throw new Error('Device status battery feature not found');
        }
        const response = await fetch(url.path);
        return response.json();
    }
    async getContentsNumber(directoryPath) {
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
    async getCurrentStorage() {
        const url = this.getFeatureUrl('devicestatus/currentstorage');
        if (!url) {
            throw new Error('Current storage feature not found');
        }
        const response = await fetch(url.path);
        return response.json();
    }
    async getCurrentDirectory() {
        const url = this.getFeatureUrl('devicestatus/currentdirectory');
        if (!url) {
            throw new Error('Current directory feature not found');
        }
        const response = await fetch(url.path);
        return response.json();
    }
    async getContents({ directoryPath, type, kind, order, page, }) {
        const url = this.baseUrl;
        // Create URLSearchParams object for query parameters
        const params = new URLSearchParams();
        if (type)
            params.append('type', type);
        if (kind)
            params.append('kind', kind);
        if (order)
            params.append('order', order);
        if (page)
            params.append('page', page.toString());
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
    async getDirectories(storagePath) {
        const url = this.baseUrl;
        const response = await fetch(`${url}${storagePath}`);
        this.directories = (await response.json());
        return this.directories;
    }
    async getDeviceInformation() {
        const url = this.getFeatureUrl('deviceinformation');
        if (!url) {
            throw new Error('Device information feature not found');
        }
        const response = await fetch(url.path);
        return response.json();
    }
    // async getLastPhoto(): Promise<CanonContent> {
    // }
    async getStorageStatus() {
        const url = this.getFeatureUrl('devicestatus/storage');
        if (!url) {
            throw new Error('Storage status feature not found');
        }
        const response = await fetch(url.path);
        return response.json();
    }
    async getTemperatureStatus() {
        const url = this.getFeatureUrl('devicestatus/temperature');
        if (!url) {
            throw new Error('Temperature status feature not found');
        }
        const response = await fetch(url.path);
        return response.json();
    }
    async getSDP() {
        const url = this.getFeatureUrl('shooting/liveview/rtpsessiondesc');
        if (!url) {
            throw new Error('SDP feature not found');
        }
        const response = await fetch(url.path);
        return response.text();
    }
    /**
     * Start the event monitoring in chunk format
     *
     *
     * @returns
     */
    async startEventMonitoring() {
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
                        if (pos >= value.length)
                            break;
                        // Get type
                        const type = value[pos];
                        pos++;
                        if (pos + 4 >= value.length)
                            break;
                        // Get data length (4 bytes, big-endian)
                        const length = (value[pos] << 24) | (value[pos + 1] << 16) | (value[pos + 2] << 8) | value[pos + 3];
                        pos += 4;
                        if (pos + length > value.length)
                            break;
                        // Extract the data bytes and convert to string
                        const dataBytes = value.slice(pos, pos + length);
                        const dataText = new TextDecoder().decode(dataBytes);
                        if (type === 0x02) {
                            try {
                                const jsonData = JSON.parse(dataText);
                            }
                            catch (e) {
                                continue;
                            }
                        }
                        pos += length;
                    }
                    else {
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
    async stopEventMonitoring() {
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
    async startEventPolling() {
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
    async stopEventPolling() {
        const url = this.getFeatureUrl('event/polling');
        if (!url) {
            throw new Error('Event monitoring feature not found');
        }
        const response = await fetch(url.path, { method: 'DELETE' });
        return response.json();
    }
    async startRTP() {
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
    async stopRTP() {
        const url = this.getFeatureUrl('shooting/liveview/rtp');
        if (!url) {
            throw new Error('RTP feature not found');
        }
        const response = await fetch(url.path, { method: 'POST', body: JSON.stringify({ action: 'stop' }) });
        return response.json();
    }
    async getLastPageContents() {
        const contents = await this.getContents({
            directoryPath: this.currentDirectory.path,
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
    async getLensInformation() {
        const url = this.getFeatureUrl('devicestatus/lens');
        if (!url) {
            throw new Error('Lens information feature not found');
        }
        const response = await fetch(url.path);
        return response.json();
    }
    async getStorages() {
        const url = this.getFeatureUrl('contents');
        if (!url) {
            throw new Error('Contents feature not found');
        }
        const response = await fetch(url.path);
        this.storages = (await response.json());
        return this.storages;
    }
    async getWifiSetting() {
        const url = this.getFeatureUrl('wifisetting');
        if (!url) {
            throw new Error('Wifi setting feature not found');
        }
        const response = await fetch(url.path);
        return response.json();
    }
    async sync(callback, frequency = 5) {
        this.isSyncActive = true;
        while (this.isSyncActive) {
            if (!this.isSyncActive)
                break;
            callback && callback();
            await new Promise((resolve) => setTimeout(resolve, frequency * 1000));
        }
    }
    cancelSync() {
        this.isSyncActive = false;
    }
    async downloadImage(path, kind) {
        const url = new URL(path, this.baseUrl);
        const params = new URLSearchParams();
        if (kind)
            params.append('kind', kind);
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
    async downloadImages(contents) {
        if (!contents) {
            throw new Error('Contents are empty');
        }
        const newFiles = contents.path.filter((newEntry) => {
            return !this.lastPageContents?.path.some((existingEntry) => existingEntry === newEntry);
        });
        const blobs = [];
        if (newFiles.length > 0) {
            for (const file of newFiles) {
                const blob = await this.downloadImage(file, 'display');
                blobs.push(blob);
            }
        }
        this.lastPageContents = contents;
        return blobs;
    }
    async startLiveView(liveViewSize = 'medium', cameraDisplay = 'keep') {
        const endpoint = this.getFeatureUrl('shooting/liveview');
        if (!endpoint) {
            throw new Error('Live view feature not found');
        }
        const response = await fetch(endpoint.path, {
            method: 'POST',
            body: JSON.stringify({
                liveviewsize: liveViewSize,
                cameradisplay: cameraDisplay,
            }),
        });
        return response.json();
    }
    async getLiveViewImageFlip() {
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
    async shutterbutton() {
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
        }
        catch (error) {
            if (error instanceof Response) {
                const status = error.status;
                return { status };
            }
            throw error;
        }
    }
    async getApertureSetting() {
        const endpoint = this.getFeatureUrl('shooting/settings/av');
        if (!endpoint) {
            throw new Error('Aperture setting feature not found');
        }
        const response = await fetch(endpoint.path);
        return response.json();
    }
    async setApertureSetting(value) {
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
    async getShutterSpeedSetting() {
        const endpoint = this.getFeatureUrl('shooting/settings/tv');
        if (!endpoint) {
            throw new Error('Shutter speed setting feature not found');
        }
        const response = await fetch(endpoint.path);
        const data = await response.json();
        this.shutterSpeedSetting = data.value;
        return this.shutterSpeedSetting;
    }
    async setShutterSpeedSetting(value) {
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
        }
        catch (error) {
            throw error;
        }
    }
    async getShootingSettings() {
        const endpoint = this.getFeatureUrl('shooting/settings');
        if (!endpoint) {
            throw new Error('Shooting settings feature not found');
        }
        const response = await fetch(endpoint.path);
        const data = await response.json();
        this.shootingSettings = data;
        return this.shootingSettings;
    }
    async getLastPhoto() {
        const events = await this.startEventPolling();
        if (!events || !events.addedcontents || events.addedcontents.length === 0) {
            throw new Error('No photo added');
        }
        const { addedcontents } = events;
        const path = addedcontents.filter((ad) => ad.endsWith('.JPG'))[0];
        const image = await this.downloadImage(path, 'main');
        const buffer = await image.arrayBuffer();
        // save the buffer to a file
        fs.writeFileSync(`/tmp/image-${Date.now()}.jpg`, Buffer.from(buffer));
        return Buffer.from(buffer).toString('base64');
    }
    async getIsoSetting() {
        const endpoint = this.getFeatureUrl('shooting/settings/iso');
        if (!endpoint) {
            throw new Error('ISO setting feature not found');
        }
        const response = await fetch(endpoint.path);
        const data = await response.json();
        this.isoSetting = data.value;
        return this.isoSetting;
    }
    async setIsoSetting(value) {
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
    /**
     * Get the auto focus setting
     *
     * @returns {Promise<{value: string, ability: string[]}>} Object containing current auto focus value and available options
     * Example:
     * {
     *   "value": "oneshot",
     *   "ability": ["oneshot", "servo"]
     * }
     */
    async getAutoFocusSetting() {
        const endpoint = this.getFeatureUrl('shooting/settings/afoperation');
        if (!endpoint) {
            throw new Error('Auto focus setting feature not found');
        }
        try {
            const response = await fetch(endpoint.path);
            const data = await response.json();
            this.autoFocusSetting = data.value;
            return this.autoFocusSetting;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Set the auto focus setting
     *
     * @param value
     * @returns
     */
    async setAutoFocusSetting(value) {
        const endpoint = this.getFeatureUrl('shooting/settings/afoperation');
        if (!endpoint) {
            throw new Error('Auto focus setting feature not found');
        }
        const body = {
            value,
        };
        const response = await fetch(endpoint.path, { method: 'PUT', body: JSON.stringify(body) });
        this.autoFocusSetting = value;
        return response.json();
    }
    async getShootingMode() {
        const endpoint = this.getFeatureUrl('shooting/settings/shootingmodedial');
        if (!endpoint) {
            throw new Error('Shooting mode feature not found');
        }
        try {
            const response = await fetch(endpoint.path);
            const data = await response.json();
            this.shootingMode = data.value;
            return this.shootingMode;
        }
        catch (error) {
            throw error;
        }
    }
    async setShootingMode(mode) {
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
    async getIgnoreShootingModeDial() {
        const endpoint = this.getFeatureUrl('shooting/control/ignoreshootingmodedialmode');
        if (!endpoint) {
            throw new Error('Ignore shooting mode dial feature not found');
        }
        const response = await fetch(endpoint.path);
        const data = await response.json();
        this.ignoreShootingModeDial = data.status === 'on';
        return this.ignoreShootingModeDial;
    }
    async setIgnoreShootingModeDial(status) {
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
        }
        catch (error) {
            throw error;
        }
    }
    async changeShootingMode(mode) {
        if (!this.ignoreShootingModeDial) {
            await this.setIgnoreShootingModeDial(true);
        }
        return this.setShootingMode(mode);
    }
    async restoreDialMode() {
        await this.setIgnoreShootingModeDial(false);
    }
    async getLiveViewImageFlipDetail(kind = 'info') {
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
            const result = {};
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
                        if (pos + 6 >= buffer.length)
                            break;
                        pos += 2;
                        const type = buffer[pos];
                        pos++;
                        const length = (buffer[pos] << 24) | (buffer[pos + 1] << 16) | (buffer[pos + 2] << 8) | buffer[pos + 3];
                        pos += 4;
                        if (pos + length + 2 > buffer.length) {
                            pos = pos - 7;
                            break;
                        }
                        if (type === 0x00) {
                            const imageData = buffer.slice(pos, pos + length);
                            const base64Image = Buffer.from(imageData).toString('base64');
                            // save the image to a file
                            fs.writeFileSync(`/tmp/image-${Date.now()}.jpg`, Buffer.from(base64Image, 'base64'));
                            result.image = base64Image;
                        }
                        else if (type === 0x01) {
                            const infoData = buffer.slice(pos, pos + length);
                            const text = new TextDecoder().decode(infoData);
                            try {
                                result.info = JSON.parse(text);
                            }
                            catch (e) {
                                throw new Error('Failed to parse info JSON');
                            }
                        }
                        pos += length;
                        if (pos + 1 < buffer.length && buffer[pos] === 0xff && buffer[pos + 1] === 0xff) {
                            pos += 2;
                        }
                    }
                    else {
                        pos++;
                    }
                }
                if (pos > 0) {
                    buffer = buffer.slice(pos);
                }
            }
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    getFeatureUrl(feature) {
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
    buildFeatureUrl(feature) {
        const url = new URL(feature.path, this.baseUrl);
        return url.toString();
    }
}
export default Canon;
