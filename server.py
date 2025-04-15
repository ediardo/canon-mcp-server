#!/usr/bin/env python3

import argparse
import requests
import sys
import json
import os
import logging
from urllib.parse import urljoin
from pprint import pprint
from dotenv import load_dotenv
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

def compose_url(ip, port, path='', use_https=True):
    """Compose a complete URL from components."""
    protocol = 'https' if use_https else 'http'
    base_url = f"{protocol}://{ip}:{port}"
    # Ensure path starts with /ccapi if not empty
    if path and not path.startswith('/ccapi'):
        path = f"/ccapi{path}"
    elif not path:
        path = '/ccapi'
    return urljoin(base_url, path)

def check_host_reachable(ip, port, use_https):
    """Check if the host is reachable.
    
    Args:
        ip: Camera IP address
        port: Camera port
        use_https: Whether to use HTTPS
        
    Returns:
        bool: True if host is reachable, False otherwise
    """
    try:
        url = compose_url(ip, port, use_https=use_https)
        logger.info(f"Requesting: {url}")
        logger.debug(f"Checking connection to: {url}")
        
        if use_https:
            requests.packages.urllib3.disable_warnings()
            response = requests.get(url, timeout=5, verify=False)
        else:
            response = requests.get(url, timeout=5)
            
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Error connecting to {url}: {str(e)}")
        return False

def make_request(ip, port, path='', use_https=True):
    """Make a request to the specified endpoint.
    
    Args:
        ip: Camera IP address
        port: Camera port
        path: Additional path after /ccapi
        use_https: Whether to use HTTPS
        
    Returns:
        dict: The JSON response or None if request failed
    """
    try:
        url = compose_url(ip, port, path, use_https)
        logger.info(f"Requesting: {url}")
        logger.debug(f"Making request to: {url}")
        
        if use_https:
            requests.packages.urllib3.disable_warnings()
            response = requests.get(url, timeout=5, verify=False)
        else:
            response = requests.get(url, timeout=5)
            
        logger.debug(f"Response Status Code: {response.status_code}")
        logger.debug("Response Headers: %s", dict(response.headers))
        
        print(response)
        print("zxczx")
        try:
            return response.json()
        except json.JSONDecodeError:
            return {'raw_response': response.text}
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making request to {url}: {str(e)}")
        return None

def list_contents(ip, port, use_https=True):
    """List contents from the camera.
    
    Args:
        ip: Camera IP address
        port: Camera port
        use_https: Whether to use HTTPS
        
    Returns:
        dict: The JSON response containing the contents list or None if request failed
        
    Example:
        >>> list_contents('192.168.1.206', 8080)
        {'path': ['/ccapi/ver130/contents/card1']}
    """
    try:
        # Hardcoded version
        version = 'ver130'
        # Construct the path for contents listing
        path = f"/{version}/contents"
        url = compose_url(ip, port, path, use_https)
        
        logger.info(f"Requesting: {url}")
        logger.debug(f"Requesting contents from: {url}")
        
        if use_https:
            requests.packages.urllib3.disable_warnings()
            response = requests.get(url, timeout=5, verify=False)
        else:
            response = requests.get(url, timeout=5)
            
        logger.debug(f"Response Status Code: {response.status_code}")
        logger.debug("Response Headers: %s", dict(response.headers))
        
        try:
            return response.json()
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON response: {str(e)}")
            return {'raw_response': response.text}
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making request to {url}: {str(e)}")
        return None

