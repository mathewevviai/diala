"use client";

const DIA_DEFAULT_API_BASE_URL = 'http://localhost:8882/v1'; // Default for Dia service

export class DiaTTSClient {
    constructor({
        apiBaseUrl         = DIA_DEFAULT_API_BASE_URL,
        model              = "dia-standard", // Example model for Dia
        voice              = "dia-voice-1",  // Example voice for Dia
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

        console.info(`[DiaTTSClient] Initialized. API Base URL: ${this.apiBaseUrl}`);
    }

    async sendText(text) {
        if (this.isStreaming) {
            console.warn("[DiaTTSClient sendText] Already streaming. Request ignored.");
            return;
        }
        if (!text || text.trim() === "") {
            console.warn("[DiaTTSClient sendText] Text is empty. Request ignored.");
            this.emit('stream_end');
            return;
        }

        this.isStreaming = true;
        this.emit('stream_start');
        console.log(`[DiaTTSClient sendText] Sending text to Dia-Service (/audio/speech): "${text}"`);

        const url = `${this.apiBaseUrl}/audio/speech`;

        const requestBody = {
            model:           this.model,
            text:            text,
            voice:           this.voice,
            response_format: this.responseFormat,
            speed:           this.speed,
            stream:          true,
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
                console.error(`[DiaTTSClient sendText] Dia-Service error: ${response.status} ${response.statusText} - ${errorBody}`);
                throw new Error(`Dia-Service request failed: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            if (!response.body) {
                console.error("[DiaTTSClient sendText] No response body from Dia-Service.");
                throw new Error("No body in TTS response from Dia-Service.");
            }

            console.log("[DiaTTSClient sendText] Received response. Streaming audio chunks.");

            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    this.emit('audio_chunk', value);
                }
            }

        } catch (error) {
            console.error("[DiaTTSClient sendText] Fetch Error:", error);
            this.emit('error', error.message || 'Unknown error during Dia TTS request.');
        } finally {
            this.isStreaming = false;
            this.emit('stream_end');
            console.log("[DiaTTSClient sendText] Finalized Dia TTS request cycle.");
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
        // console.log("[DiaTTSClient] sendEOS called (no-op for HTTP-based client).");
    }
} 