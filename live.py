#!/usr/bin/env python3

import requests
import os
import time
from urllib.parse import urljoin

def get_liveview_image(ip_address, port=8080, version="ver100", output_dir="liveview_images"):
    """
    Get live view image from Canon camera via CCAPI.
    
    Args:
        ip_address (str): Camera's IP address
        port (int): Camera's port (default: 8080)
        version (str): API version (default: ver100)
        output_dir (str): Directory to save images
    
    Returns:
        str: Path to saved image or None if failed
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Construct the API URL
    base_url = f"http://{ip_address}:{port}/ccapi/{version}/"
    endpoint = "shooting/liveview/scroll"
    url = urljoin(base_url, endpoint)
    
    try:
        # Make a GET request with stream=True to handle chunked encoding
        response = requests.get(url, stream=True, timeout=10)
        
        # Check if request was successful
        if response.status_code == 200:
            # Generate a filename with timestamp
            timestamp = int(time.time())
            filename = os.path.join(output_dir, f"liveview_{timestamp}.jpg")
            
            # Save the image data to a file
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            print(f"Live view image saved to {filename}")
            return filename
        else:
            print(f"Failed to get live view image: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting live view image: {e}")
        return None

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Get live view images from Canon camera')
    parser.add_argument('--ip', required=True, help='Camera IP address')
    parser.add_argument('--port', type=int, default=8080, help='Camera port (default: 8080)')
    parser.add_argument('--version', default='ver100', help='API version (default: ver100)')
    parser.add_argument('--output', default='liveview_images', help='Output directory (default: liveview_images)')
    parser.add_argument('--continuous', action='store_true', help='Continuously capture images')
    parser.add_argument('--interval', type=float, default=1.0, help='Interval between captures in seconds (default: 1.0)')
    
    args = parser.parse_args()
    
    if args.continuous:
        print(f"Continuously capturing live view images every {args.interval} seconds...")
        print("Press Ctrl+C to stop")
        try:
            while True:
                get_liveview_image(args.ip, args.port, args.version, args.output)
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nStopped capturing images")
    else:
        get_liveview_image(args.ip, args.port, args.version, args.output)

if __name__ == "__main__":
    main() 