def list_directory_contents(ip, port, path, use_https=True):
    """List contents from a specific directory path.
    
    Args:
        ip: Camera IP address
        port: Camera port
        path: The directory path to list contents from
        use_https: Whether to use HTTPS
        
    Returns:
        dict: The JSON response containing the directory contents list or None if request failed
        
    Example:
        >>> list_directory_contents('192.168.1.206', 8080, 'card1')
        {'path': ['/ccapi/ver130/contents/card1/100CANON',
                 '/ccapi/ver130/contents/card1/101CANON']}
    """
    try:
        # Hardcoded version
        version = 'ver130'
        # Construct the path for directory listing
        full_path = f"/{version}/contents/{path}"
        url = compose_url(ip, port, full_path, use_https)
        
        logger.info(f"Requesting directory contents: {url}")
        logger.debug(f"Requesting directory contents from: {url}")
        
        if use_https:
            requests.packages.urllib3.disable_warnings()
            response = requests.get(url, timeout=5, verify=False)
        else:
            response = requests.get(url, timeout=5)
            
        logger.debug(f"Response Status Code: {response.status_code}")
        logger.debug("Response Headers: %s", dict(response.headers))
        
        try:
            return response.json()
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON response: {str(e)}")
            return {'raw_response': response.text}
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making request to {url}: {str(e)}")
        return None

def get_directory_contents(ip, port, storage, directory, use_https=True, file_type="jpeg", kind="list", order=None, page=None):
    """Get list of contents in a specific directory.
    
    Args:
        ip: Camera IP address
        port: Camera port
        storage: Storage name (e.g., 'card1')
        directory: Directory name (e.g., 'DCIM/100CANON')
        use_https: Whether to use HTTPS
        file_type: Optional target file format (e.g., 'jpeg', 'raw')
        kind: Optional response data kind
        order: Optional contents acquisition order (only when kind=chunked)
        page: Optional display page number (only when kind=list, default=1)
        
    Returns:
        dict: The JSON response containing the directory contents or None if request failed
        
    Example:
        >>> get_directory_contents('192.168.1.206', 8080, 'card1', '101CANON')
        {'path': ['/ccapi/ver130/contents/card1/101CANON/IMG_3086.CR3',
                 '/ccapi/ver130/contents/card1/101CANON/IMG_3086.JPG',
                 '/ccapi/ver130/contents/card1/101CANON/IMG_3087.CR3']}
    """
    try:
        # Hardcoded version
        version = 'ver130'
        # Construct the base path
        base_path = f"/{version}/contents/{storage}/{directory}"
        
        # Build query parameters
        params = {}
        if file_type:
            params['type'] = file_type
        if kind:
            params['kind'] = kind
        if order:
            params['order'] = order
        if page is not None:
            params['page'] = page
            
        url = compose_url(ip, port, base_path, use_https)
        
        logger.info(f"Requesting directory contents: {url}")
        logger.debug(f"Requesting directory contents from: {url} with params: {params}")
        
        # Build full URL with params for copying
        from urllib.parse import urlencode
        full_url = f"{url}?{urlencode(params)}" if params else url
        logger.info(f"Full URL: {full_url}")
        if use_https:
            requests.packages.urllib3.disable_warnings()
            response = requests.get(url, params=params, timeout=5, verify=False)
        else:
            response = requests.get(url, params=params, timeout=5)
            
        logger.debug(f"Response Status Code: {response.status_code}")
        logger.debug("Response Headers: %s", dict(response.headers))
        
        try:
            return response.json()
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON response: {str(e)}")
            return {'raw_response': response.text}
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making request to {url}: {str(e)}")
        return None

def get_contents(ip, port, storage, directory, file, use_https=True, kind=None):
    """Get contents of a specific file from the camera.
    
    Args:
        ip: Camera IP address
        port: Camera port
        storage: Storage name (e.g., 'card1')
        directory: Directory name (e.g., '101CANON')
        file: File name (e.g., 'IMG_3086.JPG')
        use_https: Whether to use HTTPS
        kind: Optional contents kind
        
    Returns:
        requests.Response: The response object from the server
        
    Example:
        >>> response = get_contents('192.168.1.206', 8080, 'card1', '101CANON', 'IMG_3086.JPG')
        >>> response.status_code
        200
    """
    try:
        # Hardcoded version
        version = 'ver130'
        # Construct the base path
        base_path = f"/{version}/contents/{storage}/{directory}/{file}"
        
        # Build query parameters
        params = {}
        if kind:
            params['kind'] = kind
            
        url = compose_url(ip, port, base_path, use_https)
        
        logger.info(f"Requesting file contents: {url}")
        logger.debug(f"Requesting file contents from: {url} with params: {params}")
        
        if use_https:
            requests.packages.urllib3.disable_warnings()
            response = requests.get(url, params=params, timeout=5, verify=False)
        else:
            response = requests.get(url, params=params, timeout=5)
            
        logger.debug(f"Response Status Code: {response.status_code}")
        logger.debug("Response Headers: %s", dict(response.headers))
        
        return response
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making request to {url}: {str(e)}")
        return None

