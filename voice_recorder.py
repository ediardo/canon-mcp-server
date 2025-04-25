#!/usr/bin/env python3
import pyaudio
import wave
import threading
import time
import os
import whisper
from pynput import keyboard

class VoiceRecorder:
    def __init__(self, output_filename="recording.wav", transcription_filename="transcription.txt"):
        self.chunk = 1024
        self.format = pyaudio.paInt16
        self.channels = 1
        self.rate = 44100
        self.output_filename = output_filename
        self.transcription_filename = transcription_filename
        self.is_recording = False
        self.frames = []

    def record_audio(self):
        """Start recording audio."""
        p = pyaudio.PyAudio()
        
        try:
            print("Recording started... Press ESC to stop.")
            
            stream = p.open(
                format=self.format,
                channels=self.channels,
                rate=self.rate,
                input=True,
                frames_per_buffer=self.chunk
            )
            
            self.is_recording = True
            self.frames = []
            
            while self.is_recording:
                data = stream.read(self.chunk)
                self.frames.append(data)
                
        finally:
            stream.stop_stream()
            stream.close()
            p.terminate()
            
            if self.frames:  # Only save if we have frames
                self.save_recording()
                self.transcribe_audio()
                
    def stop_recording(self):
        """Stop the recording."""
        self.is_recording = False
        
    def save_recording(self):
        """Save the recorded audio to a file."""
        print(f"Saving recording to {self.output_filename}...")
        
        p = pyaudio.PyAudio()
        wf = wave.open(self.output_filename, 'wb')
        wf.setnchannels(self.channels)
        wf.setsampwidth(p.get_sample_size(self.format))
        wf.setframerate(self.rate)
        wf.writeframes(b''.join(self.frames))
        wf.close()
        p.terminate()
        
        print(f"Recording saved to {os.path.abspath(self.output_filename)}")
    
    def transcribe_audio(self):
        """Transcribe the audio using Whisper model."""
        print("Transcribing audio with Whisper... This may take a moment.")
        
        # Load the Whisper model (using the small model for faster processing)
        model = whisper.load_model("base")
        
        # Transcribe the audio file
        result = model.transcribe(self.output_filename)
        
        # Get the transcript text
        transcript = result["text"]
        
        # Save the transcript to a file
        with open(self.transcription_filename, "w") as f:
            f.write(transcript)
        
        print(f"Transcription saved to {os.path.abspath(self.transcription_filename)}")
        print(f"Transcript: {transcript}")

def on_press(key):
    """Handle key press events."""
    if key == keyboard.Key.esc:
        # Stop listener
        return False

def main():
    recorder = VoiceRecorder()
    
    # Start recording in a separate thread
    recording_thread = threading.Thread(target=recorder.record_audio)
    recording_thread.start()
    
    # Listen for ESC key press to stop recording
    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()
    
    recorder.stop_recording()
    recording_thread.join()
    
if __name__ == "__main__":
    main() 