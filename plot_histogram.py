#!/usr/bin/env python3

import json
import matplotlib.pyplot as plt
import numpy as np
import argparse

def plot_histogram(json_file):
    # Read JSON file
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    # Extract histogram data
    histogram = data.get('liveviewdata', {}).get('histogram', [])
    
    if not histogram:
        print("No histogram data found in the JSON file")
        return
    
    # Create x-axis values (typically 0-255 for image histograms)
    x = np.arange(len(histogram[0]))
    
    # Set up plot
    plt.figure(figsize=(12, 6))
    
    # Plot each channel with different colors
    colors = ['r', 'g', 'b', 'k']
    labels = ['Red', 'Green', 'Blue', 'Luminance']
    
    for i, channel_data in enumerate(histogram[:4]):  # Limit to first 4 channels
        if i < len(colors):
            plt.plot(x, channel_data, color=colors[i], alpha=0.7, label=labels[i])
    
    # Add labels and title
    plt.xlabel('Intensity Value')
    plt.ylabel('Frequency')
    plt.title('Image Histogram')
    plt.grid(alpha=0.3)
    plt.legend()
    
    # Save and show the plot
    output_file = json_file.rsplit('.', 1)[0] + '_histogram.png'
    plt.savefig(output_file)
    print(f"Histogram saved as {output_file}")
    plt.show()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Plot image histogram from JSON file')
    parser.add_argument('json_file', help='Path to the JSON file containing histogram data')
    args = parser.parse_args()
    
    plot_histogram(args.json_file) 