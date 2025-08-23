import { arrayBufferToBase64 } from '../utils/utils.js';

/**
 * AudioRecorder manages the capture and processing of audio input from the user's microphone.
 * It uses the Web Audio API and AudioWorklet to process audio in real-time with minimal latency.
 * The processed audio (Int16) is passed raw to the callback.
 */
export class AudioRecorder extends EventTarget {
    constructor({ targetSampleRate = 16000 } = {}) {
        super();
        this.targetSampleRate = targetSampleRate;
        this.stream = null;
        this.audioContext = null;
        this.source = null;
        this.processor = null;
        this.onRawAudioData = null; // Renamed callback for clarity
        this.isRecording = false;
        this.isSuspended = false;
    }

    /**
     * Initializes and starts audio capture pipeline.
     * @param {Function} onRawAudioData - Callback receiving raw Int16 ArrayBuffer audio chunks.
     */
    async start(onRawAudioData) { // Callback name updated
        this.onRawAudioData = onRawAudioData; // Store the callback
        if (this.isRecording) {
             console.warn("AudioRecorder: Already recording.");
             return;
        }
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: this.targetSampleRate,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Ensure AudioContext is created or resumed
            if (!this.audioContext || this.audioContext.state === 'closed') {
                 this.audioContext = new AudioContext({ sampleRate: this.targetSampleRate });
            } else if (this.audioContext.state === 'suspended') {
                 await this.audioContext.resume();
            }

            this.source = this.audioContext.createMediaStreamSource(this.stream);

            // Ensure worklet is added only once per context lifetime if needed,
            // but adding it here is usually fine.
            try {
                 await this.audioContext.audioWorklet.addModule('js/audio/worklets/audio-processor.js');
            } catch (e) {
                // Handle case where module might already be added (e.g., re-init without full page reload)
                 if (!e.message.includes("already been loaded")) {
                     console.error("Failed to add audio worklet module:", e);
                     throw e; // Rethrow if it's not the 'already loaded' error
                 } else {
                     console.warn("Audio worklet module already loaded.");
                 }
            }

            this.processor = new AudioWorkletNode(this.audioContext, 'audio-recorder-worklet');

            this.processor.port.onmessage = (event) => {
                if (!this.isRecording) return;

                if (event.data.event === 'chunk' && this.onRawAudioData) {
                    // ** Pass the raw ArrayBuffer directly **
                    const rawAudioBuffer = event.data.data.int16arrayBuffer;
                    this.onRawAudioData(rawAudioBuffer); // Call the callback with raw data
                } else if (event.data.event === 'error') {
                    console.error("Error from audio-processor worklet:", event.data.error);
                    // Optionally propagate error via event target
                    this.dispatchEvent(new CustomEvent('error', { detail: event.data.error }));
                }
            };

            this.source.connect(this.processor);
            // Do NOT connect processor to destination unless you want mic echo
            // this.processor.connect(this.audioContext.destination);
            this.isRecording = true;
            this.isSuspended = false; // Ensure suspended state is reset
            console.info('Audio recording started.');

        } catch (error) {
            console.error('Failed to start audio recording:', error);
            this.stop(); // Clean up on failure
            throw error; // Re-throw for caller
        }
    }

    stop() {
        console.info('Attempting to stop audio recording...');
        if (!this.isRecording && !this.stream && (!this.audioContext || this.audioContext.state === 'closed')) {
            console.info('Audio recording already stopped or not started.');
            return; // Already stopped or not started
        }

        this.isRecording = false; // Set flag immediately

        // Disconnect nodes first
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.processor) {
            this.processor.disconnect();
             // Consider closing the port if necessary: this.processor.port.close();
            this.processor = null;
        }

        // Stop media tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }


        // Close AudioContext (consider if context is shared, maybe just suspend?)
        // Closing is usually safer for complete cleanup if context is dedicated to recorder.
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close()
                .then(() => console.info('AudioContext closed successfully.'))
                .catch(e => console.warn('Error closing AudioContext:', e.message));
            this.audioContext = null;
        }

        this.onRawAudioData = null; // Clear callback reference
        console.info('Audio recording stopped and resources cleaned up.');
    }

    async suspendMic() {
        if (!this.isRecording || this.isSuspended || !this.stream || !this.audioContext || this.audioContext.state !== 'running') {
             console.warn("Cannot suspend mic: Not recording, already suspended, or context not running.");
             return;
        }

        try {
            await this.audioContext.suspend();
            // Disabling tracks might not be necessary if context is suspended, but can be belt-and-suspenders
            // this.stream.getTracks().forEach(track => track.enabled = false);
            this.isSuspended = true;
            console.info('Microphone suspended (AudioContext suspended).');
        } catch (error) {
            console.error('Failed to suspend microphone:', error);
        }
    }

    async resumeMic() {
        if (!this.isRecording || !this.isSuspended || !this.audioContext || this.audioContext.state !== 'suspended') {
             console.warn("Cannot resume mic: Not recording, not suspended, or context not suspended.");
             return;
        }

        try {
            await this.audioContext.resume();
            // Re-enable tracks if they were disabled
            // this.stream?.getTracks().forEach(track => track.enabled = true);
            this.isSuspended = false;
            console.info('Microphone resumed (AudioContext resumed).');
        } catch (error) {
            console.error('Failed to resume microphone:', error);
        }
    }

    async toggleMic() {
        if (!this.isRecording || !this.audioContext) {
             console.warn("Cannot toggle mic: Not recording or no audio context.");
             return;
        }
        if (this.isSuspended) {
            await this.resumeMic();
        } else {
            await this.suspendMic();
        }
        // The 'active' class toggle should happen in the UI event handler based on recorder state
    }
}
