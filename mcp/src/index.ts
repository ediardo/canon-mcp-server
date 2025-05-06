import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import { Canon, CanonShootingMode } from './Canon.js';
import path from 'path';

const OUTPUT_DIR = '/Users/ediardo/CanonMCP';

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
let canon: Canon;

server.tool(
    'connect-canon',
    'Connect to a Canon camera via CCAPI.',
    {
        host: z.string(),
        port: z.number().optional().default(8080),
        https: z.boolean().optional().default(false),
        username: z.string().optional(),
        password: z.string().optional(),
    },
    async ({ host, port, https, username, password }) => {
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
    }
);

server.tool(
    'take-photo',
    'Take a photo with the camera using the current shooting settings.',
    {
        delay: z.number().optional().default(0).describe('Delay in seconds between photos'),
        repeat: z.number().optional().default(1).describe('Number of photos to take'),
    },
    async ({ delay, repeat }) => {
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
                    text: JSON.stringify(picture),
                },
            ],
        };
    }
);

server.tool(
    'get-shooting-settings',
    'Get all of the present values and ability values of the shooting parameters that can be acquired and supported by the Canon camera.',
    {},
    async () => {
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
                    text: JSON.stringify(shootingSettings),
                },
            ],
        };
    }
);

server.tool(
    'change-shooting-mode',
    'Change shooting mode ',
    {
        mode: z.nativeEnum(CanonShootingMode).optional(),
    },
    async ({ mode }) => {
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
                    text: JSON.stringify(shootingMode),
                },
            ],
        };
    }
);

server.tool(
    'set-aperture-setting',
    'Set the aperture (AV) setting',
    {
        value: z.string(),
    },
    async ({ value }) => {
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
                    text: JSON.stringify(apertureSetting),
                },
            ],
        };
    }
);

server.tool(
    'set-shutter-speed-setting',
    'Set the shutter speed (TV) setting',
    {
        value: z.string(),
    },
    async ({ value }) => {
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
                    text: JSON.stringify(shutterSpeedSetting),
                },
            ],
        };
    }
);

server.tool(
    'set-iso-setting',
    'Set the ISO setting',
    {
        value: z.string(),
    },
    async ({ value }) => {
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
                    text: JSON.stringify(isoSetting),
                },
            ],
        };
    }
);

server.tool('get-autofocus-setting', 'Get the present value of the AF operation setting.', {}, async () => {
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
    const autoFocusSetting = await canon.getAutofocusOperationSetting();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(autoFocusSetting),
            },
        ],
    };
});

server.tool(
    'set-autofocus-setting',
    'Set the AF operation setting',
    {
        value: z.string(),
    },
    async ({ value }) => {
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
        const autoFocusSetting = await canon.setAutofocusOperationSetting(value);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(autoFocusSetting),
                },
            ],
        };
    }
);

server.tool('get-battery-status', 'Get battery status information', {}, async () => {
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
                text: JSON.stringify(batteryStatus),
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
                text: JSON.stringify(storageStatus),
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
                text: JSON.stringify(temperatureStatus),
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
                text: JSON.stringify(dateTimeSetting),
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
                text: JSON.stringify(rtp),
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
                text: JSON.stringify(lensInformation),
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

server.tool(
    'get-last-photo',
    'Get last photo from the camera. The photo is saved to the output directory.',
    {
        outputDir: z.string().describe('The output directory to save the photo to.'),
    },
    async ({ outputDir }) => {
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
        const buffer = Buffer.from(lastPhoto, 'base64');
        const filePath = path.join(OUTPUT_DIR, `${Date.now()}.JPG`);
        fs.writeFileSync(filePath, buffer);
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
    }
);

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
                text: JSON.stringify(liveViewImage.info),
            },
        ],
    };
});

server.tool(
    'start-interval-photos',
    'Start taking photos at regular intervals',
    {
        interval: z.number().describe('Time between photos in milliseconds'),
        repeat: z.number().describe('Number of photos to take. Set to 0 for unlimited photos.'),
    },
    async ({ interval, repeat }) => {
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
                    text: `Started interval photos: Taking ${
                        repeat === 0 ? 'unlimited' : repeat
                    } photos every ${interval}ms`,
                },
            ],
        };
    }
);

server.tool('get-interval-photos-status', 'Get status of interval photos', {}, async () => {
    const status = await canon.getIntervalPhotosStatus();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(status),
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
