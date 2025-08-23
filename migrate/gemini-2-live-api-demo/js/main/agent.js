console.log('%%%%% Executing agent.js - Top Level Test - v7 (Chatterbox Fallback) %%%%%'); // Updated version

/**
 * Core application class that orchestrates the interaction between various components
 * of the Gemini 2.0 Flash Multimodal Live API. Manages audio streaming, WebSocket communication, audio transcription,
 * and coordinates the overall application functionality.
 */
import { GeminiWebsocketClient } from '../ws/client.js';

import { AudioRecorder } from '../audio/recorder.js';
import { AudioStreamer } from '../audio/streamer.js';
import { AudioVisualizer } from '../audio/visualizer.js';
import { CameraManager } from '../camera/camera.js';
import { ScreenManager } from '../screen/screen.js';
import { ElevenLabsClient } from '../tts/elevenlabs-client.js';
// import { KokoroTTSClient } from '../tts/kokoro-client.js'; // Commented out
// import { DiaTTSClient } from '../tts/dia-client.js';       // Commented out
// import { OrpheusClient } from '../tts/orpheus-client.js';   // Commented out
import { ChatterboxClient } from '../tts/chatterbox-client.js';
import { ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID, ELEVENLABS_OUTPUT_SAMPLERATE } from '../config/config.js';

export class GeminiAgent{
    constructor({
        name = 'Alex',
        url,
        config,
        elevenLabsApiKey = null,
        transcribeUsersSpeech = false,
        modelSampleRate = 24000, // Matched to ElevenLabs/Chatterbox
        toolManager = null,
        tickedTillOverview = '',
        salesTechniquesData = [],
        regionalData = {},
        // useDiaClientInitially = false,    // Commented out
        // diaClientConfig = {},           // Commented out
        // useOrpheusInitially = false,  // Commented out
        // orpheusClientConfig = {},     // Commented out
        useChatterboxInitially = false, // Keep this, can be true by default
        chatterboxClientConfig = {}     // Default config for Chatterbox
    } = {}) {
        if (!url) throw new Error('WebSocket URL is required');
        if (!config) throw new Error('Config is required');

        this.initialized = false;
        this.connected = false;

        this.geminiTurnCompleted = false;
        this.elevenLabsStreamEndedForTurn = false;
        this.elevenLabsHeartbeatIntervalId = null;

        // this.KokoroStreamEndedForTurn = false; // Commented out
        // this.useKokoroFallback = true; // Commented out, Chatterbox is now the primary fallback

        // this.diaStreamEndedForTurn = false; // Commented out
        // this.useDiaClient = useDiaClientInitially; // Commented out

        // this.orpheusStreamEndedForTurn = false; // Commented out
        // this.useOrpheusClient = useOrpheusInitially; // Commented out

        this.currentTurnTextAccumulator = '';
        this.interruptionPointText = '';
        // this.kokoroFallbackActivatedMidTurn = false; // Commented out

        this.chatterboxStreamEndedForTurn = false;
        this.useChatterboxClient = useChatterboxInitially; // This will determine if Chatterbox is primary
        this.chatterboxFallbackActivatedMidTurn = false; // New flag for Chatterbox

        // this.kokoroAggressiveSendTimer = null; // Commented out
        // this.KOKORO_AGGRESSIVE_SEND_TIMEOUT_MS = 500; // Commented out

        this.currentLanguage = 'EN';
        this.partialLangTagBuffer = '';

        this.audioContext = null;
        this.audioRecorder = new AudioRecorder({ targetSampleRate: this.modelSampleRate });
        this.audioStreamer = null;
        this.visualizer = null;

        this.transcribeUsersSpeech = transcribeUsersSpeech;
        this.modelSampleRate = modelSampleRate;

        this.elevenLabsApiKey = elevenLabsApiKey;
        console.info('[Agent Constructor] elevenLabsApiKey received:', this.elevenLabsApiKey ? 'Exists' : 'MISSING');

        // --- DETERMINE PRIMARY TTS ---
        if (this.elevenLabsApiKey) {
            console.info('[Agent Constructor] ElevenLabs API Key provided. ElevenLabs will be primary TTS.');
            this.useChatterboxClient = false; // EL is primary, Chatterbox is fallback
        } else if (this.useChatterboxClient) {
            console.info('[Agent Constructor] No ElevenLabs API Key. Chatterbox is set as initial/primary TTS.');
            // No need to change other flags as Chatterbox is already preferred
        } else {
            console.warn('[Agent Constructor] No ElevenLabs API Key and Chatterbox not set as initial. Defaulting to Chatterbox as primary TTS.');
            this.useChatterboxClient = true; // Default to Chatterbox if no EL key and not explicitly set
        }
        // --- END DETERMINE PRIMARY TTS ---

        this.tickedTillOverview = tickedTillOverview;
        this.salesTechniquesData = salesTechniquesData;
        this.regionalData = regionalData;
        this.currentRegionName = 'Default';

        if (this.salesTechniquesData && this.salesTechniquesData.length > 0) {
             console.info(`[Agent Constructor] Loaded ${this.salesTechniquesData.length} sales techniques from JSONL data.`);
        } else if (this.salesTechniques && this.salesTechniques.length > 0) { // This 'salesTechniques' was likely a typo before, should be salesTechniquesData
             console.info(`[Agent Constructor] Loaded ${this.salesTechniquesData.length} sales techniques (folder names).`);
        }
        
        this.fps = localStorage.getItem('fps') || '5';
        this.captureInterval = 1000 / this.fps;
        this.resizeWidth = localStorage.getItem('resizeWidth') || '640';
        this.quality = localStorage.getItem('quality') || '0.4';
        
        this.cameraManager = new CameraManager({
            width: this.resizeWidth,
            quality: this.quality,
            facingMode: localStorage.getItem('facingMode') || 'environment'
        });
        this.cameraInterval = null;

        this.screenManager = new ScreenManager({
            width: this.resizeWidth,
            quality: this.quality,
            onStop: () => {
                if (this.screenInterval) {
                    clearInterval(this.screenInterval);
                    this.screenInterval = null;
                }
                this.emit('screenshare_stopped');
            }
        });
        this.screenInterval = null;
        
        this.toolManager = toolManager;
        if (this.toolManager && typeof this.toolManager.getToolDeclarations === 'function') {
            config.tools.functionDeclarations = toolManager.getToolDeclarations() || [];
        } else {
            console.warn("[Agent Constructor] ToolManager not provided or 'getToolDeclarations' is not a function. No tools will be declared.");
            config.tools.functionDeclarations = [];
        }
        this.config = config;

        this.name = name;
        this.url = url;
        this.client = null;

        // const kokoroVoiceString = "am_adam"; // Commented out

        this.elevenLabsClient = new ElevenLabsClient({
            apiKey: this.elevenLabsApiKey,
            voiceId: ELEVENLABS_VOICE_ID,
            modelId: ELEVENLABS_MODEL_ID,
            outputSampleRate: ELEVENLABS_OUTPUT_SAMPLERATE
        });
        console.info('[Agent Constructor] ElevenLabsClient instance created.');

        // this.KokoroTTSClient = new KokoroTTSClient({ voice: kokoroVoiceString }); // Commented out
        // console.info('[Agent Constructor] KokoroTTSClient instance created with corrected custom voice string.'); // Commented out

        // this.DiaTTSClient = new DiaTTSClient(diaClientConfig); // Commented out
        // console.info('[Agent Constructor] DiaTTSClient instance created.'); // Commented out

        // this.OrpheusTTSClient = new OrpheusClient(orpheusClientConfig); // Commented out
        // console.info('[Agent Constructor] OrpheusTTSClient instance created.'); // Commented out

        this.ChatterboxClient = new ChatterboxClient({
            apiBaseUrl: "http://localhost:8888",
            voice: "default",
            outputSampleRate: this.modelSampleRate,
            exaggeration: 0.5, // Default, can be overridden by sendVoiceSettings
            cfg_weight: 0.3,   // Lowered for potentially better pacing
            temperature: 0.8   // Default, can be overridden by sendVoiceSettings
        });
        console.info('[Agent Constructor] ChatterboxClient instance created.');

        this.userIsInterruption = false;

        this._eventEmitter = document.createElement('div');
    }

