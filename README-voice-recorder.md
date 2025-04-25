# Voice Recorder with Transcription

A Python script that records your voice, stops when you press the ESC key, and transcribes the audio to text using OpenAI's Whisper model.

## Requirements

To use this script, you need to install the required packages:

```bash
pip install -r requirements.txt
```

Note: Whisper may require additional dependencies based on your system. If you encounter issues, refer to the [Whisper installation guide](https://github.com/openai/whisper#setup).

## Usage

1. Run the script with Python:

```bash
python voice_recorder.py
```

2. The script will start recording immediately
3. Press the ESC key to stop recording
4. The recording will be saved as `recording.wav` in the same directory
5. The script will automatically transcribe the audio using Whisper
6. Transcription will be saved as `transcription.txt` and also printed to the console

## Notes

- On macOS, you may need to grant Terminal (or your Python environment) permission to access the microphone
- Make sure your microphone is properly connected and selected as the default input device
- The output audio file can be played with any audio player that supports WAV format
- The Whisper transcription process may take some time depending on your system and the length of the recording
- The base Whisper model is used by default for faster processing, but you can modify the script to use larger models for better accuracy 