import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Canon } from "./Canon.js";
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
    const connected = await canon.connect();
    return {
        content: [{
                type: "text",
                text: "Connected to Canon camera",
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
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    //console.log("Server started");
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
