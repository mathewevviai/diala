"use client";

const DEFAULT_ORPHEUS_VOICE = 'tara'; // Default voice if none specified
const ORPHEUS_MODEL_NAME = 'orpheus';
const ORPHEUS_RESPONSE_FORMAT = 'wav';
const ORPHEUS_DEFAULT_SERVER_URL = 'http://localhost:5005'; // Default, should be configurable

/**
 * OrpheusClient handles TTS requests to a self-hosted Orpheus FastAPI server.
 * It expects the server to have an OpenAI-compatible /v1/audio/speech endpoint.
 */
export class OrpheusClient {
    constructor({ serverUrl = ORPHEUS_DEFAULT_SERVER_URL, voice = DEFAULT_ORPHEUS_VOICE } = {}) {
        this.serverUrl = serverUrl;
        this.voice = voice;
        this.isStreaming = false;
        this._eventEmitter = document.createElement('div');
        console.info(`[OrpheusClient Constructor] Initialized with server: ${this.serverUrl}, voice: ${this.voice}`);
    }

    /**
     * Sends text to the Orpheus FastAPI server to generate speech.
     * @param {string} text The text to synthesize.
     * @param {string|null} voiceOverride Optional voice to use for this specific request.
     * @param {string|null} language Language code (not directly used by Orpheus API, voice implies language).
     */
    async sendText(text, voiceOverride = null, language = null) {
        if (!text || text.trim() === "") {
            console.warn("[OrpheusClient sendText] Attempted to send empty text.");
            this.emit('stream_end');
            return;
        }

        if (this.isStreaming) {
            console.warn("[OrpheusClient sendText] Already streaming. Request ignored.");
            return;
        }

        this.isStreaming = true;
        this.emit('stream_start');
        const currentVoice = voiceOverride || this.voice;
        const endpoint = `${this.serverUrl}/v1/audio/speech`;

        console.log(`[OrpheusClient sendText] Sending to Orpheus: "${text.substring(0,50)}...", Voice: ${currentVoice}`);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: text,
                    model: ORPHEUS_MODEL_NAME,
                    voice: currentVoice,
                    response_format: ORPHEUS_RESPONSE_FORMAT,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[OrpheusClient sendText] Error from Orpheus server: ${response.status} ${response.statusText}`, errorBody);
                this.emit('error', `Orpheus server error: ${response.status} - ${errorBody.substring(0,100)}`);
                this.isStreaming = false;
                this.emit('stream_end');
                return;
            }

            if (!response.body) {
                console.error('[OrpheusClient sendText] No response body from Orpheus server.');
                this.emit('error', 'Orpheus: No response body');
                this.isStreaming = false;
                this.emit('stream_end');
                return;
            }

            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                if (value) {
                    this.emit('audio_chunk', value);
                }
            }
            console.log("[OrpheusClient sendText] Finished streaming audio from Orpheus.");
        } catch (error) {
            console.error("[OrpheusClient sendText] Network or other error:", error);
            this.emit('error', `Orpheus client error: ${error.message}`);
        } finally {
            this.isStreaming = false;
            this.emit('stream_end');
        }
    }

    connect() {
        console.info("[OrpheusClient] Connect called (conceptual for HTTP).");
        this.emit('connected');
    }

    disconnect() {
        console.info("[OrpheusClient] Disconnect called (conceptual for HTTP).");
        if (this.isStreaming) {
            console.warn("[OrpheusClient Disconnect] Was streaming, marking as not streaming.");
            this.isStreaming = false;
            this.emit('stream_end');
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

    // Stub for API consistency
    isConnected() {
        return true; // HTTP clients are 'always connected' conceptually
    }

    // Stub for API consistency
    sendEOS() {
        // console.log("[OrpheusClient] sendEOS called (no-op for HTTP client).");
    }
} 