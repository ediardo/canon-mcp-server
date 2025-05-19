import sharp from 'sharp';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { z } from 'zod';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { exec } from 'child_process';

import { Canon, CanonJpegQuality, CanonLiveViewImageDetail, CanonRawQuality, CanonShootingMode, CanonShutterMode, CanonWhiteBalanceMode } from './Canon/Canon.js';
import { startDockerStream, stopDockerStream } from './docker.js';


const HTTPS = false;

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

const OUTPUT_DIR = path.join(os.homedir(), 'CanonMCP');
async function saveImageToFile(image: string, filePath: string) {
    const buffer = Buffer.from(image, 'base64');
    fs.writeFileSync(filePath, buffer);
}

server.tool(
    'connect-camera',
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
                isError: true,
            };
        }
        // await canon.getEventPolling();
        const picture = await canon.takePhoto();
        //const base64 = picture[0];
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
    'Change shooting mode of the camera (e.g. "m" for Manual, "av" for Aperture Priority, "tv" for Shutter Priority, "p" for Program AE, "fv" for Flexible Priority, "a+" for Scene Intelligent Auto, "c3/c2/c1" for Custom Modes, "bulb" for Bulb)',
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

// server.tool('get-sdp', 'Get SDP file of RTP', {}, async () => {
//     if (!canon) {
//         return {
//             content: [
//                 {
//                     type: 'text',
//                     text: 'Canon camera not connected. Please connect first.',
//                 },
//             ],
//         };
//     }
//     const sdp = await canon.getSDP();
//     return {
//         content: [
//             {
//                 type: 'text',
//                 text: sdp,
//             },
//         ],
//     };
// });

// server.tool('start-rtp', 'Start RTP', {}, async () => {
//     if (!canon) {
//         return {
//             content: [
//                 {
//                     type: 'text',
//                     text: 'Canon camera not connected. Please connect first.',
//                 },
//             ],
//         };
//     }
//     const rtp = await canon.startRTP();
//     return {
//         content: [
//             {
//                 type: 'text',
//                 text: JSON.stringify(rtp),
//             },
//         ],
//     };
// });

// server.tool('stop-rtp', 'Stop RTP', {}, async () => {
//     if (!canon) {
//         return {
//             content: [
//                 {
//                     type: 'text',
//                     text: 'Canon camera not connected. Please connect first.',
//                 },
//             ],
//         };
//     }
//     const rtp = await canon.stopRTP();
//     return {
//         content: [
//             {
//                 type: 'text',
//                 text: JSON.stringify(rtp, null, 2),
//             },
//         ],
//     };
// });

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
        outputDir: z.string().default(OUTPUT_DIR).describe('The output directory to save the photo to.'),
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
        if (!outputDir) {
            return {
                content: [
                    { type: 'text', text: 'Output directory not provided' }
                ]
            };
        }

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const lastPhoto = await canon.getLastPhoto();
        const buffer = Buffer.from(lastPhoto, 'base64');
        const resizedImage = await sharp(buffer)
            .resize(720, 720, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer();
        const resizedBase64 = resizedImage.toString('base64');

        const targetPath = path.join(outputDir, `${Date.now()}.JPG`);
        await saveImageToFile(lastPhoto, targetPath);

        
        return {
            content: [
                {
                    type: 'image',
                    data: resizedBase64,
                    mimeType: 'image/jpeg',
                    // type: "text",
                    // text: JSON.stringify(lastPhoto, null, 2),
                },
                {
                    type: 'text',
                    text: `Image saved to ${targetPath}`,
                },
            ],
        };
    }
);

server.tool(
    'get-live-view-image',
    'Get live view image of the camera. This does not take a photo.',
    {
        //incidentalInfo: z.boolean().optional().default(false).describe('Whether to include incidental information, such as focus frame information and histogram'),
    },
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

        const liveViewImage = await canon.getLiveViewImageFlipDetail(CanonLiveViewImageDetail.IMAGE);

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
            ],
        };
    }
);

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

server.tool('get-owner-name', 'Get the owner name set in the camera', {}, async () => {
    const ownerName = await canon.getOwnerName();
    return {
        content: [{ type: 'text', text: JSON.stringify(ownerName) }],
    };
});

server.tool(
    'set-owner-name',
    'Set the owner name in the camera',
    {
        name: z
            .string()
            .regex(/^[\x00-\x7F]*$/, 'Owner name must contain only ASCII characters')
            .max(31, 'Owner name cannot exceed 31 characters')
            .describe('The name to set as the owner name'),
    },
    async ({ name }) => {
        await canon.setOwnerName(name);
        return {
            content: [{ type: 'text', text: `Owner name set to ${name}` }],
        };
    }
);

