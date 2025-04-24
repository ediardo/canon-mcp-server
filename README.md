# Canon CCAPI TypeScript Client

This project provides a command-line interface (CLI) tool, written in TypeScript, to interact with Canon cameras using the Canon Camera Control API (CCAPI).

It is a translation of the original Python script (`server.py`).

## Features

*   Check camera connection status.
*   Make generic requests to CCAPI endpoints.
*   List storage contents (e.g., memory cards).
*   List directory contents.
*   Get detailed directory contents (files, pagination).
*   Download specific files (images, thumbnails, info).
*   Get battery information.
*   Download the last N images.
*   Continuously ping the camera.
*   Continuously sync (download) new images.

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm (usually comes with Node.js)
*   A Canon camera with CCAPI support, connected to the same network.

## Setup

1.  **Clone the repository (or ensure you have the files):**
    ```bash
    # If applicable
    # git clone <repository_url>
    # cd <repository_directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables (Optional):**
    Create a `.env` file in the project root directory to set default values:
    ```dotenv
    # .env file
    DEFAULT_IP=192.168.1.100      # Replace with your camera's IP
    DEFAULT_PORT=8080
    DEFAULT_HTTPS=false           # Set to true if your camera uses HTTPS
    DEFAULT_LOG_LEVEL=info        # e.g., debug, info, warn, error
    # DEFAULT_CONFIG_DIR=~/.config/canon-ts # Optional: Override config dir
    ```
    If `.env` is not present, the script will use hardcoded defaults (like 127.0.0.1) or command-line arguments.

## Usage

You can run the script using `ts-node` for development/direct execution or build it first and run the JavaScript version.

**Using ts-node:**

```bash
# Basic help
npx ts-node server.ts --help

# Check connection (using .env or defaults)
npx ts-node server.ts cc

# Check connection (specifying IP/Port)
npx ts-node server.ts --ip 192.168.1.101 --port 8080 cc

# List storage roots
npx ts-node server.ts lc

# List contents of card1/DCIM
npx ts-node server.ts ld --path card1/DCIM

# Download the last 5 thumbnails
npx ts-node server.ts d --last-n 5 --kind thumbnail -o ./downloads

# Sync new images every 30 seconds
npx ts-node server.ts s --frequency 30 -o ./synced_images
```

**Building and Running:**

1.  **Build the TypeScript code:**
    ```bash
    npm run build
    ```
    This compiles `server.ts` into `dist/server.js`.

2.  **Run the compiled code:**
    ```bash
    # Basic help
    node dist/server.js --help

    # Check connection
    node dist/server.js cc

    # List storage roots (specifying IP)
    node dist/server.js --ip 192.168.1.101 lc
    ```

Refer to `npx ts-node server.ts --help` for a full list of commands and options.

## Notes

*   The script attempts to automatically handle HTTP/HTTPS based on the `--https` flag or `DEFAULT_HTTPS` environment variable.
*   For HTTPS connections, it currently disables SSL certificate verification (`rejectUnauthorized: false`) to allow connections to cameras with self-signed certificates. Be aware of the security implications.
*   The `sync` command stores the index of the last downloaded image in `~/.canon/last_image_index.txt` (or `DEFAULT_CONFIG_DIR` if set) to avoid re-downloading images on subsequent runs.
*   Error handling might differ slightly from the original Python script due to differences between `requests` and `axios`. 