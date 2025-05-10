import { KokoroTTS } from "kokoro-js";
import { detectWebGPU } from "./utils";

// Device detection (if utils.js is available)
const device = (typeof detectWebGPU === 'function' && await detectWebGPU()) ? "webgpu" : "wasm";
self.postMessage({ status: "device", device });

// Load the model
const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";
try {
  const tts = await KokoroTTS.from_pretrained(model_id, {
    dtype: device === "wasm" ? "q8" : "fp32",
    device,
  });

  self.postMessage({ status: "ready", device, voices: tts.voices });
  console.log("Voices: ", tts.voices);

  // Listen for messages from the main thread
  self.addEventListener("message", async (e) => {
    const { text, voice = 'af_heart' } = e.data;

    try {
      // Generate audio directly without streaming
      // Using the correct method from Kokoro-js API
      const audio = await tts.generate(text, { voice });

      // Send the complete audio back
      self.postMessage({
        status: "complete",
        audio: audio.toBlob()
      });
    } catch (error) {
      self.postMessage({
        status: "error",
        error: error.message
      });
    }
  });
} catch (e) {
  self.postMessage({ status: "error", error: e.message });
}