def get_battery_info(ip, port, use_https=True):
    """Get battery information from the camera.
    
    Args:
        ip: Camera IP address
        port: Camera port
        use_https: Whether to use HTTPS
        
    Returns:
        dict: The JSON response containing battery information or None if request failed
        
    Example:
        >>> get_battery_info('192.168.1.206', 8080)
        {'battery': {'level': 100, 'status': 'normal'}}
    """
    try:
        # Hardcoded version
        version = 'ver100'
        # Construct the path for battery information
        path = f"/{version}/devicestatus/battery"
        url = compose_url(ip, port, path, use_https)
        
        logger.info(f"Requesting battery information: {url}")
        logger.debug(f"Requesting battery information from: {url}")
        
        if use_https:
            requests.packages.urllib3.disable_warnings()
            response = requests.get(url, timeout=5, verify=False)
        else:
            response = requests.get(url, timeout=5)
            
        logger.debug(f"Response Status Code: {response.status_code}")
        logger.debug("Response Headers: %s", dict(response.headers))
        
        try:
            return response.json()
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON response: {str(e)}")
            return {'raw_response': response.text}
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making request to {url}: {str(e)}")
        return None

def ping_host(ip, port, use_https=True, count=0):
    """Continuously check if the host is reachable.
    
    Args:
        ip: Camera IP address
        port: Camera port
        use_https: Whether to use HTTPS
        count: Number of times to ping (0 means infinite)
        
    Returns:
        None
        
    Example:
        >>> ping_host('192.168.1.206', 8080, count=3)
        Pinging 192.168.1.206:8080...
        Reply from 192.168.1.206:8080: Success
        Reply from 192.168.1.206:8080: Success
        Reply from 192.168.1.206:8080: Success
    """
    try:
        i = 0
        while True:
            if count > 0 and i >= count:
                break
                
            is_reachable = check_host_reachable(ip, port, use_https)
            status = "Success" if is_reachable else "Failed"
            print(f"Reply from {ip}:{port}: {status}")
            
            if not is_reachable:
                break
                
            i += 1
            time.sleep(1)  # Wait 1 second between pings
            
    except KeyboardInterrupt:
        print("\nPing interrupted by user")
    except Exception as e:
        logger.error(f"Error during ping: {str(e)}")

