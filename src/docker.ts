import Dockerode from 'dockerode';

const LIVESTREAM_PORT = 8080;

export async function startDockerStream(host: string, port: number, https: boolean = true, username?: string, password?: string) {
    const docker = new Dockerode();

    const containers = await docker.listContainers({
        all: true,
        filters: {
            name: ['mcp-canon-stream'],
        },
    });

    let output;
    const container = containers[0];
    if (!container) {
        // Container does not exist, create it
        await docker
            .createContainer({
                Image: 'mcp-canon-stream:latest',
                name: 'mcp-canon-stream',
                Env: [
                    `CANON_IP=${host}`,
                    `CANON_PORT=${port}`,
                    ...(https ? [`CANON_HTTPS=true`] : []),
                    ...(username ? [`CANON_USERNAME=${username}`] : []),
                    ...(password ? [`CANON_PASSWORD=${password}`] : []),
                ],
                HostConfig: {
                    PortBindings: {
                        [`${LIVESTREAM_PORT}/tcp`]: [{ HostPort: LIVESTREAM_PORT.toString() }],
                    },
                },
            })
            .then((container) => container.start());
    } else {
        // running or exited
        await docker.getContainer('mcp-canon-stream').restart();
    }

    return `Stream started. Open the browser and navigate to http://127.0.0.1:${LIVESTREAM_PORT}`;
}

export async function stopDockerStream() {
    const docker = new Dockerode();
    await docker.getContainer('mcp-canon-stream').stop();
}
