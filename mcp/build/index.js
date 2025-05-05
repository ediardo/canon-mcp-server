import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Canon, CanonShootingMode } from './Canon.js';
// Create server instance
const server = new McpServer({
    name: 'canon',
    version: '1.0.0',
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Keep Canon instance accessible to other methods
let canon;
server.tool('connect-canon', 'Connect to a Canon camera via CCAPI.', {
    host: z.string(),
    port: z.number().optional().default(8080),
    https: z.boolean().optional().default(false),
    username: z.string().optional(),
    password: z.string().optional(),
}, async ({ host, port, https, username, password }) => {
    canon = new Canon(host, port, https, username, password);
    const cameraInfo = await canon.connect({ startLiveView: true });
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(cameraInfo),
            },
        ],
    };
});
server.tool('take-photo', 'Take a photo with the camera using the current shooting settings.', {
    delay: z.number().optional().default(0).describe('Delay in seconds between photos'),
    repeat: z.number().optional().default(1).describe('Number of photos to take'),
}, async ({ delay, repeat }) => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
            isError: true,
        };
    }
    // await canon.getEventPolling();
    const picture = await canon.takePhoto();
    const base64 = picture[0];
    return {
        content: [
            {
                type: 'text',
                // data: base64,
                // mimeType: "image/jpeg"
                text: JSON.stringify(picture, null, 2),
            },
        ],
    };
});
server.tool('get-shooting-settings', 'Get shooting settings', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const shootingSettings = await canon.getShootingSettings();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(shootingSettings, null, 2),
            },
        ],
    };
});
server.tool('change-shooting-mode', 'Change shooting mode ', {
    mode: z.nativeEnum(CanonShootingMode).optional(),
}, async ({ mode }) => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const newMode = mode;
    if (!newMode) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'No mode provided. Please provide a mode.',
                },
            ],
        };
    }
    const shootingMode = await canon.changeShootingMode(newMode);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(shootingMode, null, 2),
            },
        ],
    };
});
server.tool('set-aperture-setting', 'Set aperture setting', {
    value: z.string(),
}, async ({ value }) => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const apertureSetting = await canon.setApertureSetting(value);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(apertureSetting, null, 2),
            },
        ],
    };
});
server.tool('set-shutter-speed-setting', 'Set shutter speed setting', {
    value: z.string(),
}, async ({ value }) => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const shutterSpeedSetting = await canon.setShutterSpeedSetting(value);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(shutterSpeedSetting, null, 2),
            },
        ],
    };
});
server.tool('set-iso-setting', 'Set ISO setting', {
    value: z.string(),
}, async ({ value }) => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const isoSetting = await canon.setIsoSetting(value);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(isoSetting, null, 2),
            },
        ],
    };
});
server.tool('set-auto-focus-setting', 'Set auto focus setting', {
    value: z.string(),
}, async ({ value }) => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const autoFocusSetting = await canon.setAutoFocusSetting(value);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(autoFocusSetting, null, 2),
            },
        ],
    };
});
server.tool('get-battery-status', 'Get battery status', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const batteryStatus = await canon.getBatteryStatus();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(batteryStatus, null, 2),
            },
        ],
    };
});
server.tool('get-storage-status', 'Get storage status', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const storageStatus = await canon.getStorageStatus();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(storageStatus, null, 2),
            },
        ],
    };
});
server.tool('get-temperature-status', 'Get temperature status', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const temperatureStatus = await canon.getTemperatureStatus();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(temperatureStatus, null, 2),
            },
        ],
    };
});
server.tool('get-datetime-setting', 'Get date and time setting', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const dateTimeSetting = await canon.getDateTimeSetting();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(dateTimeSetting, null, 2),
            },
        ],
    };
});
server.tool('get-sdp', 'Get SDP file of RTP', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const sdp = await canon.getSDP();
    return {
        content: [
            {
                type: 'text',
                text: sdp,
            },
        ],
    };
});
server.tool('start-rtp', 'Start RTP', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const rtp = await canon.startRTP();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(rtp, null, 2),
            },
        ],
    };
});
server.tool('stop-rtp', 'Stop RTP', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const rtp = await canon.stopRTP();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(rtp, null, 2),
            },
        ],
    };
});
server.tool('get-lens-information', 'Get lens information', {}, async () => {
    // if (!canon) {
    //     return {
    //         content: [{
    //             type: "text",
    //             text: "Canon camera not connected. Please connect first.",
    //         }],
    //     };
    // }
    const lensInformation = await canon.getLensInformation();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(lensInformation, null, 2),
            },
        ],
    };
});
server.tool('restore-dial-mode', 'Restore dial mode', {}, async () => {
    await canon.restoreDialMode();
    return {
        content: [
            {
                type: 'text',
                text: 'Dial mode restored',
            },
        ],
    };
});
server.tool('get-last-photo', 'Get last photo', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const lastPhoto = await canon.getLastPhoto();
    // save to file
    return {
        content: [
            {
                type: 'image',
                data: lastPhoto,
                mimeType: 'image/jpeg',
                // type: "text",
                // text: JSON.stringify(lastPhoto, null, 2),
            },
        ],
    };
});
server.tool('get-live-view-image', 'Get live view image of the camera. This does not take a photo.', {}, async () => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
        };
    }
    const liveViewImage = await canon.getLiveViewImageFlipDetail('both');
    if (!liveViewImage.image) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'No live view image found.',
                },
            ],
        };
    }
    return {
        content: [
            {
                type: 'image',
                data: liveViewImage.image,
                mimeType: 'image/jpeg',
            },
            {
                type: 'text',
                text: JSON.stringify(liveViewImage.info, null, 2),
            },
        ],
    };
});
server.tool('start-interval-photos', 'Start taking photos at regular intervals', {
    interval: z.number().describe('Time between photos in milliseconds'),
    repeat: z.number().describe('Number of photos to take. Set to 0 for unlimited photos.'),
}, async ({ interval, repeat }) => {
    if (!canon) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Canon camera not connected. Please connect first.',
                },
            ],
            isError: true,
        };
    }
    canon.startIntervalPhotos(interval, repeat);
    return {
        content: [
            {
                type: 'text',
                text: `Started interval photos: Taking ${repeat === 0 ? 'unlimited' : repeat} photos every ${interval}ms`,
            },
        ],
    };
});
server.tool('get-interval-photos-status', 'Get status of interval photos', {}, async () => {
    const status = await canon.getIntervalPhotosStatus();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(status, null, 2),
            },
        ],
    };
});
server.tool('stop-interval-photos', 'Stop taking photos at regular intervals', {}, async () => {
    await canon.stopIntervalPhotos();
    return {
        content: [
            {
                type: 'text',
                text: 'Stopped interval photos',
            },
        ],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('Server started');
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
