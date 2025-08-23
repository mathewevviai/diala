"use client";

const DEFAULT_CHATTERBOX_VOICE = 'default'; // Default voice if none specified
const CHATTERBOX_MODEL_NAME = 'chatterbox'; // Model name for Chatterbox
const CHATTERBOX_DEFAULT_SERVER_URL = 'http://localhost:8888'; 

/**
 * ChatterboxClient handles TTS requests to a self-hosted Chatterbox FastAPI server.
 * It expects the server to have a compatible /v1/audio/speech endpoint.
 */
export class ChatterboxClient {
    constructor({
        apiBaseUrl = CHATTERBOX_DEFAULT_SERVER_URL,
        // model = CHATTERBOX_MODEL_NAME, // Model is implicit in the server endpoint
        voice = DEFAULT_CHATTERBOX_VOICE, // Can be 'default' or a path to an audio_prompt_path
        outputSampleRate = 24000,        // Target sample rate for the server to produce
        exaggeration = 0.5,
        cfg_weight = 0.5,
        temperature = 0.8,
        // speed and normalizationOptions are not directly used by Chatterbox server.py in this setup
    } = {}) {
        this.apiBaseUrl = apiBaseUrl;
        this.voice = voice; // This will be used for audio_prompt_path if not 'default'
        this.outputSampleRate = outputSampleRate;
        this.exaggeration = exaggeration;
        this.cfg_weight = cfg_weight;
        this.temperature = temperature;

        this.isStreaming = false; // Indicates if a request is in progress
        this._eventEmitter = document.createElement('div');
        console.info(`[ChatterboxClient Constructor] Initialized. API Base URL: ${this.apiBaseUrl}, Default Voice/Prompt: ${this.voice}, Target SR: ${this.outputSampleRate}`);
    }

    /**
     * Sends text to the Chatterbox FastAPI server to generate speech.
     * @param {string} text The text to synthesize.
     * @param {string|null} voiceOverride Optional voice to use (path to .wav or 'default').
     * @param {string|null} language Language code (currently NOT used by Chatterbox server endpoint).
     */
    async sendText(text, voiceOverride = null, language = null) { // language is ignored for now
        if (!text || text.trim() === "") {
            console.warn("[ChatterboxClient sendText] Attempted to send empty text.");
            this.emit('stream_end');
            return;
        }

        if (this.isStreaming) {
            console.warn("[ChatterboxClient sendText] Already streaming. Request ignored.");
            return;
        }

        this.isStreaming = true;
        this.emit('stream_start');
        
        const currentVoiceSetting = voiceOverride || this.voice;
        const audioPromptPath = (currentVoiceSetting && currentVoiceSetting.toLowerCase() !== 'default' && (currentVoiceSetting.includes('.wav') || currentVoiceSetting.includes('.mp3'))) 
                                ? currentVoiceSetting 
                                : null;

        const endpoint = `${this.apiBaseUrl}/v1/audio/speech?target_sample_rate=${this.outputSampleRate}`;

        console.log(`[ChatterboxClient sendText] Sending to Chatterbox: "${text.substring(0,50)}...", Audio Prompt Path: ${audioPromptPath || 'using default server voice'}, Target SR: ${this.outputSampleRate}, Exaggeration: ${this.exaggeration}, CFG Weight: ${this.cfg_weight}, Temp: ${this.temperature}`);

        try {
            const requestBody = {
                text: text,
                audio_prompt_path: audioPromptPath,
                exaggeration: this.exaggeration,
                cfg_weight: this.cfg_weight,
                temperature: this.temperature,
            };

            console.log(`[ChatterboxClient sendText] Text to be sent: "${text}"`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // FastAPI StreamingResponse for raw PCM doesn't typically set 'Accept' for the stream itself,
                    // but the content-type of the response will be `audio/L16;rate=...`
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[ChatterboxClient sendText] Error from Chatterbox server: ${response.status} ${response.statusText}`, errorBody);
                this.emit('error', `Chatterbox server error: ${response.status} - ${errorBody.substring(0,100)}`);
                this.isStreaming = false;
                this.emit('stream_end');
                return;
            }

            if (!response.body) {
                console.error('[ChatterboxClient sendText] No response body from Chatterbox server.');
                this.emit('error', 'Chatterbox: No response body');
                this.isStreaming = false;
                this.emit('stream_end');
                return;
            }

            // Server streams raw PCM bytes
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read(); // value is Uint8Array
                if (done) {
                    break;
                }
                if (value && value.length > 0) {
                    this.emit('audio_chunk', value); // Pass Uint8Array directly
                }
            }
            console.log("[ChatterboxClient sendText] Finished streaming audio from Chatterbox.");

        } catch (error) {
            console.error("[ChatterboxClient sendText] Network or other error:", error);
            this.emit('error', `Chatterbox client error: ${error.message}`);
        } finally {
            this.isStreaming = false;
            this.emit('stream_end');
        }
    }

    connect() {
        // For HTTP-based clients, connect is often conceptual
        console.info("[ChatterboxClient] Connect called (conceptual for HTTP).");
        // You could add a health check here if your FastAPI server has a /health endpoint
        this.emit('connected');
    }

    disconnect() {
        console.info("[ChatterboxClient] Disconnect called (conceptual for HTTP).");
        if (this.isStreaming) {
            console.warn("[ChatterboxClient Disconnect] Was streaming, marking as not streaming.");
            // Note: Aborting an ongoing fetch is complex and requires AbortController,
            // which should be initiated before the fetch call if needed.
            // For simplicity, we're just flagging it.
            this.isStreaming = false; 
            this.emit('stream_end'); // Emit stream_end if it was abruptly stopped.
        }
        this.emit('disconnected');
    }

    on(eventName, callback) {
        this._eventEmitter.addEventListener(eventName, (event) => callback(event.detail));
    }

    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        this._eventEmitter.dispatchEvent(event);
    }

    // Method to check if client is actively making a request (simplified)
    isStreaming() { // Renamed for clarity vs isConnected
        return this.isStreaming;
    }
    
    isConnected() {
        // For HTTP, this is generally true unless you implement a more robust health check.
        return true; 
    }

    sendEOS() {
        // console.log("[ChatterboxClient] sendEOS called (no-op for HTTP client).");
    }

    // Optional: if you need to adjust voice settings dynamically
    sendVoiceSettings(settings) {
        console.warn("[ChatterboxClient sendVoiceSettings] This client does not currently support dynamic voice setting changes post-construction. Settings:", settings);
        // If your FastAPI supports this, you'd implement an API call here.
        // For now, voice and generation parameters are set at construction or passed to sendText.
        if (settings.voice) this.voice = settings.voice;
        if (settings.exaggeration) this.exaggeration = settings.exaggeration;
        if (settings.cfg_weight) this.cfg_weight = settings.cfg_weight;
        if (settings.temperature) this.temperature = settings.temperature;
        console.log("[ChatterboxClient] Updated settings:", {voice: this.voice, exaggeration: this.exaggeration, cfg_weight: this.cfg_weight, temperature: this.temperature});
    }
}