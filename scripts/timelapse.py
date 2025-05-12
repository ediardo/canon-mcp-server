#!/usr/bin/env python3
"""
timelapse.py

Create a timelapse video from images using ffmpeg-python, with:
  - image count & resolution logging
  - optional batching when only --seconds is given
  - live progress bar
  - exact FPS (even fractional seconds)
  - supports ~ expansion and absolute paths
  - optional soundtrack from MP3
"""

import argparse
import sys
import random
import tempfile
from glob import glob
from pathlib import Path

from PIL import Image, ExifTags               # pip install pillow
import ffmpeg                               # pip install ffmpeg-python
import tqdm                                 # pip install tqdm

def get_image_size(file_path: str):
    """Return (width, height) of a single image file."""
    with Image.open(file_path) as im:
        return im.size  # (width, height)

def auto_orient_image(src_path, dst_path):
    """Open image, auto-orient by EXIF, and save to dst_path."""
    with Image.open(src_path) as im:
        try:
            exif = im._getexif()
            if exif is not None:
                for tag, value in exif.items():
                    tag_name = ExifTags.TAGS.get(tag, tag)
                    if tag_name == 'Orientation':
                        orientation = value
                        if orientation == 3:
                            im = im.rotate(180, expand=True)
                        elif orientation == 6:
                            im = im.rotate(270, expand=True)
                        elif orientation == 8:
                            im = im.rotate(90, expand=True)
                        elif orientation == 2:
                            im = im.transpose(Image.FLIP_LEFT_RIGHT)
                        elif orientation == 4:
                            im = im.transpose(Image.FLIP_TOP_BOTTOM)
                        elif orientation == 5:
                            im = im.transpose(Image.FLIP_LEFT_RIGHT).rotate(270, expand=True)
                        elif orientation == 7:
                            im = im.transpose(Image.FLIP_LEFT_RIGHT).rotate(90, expand=True)
                        break
        except Exception:
            pass  # If EXIF or orientation is missing/corrupt, skip
        im.save(dst_path)

def build_timelapse(args, files, total_frames):
    """
    Launch FFmpeg asynchronously with progress piped to stdout,
    parse its 'frame=…' lines, and update the tqdm bar.
    Uses a temporary concat file list for arbitrary ordering/extensions.
    If args.audio is set, muxes in the MP3 and stops at the shortest stream.
    """
    # write a concat-style file list
    with tempfile.NamedTemporaryFile('w', delete=False, suffix='.txt') as tf:
        for f in files:
            tf.write(f"file '{f}'\n")
        filelist_path = tf.name

    # build inputs
    video_in = ffmpeg.input(
        filelist_path,
        format='concat',
        safe=0
    )

    if args.audio:
        audio_in = ffmpeg.input(args.audio)
        output_stream = ffmpeg.output(
            video_in, audio_in,
            args.output_video,
            vcodec=args.codec,
            crf=args.crf,
            pix_fmt='yuv420p',
            r=args.fps,
            acodec='aac',
            audio_bitrate='192k',
            shortest=None
        )
    else:
        output_stream = ffmpeg.output(
            video_in,
            args.output_video,
            vcodec=args.codec,
            crf=args.crf,
            pix_fmt='yuv420p',
            r=args.fps
        )

    # add progress and run
    process = (
        output_stream
        .global_args(
            '-progress', 'pipe:1',
            '-nostats',
            '-loglevel', 'error'
        )
        .overwrite_output()
        .run_async(pipe_stdout=True, pipe_stderr=True, cmd='ffmpeg')
    )

    # progress bar
    pbar = tqdm.tqdm(
        total=total_frames,
        unit='frame',
        bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]'
    )

    try:
        while True:
            line = process.stdout.readline().decode('utf-8').strip()
            if not line:
                if process.poll() is not None:
                    break
                continue
            if line.startswith('frame='):
                n = int(line.split('=', 1)[1])
                pbar.n = min(n, total_frames)
                pbar.refresh()
    finally:
        pbar.close()
        err = process.stderr.read().decode('utf-8').strip()
        if err:
            sys.stderr.write(err + '\n')
        process.wait()
        if process.returncode != 0:
            raise RuntimeError(f'FFmpeg exited with code {process.returncode}')

