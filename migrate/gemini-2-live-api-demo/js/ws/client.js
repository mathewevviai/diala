/**
 * Client for interacting with the Gemini 2.0 Flash Multimodal Live API via WebSockets.
 * This class handles the connection, sending and receiving messages, and processing responses.
 * 
 * @extends EventEmitter
 */
import { EventEmitter } from 'https://cdn.skypack.dev/eventemitter3';
import { blobToJSON } from '../utils/utils.js';

export class GeminiWebsocketClient extends EventEmitter {
    /**
     * Creates a new GeminiWebsocketClient with the given configuration.
     * @param {string} name - Name for the websocket client.
     * @param {string} url - URL for the Gemini API that contains the API key at the end.
     * @param {Object} config - Configuration object for the Gemini API.
     */
    constructor(name, url, config) {
        super();
        this.name = name || 'WebSocketClient';
        this.url = url || `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        this.ws = null;
        this.config = config;
        this.isConnecting = false;
        this.connectionPromise = null;
    }

    /**
     * Establishes a WebSocket connection and initializes the session with a configuration.
     * @returns {Promise} Resolves when the connection is established and setup is complete
     */
    async connect() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return this.connectionPromise;
        }

        if (this.isConnecting) {
            return this.connectionPromise;
        }

        console.info('🔗 Establishing WebSocket connection...');
        this.isConnecting = true;
        this.connectionPromise = new Promise((resolve, reject) => {
            const ws = new WebSocket(this.url);

            // Send setup message upon successful connection
            ws.addEventListener('open', () => {
                console.info('🔗 Successfully connected to websocket');
                this.ws = ws;
                this.isConnecting = false;

                // Configure
                console.info("[GeminiWebsocketClient] BEFORE sending setup JSON. Config object:", this.config);
                this.sendJSON({ setup: this.config });
                console.info("[GeminiWebsocketClient] AFTER sending setup JSON.");
                resolve();
            });

            // Handle connection errors
            ws.addEventListener('error', (errorEvent) => {
                console.error(`[${this.name}] WebSocket error:`, errorEvent);
            });

            // Listen for incoming messages, expecting Blob data for binary streams
            ws.addEventListener('message', async (event) => {
                if (event.data instanceof Blob) {
                    this.receive(event.data);
                } else {
                    console.error('Non-blob message received', event);
                }
            });

            // Handle connection closure
            ws.addEventListener('close', (closeEvent) => {
                console.warn(`[${this.name}] WebSocket connection closed. Code: ${closeEvent.code}, Reason: "${closeEvent.reason}", WasClean: ${closeEvent.wasClean}`);
                const wasConnected = !!this.ws;
                this.ws = null;
                this.isConnecting = false;
                this.connectionPromise = null;
                this.emit('disconnected', { code: closeEvent.code, reason: closeEvent.reason, wasClean: closeEvent.wasClean });

                if (wasConnected && !closeEvent.wasClean) {
                    console.error(`[${this.name}] Unexpected WebSocket closure.`);
                    reject(new Error(`WebSocket closed unexpectedly. Code: ${closeEvent.code}, Reason: ${closeEvent.reason}`));
                } else if (!wasConnected && !this.isConnecting) {
                    reject(new Error(`WebSocket failed to open and closed. Code: ${closeEvent.code}, Reason: ${closeEvent.reason}`));
                }
            });
        });

        return this.connectionPromise;
    }

    disconnect() {
        if (this.ws) {
            console.info(`[${this.name}] Initiating disconnect from websocket...`);
            this.ws.close(1000, "Client initiated disconnect");
        } else {
            console.info(`[${this.name}] Disconnect called but no active WebSocket connection.`);
        }
        this.ws = null;
        this.isConnecting = false;
        this.connectionPromise = null;
    }

    /**
     * Processes incoming WebSocket messages.
     * Handles various response types including tool calls, setup completion,
     * and content delivery (text).
     */
    async receive(blob) {
        const response = await blobToJSON(blob);
        console.log(`%%%% [${this.name} receive] Raw API Response: %%%%`, response);
        
        // Handle tool call responses
        if (response.toolCall) {
            console.debug(`${this.name} received tool call`, response);       
            this.emit('tool_call', response.toolCall);
            return;
        }

        // Handle tool call cancellation
        if (response.toolCallCancellation) {
            console.debug(`${this.name} received tool call cancellation`, response);
            this.emit('tool_call_cancellation', response.toolCallCancellation);
            return;
        }

        // Process server content (text/audio/interruptions)
        if (response.serverContent) {
            const { serverContent } = response;
            if (serverContent.interrupted) {
                console.debug(`${this.name} is interrupted`);
                this.emit('interrupted');
                return;
            }
            if (serverContent.turnComplete) {
                console.debug(`${this.name} has completed its turn`);
                this.emit('turn_complete');
                return;
            }
            if (serverContent.modelTurn) {
                console.debug(`${this.name} raw modelTurn received:`, serverContent.modelTurn);
                let parts = serverContent.modelTurn.parts || [];
                const textParts = parts.filter(p => typeof p.text === 'string' && p.text.trim() !== ""); 
                if (textParts.length > 0) {
                    const combinedText = textParts.map(p => p.text).join(' '); 
                    console.log(`%%%% [${this.name} receive] Emitting text_chunk (token): %%%%`, combinedText);
                    this.emit('text_chunk', combinedText);
                } else {
                    // console.debug(`${this.name} received modelTurn without usable text parts:`, parts);
                }
            } else if (serverContent.error) {
                console.error(`${this.name} received server error:`, serverContent.error);
                this.emit('error', { type: 'gemini_server_error', details: serverContent.error });
            } else {
                // This block will catch cases where serverContent is present but isn't one of the handled types
                console.warn(`${this.name} received serverContent with unhandled structure:`, serverContent);
            }
        } else {
            console.debug(`${this.name} received unmatched message:`, response);
        }
    }

    /**
     * Sends encoded audio chunk to the Gemini API.
     * 
     * @param {string} base64audio - The base64 encoded audio string.
     */
    async sendAudio(base64audio) {
        const data = { realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm', data: base64audio }] } };
        await this.sendJSON(data);
        // console.debug(`Sending audio chunk to ${this.name}.`); // Reduce logging
    }

    /**
     * Sends encoded image to the Gemini API.
     * 
     * @param {string} base64image - The base64 encoded image string.
     */
    async sendImage(base64image) {
        const data = { realtimeInput: { mediaChunks: [{ mimeType: 'image/jpeg', data: base64image }] } };
        await this.sendJSON(data);
        console.debug(`Image with a size of ${Math.round(base64image.length/1024)} KB was sent to the ${this.name}.`);
    }

    /**
     * Sends a text message to the Gemini API.
     * 
     * @param {string} text - The text to send to Gemini.
     * @param {boolean} endOfTurn - If false model will wait for more input without sending a response.
     */
    async sendText(text, endOfTurn = true) {
        const clientContentPayload = { 
            clientContent: { 
                turns: [{
                    role: 'user', 
                    parts: [{ text: text }]
                }], 
                turnComplete: endOfTurn 
            } 
        };
        // Send the clientContentPayload directly, not wrapped in another object
        await this.sendJSON(clientContentPayload); 
        console.debug(`Text sent to ${this.name}:`, text);
    }
    /**
     * Sends the result of the tool call to Gemini.
     * @param {Object} toolResponse - The response object
     * @param {any} toolResponse.output - The output of the tool execution (string, number, object, etc.)
     * @param {string} toolResponse.id - The identifier of the tool call from toolCall.functionCalls[0].id
     * @param {string} toolResponse.error - Send the output as null and the error message if the tool call failed (optional)
     */
    async sendToolResponse(toolResponse) {
        if (!toolResponse || !toolResponse.id) {
            throw new Error('Tool response must include an id');
        }

        const { output, id, error } = toolResponse;
        let result = [];

        if (error) {
            result = [{
                response: { error: error },
                id
            }];
        } else if (output === undefined) {
            throw new Error('Tool response must include an output when no error is provided');
        } else {
            result = [{
                response: { output: output },
                id
            }];
        }

        await this.sendJSON({ toolResponse: {functionResponses: result} });
        console.debug(`Tool response sent to ${this.name}:`, toolResponse);
    }

    /**
     * Sends a JSON object to the Gemini API.
     * 
     * @param {Object} json - The JSON object to send.
     */

    async sendJSON(json) {        
        try {
            this.ws.send(JSON.stringify(json));
            // console.debug(`JSON Object was sent to ${this.name}:`, json);
        } catch (error) {
            throw new Error(`Failed to send ${json} to ${this.name}:` + error);
        }
    }
}
