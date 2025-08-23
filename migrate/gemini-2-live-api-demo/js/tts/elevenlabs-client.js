// js/tts/elevenlabs-client.js
// @ts-nocheck
"use client"

// ElevenLabsClient: Streams TTS audio from ElevenLabs via WebSocket
export class ElevenLabsClient {
    constructor({ apiKey, voiceId, modelId, outputSampleRate }) {
        this.apiKey = apiKey;
        this.voiceId = voiceId;
        this.modelId = modelId;
        this.outputSampleRate = outputSampleRate;
        this.ws = null;
        this.isConnected = false; // Flag set ONLY after successful connect AND initial message send
        this.isConnecting = false; // Flag to prevent multiple connection attempts
        this.eventListeners = new Map();
        console.info(`[ElevenLabsClient] Initialized. API Key Present: ${!!this.apiKey}, Voice ID: ${this.voiceId}, Model ID: ${this.modelId}, Sample Rate: ${this.outputSampleRate}`);
        this.currentVoiceSettings = { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: false, speed: 0.5 }; // Store current settings, default speed to 0.9
    }

    async connect() {
        if (this.isConnected || this.isConnecting) {
            console.warn(`[ElevenLabsClient connect] Already connected or connecting. State: isConnected=${this.isConnected}, isConnecting=${this.isConnecting}`);
            return; // Or return existing connection promise if needed
        }
        
        this.isConnecting = true;
        console.info(`[ElevenLabsClient] Attempting to connect to WebSocket with URI: wss://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream-input?model_id=${this.modelId}&output_format=pcm_${this.outputSampleRate}`);
        
        if (!this.apiKey) {
            console.error("[ElevenLabsClient] Cannot connect: API Key is missing.");
            this.isConnecting = false;
            this.emit('error', new Error("ElevenLabs API Key is missing."));
            throw new Error("ElevenLabs API Key is missing.");
        }
        
        const ttsUri = `wss://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream-input?model_id=${this.modelId}&output_format=pcm_${this.outputSampleRate}`;
        
        return new Promise((resolve, reject) => {
            try {
                // Clear previous listeners if reusing the instance (safer to create new instance though)
                if(this.ws) {
                    this.ws.onopen = null;
                    this.ws.onmessage = null;
                    this.ws.onerror = null;
                    this.ws.onclose = null;
                }
                this.ws = new WebSocket(ttsUri);
            } catch (e) {
                console.error("%%%% [ElevenLabsClient] ERROR INSTANTIATING WEBSOCKET: %%%%", e);
                this.isConnecting = false;
                this.emit('error', e);
                reject(e);
                return;
            }
            
            this.ws.binaryType = 'arraybuffer';

            const handleOpen = () => {
                 // Use setTimeout to slightly delay sending after open event
                 setTimeout(() => {
                    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                        console.warn(`%%%% [ElevenLabsClient ONOPEN Timeout] WebSocket no longer open (state: ${this.ws?.readyState}). Cannot send initial config. %%%%`);
                        this.isConnecting = false;
                        if (!this.isConnected) { // Only reject if we never fully connected
                           reject(new Error("WebSocket closed or state changed before initial config could be sent."));
                        }
                        return;
                    }
                    
                    console.info('[ElevenLabsClient] WebSocket connection established (onopen fired, after timeout). WS ReadyState:', this.ws.readyState);
                    const initialConfig = {
                        text: " ", 
                        voice_settings: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: false },
                        generation_config: { chunk_length_schedule: [50, 90, 120, 150, 200] },
                        xi_api_key: this.apiKey,
                    };
                    try {
                        console.log("%%%% [ElevenLabsClient ONOPEN Timeout] About to send initial config. WS ReadyState:", this.ws.readyState, "%%%%");
                        this.ws.send(JSON.stringify(initialConfig));
                        console.debug('[ElevenLabsClient] Sent initial config:', initialConfig);
                        this.isConnected = true; // Mark as connected AFTER successful initial send
                        this.isConnecting = false;
                        this.emit('connected');
                        resolve(); // Resolve the promise HERE
                    } catch (e) {
                        console.error('%%%% [ElevenLabsClient ONOPEN Timeout] Error sending initial config: %%%%', e);
                        this.isConnecting = false;
                        this.isConnected = false; 
                        this.emit('error', e);
                        reject(e); // Reject connect promise
                        // Clean up the failed socket
                        if (this.ws) {
                            this.ws.close(1011, "Error sending initial config");
                            this.ws = null;
                        }
                    }
                 }, 20); // 20ms delay - adjust if needed
            };

            const handleMessage = (event) => {
                if (!this.isConnected) {
                    // console.warn("[ElevenLabsClient ONMESSAGE] Received message but not connected flag is false. Ignoring.");
                    // This can happen if messages arrive before the 'connected' flag is set after the timeout in onopen
                    // Or if disconnect was called but messages are still arriving.
                    // It might be safer to process audio anyway if ws is open.
                    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return; // Definitely ignore if socket isn't open
                }

                if (event.data instanceof ArrayBuffer) { 
                    console.log(`%%%% [ElevenLabsClient ONMESSAGE] Received audio_chunk (ArrayBuffer), size: ${event.data.byteLength} bytes. %%%%`);
                    this.emit('audio_chunk', event.data);
                    // console.log('%%%% [ElevenLabsClient ONMESSAGE] Successfully emitted audio_chunk event. %%%%');
                } else { 
                    try {
                        const msg = JSON.parse(event.data);
                        // console.log('%%%% [ElevenLabsClient ONMESSAGE] Received JSON message:', msg, '%%%%');
                        
                        if (msg.audio && typeof msg.audio === 'string') { // Check for base64 string
                            console.log(`%%%% [ElevenLabsClient ONMESSAGE] Received audio_chunk (base64), size: ${msg.audio.length} chars. %%%%`);
                            const audioData = this.base64ToArrayBuffer(msg.audio); 
                            if (audioData) { // Ensure conversion succeeded
                                this.emit('audio_chunk', audioData);
                                // console.log('%%%% [ElevenLabsClient ONMESSAGE] Successfully emitted audio_chunk event. %%%%');
                            }
                        } else if (msg.isFinal === true || (msg.alignment && msg.alignment.is_final_alignment === true)) {
                            console.log('%%%% [ElevenLabsClient ONMESSAGE] Received isFinal/EOS message. %%%%', msg);
                            this.emit('stream_end');
                        } else if (msg.error) {
                            console.error('[ElevenLabsClient ONMESSAGE] Received error message from server:', msg.error);
                            this.emit('error', new Error(msg.error));
                        } else if (msg.message && msg.message.includes("Input text was empty")) {
                            // console.info('[ElevenLabsClient ONMESSAGE] Received informational: Input text was empty.');
                        } else if (Object.keys(msg).length > 0 && !msg.audio){ // Log other non-empty, non-audio messages
                           console.log('%%%% [ElevenLabsClient ONMESSAGE] Received unhandled info JSON message: %%%%', msg);
                           this.emit('info', msg);
                        }
                    } catch (e) {
                        console.error('[ElevenLabsClient ONMESSAGE] Error parsing JSON message or processing base64 audio:', e, 'Raw data:', event.data);
                        this.emit('error', e);
                    }
                }
            };

            const handleError = (errEvent) => { 
                console.error('%%%% [ElevenLabsClient ONERROR] WebSocket error event: %%%%', errEvent);
                const error = new Error(`WebSocket error occurred. Type: ${errEvent.type || 'Unknown'}`);
                this.isConnected = false;
                this.isConnecting = false;
                this.emit('error', error);
                reject(error); // Reject the connection promise if connecting
            };
            
            const handleClose = (event) => {
                const wasConnected = this.isConnected;
                this.isConnected = false;
                this.isConnecting = false; // Ensure connecting flag is also false
                console.info(`[ElevenLabsClient ONCLOSE] WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}, WasConnected: ${wasConnected}`);
                this.emit('disconnected', { code: event.code, reason: event.reason, wasClean: event.wasClean });
                
                // If it closes before 'connected' flag was set (i.e. during connection attempt), reject.
                if (!wasConnected && event.target === this.ws) { 
                    console.warn("[ElevenLabsClient ONCLOSE] Closed before connection was fully established.");
                    reject(new Error(`WebSocket closed before connection could be fully established. Code: ${event.code}, Reason: ${event.reason}`));
                }
                // Nullify ws reference after close handler finishes
                 if (event.target === this.ws) {
                    this.ws = null; 
                 }
            };

            // Assign handlers
            this.ws.onopen = handleOpen;
            this.ws.onmessage = handleMessage;
            this.ws.onerror = handleError;
            this.ws.onclose = handleClose;

        });
    }

    sendText(text) {
        console.log("%%%% [ElevenLabsClient sendText] ENTERED. About to check WebSocket state. %%%%");
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log("%%%% [ElevenLabsClient sendText] WebSocket IS OPEN. Attempting to send. %%%%");
            try {
                const payload = JSON.stringify({
                    text,
                    try_trigger_generation: false // Set to false unless it's the very last piece of text for a sentence? Maybe true is fine. Test.
                });
                // console.debug(`[ElevenLabsClient sendText] Payload to send: ${payload}`);
                this.ws.send(payload);
                console.log("%%%% [ElevenLabsClient sendText] SUCCESSFULLY CALLED ws.send(). Text: %%%%", text);
            } catch (e) {
                console.error("%%%% [ElevenLabsClient sendText] ERROR DURING ws.send() or JSON.stringify(): %%%%", e);
                console.error("Error stack:", e.stack);
            }
        } else {
            console.warn("%%%% [ElevenLabsClient sendText] WebSocket NOT OPEN or ws is null. %%%%");
            if (this.ws) {
                console.warn(`[ElevenLabsClient sendText] WS ReadyState: ${this.ws.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`);
            } else {
                console.warn("[ElevenLabsClient sendText] this.ws is NULL.");
            }
        }
    }

    sendVoiceSettings(settings) {
        console.log("%%%% [ElevenLabsClient sendVoiceSettings] ENTERED. About to check WebSocket state. %%%%");
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log("%%%% [ElevenLabsClient sendVoiceSettings] WebSocket IS OPEN. Attempting to send settings. %%%%");
            try {
                // Merge new settings with current settings
                this.currentVoiceSettings = { ...this.currentVoiceSettings, ...settings };
                const payload = JSON.stringify({ voice_settings: this.currentVoiceSettings });
                console.debug(`[ElevenLabsClient sendVoiceSettings] Payload to send: ${payload}`);
                this.ws.send(payload);
                console.log("%%%% [ElevenLabsClient sendVoiceSettings] SUCCESSFULLY CALLED ws.send() for settings. %%%%");
            } catch (e) {
                console.error("%%%% [ElevenLabsClient sendVoiceSettings] ERROR DURING ws.send() or JSON.stringify(): %%%%", e);
                console.error("Error stack:", e.stack);
            }
        } else {
            console.warn("%%%% [ElevenLabsClient sendVoiceSettings] WebSocket NOT OPEN or ws is null. Cannot send settings. %%%%");
            if (this.ws) {
                console.warn(`[ElevenLabsClient sendVoiceSettings] WS ReadyState: ${this.ws.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`);
            } else {
                console.warn("[ElevenLabsClient sendVoiceSettings] this.ws is NULL.");
            }
        }
    }

    sendEOS() {
        console.log("%%%% [ElevenLabsClient sendEOS] ENTERED. %%%%");
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.info('[ElevenLabsClient sendEOS] Sending EOS (empty string text).');
            try {
                this.ws.send(JSON.stringify({ text: "" }));
                console.log("%%%% [ElevenLabsClient sendEOS] SUCCESSFULLY CALLED ws.send() for EOS. %%%%");
            } catch (e) {
                console.error('%%%% [ElevenLabsClient sendEOS] Error sending EOS: %%%%', e);
            }
        } else {
            console.warn('%%%% [ElevenLabsClient sendEOS] Attempted to send EOS, but WebSocket not open or ws is null. %%%%');
             if (this.ws) {
                console.warn(`[ElevenLabsClient sendEOS] WS ReadyState: ${this.ws.readyState}`);
            } else {
                console.warn("[ElevenLabsClient sendEOS] this.ws is NULL.");
            }
        }
    }

    disconnect() {
        console.log("%%%% [ElevenLabsClient disconnect] ENTERED. %%%%");
        if (this.isConnecting) {
             console.warn("[ElevenLabsClient disconnect] Called while still connecting. Attempting to close anyway.");
        }
        if (this.ws) {
            const currentWs = this.ws; // Capture current instance
             this.ws = null; // Nullify immediately to prevent race conditions
             this.isConnected = false;
             this.isConnecting = false;

            console.info('[ElevenLabsClient disconnect] Disconnecting WebSocket...');
            if (currentWs.readyState === WebSocket.OPEN) {
                this.sendEOS(); // Try sending EOS using the captured instance
                // Close slightly after EOS attempt
                setTimeout(() => {
                    if (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CLOSING) {
                         currentWs.close(1000, "Client initiated disconnect");
                         console.log("%%%% [ElevenLabsClient disconnect] Called close() after EOS. %%%%");
                    } else {
                         console.log(`%%%% [ElevenLabsClient disconnect] Socket state changed before close could be called after EOS (state: ${currentWs.readyState}). %%%%`);
                    }
                }, 50); 
            } else if (currentWs.readyState === WebSocket.CONNECTING) {
                console.info('[ElevenLabsClient disconnect] WebSocket was in CONNECTING state. Closing.');
                currentWs.close(1000, "Client initiated disconnect during connection attempt");
            } else {
                 console.info(`[ElevenLabsClient disconnect] WebSocket not OPEN or CONNECTING (state: ${currentWs.readyState}). Already closed or closing.`);
            }
        } else {
            console.info("[ElevenLabsClient disconnect] No WebSocket instance (this.ws is null). Already disconnected or never connected.");
            this.isConnected = false;
            this.isConnecting = false;
        }
    }

    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }

    emit(eventName, data) {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            listeners.forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error(`[ElevenLabsClient] Error in event listener for ${eventName}:`, e);
                }
            });
        }
    }

    base64ToArrayBuffer(base64) {
        try {
            const binary_string = window.atob(base64);
            const len = binary_string.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        } catch(e) {
            console.error("[ElevenLabsClient base64ToArrayBuffer] Failed:", e);
            return null;
        }
    }
}
