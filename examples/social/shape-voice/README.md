# Shape Voice

Shape Voice is an example voice conversational web-app using the Shapes API.

### Prerequisites:

You will need an API key for your shape from the [Shapes Inc.](https://shapes.inc) developer dashboard.

You will also need a Deepgram API key for voice recognition.

The example uses Kokoro TTS for text to speech. The model will be downloaded on first run, which takes some time.

### Setup:
1. Copy the `.env.example` file to `.env`
2. Fill in the values for the environment variables
3. Run `npm install`
4. Run `npm start`

### Usage:

Open the app in your browser and click the microphone button to start recording. Click the microphone button again to stop recording.
The app will use your microphone to record your voice and send it to Deepgram for transcription.
The transcription will be sent to your shape, and the response will be sent back to the app for text to speech.

The default voice in the example if British male, which might not be suitable for your shape.
You can change the voice used for text to speech by modifying the `voice` variable in the `App.jsx` file.

-------------------
© 2025 Shapes Inc.