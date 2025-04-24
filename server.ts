import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import winston from 'winston';
import * as ccapi from './canon-ccapi'; // Import the library

// Load environment variables from .env file
dotenv.config();

// --- Constants and Logger Setup ---
const DEFAULT_IP: string = process.env.DEFAULT_IP || '127.0.0.1';
const DEFAULT_PORT: number = parseInt(process.env.DEFAULT_PORT || '8080', 10);
const DEFAULT_HTTPS: boolean = (process.env.DEFAULT_HTTPS || 'false').toLowerCase() === 'true';
const DEFAULT_LOG_LEVEL: string = (process.env.DEFAULT_LOG_LEVEL || 'info').toLowerCase();
const DEFAULT_CONFIG_DIR: string = path.resolve(process.env.DEFAULT_CONFIG_DIR || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.canon'));

const logger = winston.createLogger({
    level: DEFAULT_LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} - ${level.toUpperCase()} - ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

logger.info(`Default config directory: ${DEFAULT_CONFIG_DIR}`);

// --- CLI Specific Functions ---

function printResponse(response: any): void {
    if (response === null || response === undefined) {
        console.log("No response received or error occurred.");
        return;
    }
    try {
        if (typeof response === 'object' && response !== null && 'raw_response' in response) {
             console.log("Received non-JSON response:");
             console.log(response.raw_response);
        } else if (typeof response === 'object') {
            console.log(JSON.stringify(response, null, 2));
        } else {
            console.log(response);
        }
    } catch (e) {
        logger.error("Error printing response:", e);
        console.log("Raw response data:", response);
    }
}

// --- Main Execution (CLI) ---

async function main() {
    const program = new Command();

    program
        .name('canon-cli')
        .description('CLI tool for Canon CCAPI using canon-ccapi library')
        .version('1.0.0');

    program
        .option('--ip <ip>', 'IP address', DEFAULT_IP)
        .option('--port <port>', 'Port number', (val) => parseInt(val, 10), DEFAULT_PORT)
        .option('--https', 'Use HTTPS', DEFAULT_HTTPS)
        .option('--log-level <level>', 'Logging level (debug, info, warn, error)', DEFAULT_LOG_LEVEL);

    program.hook('preAction', (thisCommand) => {
        const options = thisCommand.opts();
        const logLevel = options.logLevel?.toLowerCase() || 'info';
         if (['debug', 'info', 'warn', 'error'].includes(logLevel)) {
             logger.level = logLevel;
             logger.info(`Log level set to: ${logger.level}`);
         } else {
            logger.warn(`Invalid log level: ${options.logLevel}. Using default: ${logger.level}`);
         }
    });

    program
        .command('check-connection').aliases(['cc'])
        .description('Check host reachability')
        .action(async (options, command) => {
            const globalOpts = command.parent!.opts();
            const isReachable = await ccapi.checkHostReachable(globalOpts.ip, globalOpts.port, globalOpts.https, logger);
            console.log(`Host ${globalOpts.ip}:${globalOpts.port} is ${isReachable ? 'reachable' : 'not reachable'}!`);
            process.exit(isReachable ? 0 : 1);
        });

    program
        .command('connect').aliases(['c'])
        .description('Make a generic API request')
        .option('--path <path>', 'API path (e.g., /ver100/deviceinfo)', '')
        .action(async (options, command) => {
             const globalOpts = command.parent!.opts();
            const response = await ccapi.makeRequest(globalOpts.ip, globalOpts.port, options.path, globalOpts.https, {}, logger);
            printResponse(response);
        });

    program
        .command('list-contents').aliases(['lc'])
        .description('List storage roots (e.g., card1)')
        .action(async (options, command) => {
             const globalOpts = command.parent!.opts();
            const response = await ccapi.listContents(globalOpts.ip, globalOpts.port, globalOpts.https, logger);
            printResponse(response);
        });

    program
        .command('list-directory').aliases(['ld'])
        .description('List contents of a specific path (e.g., card1 or card1/DCIM)')
        .requiredOption('--path <path>', 'Path relative to /contents/ (e.g., card1/100CANON)')
        .action(async (options, command) => {
             const globalOpts = command.parent!.opts();
            const response = await ccapi.listDirectoryContents(globalOpts.ip, globalOpts.port, options.path, globalOpts.https, logger);
            printResponse(response);
        });

    program
        .command('get-directory').aliases(['gd'])
        .description('Get detailed directory contents')
        .requiredOption('--storage <name>', 'Storage name (e.g., card1)')
        .requiredOption('--directory <name>', 'Directory name (e.g., 100CANON)')
        .option('--type <type>', 'Filter by file format (e.g., jpeg, raw)')
        .option('--kind <kind>', 'Response kind (list, number, info)', 'list')
        .option('--order <order>', 'Acquisition order (for kind=chunked)')
        .option('--page <page>', 'Page number (for kind=list)', (val) => parseInt(val, 10))
        .action(async (options, command) => {
            const globalOpts = command.parent!.opts();
             const response = await ccapi.getDirectoryContents(
                 globalOpts.ip, globalOpts.port, options.storage, options.directory,
                 globalOpts.https, logger, options.type, options.kind,
                 options.order, options.page
             );
            printResponse(response);
        });

    program
        .command('get-contents').aliases(['gc'])
        .description('Download a specific file or get its info')
        .requiredOption('--storage <name>', 'Storage name')
        .requiredOption('--directory <name>', 'Directory name')
        .requiredOption('--file <name>', 'File name')
        .option('--kind <kind>', 'Contents kind (thumbnail, view, info)')
        .option('-o, --output <path>', 'Save path (omit for stdout/info)')
        .action(async (options, command) => {
            const globalOpts = command.parent!.opts();
             if (options.kind === 'info') {
                 const apiPath = `/ver130/contents/${options.storage}/${options.directory}/${options.file}`;
                 const infoResponse = await ccapi.makeRequest(globalOpts.ip, globalOpts.port, apiPath, globalOpts.https, { kind: 'info' }, logger);
                 printResponse(infoResponse);
             } else {
                 const response = await ccapi.getContents(
                     globalOpts.ip, globalOpts.port, options.storage, options.directory, options.file,
                     globalOpts.https, logger, options.kind
                 );
                 const result = await ccapi.saveContents(response, logger, options.output);
                 printResponse(result);
             }
        });

    program
        .command('battery').aliases(['b'])
        .description('Get battery information')
        .action(async (options, command) => {
            const globalOpts = command.parent!.opts();
            const response = await ccapi.getBatteryInfo(globalOpts.ip, globalOpts.port, globalOpts.https, logger);
            printResponse(response);
        });

     program
         .command('download').aliases(['d'])
         .description('Download the last N images')
         .requiredOption('--last-n <number>', 'Number of images', (val) => parseInt(val, 10))
         .option('-o, --output-path <path>', 'Output directory')
         .option('--kind <kind>', 'Image data kind (thumbnail, view)')
         .option('--type <type>', 'File type filter (jpeg, raw)')
         .action(async (options, command) => {
             const globalOpts = command.parent!.opts();
              const response = await ccapi.downloadImages(
                  globalOpts.ip, globalOpts.port, options.lastN, globalOpts.https,
                  logger, DEFAULT_CONFIG_DIR, options.outputPath,
                  options.kind, options.type
              );
             printResponse(response);
         });

     program
         .command('ping').aliases(['p'])
         .description('Continuously ping the host')
         .option('-c, --count <number>', 'Number of pings (0=infinite)', (val) => parseInt(val, 10), 0)
         .action(async (options, command) => {
              const globalOpts = command.parent!.opts();
             await ccapi.pingHost(globalOpts.ip, globalOpts.port, globalOpts.https, logger, options.count);
         });

     program
         .command('sync').aliases(['s'])
         .description('Continuously sync new images')
         .option('-o, --output-path <path>', 'Output directory')
          .option('--kind <kind>', 'Image data kind (thumbnail, view)')
          .option('--type <type>', 'File type filter (jpeg, raw)')
         .option('--frequency <seconds>', 'Check frequency (seconds)', (val) => parseInt(val, 10), 60)
         .action(async (options, command) => {
              const globalOpts = command.parent!.opts();
              await ccapi.syncImages(
                  globalOpts.ip, globalOpts.port, globalOpts.https, logger, DEFAULT_CONFIG_DIR,
                  options.outputPath, options.kind, options.type, options.frequency
              );
         });

    if (process.argv.length <= 2) {
        program.outputHelp();
    } else {
        await program.parseAsync(process.argv);
    }
}

main().catch(error => {
    logger.error("Unhandled error in main:", error);
    process.exit(1);
}); 