def download_images(ip, port, last_n, output_path=None, use_https=True, kind='thumbnail', file_type='jpeg'):
    """Download the last N images from the camera.
    
    Args:
        ip: Camera IP address
        port: Camera port
        last_n: Number of most recent images to download
        output_path: Directory where to save the images. If not provided, saves in current directory.
        use_https: Whether to use HTTPS
        kind: Type of image to download (e.g., 'jpeg', 'raw'). Defaults to 'jpeg'.
        file_type: Target file format (e.g., 'jpeg', 'raw'). Defaults to 'jpeg'.
        
    Returns:
        dict: Information about downloaded files or error message
        
    Example:
        >>> download_images('192.168.1.206', 8080, 5, '~/Downloads', kind='jpeg', file_type='jpeg')
        {'downloaded': ['IMG_3086.JPG', 'IMG_3087.JPG', ...], 'total': 5}
    """
    try:
        # Get list of storages
        storages = list_contents(ip, port, use_https)
        if not storages or 'path' not in storages:
            return {'error': 'No storage found'}
            
        # Get the first storage (usually card1)
        storage = storages['path'][0].split('/')[-1]
        
        # Get list of directories in the storage
        directories = list_directory_contents(ip, port, storage, use_https)
        if not directories or 'path' not in directories:
            return {'error': 'No directories found'}
            
        # Get the most recent directory (usually the last one)
        recent_dir = directories['path'][-1].split('/')[-1]
        
     
        # Get list of files in the directory
        pages = get_last_directory_contents_page(ip, port, storage, recent_dir, use_https)
        if not pages or 'contentsnumber' not in pages:
            return {'error': 'No files found'}
        last_page = pages['pagenumber']
        total_files = pages['contentsnumber']
        files_per_page = 100
        
        files = get_directory_contents(ip, port, storage, recent_dir, use_https, kind="list", page=last_page)
        if not files or 'path' not in files:
            return {'error': 'No files found :('}
        
            
        # Filter for image files and get the last N
        image_files = [f.split('/')[-1] for f in files['path'] if f.lower().endswith(('.jpg', '.jpeg', '.cr2', '.cr3'))]
        image_files = image_files[-last_n:]  # Get the last N images
        
        # Create output directory if it doesn't exist
        if output_path:
            os.makedirs(output_path, exist_ok=True)
        else:
            output_path = os.getcwd()
            
        downloaded_files = []
        for file in image_files:
            # Get the file contents
            response = get_contents(ip, port, storage, recent_dir, file, use_https, kind=kind)
            if response and response.status_code == 200:
                # Save the file
                result = save_contents(response, os.path.join(output_path, file))
                if 'saved_to' in result:
                    downloaded_files.append(file)
                    
        return {
            'downloaded': downloaded_files,
            'total': len(downloaded_files),
            'output_path': output_path,
            'kind': kind,
            'file_type': file_type
        }
            
    except Exception as e:
        logger.error(f"Error downloading images: {str(e)}")
        return {'error': str(e)}

def save_contents(response, output_path=None):
    """Save the contents of a response to a file.
    
    Args:
        response: The response object from get_contents
        output_path: Optional path where to save the file. If not provided, saves in current directory.
        
    Returns:
        dict: Information about the saved file or error message
        
    Example:
        >>> response = get_contents('192.168.1.206', 8080, 'card1', '101CANON', 'IMG_3086.JPG')
        >>> save_contents(response)
        {'saved_to': '/current/directory/IMG_3086.JPG'}
    """
    if response is None:
        return {'error': 'No response received'}
        
    if response.status_code != 200:
        return {'error': f'Request failed with status code {response.status_code}'}
        
    # If this is a binary response (like an image), save it
    if 'Content-Type' in response.headers and not response.headers['Content-Type'].startswith('application/json'):
        # Get filename from Content-Disposition header if available, otherwise use original filename
        filename = None
        if 'Content-Disposition' in response.headers:
            import re
            match = re.search('filename="?([^"]+)"?', response.headers['Content-Disposition'])
            if match:
                filename = match.group(1)
        
        # Determine output filename
        if output_path:
            output_file = output_path
        else:
            # Save in current working directory
            output_file = os.path.join(os.getcwd(), filename if filename else 'downloaded_file')
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        # Save the file
        with open(output_file, 'wb') as f:
            f.write(response.content)
        logger.info(f"File saved to: {output_file}")
        return {'saved_to': output_file}
    
    # If it's JSON, return the parsed JSON
    try:
        return response.json()
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON response: {str(e)}")
        return {'raw_response': response.text}

def get_last_directory_contents_page(ip, port, storage, directory, use_https=True):
    """Get the last page of directory contents.
    
    Args:
        ip: Camera IP address
        port: Camera port
        storage: Storage name (e.g., 'card1')
        directory: Directory name (e.g., '101CANON')
        
    Returns:
        dict: The JSON response containing the last page of directory contents or None if request failed
    
    Example:
        >>> get_last_directory_contents_page('192.168.1.206', 8080, 'card1', '101CANON')
        {"contentsnumber": 835, "pagenumber": 9 }
    """
    try:
        # Hardcoded version
        pages = get_directory_contents(ip, port, storage, directory, use_https, kind="number")
        return pages
    except Exception as e:
        logger.error(f"Error getting last directory contents page: {str(e)}")
        return None
        
        

        
