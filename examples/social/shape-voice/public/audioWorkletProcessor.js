class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const inputData = input[0]; // First channel (mono)
            // Convert float32 to int16 (linear16)
            const buffer = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                buffer[i] = Math.min(1, Math.max(-1, inputData[i])) * 32767;
            }
            // Send to main thread
            this.port.postMessage(buffer);
        }
        return true; // Keep the processor alive
    }
}

registerProcessor('audio-processor', AudioProcessor);