def main():
    parser = argparse.ArgumentParser(
        description="Timelapse builder using FFmpeg with optional audio and progress logging",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument(
        '--input-path', '-i', required=True,
        help='Folder containing image sequence (e.g. ~/photos/sequence).'
    )
    parser.add_argument(
        '--output-video', '-o', required=True,
        help='Output video file, e.g. timelapse.mp4'
    )
    parser.add_argument(
        '--fps', '-f', type=float,
        help='Exact frames per second (float allowed).'
    )
    parser.add_argument(
        '--seconds', '-s', type=float,
        help='Target video duration in seconds (if --fps not given).'
    )
    parser.add_argument(
        '--codec', default='libx264',
        help='FFmpeg video codec (libx264, hevc, av1, prores_ks, etc.)'
    )
    parser.add_argument(
        '--crf', type=int, default=20,
        help='Constant Rate Factor (0–51, lower=better quality).'
    )
    parser.add_argument(
        '--audio', '-a', default=None,
        help='Optional MP3 file to add as soundtrack.'
    )

    args = parser.parse_args()

    # resolve and validate input directory
    input_dir = Path(args.input_path).expanduser().resolve()
    if not input_dir.is_dir():
        sys.exit(f"Error: input path '{input_dir}' is not a directory")

    # gather image files
    files = [
        str(p) for p in sorted(input_dir.iterdir())
        if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.tif', '.tiff')
    ]
    if not files:
        sys.exit(f"No images found under '{input_dir}'")

    # --- EXIF orientation correction ---
    tempdir = tempfile.TemporaryDirectory(prefix="timelapse_oriented_")
    oriented_files = []
    for i, src in enumerate(files):
        ext = Path(src).suffix
        dst = str(Path(tempdir.name) / f"frame_{i:05d}{ext}")
        auto_orient_image(src, dst)
        oriented_files.append(dst)

    total_frames = len(oriented_files)
    width, height = get_image_size(oriented_files[0])

    # determine FPS and select frames if needed
    fps = args.fps
    selected = oriented_files
    if fps is None:
        if args.seconds is None:
            sys.exit("Error: you must provide either --fps or --seconds")
        # evenly sample to fit desired duration at 24 fps
        target_fps = 24.0
        num_frames = int(args.seconds * target_fps)
        if num_frames <= 0:
            sys.exit("Error: --seconds must be > 0")
        if num_frames >= total_frames:
            selected = oriented_files
        else:
            step = total_frames / num_frames
            indices = [int(i * step) for i in range(num_frames)]
            selected = [oriented_files[i] for i in indices]
        fps = target_fps
        print(f"[Sampling] {total_frames}→{len(selected)} frames for {args.seconds}s at {fps}fps")
    else:
        print(f"[Using FPS] {fps:.3f}")

    est_dur = len(selected) / fps
    print(f"Found       : {total_frames} images")
    print(f"Resolution  : {width} × {height}")
    if args.audio:
        print(f"Audio track : {args.audio}")
    print(f"Output file : {args.output_video}")
    print(f"Codec       : {args.codec} (CRF {args.crf})")
    print(f"Frames      : {len(selected)}")
    print(f"Target FPS  : {fps:.3f}")
    print(f"Duration    : {est_dur:.2f} seconds\n")

    resp = input("Proceed? [Y/n]: ").strip().lower()
    if resp in ('n', 'no'):
        print("Aborted.")
        sys.exit(0)

    args.fps = fps
    build_timelapse(args, selected, len(selected))

    print(f"\n✓ Done → {Path(args.output_video).resolve()}")

if __name__ == '__main__':
    main()