def print_response(response):
    """Pretty print the response.
    
    Args:
        response: The response to print
    """
    if response is None:
        print("No response received")
        return
        
    logger.info("\nResponse:")
    if isinstance(response, dict):
        print(json.dumps(response, indent=2))
    else:
        pprint(json.dumps(response, indent=2))

def main():
    # Get default values from environment variables
    default_ip = os.getenv('DEFAULT_IP', '127.0.0.1')
    default_port = int(os.getenv('DEFAULT_PORT', '8080'))
    default_https = os.getenv('DEFAULT_HTTPS', 'false').lower() == 'true'
    default_log_level = os.getenv('DEFAULT_LOG_LEVEL', 'INFO').upper()

    parser = argparse.ArgumentParser(description='Server connection and request tool')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Common arguments for both subcommands
    common_parser = argparse.ArgumentParser(add_help=False)
    common_parser.add_argument('--ip', default=default_ip, help=f'IP address to connect to (default: {default_ip})')
    common_parser.add_argument('--port', type=int, default=default_port, help=f'Port number to connect to (default: {default_port})')
    common_parser.add_argument('--https', action='store_true', default=default_https, help=f'Use HTTPS protocol (default: {default_https})')
    common_parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL', 
                                                     'debug', 'info', 'warning', 'error', 'critical'], 
                             default=default_log_level, help='Set the logging level (default: INFO)')
    
    # Check connection command
    check_parser = subparsers.add_parser('check-connection', aliases=['cc'], 
                                       parents=[common_parser],
                                       help='Check if host is reachable')
    
    # Connect command
    connect_parser = subparsers.add_parser('connect', aliases=['c'],
                                         parents=[common_parser],
                                         help='Make a request to the host and print response')
    connect_parser.add_argument('--path', default='', help='Additional path after /ccapi (e.g., /ver100/deviceinfo)')
    
    # List contents command
    list_parser = subparsers.add_parser('list-contents', aliases=['lc'],
                                      parents=[common_parser],
                                      help='List contents from the camera')
    
    # List directory contents command
    list_dir_parser = subparsers.add_parser('list-directory', aliases=['ld'],
                                          parents=[common_parser],
                                          help='List contents from a specific directory')
    list_dir_parser.add_argument('--path', required=True, help='Directory path to list contents from')
    
    # Get directory contents command
    get_dir_parser = subparsers.add_parser('get-directory', aliases=['gd'],
                                         parents=[common_parser],
                                         help='Get contents from a specific storage and directory')
    get_dir_parser.add_argument('--path', '--storage', required=True, help='Storage name (e.g., card1)')
    get_dir_parser.add_argument('--directory', required=True, help='Directory name (e.g., 101CANON)')
    get_dir_parser.add_argument('--type', help='Target file format (e.g., jpeg, raw)')
    get_dir_parser.add_argument('--kind', help='Response data kind')
    get_dir_parser.add_argument('--order', help='Contents acquisition order (only when kind=chunked)')
    get_dir_parser.add_argument('--page', type=int, help='Display page number (only when kind=list)')
    
    # Get contents command
    get_contents_parser = subparsers.add_parser('get-contents', aliases=['gc'],
                                              parents=[common_parser],
                                              help='Get contents of a specific file')
    get_contents_parser.add_argument('--path', '--storage', required=True, help='Storage name (e.g., card1)')
    get_contents_parser.add_argument('--directory', required=True, help='Directory name (e.g., 101CANON)')
    get_contents_parser.add_argument('--file', required=True, help='File name (e.g., IMG_3086.JPG)')
    get_contents_parser.add_argument('--kind', help='Contents kind')
    get_contents_parser.add_argument('--output', '-o', help='Path where to save the file. If not provided, saves in current directory.')
    
    # Battery information command
    battery_parser = subparsers.add_parser('battery', aliases=['b'],
                                         parents=[common_parser],
                                         help='Get battery information from the camera')
    
    # Download command
    download_parser = subparsers.add_parser('download', aliases=['d'],
                                          parents=[common_parser],
                                          help='Download the last N images from the camera')
    download_parser.add_argument('--last-n', type=int, required=True, help='Number of most recent images to download')
    download_parser.add_argument('--output-path', '-o', help='Directory where to save the images. If not provided, saves in current directory.')
    download_parser.add_argument('--kind', help='Type of image to download (e.g., jpeg, raw). Defaults to jpeg.')
    download_parser.add_argument('--type', help='Target file format (e.g., jpeg, raw). Defaults to jpeg.')
    
    # Ping command
    ping_parser = subparsers.add_parser('ping', aliases=['p'],
                                      parents=[common_parser],
                                      help='Continuously check if the host is reachable')
    ping_parser.add_argument('-c', '--count', type=int, default=0, help='Number of times to ping (0 means infinite)')
    
    args = parser.parse_args()
    
    # Convert log level to uppercase
    log_level = args.log_level.upper()
    
    if log_level == 'DEBUG':
        logger.setLevel(logging.DEBUG)
    elif log_level == 'INFO':
        logger.setLevel(logging.INFO)
    elif log_level == 'WARNING':
        logger.setLevel(logging.WARNING)
    elif log_level == 'ERROR':
        logger.setLevel(logging.ERROR)
    elif log_level == 'CRITICAL':
        logger.setLevel(logging.CRITICAL)
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    if args.command in ['check-connection', 'cc']:
        logger.info(f"Checking if {args.ip}:{args.port} is reachable using {'HTTPS' if args.https else 'HTTP'}...")
        is_reachable = check_host_reachable(args.ip, args.port, args.https)
        print(f"Host {args.ip}:{args.port} is {'reachable' if is_reachable else 'not reachable'}!")
        if not is_reachable:
            sys.exit(1)
    elif args.command in ['connect', 'c']:
        logger.info(f"Making request to {args.ip}:{args.port} using {'HTTPS' if args.https else 'HTTP'}...")
        response = make_request(args.ip, args.port, args.path, args.https)
        print_response(response)
    elif args.command in ['list-contents', 'lc']:
        logger.info(f"Listing contents from {args.ip}:{args.port} using {'HTTPS' if args.https else 'HTTP'}...")
        response = list_contents(args.ip, args.port, args.https)
        print_response(response)
    elif args.command in ['list-directory', 'ld']:
        logger.info(f"Listing directory contents from {args.ip}:{args.port} using {'HTTPS' if args.https else 'HTTP'}...")
        response = list_directory_contents(args.ip, args.port, args.path, args.https)
        print_response(response)
    elif args.command in ['get-directory', 'gd']:
        logger.info(f"Getting directory contents from {args.ip}:{args.port} using {'HTTPS' if args.https else 'HTTP'}...")
        response = get_directory_contents(
            args.ip, args.port, 
            args.path, args.directory,
            args.https, args.type, args.kind, 
            args.order, args.page
        )
        print_response(response)
    elif args.command in ['get-contents', 'gc']:
        logger.info(f"Getting file contents from {args.ip}:{args.port} using {'HTTPS' if args.https else 'HTTP'}...")
        response = get_contents(
            args.ip, args.port,
            args.path, args.directory, args.file,
            args.https, args.kind
        )
        if args.kind == "info":
            print_response(response)
        else:
            result = save_contents(response, args.output)
            print_response(result)
    elif args.command in ['battery', 'b']:
        logger.info(f"Getting battery information from {args.ip}:{args.port} using {'HTTPS' if args.https else 'HTTP'}...")
        response = get_battery_info(args.ip, args.port, args.https)
        print_response(response)
    elif args.command in ['download', 'd']:
        logger.info(f"Downloading the last {args.last_n} images from {args.ip}:{args.port} using {'HTTPS' if args.https else 'HTTP'}...")
        response = download_images(args.ip, args.port, args.last_n, args.output_path, args.https, args.kind, args.type)
        print_response(response)
    elif args.command in ['ping', 'p']:
        logger.info(f"Pinging {args.ip}:{args.port} using {'HTTPS' if args.https else 'HTTP'}...")
        ping_host(args.ip, args.port, args.https, args.count)

if __name__ == '__main__':
    main() 