    async ensureAudioResumed() {
        if (this.audioStreamer && typeof this.audioStreamer.resumePlaybackContext === 'function') {
            console.info("[Agent ensureAudioResumed] Attempting to ensure audio context is resumed via AudioStreamer.");
            const resumed = await this.audioStreamer.resumePlaybackContext();
            if (resumed) {
                console.info("[Agent ensureAudioResumed] AudioStreamer context is running.");
            } else {
                console.warn("[Agent ensureAudioResumed] AudioStreamer context may still be suspended or failed to resume.");
            }
        } else if (this.audioContext && this.audioContext.state === 'suspended') {
            console.info("[Agent ensureAudioResumed] Attempting to resume agent's master AudioContext.");
            try {
                await this.audioContext.resume();
                console.info(`[Agent ensureAudioResumed] Agent's master AudioContext resumed. New state: ${this.audioContext.state}`);
            } catch (error) {
                console.error("[Agent ensureAudioResumed] Error resuming agent's master AudioContext:", error);
            }
        }
    }

    setupEventListeners() {
        if (!this.client) {
            console.error("[Agent setupEventListeners] Gemini client (this.client) is not initialized!");
            return;
        }

        this.client.on('text_chunk', async (textChunk) => {
            this.emit('transcription', textChunk);

            let currentProcessingText = this.partialLangTagBuffer + textChunk;
            this.partialLangTagBuffer = '';

            let textToAccumulate = '';

            while (currentProcessingText.length > 0) {
                const langTagMatch = currentProcessingText.match(/\[LANGUAGE:(.*?)\]/i);

                if (langTagMatch) {
                    const tag = langTagMatch[0];
                    // const newLang = langTagMatch[1].toUpperCase().trim(); // No longer used for switching
                    const textBeforeTag = currentProcessingText.substring(0, langTagMatch.index);

                    textToAccumulate += textBeforeTag;

                    // Log that the tag is being stripped and its language-switching capability is ignored
                    console.log(`%%%% [Agent text_chunk] Language tag ${tag} encountered and stripped. Language switching based on this tag is IGNORED. Text will be processed using current language: ${this.currentLanguage}. %%%%`);
                    
                    currentProcessingText = currentProcessingText.substring(langTagMatch.index + tag.length); // Remove the tag
                } else {
                    const partialMatch = currentProcessingText.match(/\[LANGUAGE:[A-Z]{0,2}$/i) || currentProcessingText.match(/\[LANGUAGE:$/i) || currentProcessingText.match(/\[LANGUAG$/i) || currentProcessingText.match(/\[LANGUA$/i) || currentProcessingText.match(/\[LANGU$/i) || currentProcessingText.match(/\[LANG$/i) || currentProcessingText.match(/\[LAN$/i) || currentProcessingText.match(/\[LA$/i) || currentProcessingText.match(/\[L$/i) || currentProcessingText.match(/\($/i) ; // Ensure backslashes are escaped for regex in string
                    if (partialMatch) {
                        this.partialLangTagBuffer = partialMatch[0];
                        textToAccumulate += currentProcessingText.substring(0, partialMatch.index);
                        console.log("%%%% [Agent text_chunk] Buffered partial language tag: ", this.partialLangTagBuffer, "%%%%");
                    } else {
                        textToAccumulate += currentProcessingText;
                    }
                    currentProcessingText = '';
                }
            }

            if (textToAccumulate.trim() !== '') {
                this.currentTurnTextAccumulator += textToAccumulate;
            }

            let ttsDispatchedThisChunk = false;

            if (this.elevenLabsApiKey && this.elevenLabsClient && this.elevenLabsClient.isConnected && !this.useChatterboxClient) { // Check !this.useChatterboxClient if EL is primary
                if (this.elevenLabsClient.isConnected) {
                        console.log("%%%% [Agent text_chunk Handler] ElevenLabs connection assured. Sending text. %%%%");
                    console.log("%%%% TTS PRE-SEND (EL current chunk): ", this.currentTurnTextAccumulator, "%%%%");
                    this.elevenLabsClient.sendText(this.currentTurnTextAccumulator);
                        ttsDispatchedThisChunk = true;
                }
            }
            else if (this.useChatterboxClient && this.ChatterboxClient) {
                console.log("%%%% [Agent text_chunk Handler] ChatterboxClient is active: Accumulating text chunk. %%%%");
                this.chatterboxStreamEndedForTurn = false; // Reset flag
                // Chatterbox typically sends full text on turn_complete or interruption
                ttsDispatchedThisChunk = true;
            }
            // Removed Kokoro, Dia, Orpheus specific logic here
            
            if (!ttsDispatchedThisChunk) {
                 console.warn("%%%% [Agent text_chunk Handler] No active TTS client for this chunk. No audio will be generated. %%%%");
                 this.elevenLabsStreamEndedForTurn = true;
                 this.chatterboxStreamEndedForTurn = true;
                 // this.KokoroStreamEndedForTurn = true; // Commented out
                 // this.diaStreamEndedForTurn = true; // Commented out
                 // this.orpheusStreamEndedForTurn = true; // Commented out
            }
        });

        this.client.on('interrupted', () => {
            console.info('[Agent Event] Gemini reported interruption (e.g., by its own tool call or speech end).');
            if (!this.userIsInterruption) {
                // Log which TTS was active
                if (this.useChatterboxClient && this.ChatterboxClient && this.currentTurnTextAccumulator.trim() !== '') {
                    console.log("[Agent Gemini Interrupted Event] ChatterboxClient was active. Accumulated text: ", this.currentTurnTextAccumulator);
                } else if (this.elevenLabsClient && this.elevenLabsClient.isConnected && !this.useChatterboxClient && this.currentTurnTextAccumulator.trim() !== '') {
                    console.log("[Agent Gemini Interrupted Event] ElevenLabs was active. Accumulated text: ", this.currentTurnTextAccumulator);
                }
                // Removed Kokoro, Dia, Orpheus logging

                this.interruptionPointText = this.currentTurnTextAccumulator;
                
                if (this.audioStreamer) {
                    this.audioStreamer.stop();
                }

                if (this.elevenLabsClient && this.elevenLabsClient.isConnected && !this.useChatterboxClient) {
                    console.log("[Agent Gemini Interrupted Event] Sending EOS to ElevenLabs.");
                    this.elevenLabsClient.sendEOS();
                } else if (this.useChatterboxClient && this.ChatterboxClient) {
                    console.log("[Agent Gemini Interrupted Event] ChatterboxClient active: Preparing to send accumulated text.");
                    const textForChatterbox = this.currentTurnTextAccumulator.trim();
                    console.log(`%%%% [Agent Interrupted - Chatterbox PRE-SEND] Text to be sent: "${textForChatterbox}", Current Agent Language: ${this.currentLanguage} %%%%`); // Enhanced Log
                    if (textForChatterbox) {
                        this.ChatterboxClient.sendText(textForChatterbox, null, this.currentLanguage);
                    } else {
                        this.chatterboxStreamEndedForTurn = true; // No text to send
                    }
                }
                // Removed Kokoro, Dia, Orpheus EOS logic
                this.geminiTurnCompleted = true;
                this.elevenLabsStreamEndedForTurn = true;
                this.chatterboxStreamEndedForTurn = this.currentTurnTextAccumulator.trim() === '' ? true : this.chatterboxStreamEndedForTurn;
                // this.KokoroStreamEndedForTurn = true; // Commented out
                // this.diaStreamEndedForTurn = true; // Commented out
                // this.orpheusStreamEndedForTurn = true; // Commented out
            }
            this.userIsInterruption = false;
            this.emit('interrupted');
        });

        this.client.on('turn_complete', () => {
            console.info('[Agent Event] Gemini turn_complete.');
            this.geminiTurnCompleted = true;

            // if (this.kokoroAggressiveSendTimer) { // Commented out
            //     clearTimeout(this.kokoroAggressiveSendTimer);
            //     this.kokoroAggressiveSendTimer = null;
            //     console.log("%%%% [Agent Gemini turn_complete] Cleared pending Kokoro aggressive send timer. %%%%");
            // }

            let ttsActionTaken = false;
            let textForTTS = this.currentTurnTextAccumulator.trim();

            if (this.useChatterboxClient && this.ChatterboxClient) {
                if (textForTTS !== '') {
                    const logPrefix = this.chatterboxFallbackActivatedMidTurn ? "Chatterbox Fallback (mid-turn)" : "Chatterbox Primary";
                    console.log(`%%%% [Agent Gemini turn_complete] ${logPrefix}: Preparing to send accumulated text.`);
                    console.log(`%%%% [Agent Turn Complete - Chatterbox PRE-SEND] Text to be sent: "${textForTTS}", Current Agent Language: ${this.currentLanguage} %%%%`); // Enhanced Log
                    this.ChatterboxClient.sendText(textForTTS, null, this.currentLanguage);
                    ttsActionTaken = true;
                } else {
                    const logPrefix = this.chatterboxFallbackActivatedMidTurn ? "Chatterbox Fallback (mid-turn)" : "Chatterbox Primary";
                    console.log(`%%%% [Agent Gemini turn_complete] ${logPrefix}: No accumulated text to send. %%%%`);
                    this.chatterboxStreamEndedForTurn = true;
                    ttsActionTaken = true; // Still counts as action if Chatterbox is primary and no text
                }
            }
            else if (this.elevenLabsClient && this.elevenLabsClient.isConnected && !this.useChatterboxClient) { // EL is primary
                console.log("%%%% [Agent Gemini turn_complete] Sending EOS to ElevenLabs. %%%%TTS PRE-SEND (EL EOS - no text)%%%%");
                this.elevenLabsClient.sendEOS();
                ttsActionTaken = true;
            }
            // Removed Kokoro, Dia, Orpheus logic
            
            if (!ttsActionTaken) {
                 console.log("%%%% [Agent Gemini turn_complete] No active TTS client (EL or Chatterbox) to send EOS or accumulated text to. %%%%");
                 this.elevenLabsStreamEndedForTurn = true; 
                 this.chatterboxStreamEndedForTurn = true;
                 // this.KokoroStreamEndedForTurn = true; // Commented out
                 // this.diaStreamEndedForTurn = true; // Commented out
                 // this.orpheusStreamEndedForTurn = true; // Commented out
            }

            this.checkAndFinalizeTTSTurn(); 
            this.emit('turn_complete');
        });

        this.client.on('tool_call', async (toolCall) => {
            await this.handleToolCall(toolCall);
        });

        // ElevenLabs Specific Listeners
        this.elevenLabsClient.on('connected', () => {
            console.info('[Agent Event] ElevenLabsClient connected.');
            if (this.elevenLabsHeartbeatIntervalId) clearInterval(this.elevenLabsHeartbeatIntervalId);
            
            if (this.elevenLabsClient.isConnected) { this.elevenLabsClient.sendText(" "); }
            
            this.elevenLabsHeartbeatIntervalId = setInterval(() => {
                if (this.elevenLabsClient && this.elevenLabsClient.isConnected) {
                    this.elevenLabsClient.sendText(" "); 
                } else {
                    console.warn("[Agent] Heartbeat: ElevenLabs client not connected, stopping heartbeat.");
                    if(this.elevenLabsHeartbeatIntervalId) clearInterval(this.elevenLabsHeartbeatIntervalId);
                    this.elevenLabsHeartbeatIntervalId = null;
                }
            }, 15000); 
        });

        this.elevenLabsClient.on('audio_chunk', (audioData) => {
            if (this.audioStreamer && this.audioStreamer.isInitialized) {
                if (this.audioStreamer.sampleRate !== ELEVENLABS_OUTPUT_SAMPLERATE) {
                    console.warn(`[Agent Event - EL] Correcting AudioStreamer sample rate to ${ELEVENLABS_OUTPUT_SAMPLERATE}`);
                    this.audioStreamer.sampleRate = ELEVENLABS_OUTPUT_SAMPLERATE;
                }
                try {
                    this.audioStreamer.streamAudio(new Uint8Array(audioData)); 
                } catch (e) {
                    console.error("%%%% [Agent Event - EL] ERROR calling audioStreamer.streamAudio():", e, "%%%%");
                }
            } else {
                console.warn('[Agent Event - EL] AudioStreamer not ready for ElevenLabs audio_chunk. Streamer:', this.audioStreamer, 'Initialized:', this.audioStreamer ? this.audioStreamer.isInitialized : 'N/A');
            }
        });
        
        this.elevenLabsClient.on('stream_end', () => {
            console.log('%%%% [Agent Event] ElevenLabs stream_end received by Agent. %%%%');
            this.elevenLabsStreamEndedForTurn = true;
            if (this.audioStreamer) {
                this.audioStreamer.signalStreamCompletion(); 
            }
            this.checkAndFinalizeTTSTurn();
        });

        this.elevenLabsClient.on('error', (error) => {
            console.error('[Agent Event] ElevenLabsClient error:', error);
            if (this.elevenLabsHeartbeatIntervalId) {
                clearInterval(this.elevenLabsHeartbeatIntervalId);
                this.elevenLabsHeartbeatIntervalId = null;
            }
            const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
            
            this.elevenLabsStreamEndedForTurn = true; // Assume stream ended on error

            // Fallback to Chatterbox
            console.warn("[Agent Event] ElevenLabs critical error. Attempting Chatterbox fallback.", error);
            this.useChatterboxClient = true;
            this.useOrpheusClient = false;  // Ensure others are off
            this.useDiaClient = false;      // Ensure others are off
            // this.useKokoroFallback = false; // Ensure others are off
            this.chatterboxStreamEndedForTurn = false; // Ready for Chatterbox stream
            this.chatterboxFallbackActivatedMidTurn = true; // Flag that fallback happened mid-turn
            
            if (this.ChatterboxClient) {
                console.info("[Agent Event] EL Error. Switching to Chatterbox fallback.");
                if (this.geminiTurnCompleted && this.currentTurnTextAccumulator.trim() !== '') {
                    console.log("%%%% [Agent EL Error Fallback] Chatterbox: Sending accumulated text for catch-up: ", this.currentTurnTextAccumulator.trim(), "%%%%");
                    const textForChatterbox = this.currentTurnTextAccumulator.trim();
                    console.log("%%%% TTS PRE-SEND (Chatterbox EL error fallback): ", textForChatterbox, `(lang: ${this.currentLanguage}) %%%%`);
                    this.ChatterboxClient.sendText(textForChatterbox, null, this.currentLanguage);
                } else if (this.geminiTurnCompleted && this.currentTurnTextAccumulator.trim() === '') {
                    console.log("%%%% [Agent EL Error Fallback] Chatterbox: No text to send, marking stream ended. %%%%");
                    this.chatterboxStreamEndedForTurn = true;
                }
            } else {
                console.error("[Agent Event] EL Error. ChatterboxClient not available for fallback!");
            }
            
            if (this.geminiTurnCompleted) {
                this.checkAndFinalizeTTSTurn();
            }
        });

        this.elevenLabsClient.on('disconnected', (details) => {
            console.info('[Agent Event] ElevenLabsClient disconnected. Details:', details);
            if (this.elevenLabsHeartbeatIntervalId) {
                clearInterval(this.elevenLabsHeartbeatIntervalId);
                this.elevenLabsHeartbeatIntervalId = null;
            }

            this.elevenLabsStreamEndedForTurn = true; // Assume stream ended on disconnect

            // Fallback to Chatterbox
            console.warn("[Agent Event] ElevenLabs disconnected. Attempting Chatterbox fallback.");
            this.useChatterboxClient = true;
            this.useOrpheusClient = false;
            this.useDiaClient = false;
            // this.useKokoroFallback = false;
            this.chatterboxStreamEndedForTurn = false;
            this.chatterboxFallbackActivatedMidTurn = true;

            if (this.ChatterboxClient) {
                console.info("[Agent Event] EL Disconnected. Switching to Chatterbox fallback.");
                if (this.geminiTurnCompleted && this.currentTurnTextAccumulator.trim() !== '') {
                    console.log("%%%% [Agent EL Disconnect Fallback] Chatterbox: Sending accumulated text: ", this.currentTurnTextAccumulator.trim(), "%%%%");
                    const textForChatterbox = this.currentTurnTextAccumulator.trim();
                    console.log("%%%% TTS PRE-SEND (Chatterbox EL disconnect fallback): ", textForChatterbox, `(lang: ${this.currentLanguage}) %%%%`);
                    this.ChatterboxClient.sendText(textForChatterbox, null, this.currentLanguage);
                } else if (this.geminiTurnCompleted && this.currentTurnTextAccumulator.trim() === '') {
                    console.log("%%%% [Agent EL Disconnect Fallback] Chatterbox: No text to send, marking stream ended. %%%%");
                    this.chatterboxStreamEndedForTurn = true;
                }
            } else {
                 console.error("[Agent Event] EL Disconnected. ChatterboxClient not available for fallback!");
            }
            
            if (this.geminiTurnCompleted) {
                this.checkAndFinalizeTTSTurn();
            }
        });

        this.elevenLabsClient.on('info', (infoData) => {
            // console.debug('[Agent Event] ElevenLabsClient info:', infoData); // Keep for debugging if needed
        });

        // Chatterbox Specific Listeners (if it were WebSocket based, it would be similar to EL)
        // Since it's HTTP, the 'audio_chunk' and 'stream_end' are handled within its sendText method's fetch response.
        if (this.ChatterboxClient) {
            this.ChatterboxClient.on('audio_chunk', (audioData) => {
                if (this.audioStreamer && this.audioStreamer.isInitialized) {
                    // Chatterbox client should be configured to output at ELEVENLABS_OUTPUT_SAMPLERATE
                    if (this.audioStreamer.sampleRate !== ELEVENLABS_OUTPUT_SAMPLERATE) {
                        console.warn(`[Agent Event - Chatterbox] Correcting AudioStreamer sample rate to ${ELEVENLABS_OUTPUT_SAMPLERATE}`);
                        this.audioStreamer.sampleRate = ELEVENLABS_OUTPUT_SAMPLERATE;
                    }
                    try {
                        this.audioStreamer.streamAudio(new Uint8Array(audioData)); 
                    } catch (e) {
                        console.error("%%%% [Agent Event - Chatterbox] ERROR calling audioStreamer.streamAudio():", e, "%%%%");
                    }
                } else {
                    console.warn('[Agent Event - Chatterbox] AudioStreamer not ready for Chatterbox audio_chunk.');
                }
            });

            this.ChatterboxClient.on('stream_end', () => {
                console.log('%%%% [Agent Event] Chatterbox stream_end received by Agent. %%%%');
                this.chatterboxStreamEndedForTurn = true;
                if (this.audioStreamer) {
                    this.audioStreamer.signalStreamCompletion(); 
                }
                this.checkAndFinalizeTTSTurn();
            });

            this.ChatterboxClient.on('error', (error) => {
                console.error('[Agent Event] ChatterboxClient error:', error);
                this.chatterboxStreamEndedForTurn = true; // Assume stream ended on error
                this.checkAndFinalizeTTSTurn();
                this.emit('error', { type: 'tts_error', source: 'Chatterbox', message: error.message || error });
                // Here, you could implement a fallback to another TTS if Chatterbox fails,
                // but for now, we assume Chatterbox is the last resort.
            });
        }
        // Removed Kokoro, Dia, Orpheus listeners
    }
        
    async handleToolCall(toolCall) {
        if (!this.toolManager || typeof this.toolManager.handleToolCall !== 'function') {
            console.error("[Agent handleToolCall] ToolManager not available or handleToolCall is not a function.");
            if (this.client && toolCall.functionCalls && toolCall.functionCalls[0]) {
                await this.client.sendToolResponse({ id: toolCall.functionCalls[0].id, error: "Tool processing system unavailable." });
            } return;
        }
        const functionCall = toolCall.functionCalls[0];
        const response = await this.toolManager.handleToolCall(functionCall);
        if (this.client) await this.client.sendToolResponse(response);
    }

    async connect() {
        if (this.connected) { console.warn("[Agent connect] Already connected."); return; }

        if (!this.initialized) {
            console.info("[Agent connect] Agent not yet initialized. Calling initialize() first.");
            await this.initialize();
            if (!this.initialized) {
                console.error("[Agent connect] Initialization failed. Aborting Gemini connection.");
                this.emit('error', {type: 'initialization_failed', message: 'Agent initialization failed.'});
                return; 
            }
        }
        
        try {
            const systemInstructionText = this.buildSystemInstruction();

            const systemInstructionPayload = { parts: [{ text: systemInstructionText }] };

            const baseConfig = { ...this.config };
            delete baseConfig.systemInstruction;
            if (baseConfig.generationConfig) {
                delete baseConfig.generationConfig.systemInstruction;
            }

            const finalConfig = {
                 ...baseConfig,
                 systemInstruction: systemInstructionPayload 
            };

            this.client = new GeminiWebsocketClient(this.name, this.url, finalConfig);
            await this.client.connect();
            this.setupEventListeners();
            this.connected = true;
            console.info("[Agent connect] Successfully connected Gemini client.");
        } catch (error) {
            console.error("[Agent connect] Failed to connect Gemini client:", error);
            this.connected = false; throw error;
        }
    }

    async sendText(text) {
        this.currentTurnTextAccumulator = '';
        this.interruptionPointText = '';
        this.geminiTurnCompleted = false;
        this.elevenLabsStreamEndedForTurn = false;
        this.chatterboxStreamEndedForTurn = false; // Reset Chatterbox flag
        this.chatterboxFallbackActivatedMidTurn = false; // Reset fallback flag
        // this.KokoroStreamEndedForTurn = false; // Commented out
        // this.diaStreamEndedForTurn = false;    // Commented out
        // this.orpheusStreamEndedForTurn = false;// Commented out
        // this.kokoroFallbackActivatedMidTurn = false; // Commented out
        // if (this.kokoroAggressiveSendTimer) { // Commented out
        //     clearTimeout(this.kokoroAggressiveSendTimer);
        //     this.kokoroAggressiveSendTimer = null;
        // }
        console.log("%%%% [Agent sendText] Reset turn completion and accumulator flags for new turn. %%%%");

        if (this.audioStreamer) {
            console.log("%%%% [Agent sendText] Explicitly calling audioStreamer.stop() at the beginning of new text submission. %%%%");
            this.audioStreamer.stop();
        }
        if (this.audioRecorder && this.audioRecorder.isRecording) {
            await this.stopUserRecording(); 
        }

        await this.ensureAudioResumed();

        if (!this.client || !this.connected) { 
            console.error("[Agent sendText] Cannot send text: client not connected."); 
            if (!this.client?.isConnecting) {
                console.warn("[Agent sendText] Attempting to reconnect as client was not connected.");
                try {
                    await this.connect();
                    if (!this.connected) {
                         console.error("[Agent sendText] Reconnect attempt failed.");
                         return;
                    }
                } catch (e) {
                    console.error("[Agent sendText] Error during reconnect attempt:", e);
                    return;
                }
            } else {
                console.warn("[Agent sendText] Client is already trying to connect. Aborting sendText.");
                return;
            }
        }

        try {
            // Determine primary TTS for this turn
            let primaryTTSDetermined = false;
            if (this.elevenLabsApiKey && !this.useChatterboxClient) { // EL is primary
                if (!this.elevenLabsClient.isConnected) {
                    console.info("[Agent sendText] ElevenLabs not connected, attempting to connect before sending text to Gemini.");
                    try {
                        await this.elevenLabsClient.connect();
                        primaryTTSDetermined = true;
                    } catch (elError) {
                        console.error("[Agent sendText] Failed to connect ElevenLabs. Will use Chatterbox fallback.", elError);
                        this.useChatterboxClient = true; // Fallback to Chatterbox
                        this.chatterboxFallbackActivatedMidTurn = true;
                        primaryTTSDetermined = true;
                    }
                } else {
                     console.info("[Agent sendText] ElevenLabs already connected.");
                     primaryTTSDetermined = true;
                }
            } else if (this.useChatterboxClient) { // Chatterbox is primary or fallback
                console.log("%%%% [Agent sendText] Chatterbox is the active TTS. Sending to Gemini. %%%%");
                primaryTTSDetermined = true;
            }
            // Removed Kokoro, Dia, Orpheus logic

            if (!primaryTTSDetermined) {
                console.warn("[Agent sendText] No primary TTS could be determined. Defaulting to Chatterbox. This should ideally not happen if constructor logic is correct.");
                this.useChatterboxClient = true;
                 primaryTTSDetermined = true;
            }


            let textToSend = text;
            const techniquesForThisTurn = this.formatTechniquesForTurn();
            
            let regionalGuidanceForTurn = '';
            const currentRegionInfo = this.regionalData ? this.regionalData[this.currentRegionName] : null;
            if (currentRegionInfo) {
                regionalGuidanceForTurn = `<SYSTEM_TASK FOR ALEX (DO NOT SPEAK THIS): REGIONAL_STYLE_MAINTAIN: ${currentRegionInfo.accent_target} for ${this.currentRegionName}. Local phrase use: optional, only if 100% natural and grammatically correct. PRIORITY: Authentic persona.>`;
            }

            if (this.interruptionPointText) {
                const interruptionContext = `System: You were in the middle of saying "${this.interruptionPointText}" when you were interrupted by the user. Discard the rest of that previous thought. Now, respond to the user's latest message, which is:`;
                textToSend = `${interruptionContext}\n\nUser: ${text}`;
                console.log(`[Agent sendText] Sending interruption context to Gemini. Interrupted text: "${this.interruptionPointText}"`);
                this.interruptionPointText = '';
            }
            
            const finalTextPayload = regionalGuidanceForTurn + techniquesForThisTurn + textToSend;

            await this.client.sendText(finalTextPayload);
            await this.client.sendText(" ", false); 

            this.emit('text_sent', text);
        } catch (error) {
            console.error("[Agent sendText] Error sending text:", error);
        }
    }

    async initiateGreeting() {
        this.currentTurnTextAccumulator = '';
        this.interruptionPointText = '';
        this.geminiTurnCompleted = false;
        this.elevenLabsStreamEndedForTurn = false;
        this.chatterboxStreamEndedForTurn = false; // Reset Chatterbox flag
        this.chatterboxFallbackActivatedMidTurn = false; // Reset fallback flag
        // Reset other TTS flags if they were used
        // this.KokoroStreamEndedForTurn = false;
        // this.diaStreamEndedForTurn = false;
        // this.orpheusStreamEndedForTurn = false;
        // this.kokoroFallbackActivatedMidTurn = false;
        // if (this.kokoroAggressiveSendTimer) { clearTimeout(this.kokoroAggressiveSendTimer); this.kokoroAggressiveSendTimer = null; }

        console.log("%%%% [Agent initiateGreeting] Reset turn completion and accumulator flags for new greeting turn. %%%%");

        console.log("[Agent initiateGreeting] Attempting to initiate greeting.");
        if (this.audioRecorder && this.audioRecorder.isRecording) {
            await this.stopUserRecording(); 
        }
        await this.ensureAudioResumed();

        if (!this.client || !this.connected) {
            console.error("[Agent initiateGreeting] Cannot initiate greeting: client not connected.");
            if (!this.client?.isConnecting) {
                console.warn("[Agent initiateGreeting] Attempting to reconnect as client was not connected.");
                try {
                    await this.connect();
                    if (!this.connected) {
                        console.error("[Agent initiateGreeting] Reconnect attempt failed.");
                        this.emit('error', { type: 'connection_failed', message: 'Failed to connect to initiate greeting.' });
                        return;
                    }
                } catch (e) {
                    console.error("[Agent initiateGreeting] Error during reconnect attempt:", e);
                    this.emit('error', { type: 'connection_error', message: 'Error connecting to initiate greeting.' });
                    return;
                }
            } else {
                console.warn("[Agent initiateGreeting] Client is already trying to connect. Aborting greeting initiation.");
                return;
            }
        }

        let greetingPrompt = `System: You are Alex, a friendly and professional sales agent from TickedTill. This is a cold call.`;

        const regionInfo = this.regionalData ? this.regionalData[this.currentRegionName] : null;
        let regionalOpening = "";
        if (regionInfo) {
            greetingPrompt += ` You are speaking to someone in ${this.currentRegionName}. Your speaking style for this entire call must actively emulate a ${regionInfo.accent_target} local. This is crucial for rapport.`;
            if (regionInfo.sample_vernacular_1) {
                regionalOpening = regionInfo.sample_vernacular_1;
                 greetingPrompt += ` Start your greeting by using the local phrase '${regionalOpening}' or a very similar natural-sounding local alternative, then smoothly transition into introducing yourself.`;
            }
        }

        greetingPrompt += ` After your initial local greeting phrase (if one was suggested), you MUST state your name (Alex), your company (TickedTill), and the general reason for your call (helping businesses with flexible payment options). Then, ask a brief, low-commitment question to gauge their potential interest or if they are the right person to speak to about this topic. Do not ask them what they hope to achieve. Maintain the local style throughout.`;

        if (this.salesTechniquesData && this.salesTechniquesData.length > 0) {
            const numTechniquesToSelect = Math.min(5, this.salesTechniquesData.length);
            const selectedTechniques = this.salesTechniquesData.sort(() => 0.5 - Math.random()).slice(0, numTechniquesToSelect);

            greetingPrompt += "\n\nConsider these sales techniques to inform your greeting:\n";
            selectedTechniques.forEach((tech, index) => {
                greetingPrompt += `- Technique ${index + 1}: ${tech.content}\n`;
            });
            greetingPrompt += "\nCraft your greeting to subtly incorporate these techniques without explicitly stating them.";
        } else {
            console.warn("[Agent initiateGreeting] No sales techniques data available. Using default greeting.");
        }

        if (this.tickedTillOverview) {
            greetingPrompt += '\n\n**Context: TickedTill Company Overview & Operational Model**\n';
            const MAX_OVERVIEW_CHARS = 3000;
            greetingPrompt += this.tickedTillOverview.substring(0, MAX_OVERVIEW_CHARS) + (this.tickedTillOverview.length > MAX_OVERVIEW_CHARS ? '\n... [OVERVIEW TRUNCATED] ...\n' : '\n');
        }

        if (this.salesTechniques && this.salesTechniques.length > 0) { // This was likely a typo, should be salesTechniquesData
            const numTechniquesToSelect = Math.min(5, this.salesTechniquesData.length);
            const selectedTechniques = this.salesTechniquesData.sort(() => 0.5 - Math.random()).slice(0, numTechniquesToSelect);
            
            greetingPrompt += "\n**Consider these sales techniques/mindsets for your greeting:**\n";
            selectedTechniques.forEach((tech) => { greetingPrompt += `- ${tech.content}\n`; });
            greetingPrompt += '\nApply the principles from these techniques where relevant to your opening greeting, but do not explicitly mention the techniques or this list.';
        }

        try {
            let primaryTTSDeterminedGreeting = false;
            if (this.elevenLabsApiKey && !this.useChatterboxClient) { // EL is primary
                if (!this.elevenLabsClient.isConnected) {
                    console.info("[Agent initiateGreeting] ElevenLabs not connected, attempting connect.");
                    try {
                        await this.elevenLabsClient.connect();
                        primaryTTSDeterminedGreeting = true;
                    } catch (elError) {
                        console.error("[Agent initiateGreeting] Failed to connect ElevenLabs for greeting. Will use Chatterbox fallback.", elError);
                        this.useChatterboxClient = true; // Fallback to Chatterbox
                        this.chatterboxFallbackActivatedMidTurn = true; // Mark as fallback
                        primaryTTSDeterminedGreeting = true;
                    }
                } else {
                    console.info("[Agent initiateGreeting] ElevenLabs already connected.");
                    primaryTTSDeterminedGreeting = true;
                }
            } else if (this.useChatterboxClient) { // Chatterbox is primary or fallback
                console.log("%%%% [Agent initiateGreeting] Chatterbox is the active TTS. %%%%");
                primaryTTSDeterminedGreeting = true;
            }
            // Removed Kokoro, Dia, Orpheus logic

            if (!primaryTTSDeterminedGreeting) {
                console.warn("[Agent initiateGreeting] No primary TTS could be determined for greeting. Defaulting to Chatterbox. This should ideally not happen.");
                this.useChatterboxClient = true;
            }

            console.log(`[Agent initiateGreeting] Sending prompt to Gemini to generate greeting (length: ${greetingPrompt.length}): "${greetingPrompt.substring(0, 200)}..."`);
            await this.client.sendText(greetingPrompt, true);
            await this.client.sendText(" ", false);
            console.log("[Agent initiateGreeting] Greeting prompt and flush message sent to Gemini.");
            
            this.emit('greeting_initiated');

        } catch (error) {
            console.error("[Agent initiateGreeting] Error sending greeting prompt:", error);
            this.emit('error', { type: 'greeting_failed', message: 'Failed to send greeting prompt.' });
        }
    }

    async startCameraCapture() { /* ... (no changes needed for this method) ... */ }
    async stopCameraCapture() { /* ... (no changes needed for this method) ... */ }
    async startScreenShare() { /* ... (no changes needed for this method) ... */ }
    async stopScreenShare() { /* ... (no changes needed for this method) ... */ }

    async disconnect() {
        console.info('[Agent] Disconnect called.');
        await this.stopCameraCapture();
        await this.stopScreenShare();

        if (this.audioRecorder) { this.audioRecorder.stop(); this.audioRecorder = null; }
        if (this.visualizer) { this.visualizer.cleanup(); this.visualizer = null; }
        if (this.audioStreamer) { this.audioStreamer.stop(); this.audioStreamer = null; }
        
        // Disconnect ElevenLabs if it was the primary
        if (this.elevenLabsClient && !this.useChatterboxClient) { // Only if EL was not overridden by Chatterbox
            console.info('[Agent] Disconnecting ElevenLabsClient in agent disconnect().');
            this.elevenLabsClient.disconnect();
            if (this.elevenLabsHeartbeatIntervalId) {
                clearInterval(this.elevenLabsHeartbeatIntervalId);
                this.elevenLabsHeartbeatIntervalId = null;
            }
        }
        // Chatterbox, Kokoro, Dia, Orpheus are HTTP and don't need explicit WebSocket disconnect here.
        // Their `disconnect` methods are conceptual for HTTP.
        if (this.ChatterboxClient) this.ChatterboxClient.disconnect();
        // if (this.KokoroTTSClient) this.KokoroTTSClient.disconnect(); // Commented out
        // if (this.DiaTTSClient) this.DiaTTSClient.disconnect();       // Commented out
        // if (this.OrpheusTTSClient) this.OrpheusTTSClient.disconnect(); // Commented out
        
        if (this.client) {
            this.client.disconnect();
            this.client = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            try { await this.audioContext.close(); } 
            catch (e) { console.warn("[Agent Disconnect] Error closing audio context:", e.message); }
            this.audioContext = null;
        }
        
        this.initialized = false;
        this.connected = false;
        console.info('Disconnected and cleaned up all resources');
    }

    async initialize() {
        console.info('[Agent Initialize] Starting initialization sequence (v7 Chatterbox Fallback).');
        if (this.initialized) { console.warn("[Agent Initialize] Already initialized."); return; }
        try {            
            this.audioContext = new AudioContext();
            
            this.audioStreamer = new AudioStreamer(this.audioContext);
            try {
                await this.audioStreamer.initialize();
            } catch (err) {
                console.error("[Agent Initialize] AudioStreamer initialization failed:", err);
            }
            this.audioStreamer.initialBufferTime = 0; // Play as soon as possible
            this.audioStreamer.sampleRate = ELEVENLABS_OUTPUT_SAMPLERATE; // Default for EL/Chatterbox
            
            this.visualizer = new AudioVisualizer(this.audioContext, 'visualizer');
            if (this.audioStreamer.gainNode && this.visualizer.analyser) {
                 this.audioStreamer.gainNode.connect(this.visualizer.analyser);
            } else { console.warn("[Agent Initialize] Could not connect AudioStreamer gainNode to Visualizer analyser."); }
            this.visualizer.start();
            
            // TTS Client Initialization Logic
            if (this.elevenLabsApiKey) {
                console.info('[Agent Initialize] ElevenLabs API Key found. Attempting ElevenLabsClient connection.');
                try {
                    await this.elevenLabsClient.connect();
                    this.useChatterboxClient = false; // EL is primary
                    console.info('[Agent Initialize] ElevenLabsClient connected successfully.');
                } catch (elError) {
                     console.error("[Agent Initialize] Initial ElevenLabs connection failed. Falling back to Chatterbox.", elError);
                     this.useChatterboxClient = true; // Fallback to Chatterbox
                     // No explicit connect needed for Chatterbox HTTP client here, but good to log.
                     if (this.ChatterboxClient) {
                         console.info('[Agent Initialize] Using ChatterboxClient as fallback.');
                         this.ChatterboxClient.connect(); // Conceptual connect
                     } else {
                        console.error("[Agent Initialize] ChatterboxClient not available for fallback after EL failure!");
                     }
                }
            } else if (this.useChatterboxClient && this.ChatterboxClient) {
                console.info('[Agent Initialize] No ElevenLabs API Key. ChatterboxClient is configured as the primary TTS.');
                this.ChatterboxClient.connect(); // Conceptual connect
            } else {
                 console.warn('[Agent Initialize] No primary TTS (ElevenLabs or Chatterbox) configured/available.');
                 // Could default to Chatterbox here as well if desired.
                 if (this.ChatterboxClient) {
                    console.info('[Agent Initialize] Defaulting to ChatterboxClient.');
                    this.useChatterboxClient = true;
                    this.ChatterboxClient.connect();
                 } else {
                    console.error('[Agent Initialize] CRITICAL: No TTS client could be initialized.');
                 }
            }
            // Removed Kokoro, Dia, Orpheus initialization logic
            
            this.initialized = true;
            console.info('[Agent Initialize] Agent initialization sequence complete (v7 Chatterbox Fallback).');
            
        } catch (error) {
            console.error('[Agent Initialize] Major error during initialization sequence:', error);
            this.initialized = false;
            await this.disconnect(); 
        }
    }

    async startRecording() { /* ... (no changes needed for this method) ... */ }
    async stopRecording() { /* ... (no changes needed for this method) ... */ }
    async toggleMic() { /* ... (no changes needed for this method) ... */ }

    on(eventName, callback) {
         this._eventEmitter.addEventListener(eventName, (event) => callback(event.detail));
    }
    
    emit(eventName, data) {
         const event = new CustomEvent(eventName, { detail: data });
         this._eventEmitter.dispatchEvent(event);
    }

    checkAndFinalizeTTSTurn() {
        let activeTTSEnded = false;
        let activeTTSService = "none";

        if (this.elevenLabsClient && this.elevenLabsClient.isConnected && !this.useChatterboxClient) {
            activeTTSService = "ElevenLabs";
            activeTTSEnded = this.elevenLabsStreamEndedForTurn;
        } else if (this.useChatterboxClient && this.ChatterboxClient) { // Check if Chatterbox is the active one
            activeTTSService = "Chatterbox";
            activeTTSEnded = this.chatterboxStreamEndedForTurn;
        } else if (this.elevenLabsApiKey && !this.useChatterboxClient) { // Intended EL but connection might have failed
            activeTTSService = "ElevenLabs (intended)";
            activeTTSEnded = this.elevenLabsStreamEndedForTurn; // This would be true if EL failed
        } else {
            activeTTSService = "NoneConfiguredOrActive";
            activeTTSEnded = true; // No TTS was supposed to be active
        }
        // Removed Kokoro, Dia, Orpheus checks

        console.log(`%%%% [Agent checkAndFinalizeTTSTurn - ${activeTTSService}] Checking. Gemini Done: ${this.geminiTurnCompleted}, Active TTS Stream Ended: ${activeTTSEnded} %%%%`);

        if (this.geminiTurnCompleted && activeTTSEnded) {
            console.log("%%%% [Agent checkAndFinalizeTTSTurn] Turn fully complete. Clearing accumulators. %%%%");
            this.currentTurnTextAccumulator = '';
            this.interruptionPointText = '';
            this.chatterboxFallbackActivatedMidTurn = false; // Reset fallback flag

            if (activeTTSService === "ElevenLabs" && this.elevenLabsClient && this.elevenLabsClient.isConnected) {
                console.log("%%%% [Agent checkAndFinalizeTTSTurn] Both Gemini and ElevenLabs finished. KEEPING ElevenLabs connection OPEN. %%%%");
            } else if (activeTTSService === "Chatterbox" && this.ChatterboxClient) {
                console.log("%%%% [Agent checkAndFinalizeTTSTurn] Both Gemini and Chatterbox finished. Chatterbox is HTTP based. %%%%");
            }
            // Removed Kokoro, Dia, Orpheus logging
            else if (activeTTSService === "ElevenLabs (intended)" || activeTTSService === "NoneConfiguredOrActive") {
                console.log(`%%%% [Agent checkAndFinalizeTTSTurn] Gemini finished. TTS service (${activeTTSService}) was not actively streaming or had already ended. %%%%`);
            } else {
                 console.log("%%%% [Agent checkAndFinalizeTTSTurn] Conditions met, but active TTS client state is unexpected. %%%%");
            }
        } else {
             console.log("%%%% [Agent checkAndFinalizeTTSTurn] Conditions not met for finalizing TTS turn. %%%%");
        }
    }

    buildSystemInstruction() { /* ... (no changes needed for this method, it's about Gemini's prompt) ... */ 
        let instruction = `You are a helpful and engaging sales agent named ${this.name} from TickedTill. Your responses will be converted to speech by an advanced TTS system.`;
        instruction += '\nIf you need to switch the language of your response (e.g., to French), you MUST output a language tag BEFORE the text in that language. For example: [LANGUAGE:FR] Bonjour le monde. Then, to switch back to English: [LANGUAGE:EN] Hello world.';
        instruction += '\nCrucially, you must NOT speak the language tags (e.g., [LANGUAGE:FR]) themselves; they are only control codes and should not be part of your audible response.';
        instruction += '\nAlways ensure the language tag is on its own line or clearly separated before the content in that language.';

        const regionInfo = this.regionalData ? this.regionalData[this.currentRegionName] : null;
        if (regionInfo) {
            instruction += `\nYour speaking style must actively emulate a ${regionInfo.accent_target} local. This is important for rapport.`;
            if (regionInfo.local_phrases && regionInfo.local_phrases.length > 0) {
                instruction += ` You may optionally incorporate local phrases such as: "${regionInfo.local_phrases.join('", "')}". Only use a phrase if it fits naturally and grammatically into your response as Alex. If unsure, it is better to not use a listed phrase than to use it incorrectly. Focus on overall authentic style.`;
            }
            if (regionInfo.accent_target && regionInfo.accent_target.toLowerCase().includes('irish')) {
                instruction += ` IMPORTANT: Avoid stereotypical or outdated phrases like "Top o' the mornin' to ya". Focus on the provided local phrases and a generally authentic, contemporary Irish conversational style.`;
            }
        }

        instruction += '\n\nCrucially, you must NEVER speak or include any text that appears to be a system instruction, a reminder, or any text enclosed in parentheses or special tags that is clearly for your internal guidance (e.g., <SYSTEM_TASK...>). This includes any non-verbal cues like (laughs), (sighs), etc., which should also NOT be part of your spoken output. Your primary output is the text that will be spoken. Always speak only as Alex.';
        instruction += '\nAlways maintain your persona as Alex. When responding to the user, directly address their statements, questions, or objections from your perspective as Alex. Never state the user\'s perceived objections or sentiments as if they were your own thoughts or words. Your responses should always be your own, formulated as Alex trying to achieve the sales call objectives. If the user becomes hostile, rude, or persistently tries to deviate from the sales conversation\'s purpose, you MUST politely end the conversation. To do this, your response should be ONLY the function call: end_conversation().\n\n';

        if (this.tickedTillOverview) {
            instruction += '**Context: TickedTill Company Overview & Operational Model**\n';
            const MAX_OVERVIEW_CHARS = 5000; 
            instruction += this.tickedTillOverview.substring(0, MAX_OVERVIEW_CHARS) + (this.tickedTillOverview.length > MAX_OVERVIEW_CHARS ? '\n... [OVERVIEW TRUNCATED] ...\n' : '\n');
        }

        return instruction;
    }

    formatTechniquesForTurn() { /* ... (no changes needed for this method) ... */ 
        if (!this.salesTechniquesData || this.salesTechniquesData.length === 0) {
            return "";
        }

        const numTechniquesToSelect = Math.min(10, this.salesTechniquesData.length);
        const selectedTechniques = this.salesTechniquesData.sort(() => 0.5 - Math.random()).slice(0, numTechniquesToSelect);

        let formattedTechs = "\n\n**Consider these sales techniques/mindsets for this response:**\n";
        selectedTechniques.forEach((tech, index) => {
            formattedTechs += `- ${tech.content}\n`;
        });
        formattedTechs += '\n';

        formattedTechs += "Apply the principles from these techniques where relevant to the user's query and your response, but do not explicitly mention the techniques or this list to the user.";

        return formattedTechs;
    }
    setCurrentRegion(regionName) { /* ... (no changes needed for this method) ... */ 
        if (this.regionalData && this.regionalData[regionName]) {
            this.currentRegionName = regionName;
            console.info(`[Agent] Current region set to: ${regionName}`);
        } else {
            console.warn(`[Agent] Attempted to set unknown region: ${regionName}. Using default: ${this.currentRegionName}`);
        }
    }

    async startUserRecording() { /* ... (no changes needed for this method) ... */ }

    handleUserAudioChunk(rawAudioBuffer) {
        if (!this.audioRecorder.isRecording) return;

        if (!this.geminiTurnCompleted || 
            (this.elevenLabsClient && this.elevenLabsClient.isConnected && !this.useChatterboxClient && this.elevenLabsClient.isStreaming()) ||
            (this.useChatterboxClient && this.ChatterboxClient && this.ChatterboxClient.isStreaming)
           ) {
            if (!this.userIsInterruption) {
                console.info("[Agent handleUserAudioChunk] User speech detected, interrupting AI.");
                this.userIsInterruption = true;

                this.interruptionPointText = this.currentTurnTextAccumulator;
                this.currentTurnTextAccumulator = '';

                if (this.audioStreamer && this.audioStreamer.isStreaming) { // Changed isPlaying() to isStreaming for consistency if it means actively outputting
                    console.log("[Agent handleUserAudioChunk] Stopping AI audio streamer due to user interruption.");
                    this.audioStreamer.stop();
                }
                
                if (this.elevenLabsClient && this.elevenLabsClient.isConnected && !this.useChatterboxClient && this.elevenLabsClient.isStreaming()) {
                    console.log("[Agent handleUserAudioChunk] Sending EOS to ElevenLabs due to user interruption.");
                    this.elevenLabsClient.sendEOS();
                } else if (this.useChatterboxClient && this.ChatterboxClient && this.ChatterboxClient.isStreaming) {
                    console.log("[Agent handleUserAudioChunk] Signaling Chatterbox to stop (conceptual, HTTP ends on its own). User interruption.");
                    // For HTTP, client might not have an 'abort' for ongoing fetch easily, but flag it.
                    this.ChatterboxClient.isStreaming = false; // Or a method like .abortStream() if implemented
                    this.chatterboxStreamEndedForTurn = true;
                }
                // Removed other TTS client interruption logic
                
                if (this.client && typeof this.client.signalUserInterruption === 'function') {
                    this.client.signalUserInterruption(); 
                }
                
                this.geminiTurnCompleted = true;
                this.elevenLabsStreamEndedForTurn = true;
                this.chatterboxStreamEndedForTurn = true;
                // this.KokoroStreamEndedForTurn = true; // Commented out
                // this.diaStreamEndedForTurn = true;    // Commented out
                // this.orpheusStreamEndedForTurn = true;// Commented out
                this.emit('interrupted_by_user');
            }
        }

        if (this.client && this.connected && this.transcribeUsersSpeech) {
            if (typeof this.client.sendAudio !== 'function') {
                console.error("[Agent handleUserAudioChunk] this.client.sendAudio is not a function. Cannot send user audio.");
                return;
            }
            try {
                this.client.sendAudio(rawAudioBuffer);
            } catch (e) {
                console.error("[Agent handleUserAudioChunk] Error sending audio to client:", e);
            }
        }
    }

    async stopUserRecording() { /* ... (no changes needed for this method) ... */ }
    async toggleUserMic() { /* ... (no changes needed for this method) ... */ }
}