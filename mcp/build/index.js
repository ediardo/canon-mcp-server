import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Canon, CanonShootingMode } from "./Canon.js";
// Create server instance
const server = new McpServer({
    name: "canon",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Keep Canon instance accessible to other methods
let canon;
server.tool("connect-canon", "Connect to a Canon camera", {
    host: z.string(),
    port: z.number().optional().default(8080),
    https: z.boolean().optional().default(false),
    username: z.string().optional(),
    password: z.string().optional(),
}, async ({ host, port, https, username, password }) => {
    canon = new Canon(host, port, https, username, password);
    const cameraInfo = await canon.connect();
    return {
        content: [{
                type: "text",
                text: JSON.stringify(cameraInfo),
            }],
    };
});
server.tool("take-picture", "Take a picture", {}, async () => {
    if (!canon) {
        return {
            content: [{
                    type: "text",
                    text: "Canon camera not connected. Please connect first.",
                }],
            isError: true
        };
    }
    // await canon.getEventPolling();
    const picture = await canon.takePicture();
    const base64 = picture[0];
    return {
        content: [{
                type: "image",
                data: base64,
                mimeType: "image/jpeg"
            }]
    };
});
server.tool("get-shooting-settings", "Get shooting settings", {}, async () => {
    if (!canon) {
        return {
            content: [{
                    type: "text",
                    text: "Canon camera not connected. Please connect first.",
                }],
        };
    }
    const shootingSettings = await canon.getShootingSettings();
    return {
        content: [{
                type: "text",
                text: JSON.stringify(shootingSettings, null, 2),
            }],
    };
});
server.tool("change-shooting-mode", "Change shooting mode", {
    mode: z.nativeEnum(CanonShootingMode).optional(),
}, async ({ mode }) => {
    if (!canon) {
        return {
            content: [{
                    type: "text",
                    text: "Canon camera not connected. Please connect first.",
                }],
        };
    }
    const newMode = mode;
    if (!newMode) {
        return {
            content: [{
                    type: "text",
                    text: "No mode provided. Please provide a mode.",
                }],
        };
    }
    const shootingMode = await canon.changeShootingMode(newMode);
    return {
        content: [{
                type: "text",
                text: JSON.stringify(shootingMode, null, 2),
            }],
    };
});
server.tool("set-aperture-setting", "Set aperture setting", {
    value: z.string(),
}, async ({ value }) => {
    if (!canon) {
        return {
            content: [{
                    type: "text",
                    text: "Canon camera not connected. Please connect first.",
                }],
        };
    }
    const apertureSetting = await canon.setApertureSetting(value);
    return {
        content: [{
                type: "text",
                text: JSON.stringify(apertureSetting, null, 2),
            }],
    };
});
server.tool("set-shutter-speed-setting", "Set shutter speed setting", {
    value: z.string(),
}, async ({ value }) => {
    if (!canon) {
        return {
            content: [{
                    type: "text",
                    text: "Canon camera not connected. Please connect first.",
                }],
        };
    }
    const shutterSpeedSetting = await canon.setShutterSpeedSetting(value);
    return {
        content: [{
                type: "text",
                text: JSON.stringify(shutterSpeedSetting, null, 2),
            }],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("Server started");
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
