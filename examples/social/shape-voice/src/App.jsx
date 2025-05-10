import { useState, useRef, useEffect } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import OpenAI from 'openai';

export function App() {
    const [recording, setRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [ttsStatus, setTtsStatus] = useState('idle');
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const deepgramRef = useRef(null);
    const keepAliveIntervalRef = useRef(null);
    const audioWorkletNodeRef = useRef(null);
    const ttsWorkerRef = useRef(null);
    const audioRef = useRef(new Audio());

    const openai = new OpenAI({
        apiKey: import.meta.env.VITE_SHAPESINC_API_KEY,
        baseURL: "https://api.shapes.inc/v1/",
        dangerouslyAllowBrowser: true,
    });

    const startDeepgram = () => {
        const deepgramClient = createClient(import.meta.env.VITE_DEEPGRAM_API_KEY);
        const deepgram = deepgramClient.listen.live({
            smart_format: true,
            model: 'nova-2-general',
            encoding: 'linear16',
            sample_rate: 16000,
        });

        deepgramRef.current = deepgram;

        deepgram.on(LiveTranscriptionEvents.Open, () => {
            keepAliveIntervalRef.current = setInterval(() => {
                if (deepgram.getReadyState() === 1) {
                    deepgram.keepAlive();
                }
            }, 10000);
        });

        deepgram.on(LiveTranscriptionEvents.Close, () => {
            clearInterval(keepAliveIntervalRef.current);
            deepgramRef.current = null;
        });

        deepgram.on(LiveTranscriptionEvents.Error, (err) => {
            console.error('Deepgram error:', err);
            clearInterval(keepAliveIntervalRef.current);
        });

        deepgram.on(LiveTranscriptionEvents.Transcript, (data) => {
            const newTranscript = data.channel?.alternatives?.[0]?.transcript;
            if (newTranscript) {
                setTranscript((prev) => (prev ? prev + ' ' + newTranscript : newTranscript));
            }
        });
    };

    const stopDeepgram = () => {
        if (deepgramRef.current) {
            deepgramRef.current.finish();
            deepgramRef.current = null;
        }
        clearInterval(keepAliveIntervalRef.current);
    };

    const startRecording = async () => {
        setTranscript('');
        setAiResponse('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new AudioContext({ sampleRate: 16000 });

            // Load the AudioWorklet module
            await audioContextRef.current.audioWorklet.addModule('/audioWorkletProcessor.js');

            const source = audioContextRef.current.createMediaStreamSource(stream);
            const workletNode = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
            audioWorkletNodeRef.current = workletNode;

            // Handle audio data from the worklet
            workletNode.port.onmessage = (event) => {
                if (!deepgramRef.current || deepgramRef.current.getReadyState() !== 1) return;
                const buffer = event.data;
                deepgramRef.current.send(buffer.buffer);
            };

            source.connect(workletNode);
            workletNode.connect(audioContextRef.current.destination);

            mediaRecorderRef.current = { stream };
            startDeepgram();
            setRecording(true);
        } catch (err) {
            console.error('Microphone error:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
        if (audioWorkletNodeRef.current) {
            audioWorkletNodeRef.current.disconnect();
            audioWorkletNodeRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        stopDeepgram();
        setRecording(false);
        sendToOpenAI();
    };

    const sendToOpenAI = async () => {
        if (!transcript) return;
        setLoading(true);
        try {
            const completion = await openai.chat.completions.create({
                model: 'shapesinc/' + import.meta.env.VITE_SHAPESINC_SHAPE_USERNAME,
                messages: [{ role: 'user', content: transcript }],
            });
            const response = completion.choices[0]?.message?.content || 'No response from AI';
            setAiResponse(response);

            // Generate speech from the AI response
            if (response && response !== 'No response from AI') {
                generateSpeech(response);
            }
        } catch (err) {
            console.error('OpenAI error:', err);
            setAiResponse('Error communicating with AI');
        }
        setLoading(false);
    };

    // Initialize TTS worker
    useEffect(() => {
        // Create the TTS worker
        ttsWorkerRef.current = new Worker(new URL('/ttsWorker.js', import.meta.url), {
            type: 'module'
        });

        // Set up event handlers for the worker
        ttsWorkerRef.current.addEventListener('message', (event) => {
            const { status, device, error, audio } = event.data;

            switch (status) {
                case 'device':
                    console.log('TTS using device:', device);
                    setTtsStatus('loading');
                    break;
                case 'ready':
                    console.log('TTS model loaded successfully');
                    setTtsStatus('ready');
                    break;
                case 'error':
                    console.error('TTS error:', error);
                    setTtsStatus('error');
                    break;
                case 'complete':
                    if (audio) {
                        setAudioBlob(audio);
                        playAudio(audio);
                    }
                    break;
            }
        });

        return () => {
            stopRecording(); // Cleanup recording on unmount

            // Clean up TTS worker
            if (ttsWorkerRef.current) {
                ttsWorkerRef.current.terminate();
                ttsWorkerRef.current = null;
            }
        };
    }, []);

    // Handle audio playback
    const playAudio = (blob) => {
        if (audioRef.current.src) {
            URL.revokeObjectURL(audioRef.current.src);
        }

        const url = URL.createObjectURL(blob);
        audioRef.current.src = url;
        audioRef.current.onplay = () => setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play().catch(err => console.error('Audio playback error:', err));
    };

    // Generate speech from text
    const generateSpeech = (text) => {
        if (!text || ttsStatus !== 'ready') return;

        // Change the text to speech voice here
        // List of Kokoro TTS voices - https://github.com/hexgrad/kokoro/blob/main/demo/app.py#L87-L115
        const voice = 'bm_lewis';
        ttsWorkerRef.current?.postMessage({ text, voice });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <button
                onClick={recording ? stopRecording : startRecording}
                className={`p-4 rounded-full ${recording ? 'bg-red-500' : 'bg-green-500'} text-white mb-4`}
            >
                <Mic className="w-6 h-6" />
            </button>
            <div className="w-full max-w-xl bg-white shadow rounded p-4">
                <h2 className="text-lg font-semibold mb-2">Transcript</h2>
                <p className="mb-4">{transcript || '---'}</p>

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold mb-2">AI Response</h2>
                    {audioBlob && !isPlaying && (
                        <button
                            onClick={() => playAudio(audioBlob)}
                            className="p-2 rounded-full bg-blue-500 text-white"
                            title="Play response"
                        >
                            <Volume2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="relative">
                        <p>{aiResponse || '---'}</p>
                        {ttsStatus === 'loading' && (
                            <div className="text-sm text-blue-500 mt-2">
                                Loading TTS model...
                            </div>
                        )}
                        {isPlaying && (
                            <div className="absolute right-0 top-0">
                                <div className="animate-pulse p-1 rounded-full bg-blue-100">
                                    <Volume2 className="w-4 h-4 text-blue-500" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}