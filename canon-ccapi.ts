import axios, { AxiosError, AxiosResponse } from 'axios';
import https from 'https';
import { URL } from 'url';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import winston from 'winston'; // Keep winston type for logger parameter

// --- Interfaces ---

export interface PathListResponse {
    path: string[];
}

export interface ContentsNumberResponse {
    contentsnumber: number;
    pagenumber: number;
}

export interface BatteryInfoResponse {
     battery?: {
       level: number;
       kind: string;
       quality: string;
     };
     powersource?: string;
     charge?: string;
}

export interface FileInfo {
    name: string;
    size: number;
    date: string;
}

export interface DirectoryContentsResponse {
    path: string[];
    information?: FileInfo[];
    contentsnumber?: number;
    pagenumber?: number;
}

export interface DownloadResult {
    saved_to?: string;
    error?: string;
}

export interface DownloadSummary {
    downloaded: string[];
    total: number;
    output_path: string;
    kind?: string;
    file_type?: string;
    last_index: number | null;
    index_file: string | null;
    error?: string;
}

// --- Helper Functions ---

export function composeUrl(ip: string, port: number, apiPath: string = '', useHttps: boolean = true): string {
    const protocol = useHttps ? 'https' : 'http';
    let fullPath = apiPath;
    if (fullPath && !fullPath.startsWith('/ccapi')) {
        fullPath = `/ccapi${fullPath}`;
    } else if (!fullPath) {
        fullPath = '/ccapi';
    }
    const baseUrl = `${protocol}://${ip}:${port}`;
    const url = new URL(fullPath, baseUrl);
    return url.toString();
}

const createAxiosInstance = (useHttps: boolean) => {
    return axios.create({
        httpsAgent: useHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined,
        timeout: 5000,
    });
};

export const sleep = promisify(setTimeout);

// --- Core Request Functions ---

export async function checkHostReachable(ip: string, port: number, useHttps: boolean, logger: winston.Logger): Promise<boolean> {
    const url = composeUrl(ip, port, '', useHttps);
    logger.info(`Checking connection to: ${url}`);
    const instance = createAxiosInstance(useHttps);
    try {
        await instance.get(url);
        return true;
    } catch (error) {
        const axiosError = error as AxiosError;
        logger.error(`Error connecting to ${url}: ${axiosError.message}`);
        if (axiosError.response) {
            logger.error(`Status: ${axiosError.response.status}, Data: ${JSON.stringify(axiosError.response.data)}`);
        } else if (axiosError.request) {
            logger.error('No response received from server.');
        } else {
            logger.error('Error setting up request.');
        }
        return false;
    }
}

