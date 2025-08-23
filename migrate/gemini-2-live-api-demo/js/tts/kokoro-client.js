"use client";

const KOKORO_DEFAULT_API_BASE_URL = 'http://localhost:8880/v1'; // Default, make this configurable

export class KokoroTTSClient {
    constructor({
        apiBaseUrl         = KOKORO_DEFAULT_API_BASE_URL,
        model              = "kokoro",
        voice              = "af_heart",
        responseFormat     = "pcm",
        speed              = 1.0,
        normalizationOptions
    } = {}) {
        this.apiBaseUrl = apiBaseUrl;
        this.model = model;
        this.voice = voice;
        this.responseFormat = responseFormat;
        this.speed = speed;
        this.normalizationOptions = normalizationOptions;
        this._eventEmitter = document.createElement('div');
        this.isStreaming = false;

        console.info(`[KokoroTTSClient] Initialized. API Base URL: ${this.apiBaseUrl}`);
    }

    async sendText(text, language = 'EN') {
        if (this.isStreaming) {
            console.warn("[KokoroTTSClient sendText] Already streaming. Request ignored.");
            return;
        }
        if (!text || text.trim() === "") {
            console.warn("[KokoroTTSClient sendText] Text is empty. Request ignored.");
            this.emit('stream_end');
            return;
        }

        this.isStreaming = true;
        this.emit('stream_start');
        console.log(`[KokoroTTSClient sendText] Sending text to Kokoro-FastAPI (/audio/speech): "${text}"`);

        const url = `${this.apiBaseUrl}/audio/speech`;

        const requestBody = {
            model:           this.model,
            input:           text,
            voice:           this.voice,
            response_format: this.responseFormat,
            speed:           this.speed,
            stream:          true,
            language:        language
        };
        if (this.normalizationOptions) {
            requestBody.normalization_options = this.normalizationOptions;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': `audio/${this.responseFormat}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[KokoroTTSClient sendText] Kokoro-FastAPI error: ${response.status} ${response.statusText} - ${errorBody}`);
                throw new Error(`Kokoro-FastAPI request failed: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            if (!response.body) {
                console.error("[KokoroTTSClient sendText] No response body from Kokoro-FastAPI.");
                throw new Error("No body in TTS response.");
            }

            console.log("[KokoroTTSClient sendText] Received response. Streaming audio chunks.");

            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    this.emit('audio_chunk', value);
                    console.log(`[KokoroTTSClient sendText] Emitted audio chunk of size ${value.length}`);
                }
            }

        } catch (error) {
            console.error("[KokoroTTSClient sendText] Fetch Error:", error);
            this.emit('error', error.message || 'Unknown error during TTS request.');
        } finally {
            this.isStreaming = false;
            this.emit('stream_end');
            console.log("[KokoroTTSClient sendText] Finalized TTS request cycle.");
        }
    }

    on(eventName, callback) {
        this._eventEmitter.addEventListener(eventName, (event) => callback(event.detail));
    }

    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        this._eventEmitter.dispatchEvent(event);
    }

    isConnected() {
        return true;
    }

    sendEOS() {
        // console.log("[KokoroTTSClient] sendEOS called (no-op for HTTP client).");
    }
} 
