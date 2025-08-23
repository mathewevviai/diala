/**
 * Establishes a websocket connection to Deepgram API
 * for real-time audio transcription.
 * Handles KeepAlive internally.
 */
// export class DeepgramTranscriber {
//     constructor(apiKey, sampleRate) {
//         this.apiKey = apiKey;
//         this.ws = null;
//         this.isConnected = false;
//         this.eventListeners = new Map();
//         this.sampleRate = sampleRate;
//         this.keepAliveIntervalId = null; // Added for KeepAlive management
//         console.info('DeepgramTranscriber initialized');
//     }

//     async connect() {
//         // Prevent multiple connection attempts
//         if (this.ws || this.isConnected) {
//             console.warn("DeepgramTranscriber: Already connected or connecting.");
//             return;
//         }

//         try {
//             const url = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=${this.sampleRate}`;
//             console.info('Attempting to connect to Deepgram WebSocket...');

//             // Create WebSocket with authorization in protocol
//             this.ws = new WebSocket(url, ['token', this.apiKey]);
//             this.ws.binaryType = 'arraybuffer';

//             this.ws.onopen = () => {
//                 this.isConnected = true;
//                 console.info('Deepgram WebSocket connection established');

//                 const config = {
//                     type: 'Configure',
//                     features: {
//                         model: 'nova-2', // Consider making configurable if needed
//                         language: 'en-US',
//                         encoding: 'linear16',
//                         sample_rate: this.sampleRate,
//                         channels: 1,
//                         interim_results: false,
//                         punctuate: true,
//                         endpointing: 800 // Adjust if needed
//                     },
//                 };

//                 console.debug('Sending Deepgram configuration:', config);
//                 this.ws.send(JSON.stringify(config));

//                 // ** Start KeepAlive interval **
//                 this.startKeepAlive();

//                 this.emit('connected');
//             };

//             this.ws.onmessage = (event) => {
//                 try {
//                     const response = JSON.parse(event.data);
//                     if (response.type === 'Results') {
//                         const transcript = response.channel?.alternatives[0]?.transcript;
//                         if (transcript && transcript.trim() !== "") { // Ensure transcript is not empty
//                             this.emit('transcription', transcript);
//                         }
//                     } else if (response.type === 'Metadata') {
//                         // console.debug('Received Deepgram Metadata:', response);
//                     } else if (response.type === 'SpeechStarted') {
//                          // console.debug('Deepgram SpeechStarted');
//                     } else if (response.type === 'UtteranceEnd') {
//                          // console.debug('Deepgram UtteranceEnd');
//                     } else {
//                         // console.debug('Received other Deepgram message:', response.type);
//                     }
//                 } catch (error) {
//                     console.error('Error processing Deepgram WebSocket message:', error);
//                     this.emit('error', error);
//                 }
//             };

//             this.ws.onerror = (error) => {
//                 console.error('Deepgram WebSocket error:', error);
//                 this.stopKeepAlive(); // Stop KeepAlive on error
//                 this.isConnected = false; // Ensure state is updated
//                 this.emit('error', error);
//                 // Consider attempting reconnect or notifying user more explicitly
//             };

//             this.ws.onclose = (event) => {
//                 console.info(`Deepgram WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
//                 this.stopKeepAlive(); // Stop KeepAlive on close
//                 this.isConnected = false;
//                 this.ws = null; // Nullify reference
//                 this.emit('disconnected');
//             };

//         } catch (error) {
//             console.error('Error in Deepgram connect():', error);
//             this.stopKeepAlive(); // Ensure KeepAlive stops if connect throws error early
//             this.isConnected = false;
//             this.ws = null;
//             throw error;
//         }
//     }

//     // ** Method to start KeepAlive **
//     startKeepAlive() {
//         this.stopKeepAlive(); // Clear any existing interval first
//         this.keepAliveIntervalId = setInterval(() => {
//             if (this.ws && this.ws.readyState === WebSocket.OPEN) {
//                 // console.debug('Sending Deepgram KeepAlive');
//                 this.ws.send(JSON.stringify({ type: 'KeepAlive' }));
//             } else {
//                 console.warn('Deepgram KeepAlive: WebSocket not open, stopping interval.');
//                 this.stopKeepAlive();
//             }
//         }, 8000); // Send every 8 seconds (safer than 10)
//          console.info('Deepgram KeepAlive interval started.');
//     }

//     // ** Method to stop KeepAlive **
//     stopKeepAlive() {
//         if (this.keepAliveIntervalId) {
//             clearInterval(this.keepAliveIntervalId);
//             this.keepAliveIntervalId = null;
//              console.info('Deepgram KeepAlive interval stopped.');
//         }
//     }

//     sendAudio(audioData) { // Expects ArrayBuffer or similar binary type
//         if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
//             // console.warn('Deepgram WebSocket is not connected or ready, cannot send audio.');
//             // Throwing an error might be too disruptive if it happens transiently.
//             // Consider queuing or just warning.
//              return; // Silently fail for now, or queue if complex buffering is needed
//             // throw new Error('Deepgram WebSocket is not connected');
//         }
//         // Here, we assume audioData is already in the correct binary format (e.g., ArrayBuffer)
//         this.ws.send(audioData);
//         // Maybe reset a timer here if implementing conditional KeepAlive later
//     }

//     disconnect() {
//         console.info('DeepgramTranscriber disconnect called.');
//         this.stopKeepAlive(); // Stop KeepAlive first
//         if (this.ws) {
//             // Send CloseStream message if the connection is open
//             if (this.ws.readyState === WebSocket.OPEN) {
//                 try {
//                     this.ws.send(JSON.stringify({ type: 'CloseStream' }));
//                 } catch (e) {
//                     console.warn("Error sending CloseStream:", e.message);
//                 }
//             }
//             // Close the WebSocket connection regardless of state (closing/closed is no-op)
//             this.ws.close(1000, "Client initiated disconnect"); // 1000 is normal closure
//             this.ws = null; // Nullify reference
//         }
//         this.isConnected = false; // Ensure state is updated
//     }

//     on(eventName, callback) {
//         if (!this.eventListeners.has(eventName)) {
//             this.eventListeners.set(eventName, []);
//         }
//         this.eventListeners.get(eventName).push(callback);
//     }

//     off(eventName, callbackToRemove) {
//         const listeners = this.eventListeners.get(eventName);
//         if (listeners) {
//             this.eventListeners.set(
//                 eventName,
//                 listeners.filter(callback => callback !== callbackToRemove)
//             );
//         }
//     }

//     emit(eventName, data) {
//         const listeners = this.eventListeners.get(eventName);
//         if (listeners) {
//             listeners.forEach(callback => {
//                 try {
//                     callback(data);
//                 } catch(e) {
//                      console.error(`Error in DeepgramTranscriber listener for ${eventName}:`, e);
//                 }
//             });
//         }
//     }
// }
