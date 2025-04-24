#!/usr/bin/env python3

import os
import time
from flask import Flask, render_template_string, send_from_directory
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global variables
PHOTOS_DIR = None
REFRESH_FREQUENCY = 60  # in seconds
last_modified = 0

# HTML template with auto-refresh
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Photo Viewer</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
        }
        .photo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        .photo-container {
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .photo-container:hover {
            transform: scale(1.02);
        }
        .photo-container img {
            width: 100%;
            height: auto;
            border-radius: 4px;
            display: block;
        }
        .photo-info {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
        }
        .header {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .refresh-info {
            color: #666;
            font-size: 14px;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .fade-in {
            animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Photo Viewer</h1>
        <p class="refresh-info">Auto-updating every {{ refresh_interval }} seconds</p>
    </div>
    <div class="loading" id="loading">Checking for new photos...</div>
    <div class="photo-grid" id="photo-grid">
        {% for photo in photos %}
        <div class="photo-container fade-in">
            <img src="{{ url_for('serve_photo', filename=photo) }}" alt="{{ photo }}">
            <div class="photo-info">
                {{ photo }}
            </div>
        </div>
        {% endfor %}
    </div>

    <script>
        let currentPhotos = new Set({{ photos|tojson }});
        const refreshInterval = {{ refresh_interval }};
        const loadingElement = document.getElementById('loading');
        const photoGrid = document.getElementById('photo-grid');

        function updatePhotos() {
            loadingElement.style.display = 'block';
            fetch('/api/photos')
                .then(response => response.json())
                .then(data => {
                    loadingElement.style.display = 'none';
                    const newPhotos = new Set(data.photos);
                    
                    // Add new photos
                    for (const photo of newPhotos) {
                        if (!currentPhotos.has(photo)) {
                            const photoContainer = document.createElement('div');
                            photoContainer.className = 'photo-container fade-in';
                            photoContainer.innerHTML = `
                                <img src="/photos/${photo}" alt="${photo}">
                                <div class="photo-info">${photo}</div>
                            `;
                            photoGrid.insertBefore(photoContainer, photoGrid.firstChild);
                            currentPhotos.add(photo);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching photos:', error);
                    loadingElement.style.display = 'none';
                });
        }

        // Initial update
        updatePhotos();

        // Set up periodic updates
        setInterval(updatePhotos, refreshInterval * 1000);
    </script>
</body>
</html>
"""

class PhotoHandler(FileSystemEventHandler):
    def on_modified(self, event):
        global last_modified
        if not event.is_directory and event.src_path.lower().endswith(('.jpg', '.jpeg', '.cr2', '.cr3')):
            last_modified = time.time()
            logger.info(f"New photo detected: {event.src_path}")

def get_photos():
    """Get list of photos in the directory."""
    if not PHOTOS_DIR or not os.path.exists(PHOTOS_DIR):
        return []
    
    photos = []
    for file in os.listdir(PHOTOS_DIR):
        if file.lower().endswith(('.jpg', '.jpeg', '.cr2', '.cr3')):
            photos.append(file)
    return sorted(photos, reverse=True)  # Sort by newest first

@app.route('/')
def index():
    """Render the main page with photos."""
    photos = get_photos()
    return render_template_string(
        HTML_TEMPLATE,
        photos=photos,
        refresh_interval=REFRESH_FREQUENCY
    )

@app.route('/photos/<path:filename>')
def serve_photo(filename):
    """Serve individual photos."""
    return send_from_directory(PHOTOS_DIR, filename)

@app.route('/api/photos')
def api_photos():
    """API endpoint to get current photos."""
    photos = get_photos()
    return {'photos': photos}

def start_file_watcher():
    """Start watching the photos directory for changes."""
    event_handler = PhotoHandler()
    observer = Observer()
    observer.schedule(event_handler, PHOTOS_DIR, recursive=False)
    observer.start()
    logger.info(f"Started watching directory: {PHOTOS_DIR}")
    return observer

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Photo viewer web server')
    parser.add_argument('--output-path', '-o', required=True, help='Directory containing photos')
    parser.add_argument('--frequency', '-f', type=int, default=60, help='Refresh frequency in seconds')
    parser.add_argument('--port', '-p', type=int, default=5000, help='Port to run the server on')
    parser.add_argument('--host', default='127.0.0.1', help='Host to run the server on')
    
    args = parser.parse_args()
    
    global PHOTOS_DIR, REFRESH_FREQUENCY
    PHOTOS_DIR = os.path.abspath(args.output_path)
    REFRESH_FREQUENCY = args.frequency
    
    if not os.path.exists(PHOTOS_DIR):
        logger.error(f"Directory does not exist: {PHOTOS_DIR}")
        return
    
    # Start file watcher
    observer = start_file_watcher()
    
    try:
        logger.info(f"Starting web server on {args.host}:{args.port}")
        logger.info(f"Watching directory: {PHOTOS_DIR}")
        logger.info(f"Auto-refresh every {REFRESH_FREQUENCY} seconds")
        app.run(host=args.host, port=args.port, debug=False)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        observer.stop()
        observer.join()

if __name__ == '__main__':
    main() 