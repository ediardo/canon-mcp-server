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
var ShutterButtonAction;
(function (ShutterButtonAction) {
    ShutterButtonAction["Release"] = "release";
    ShutterButtonAction["HalfPress"] = "half_press";
    ShutterButtonAction["FullPress"] = "full_press";
})(ShutterButtonAction || (ShutterButtonAction = {}));
export var CanonShutterMode;
(function (CanonShutterMode) {
    CanonShutterMode["ELECTRONIC_FIRST_CURTAIN"] = "elec_1st_curtain";
    CanonShutterMode["MECHANICAL"] = "mechanical";
    CanonShutterMode["ELECTRONIC"] = "electronic";
})(CanonShutterMode || (CanonShutterMode = {}));
export var CanonWhiteBalanceMode;
(function (CanonWhiteBalanceMode) {
    CanonWhiteBalanceMode["AUTO"] = "auto";
    CanonWhiteBalanceMode["AWB_WHITE"] = "awbwhite";
    CanonWhiteBalanceMode["DAYLIGHT"] = "daylight";
    CanonWhiteBalanceMode["SHADE"] = "shade";
    CanonWhiteBalanceMode["CLOUDY"] = "cloudy";
    CanonWhiteBalanceMode["TUNGSTEN"] = "tungsten";
    CanonWhiteBalanceMode["WHITE_FLUORESCENT"] = "whitefluorescent";
    CanonWhiteBalanceMode["FLASH"] = "flash";
    CanonWhiteBalanceMode["CUSTOM"] = "custom";
    CanonWhiteBalanceMode["COLOR_TEMP"] = "colortemp"; // Color temp.
})(CanonWhiteBalanceMode || (CanonWhiteBalanceMode = {}));
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
            await this.startEventPolling();
            const response = await this.shutterbutton();
            return response;
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
    async getOwnerName() {
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
    async setOwnerName(name) {
        const endpoint = this.getFeatureUrl('functions/registeredname/ownername');
        if (!endpoint) {
            throw new Error('Owner name feature not found');
        }
        const response = await fetch(endpoint.path, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ownername: name
            })
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
    async getDateTimeSetting() {
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
    async getBatteryStatus() {
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
        }
        catch (error) {
            throw error;
        }
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
        // fs.writeFileSync(`/tmp/canon-${Date.now()}.url`, url.toString());
        const response = await fetch(url.toString());
        // save the response to a file
        // if (!response.ok) {
        //     // save the response to a file
        //     fs.writeFileSync(`/tmp/canon-${Date.now()}.json`, JSON.stringify(response, null, 2));
        //     // save the status text to a file
        //     fs.writeFileSync(`/tmp/canon-${Date.now()}.status`, response.statusText);
        //     throw new Error(`Failed to download image: ${response.statusText}`);
        // }
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
    async shutterbutton(af = true) {
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Failed to take photo: ${response.status} ${response.statusText}`);
            }
            return response.json();
        }
        catch (error) {
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
    async shutterbuttonManual(action, af = true) {
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Failed to control shutter: ${response.status} ${response.statusText}`);
            }
            return response.json();
        }
        catch (error) {
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
    async getApertureSetting() {
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
    async setApertureSetting(value) {
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
        }
        catch (error) {
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
    async getExposureCompensationSetting() {
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
    async setExposureCompensationSetting(value) {
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
    async getWhiteBalanceSetting() {
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
    async setWhiteBalanceSetting(value) {
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
    async getColorTemperatureSetting() {
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
    async setColorTemperatureSetting(value) {
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
        const base64 = Buffer.from(buffer).toString('base64');
        return base64;
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
    async setIsoSetting(value) {
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
    async getAutofocusOperationSetting() {
        const endpoint = this.getFeatureUrl('shooting/settings/afoperation');
        if (!endpoint) {
            throw new Error('Auto focus setting feature not found');
        }
        try {
            const response = await fetch(endpoint.path);
            const data = await response.json();
            this.autoFocusSetting = data;
            return data;
        }
        catch (error) {
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
    async setAutofocusOperationSetting(value) {
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
        }
        catch (error) {
            throw error;
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
    async setShootingMode(mode) {
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
    async getShutterMode() {
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
    async setShutterMode(value) {
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