server.tool('get-shutter-mode', 'Get the shutter mode release of the camera', {}, async () => {
    const shutterMode = await canon.getShutterMode();
    return {
        content: [{ type: 'text', text: JSON.stringify(shutterMode) }],
    };
});

server.tool(
    'set-shutter-mode',
    'Set the shutter mode release of the camera',
    {
        mode: z.nativeEnum(CanonShutterMode).describe('The mode to set the shutter mode to'),
    },
    async ({ mode }) => {
        await canon.setShutterMode(mode);
        return {
            content: [{ type: 'text', text: `Shutter mode set to ${mode}` }],
        };
    }
);

server.tool('get-color-temperature', 'Get the color temperature of the camera', {}, async () => {
    const colorTemperature = await canon.getColorTemperatureSetting();
    return {
        content: [{ type: 'text', text: JSON.stringify(colorTemperature) }],
    };
});

server.tool(
    'set-color-temperature',
    'Set the color temperature of the camera',
    {
        value: z.number().describe('The value to set the color temperature to'),
    },
    async ({ value }) => {
        const colorTemperature = await canon.setColorTemperatureSetting(value);

        return {
            content: [{ type: 'text', text: JSON.stringify(colorTemperature) }],
        };
    }
);

server.tool(
    'set-white-balance',
    'Set the white balance of the camera',
    {
        value: z.nativeEnum(CanonWhiteBalanceMode).describe('The value to set the white balance to'),
    },
    async ({ value }) => {
        const whiteBalance = await canon.setWhiteBalanceSetting(value);
        return {
            content: [{ type: 'text', text: JSON.stringify(whiteBalance) }],
        };
    }
);

server.tool(
    'execute-autofocus',
    'Execute autofocus. This API only issues a focusing instruction and does not return the focusing results. For the focusing results, check the focus frame information in the Live View incidental information.',
    {
        action: z.enum(['start', 'stop']).describe('The action to execute'),
    },
    async ({ action }) => {
        const autofocus = await canon.executeAutofocus(action);
        return { content: [{ type: 'text', text: JSON.stringify(autofocus) }] };
    }
);

server.tool('start-camera-livestream', 'Start livestream in a browser',  {
    host: z.string(),
    port: z.number().optional().default(8080),
    https: z.boolean().optional().default(HTTPS),
    username: z.string().optional(),
    password: z.string().optional(),
},
async ({ host, port, https, username, password }) => {
    const output = await startDockerStream(host, port, https, username, password);

    return { content: [{ type: 'text', text: output as string }] };
});

server.tool('stop-camera-livestream', 'Stop livestream in a browser', {}, async () => {
    await stopDockerStream();
    return { content: [{ type: 'text', text: 'Livestream stopped' }] };
});

server.tool('get-aperture-increments', 'Get the aperture increments', {}, async () => {
    if (!canon) {
        return {
            content: [{ type: 'text', text: 'Get the aperture value level increment information.' }],
            isError: true
        };
    }

    const apertureIncrements = await canon.getApertureIncrements();
    return {
        content: [{ type: 'text', text: JSON.stringify(apertureIncrements) }]
    };
});

server.tool('get-shutter-speed-increments', 'Get the shutter speed increments', {}, async () => {
    if (!canon) {
        return {
            content: [{ type: 'text', text: 'Get the shutter speed value level increment information.' }],
            isError: true
        };
    }

    const shutterSpeedIncrements = await canon.getShutterSpeedIncrements();
    return {
        content: [{ type: 'text', text: JSON.stringify(shutterSpeedIncrements) }]
    };
});

server.tool('get-iso-speed-increments', 'Get the ISO speed increments', {}, async () => {
    if (!canon) {
        return {
            content: [{ type: 'text', text: 'Get the ISO speed value level increment information.' }],
            isError: true
        };
    }

    const isoSpeedIncrements = await canon.getIsoSpeedIncrements();
    return {
        content: [{ type: 'text', text: JSON.stringify(isoSpeedIncrements) }]
    };
});

server.tool('get-jpeg-quality', 'Get the JPEG quality', {}, async () => {
    if (!canon) {
        return {
            content: [{ type: 'text', text: 'Get the JPEG quality value level information.' }],
            isError: true
        };
    }

    const jpegQuality = await canon.getStillImageQuality();
    return {
        content: [{ type: 'text', text: JSON.stringify(jpegQuality) }]
    };
});

server.tool('set-jpeg-quality', 'Set the JPEG quality', {
    jpeg: z.nativeEnum(CanonJpegQuality).describe('The value to set the JPEG quality to'),
    raw: z.nativeEnum(CanonRawQuality).describe('The value to set the raw quality to'),
}, async ({ jpeg, raw }) => {
    const jpegQuality = await canon.setStillImageQuality({ jpeg, raw });
    return { content: [{ type: 'text', text: JSON.stringify(jpegQuality) }] };
});


async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // console.log('Server started');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
