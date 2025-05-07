import Canon from './Canon.js';
import http from 'http';
const boundary = 'frame'; // used for multipart separator
const PORT = 8080;
async function main() {
    const canon = new Canon('10.0.0.241', 8080, false);
    await canon.connect({ startLiveView: true });
    await new Promise(resolve => setTimeout(resolve, 3000));
    const mjpegClients = [];
    // Start live view
    const stream = await canon.startLiveViewImageScroll();
    // Stream JPEGs to all connected clients
    Canon.processLiveViewStream(stream, async (blob) => {
        const jpegBuffer = Buffer.from(await blob.arrayBuffer());
        const header = `--${boundary}\r\n` +
            `Content-Type: image/jpeg\r\n` +
            `Content-Length: ${jpegBuffer.length}\r\n\r\n`;
        for (let res of mjpegClients) {
            try {
                res.write(header);
                res.write(jpegBuffer);
                res.write('\r\n');
            }
            catch (err) {
                console.error('Client write error, removing:', err);
                mjpegClients.splice(mjpegClients.indexOf(res), 1);
            }
        }
    });
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
                if (idx !== -1)
                    mjpegClients.splice(idx, 1);
            });
        }
        else {
            // Simple HTML viewer
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <html><body style="margin:0;background:black">
                    <img src="/mjpeg" style="width:100vw;height:auto;display:block;margin:auto;">
                </body></html>
            `);
        }
    });
    server.listen(PORT, () => {
        console.log(`MJPEG server started: http://localhost:${PORT}/mjpeg`);
    });
}
main();