export async function makeRequest<T = any>(
    ip: string, port: number, path: string = '', useHttps: boolean = true,
    params: Record<string, any> = {}, logger: winston.Logger
): Promise<T | { raw_response: string } | null> {
    const url = composeUrl(ip, port, path, useHttps);
    logger.info(`Requesting: ${url}` + (Object.keys(params).length ? ` with params: ${JSON.stringify(params)}` : ''));
    logger.debug(`Making request to: ${url}`);
    const instance = createAxiosInstance(useHttps);
    try {
        const response: AxiosResponse<T> = await instance.get(url, { params });
        logger.debug(`Response Status Code: ${response.status}`);
        logger.debug(`Response Headers: ${JSON.stringify(response.headers)}`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        logger.error(`Error making request to ${url}: ${axiosError.message}`);
        if (axiosError.response) {
            logger.error(`Status: ${axiosError.response.status}, Data: ${JSON.stringify(axiosError.response.data)}, Headers: ${JSON.stringify(axiosError.response.headers)}`);
             if (typeof axiosError.response.data === 'string') {
                return { raw_response: axiosError.response.data };
            } else {
                 logger.error('Response data is not a string, cannot provide raw_response.');
                 return { raw_response: `Request failed with status ${axiosError.response.status}` };
            }
        } else if (axiosError.request) {
            logger.error('No response received from server.');
        } else {
            logger.error('Error setting up request.');
        }
        return null;
    }
}

// --- API Specific Functions ---

export async function listContents(ip: string, port: number, useHttps: boolean, logger: winston.Logger): Promise<PathListResponse | null> {
    const version = 'ver130';
    const apiPath = `/${version}/contents`;
    return await makeRequest<PathListResponse>(ip, port, apiPath, useHttps, {}, logger) as PathListResponse | null;
}

export async function listDirectoryContents(ip: string, port: number, dirPath: string, useHttps: boolean, logger: winston.Logger): Promise<PathListResponse | null> {
    const version = 'ver130';
    const apiPath = `/${version}/contents/${dirPath}`;
    return await makeRequest<PathListResponse>(ip, port, apiPath, useHttps, {}, logger) as PathListResponse | null;
}

export async function getDirectoryContents(
    ip: string, port: number, storage: string, directory: string, useHttps: boolean, logger: winston.Logger,
    fileType?: string, kind: string = "list", order?: string, page?: number
): Promise<DirectoryContentsResponse | null> {
    const version = 'ver130';
    const apiPath = `/${version}/contents/${storage}/${directory}`;
    const params: Record<string, any> = {};
    if (fileType) params['type'] = fileType;
    if (kind) params['kind'] = kind;
    if (order) params['order'] = order;
    if (page !== undefined) params['page'] = page;
    return await makeRequest<DirectoryContentsResponse>(ip, port, apiPath, useHttps, params, logger) as DirectoryContentsResponse | null;
}

export async function getContents(
    ip: string, port: number, storage: string, directory: string, file: string, useHttps: boolean, logger: winston.Logger, kind?: string
): Promise<AxiosResponse<Buffer> | null> {
    const version = 'ver130';
    const apiPath = `/${version}/contents/${storage}/${directory}/${file}`;
    const params: Record<string, any> = {};
    if (kind) params['kind'] = kind;
    const url = composeUrl(ip, port, apiPath, useHttps);
    logger.info(`Requesting file contents: ${url}` + (Object.keys(params).length ? ` with params: ${JSON.stringify(params)}` : ''));
    const instance = createAxiosInstance(useHttps);
    try {
        const response = await instance.get<ArrayBuffer>(url, { params, responseType: 'arraybuffer' });
        logger.debug(`Response Status Code: ${response.status}`);
        logger.debug("Response Headers: %s", JSON.stringify(response.headers));
         const bufferResponse: AxiosResponse<Buffer> = { ...response, data: Buffer.from(response.data) };
        return bufferResponse;
    } catch (error) {
        const axiosError = error as AxiosError;
        logger.error(`Error getting file contents from ${url}: ${axiosError.message}`);
        if (axiosError.response) {
            logger.error(`Status: ${axiosError.response.status}, Data: ${axiosError.response.data}`);
        } else if (axiosError.request) {
            logger.error('No response received from server.');
        } else {
            logger.error('Error setting up request.');
        }
        return null;
    }
}

export async function getBatteryInfo(ip: string, port: number, useHttps: boolean, logger: winston.Logger): Promise<BatteryInfoResponse | null> {
    const version = 'ver100';
    const apiPath = `/${version}/devicestatus/battery`;
    return await makeRequest<BatteryInfoResponse>(ip, port, apiPath, useHttps, {}, logger) as BatteryInfoResponse | null;
}

export async function pingHost(ip: string, port: number, useHttps: boolean, logger: winston.Logger, count: number = 0): Promise<void> {
    logger.info(`Pinging ${ip}:${port} using ${useHttps ? 'HTTPS' : 'HTTP'}...`);
    let i = 0;
    const infinite = count <= 0;
    try {
        while (infinite || i < count) {
            const isReachable = await checkHostReachable(ip, port, useHttps, logger); // Pass logger
            const status = isReachable ? "Success" : "Failed";
            console.log(`Reply from ${ip}:${port}: ${status}`); // Keep console log for ping output
            if (!isReachable && !infinite) break;
            i++;
            if (infinite || i < count) await sleep(1000);
        }
    } catch (error) {
        logger.error(`Error during ping: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// --- Image Handling ---

export function getImageIndex(filename: string, logger: winston.Logger): number | null {
    try {
        const name = path.parse(filename).name;
        const parts = name.split('_');
        if (parts.length > 1) {
            const numberPart = parts[parts.length - 1];
            const number = parseInt(numberPart, 10);
            if (!isNaN(number)) return number;
        }
        const match = name.match(/[a-zA-Z]+(\d+)$/);
         if (match && match[1]) {
             const number = parseInt(match[1], 10);
             if (!isNaN(number)) return number;
         }
        return null;
    } catch (error) {
        logger.error(`Error extracting image index from "${filename}": ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export async function storeLastImageIndex(index: number, configDir: string, logger: winston.Logger): Promise<string | null> {
    const indexFilePath = path.join(configDir, 'last_image_index.txt');
    try {
        await fs.promises.mkdir(configDir, { recursive: true });
        await fs.promises.writeFile(indexFilePath, String(index), 'utf8');
        logger.info(`Stored last image index ${index} in ${indexFilePath}`);
        return indexFilePath;
    } catch (error) {
        logger.error(`Error storing last image index in "${indexFilePath}": ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export async function readLastImageIndex(configDir: string, logger: winston.Logger): Promise<number> {
     const indexFilePath = path.join(configDir, 'last_image_index.txt');
     try {
         if (fs.existsSync(indexFilePath)) {
             const content = await fs.promises.readFile(indexFilePath, 'utf8');
             const index = parseInt(content.trim(), 10);
             return isNaN(index) ? 0 : index;
         }
     } catch (error) {
         logger.error(`Error reading last image index from "${indexFilePath}": ${error instanceof Error ? error.message : String(error)}`);
     }
     return 0;
 }

export async function getLatestDirectoryAndPage(ip: string, port: number, useHttps: boolean, logger: winston.Logger): Promise<{ storage: string; directory: string; lastPage: number } | null> {
    try {
        const storages = await listContents(ip, port, useHttps, logger);
        if (!storages?.path?.length) { logger.error('No storage found on camera.'); return null; }
        const storage = storages.path[0].split('/').pop()!;

        const directories = await listDirectoryContents(ip, port, storage, useHttps, logger);
        if (!directories?.path?.length) { logger.error(`No directories found in storage '${storage}'.`); return null; }
        const recentDirPath = directories.path[directories.path.length - 1];
        const directory = recentDirPath.split('/').pop()!;

         const pageInfo = await getDirectoryContents(ip, port, storage, directory, useHttps, logger, undefined, 'number');
         if (!pageInfo || typeof pageInfo.pagenumber !== 'number') {
             logger.error(`Could not get page number for directory '${directory}'. Response: ${JSON.stringify(pageInfo)}`);
             return null;
         }
         return { storage, directory, lastPage: pageInfo.pagenumber };
    } catch (error) {
        logger.error(`Error finding latest directory/page: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export async function saveContents(response: AxiosResponse<Buffer> | null, logger: winston.Logger, outputPath?: string): Promise<DownloadResult> {
    if (!response) return { error: 'No response received' };
    if (response.status !== 200) {
        let errorMsg = `Request failed with status code ${response.status}`;
         const contentType = response.headers['content-type'];
         if (contentType && contentType.includes('json')) {
             try { errorMsg += `: ${JSON.stringify(JSON.parse(response.data.toString('utf8')))}`; } catch (e) { /* ignore */ }
         }
        return { error: errorMsg };
    }

    let filename: string | undefined;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
    }

    const targetDir = outputPath ? path.dirname(outputPath) : process.cwd();
    const targetFile = outputPath ? path.basename(outputPath) : (filename || 'downloaded_file');
    const finalPath = path.join(targetDir, targetFile);

    try {
        await fs.promises.mkdir(targetDir, { recursive: true });
        await fs.promises.writeFile(finalPath, response.data);
        logger.info(`File saved to: ${finalPath}`);
        return { saved_to: finalPath };
    } catch (error) {
        logger.error(`Error saving file to "${finalPath}": ${error instanceof Error ? error.message : String(error)}`);
        return { error: `Failed to save file: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function downloadImages(
    ip: string, port: number, lastN: number, useHttps: boolean, logger: winston.Logger, configDir: string,
    outputDirArg?: string, kind?: string, fileType?: string
): Promise<DownloadSummary> {
    const outputDir = outputDirArg ? path.resolve(outputDirArg) : process.cwd();
    let lastIndex: number | null = null;
    let indexFilePath: string | null = null;
    const downloadedFiles: string[] = [];
    const summaryBase = { downloaded: [], total: 0, output_path: outputDir, last_index: null, index_file: null, kind, file_type: fileType };

    try {
        const latestDirInfo = await getLatestDirectoryAndPage(ip, port, useHttps, logger);
        if (!latestDirInfo) return { ...summaryBase, error: 'Could not determine latest directory or page.' };
        const { storage, directory, lastPage } = latestDirInfo;

        const filesResponse = await getDirectoryContents(ip, port, storage, directory, useHttps, logger, fileType, 'list', undefined, lastPage);
        if (!filesResponse?.path?.length) {
             logger.warn(`No files found on the last page (${lastPage}) of directory '${directory}'.`);
             const numResponse = await getDirectoryContents(ip, port, storage, directory, useHttps, logger, fileType, 'number');
             if (numResponse?.contentsnumber) logger.warn(`Directory has ${numResponse.contentsnumber} files of type ${fileType || 'any'}. Consider pagination.`);
            return { ...summaryBase, error: 'No files found on the last page.' };
        }

         const imageFiles = filesResponse.path
            .map(p => p.split('/').pop()!)
            .filter(f => /\.(jpe?g|cr2|cr3|png|gif|tiff?)$/i.test(f));
        const filesToDownload = imageFiles.slice(-lastN);
        logger.info(`Attempting to download the last ${filesToDownload.length} images from page ${lastPage} of ${directory}...`);

        for (const file of filesToDownload) {
            const response = await getContents(ip, port, storage, directory, file, useHttps, logger, kind);
            if (response) {
                const saveResult = await saveContents(response, logger, path.join(outputDir, file));
                if (saveResult.saved_to) {
                    downloadedFiles.push(file);
                    const currentIndex = getImageIndex(file, logger);
                    if (currentIndex !== null) lastIndex = Math.max(lastIndex ?? -1, currentIndex);
                } else { logger.warn(`Failed to download or save ${file}: ${saveResult.error}`); }
            } else { logger.warn(`Failed to get contents for ${file}.`); }
        }

        if (lastIndex !== null) {
            indexFilePath = await storeLastImageIndex(lastIndex, configDir, logger);
        }

        return {
            ...summaryBase,
            downloaded: downloadedFiles,
            total: downloadedFiles.length,
            last_index: lastIndex,
            index_file: indexFilePath
        };
    } catch (error) {
        logger.error(`Error downloading images: ${error instanceof Error ? error.message : String(error)}`);
        return { ...summaryBase, error: error instanceof Error ? error.message : String(error), last_index: lastIndex, index_file: indexFilePath };
    }
}

export async function syncImages(
    ip: string, port: number, useHttps: boolean, logger: winston.Logger, configDir: string,
    outputDirArg?: string, kind?: string, fileType?: string, frequency: number = 60
): Promise<void> {
     const outputDir = outputDirArg ? path.resolve(outputDirArg) : process.cwd();
     let lastIndex = await readLastImageIndex(configDir, logger);
     logger.info(`Starting sync with last known index: ${lastIndex}. Checking every ${frequency} seconds.`);
     try { await fs.promises.mkdir(outputDir, { recursive: true }); } catch (error) {
         logger.error(`Failed to create output directory "${outputDir}": ${error instanceof Error ? error.message : String(error)}`); return;
     }

     // eslint-disable-next-line no-constant-condition
     while (true) {
         try {
             const latestDirInfo = await getLatestDirectoryAndPage(ip, port, useHttps, logger);
             if (!latestDirInfo) { logger.warn('Could not determine latest directory for sync cycle.'); await sleep(frequency * 1000); continue; }
             const { storage, directory, lastPage } = latestDirInfo;

             const filesResponse = await getDirectoryContents(ip, port, storage, directory, useHttps, logger, fileType, 'list', undefined, lastPage);
             if (!filesResponse?.path?.length) { logger.debug(`No files found on page ${lastPage} of ${directory} during sync cycle.`); await sleep(frequency * 1000); continue; }

             const filesToCheck: { name: string; index: number }[] = [];
             for (const filePath of filesResponse.path) {
                const filename = filePath.split('/').pop();
                 if (filename && /\.(jpe?g|cr2|cr3|png|gif|tiff?)$/i.test(filename)) {
                    const currentIndex = getImageIndex(filename, logger);
                    if (currentIndex !== null && currentIndex > lastIndex) filesToCheck.push({ name: filename, index: currentIndex });
                 }
             }

             if (filesToCheck.length > 0) {
                 filesToCheck.sort((a, b) => a.index - b.index);
                 logger.info(`Found ${filesToCheck.length} new images to download (since index ${lastIndex}).`);
                 let downloadedCount = 0;
                 for (const fileInfo of filesToCheck) {
                     const response = await getContents(ip, port, storage, directory, fileInfo.name, useHttps, logger, kind);
                     if (response) {
                         const saveResult = await saveContents(response, logger, path.join(outputDir, fileInfo.name));
                         if (saveResult.saved_to) {
                             downloadedCount++; lastIndex = fileInfo.index; await storeLastImageIndex(lastIndex, configDir, logger);
                         } else { logger.warn(`Failed to save ${fileInfo.name}: ${saveResult.error}`); }
                     } else { logger.warn(`Failed to get contents for ${fileInfo.name}.`); }
                 }
                 logger.info(`Downloaded ${downloadedCount} new images. New last index: ${lastIndex}`);
             } else { logger.debug(`No new images found (last index: ${lastIndex}).`); }
         } catch (error) { logger.error(`Error during sync cycle: ${error instanceof Error ? error.message : String(error)}`); }
         await sleep(frequency * 1000);
     }
 } 