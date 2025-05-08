import Canon from './Canon/Canon.js';
import http from 'http';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const boundary = 'frame'; // used for multipart separator
const PORT = 8080;

let fps = 0; // Variable to store calculated FPS
let frameCount = 0;
let lastFpsTime = Date.now();

async function main() {
    // Get CLI arguments
    const args = process.argv.slice(2);

    const ip = process.env.CANON_IP || process.argv[2] || '10.0.0.241';
    const port = parseInt(process.env.CANON_PORT || process.argv[3] || '8080', 10);
    const useHttps = (process.env.CANON_HTTPS || process.argv[4] || 'false') === 'true';

    const canon = new Canon(ip, port, useHttps);
    await canon.connect({ startLiveView: true });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mjpegClients: http.ServerResponse[] = [];
    const sseClients: http.ServerResponse[] = []; // For FPS streaming

    // Start live view
    const stream = await canon.startLiveViewImageScroll();

    // Handle graceful shutdown
    async function cleanup() {
        console.log('Shutting down...');
        // Stop live view scroll
        await canon.stopLiveViewScroll();
        // Close all client connections
        for (let res of mjpegClients) {
            try {
                res.end();
            } catch (err) {
                console.error('Error closing client connection:', err);
            }
        }
        process.exit(0);
    }

    process.on('SIGINT', cleanup);  // Ctrl+C
    process.on('SIGTERM', cleanup); // Kill signal

    // Stream JPEGs to all connected clients
    Canon.processLiveViewStream(stream, async (blob) => {
        const jpegBuffer = Buffer.from(await blob.arrayBuffer());
        const header = 
            `--${boundary}\r\n` +
            `Content-Type: image/jpeg\r\n` +
            `Content-Length: ${jpegBuffer.length}\r\n\r\n`;

        for (let res of mjpegClients) {
            try {
                res.write(header);
                res.write(jpegBuffer);
                res.write('\r\n');
            } catch (err) {
                console.error('Client write error, removing:', err);
                mjpegClients.splice(mjpegClients.indexOf(res), 1);
            }
        }
        frameCount++; // Increment frame count for FPS calculation
    });

    // Calculate and broadcast FPS periodically
    setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = (now - lastFpsTime) / 1000;
        if (elapsedSeconds > 0) {
            fps = frameCount / elapsedSeconds;
        }
        frameCount = 0;
        lastFpsTime = now;

        // Send FPS to all SSE clients
        for (let res of sseClients) {
            try {
                res.write(`data: ${fps.toFixed(2)}\n\n`);
            } catch (err) {
                console.error('SSE client write error, removing:', err);
                sseClients.splice(sseClients.indexOf(res), 1);
            }
        }
    }, 1000); // Update FPS every second

    // Create HTTP server to stream MJPEG
    const server = http.createServer((req, res) => {
        if (req.url === '/mjpeg') {
            res.writeHead(200, {
                'Content-Type': `multipart/x-mixed-replace; boundary=${boundary}`,
                'Cache-Control': 'no-cache',
                'Connection': 'close',
                'Pragma': 'no-cache',
            });
            mjpegClients.push(res);

            req.on('close', () => {
                const idx = mjpegClients.indexOf(res);
                if (idx !== -1) mjpegClients.splice(idx, 1);
            });
        } else if (req.url === '/Canon.js') {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            fs.createReadStream(path.join(__dirname, 'Canon', 'Canon.js')).pipe(res);
        } else if (req.url === '/fps') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });
            sseClients.push(res);
            res.write(`data: ${fps.toFixed(2)}\n\n`); // Send initial FPS

            req.on('close', () => {
                const idx = sseClients.indexOf(res);
                if (idx !== -1) sseClients.splice(idx, 1);
            });
        } else {
            // Serve index.html
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
        }
    });

    server.listen(PORT, () => {
        console.log(`Server started: http://localhost:${PORT}`);
    });
}

main();