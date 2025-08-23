/**
 * AudioStreamer v6: Based on user's preferred version (digest3) with buffering tweaks.
 */

export class AudioStreamer {
    constructor(context) {
        if (!context || !(context instanceof AudioContext)) {
            throw new Error('Invalid AudioContext provided');
        }
        this.context = context;
        this.audioQueue = [];
        this.isPlaying = false;
        this._sampleRate = 24000; // Default TTS rate

        // *** Tweak Point 1: Buffer chunk size (100ms) ***
        this.bufferSize = Math.floor(this._sampleRate * 0.1); 

        this.processingBuffer = new Float32Array(0);
        this.scheduledTime = 0;
        this.gainNode = this.context.createGain();
        this.isStreamComplete = false;
        this.checkIntervalId = null; // Use checkIntervalId consistently

        // *** Tweak Point 2: Initial buffering delay (100ms) ***
        this.initialBufferTime = 0.1; 

        this.isInitialized = false;
        this.scheduledSources = new Set();
        this.endOfQueueAudioSource = null; // Keep track of the last source for completion (as in user's code)
        
        this.byteLeftover = null; // Buffer for a single leftover byte from an odd-length chunk

        this.gainNode.connect(this.context.destination);
        console.info('AudioStreamer constructed (v6)', { 
            initialSampleRate: this._sampleRate, 
            initialBufferSize: this.bufferSize,
            initialBufferTime: this.initialBufferTime 
        });
        
        this.streamAudio = this.streamAudio.bind(this);
        this.scheduleNextBuffer = this.scheduleNextBuffer.bind(this);
        this.stop = this.stop.bind(this);
        this.initialize = this.initialize.bind(this); // Ensure initialize is bound if needed
    }

    get sampleRate() { return this._sampleRate; }

    set sampleRate(value) {
        if (this._sampleRate === value) return;
        if (!Number.isFinite(value) || value <= 0 || value > 192000) {
            console.warn(`[AudioStreamer v6] Attempt to set invalid sample rate: ${value}. Using current: ${this._sampleRate}`);
            return;
        }
        console.info(`[AudioStreamer v6] Sample rate changing from ${this._sampleRate} to ${value}`);
        this._sampleRate = value;
        // *** Tweak Point 1 (Update): Buffer chunk size (100ms) ***
        this.bufferSize = Math.floor(this._sampleRate * 0.1); 
        console.info('[AudioStreamer v6] Sample rate updated', { newRate: value, newBufferSize: this.bufferSize });
    }

    streamAudio(newChunk) { // Expects Uint8Array (raw PCM16 bytes)
        if (!this.isInitialized) { console.warn('[AudioStreamer v6] Not initialized.'); return; }
        if (!newChunk || !(newChunk instanceof Uint8Array)) { console.warn('[AudioStreamer v6] Invalid audio chunk.'); return; }
        if (newChunk.length === 0 && !this.byteLeftover) return;

        let effectiveChunk;
        if (this.byteLeftover) {
            effectiveChunk = new Uint8Array(this.byteLeftover.length + newChunk.length);
            effectiveChunk.set(this.byteLeftover, 0);
            effectiveChunk.set(newChunk, this.byteLeftover.length);
            this.byteLeftover = null; 
        } else {
            effectiveChunk = newChunk;
        }

        if (effectiveChunk.length === 0) return;

        const processableLength = effectiveChunk.length - (effectiveChunk.length % 2);
    
        if (effectiveChunk.length % 2 !== 0) {
            this.byteLeftover = new Uint8Array([effectiveChunk[effectiveChunk.length - 1]]); 
        }

        if (processableLength === 0) {
            return;
        }

        try {
            const numSamples = processableLength / 2;
            const float32Array = new Float32Array(numSamples);
            const dataView = new DataView(effectiveChunk.buffer, effectiveChunk.byteOffset, processableLength); 

            for (let i = 0; i < numSamples; i++) {
                float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0;
            }
            if (numSamples > 0) {
                console.log(`%%%% [AudioStreamer streamAudio] Processed ${numSamples} samples. First 3:`, float32Array.slice(0,3));
            }
            
            if (this.processingBuffer.length > this.sampleRate * 5) { 
                console.warn(`[AudioStreamer v6] Processing buffer overflow (${this.processingBuffer.length}), resetting.`);
                this.processingBuffer = float32Array;
            } else {
                const newBuffer = new Float32Array(this.processingBuffer.length + float32Array.length);
                newBuffer.set(this.processingBuffer);
                newBuffer.set(float32Array, this.processingBuffer.length);
                this.processingBuffer = newBuffer;
            }
            
            while (this.processingBuffer.length >= this.bufferSize) {
                this.audioQueue.push(this.processingBuffer.slice(0, this.bufferSize));
                this.processingBuffer = this.processingBuffer.slice(this.bufferSize);
            }

            const queuedDuration = this.audioQueue.reduce((sum, buffer) => sum + buffer.length, 0) / this.sampleRate;

            if (!this.isPlaying && queuedDuration >= this.initialBufferTime) {
                console.log('%%%% [AudioStreamer streamAudio] Initial buffer filled, starting playback trigger (v6). Queue size:', this.audioQueue.length, 'Duration:', queuedDuration.toFixed(3), 's %%%%');
                this.isPlaying = true;
                if (this.gainNode && this.context.state === 'running') {
                    this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
                    this.gainNode.gain.setValueAtTime(1.0, this.context.currentTime);
                }
                this.scheduledTime = this.context.currentTime + this.initialBufferTime; 
                this.scheduleNextBuffer();
            } else if (this.isPlaying) {
                this.scheduleNextBuffer(); 
            }
        } catch (error) {
            console.error('%%%% [AudioStreamer streamAudio] Error processing audio chunk (v6):', error, '%%%%');
            this.byteLeftover = null; 
            this.stop();
        }
    }
    
    signalStreamCompletion() {
        console.log("%%%% [AudioStreamer signalStreamCompletion] Called (v6). %%%%");
        this.isStreamComplete = true;
        // Queue any remaining data from the processing buffer
        if (this.processingBuffer.length > 0) {
            this.audioQueue.push(this.processingBuffer);
            this.processingBuffer = new Float32Array(0);
             console.log('%%%% [AudioStreamer signalStreamCompletion] Queued final processing buffer data (v6). Queue size:', this.audioQueue.length, '%%%%');
        }
        // Ensure the scheduler runs to play out remaining items
        this.scheduleNextBuffer();
    }

    createAudioBuffer(audioData) {
        if (audioData.length === 0) return null;
        try {
            const audioBuffer = this.context.createBuffer(1, audioData.length, this.sampleRate);
            audioBuffer.getChannelData(0).set(audioData);
            return audioBuffer;
        } catch (e) {
            console.error("[AudioStreamer v6] Error creating AudioBuffer:", e); return null;
        }
    }

    scheduleNextBuffer() {
        if (this.checkIntervalId) {
            clearTimeout(this.checkIntervalId);
            this.checkIntervalId = null;
        }

        if (!this.isPlaying) {
            console.log('%%%% [AudioStreamer scheduleNextBuffer] Not playing, exiting scheduler. %%%%');
            return;
        }

        const SCHEDULE_AHEAD_TIME = 0.1;
        const MIN_TIMEOUT_DELAY = 20;
        const WAIT_TIMEOUT_DELAY = 50;

        try {
            let scheduledAny = false;
            while (this.audioQueue.length > 0 && (this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME)) {
                const audioData = this.audioQueue.shift();
                if (!audioData || audioData.length === 0) continue;

                const audioBuffer = this.createAudioBuffer(audioData);
                if (!audioBuffer) continue;
                
                const source = this.context.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(this.gainNode);
                
                const startTime = Math.max(this.scheduledTime, this.context.currentTime);
                source.start(startTime);
                source._scheduledStartTime = startTime; 
                this.scheduledTime = startTime + audioBuffer.duration;
                
                this.scheduledSources.add(source);
                scheduledAny = true;
                console.log(`%%%% [AudioStreamer scheduleNextBuffer] Source SCHEDULED. Start: ${startTime.toFixed(3)}, Duration: ${audioBuffer.duration.toFixed(3)}, ContextTime: ${this.context.currentTime.toFixed(3)} %%%%`);

                if (this.audioQueue.length === 0) {
                     if (this.endOfQueueAudioSource) { this.endOfQueueAudioSource.onended = null; }
                     this.endOfQueueAudioSource = source;
                }

                source.onended = () => {
                    this.scheduledSources.delete(source);
                    console.log(`%%%% [AudioStreamer onended] Source FINISHED. Scheduled Start: ${source._scheduledStartTime?.toFixed(3)}, Duration: ${source.buffer?.duration.toFixed(3)}, ContextTime at end: ${this.context.currentTime.toFixed(3)}. Remaining sources: ${this.scheduledSources.size} %%%%`);
                    
                    if (this.endOfQueueAudioSource === source) {
                       if (this.audioQueue.length === 0 && this.processingBuffer.length === 0) {
                           if (this.isStreamComplete) {
                               console.log('%%%% [AudioStreamer onended] Stream complete and last known source finished. Setting isPlaying=false. %%%%');
                               this.isPlaying = false;
                           }
                       }
                        this.endOfQueueAudioSource = null;
                    }
                };
            }
            if (!scheduledAny && this.audioQueue.length > 0) {
                console.log(`%%%% [AudioStreamer scheduleNextBuffer] No sources scheduled this run, but queue has ${this.audioQueue.length} items. ScheduledTime: ${this.scheduledTime.toFixed(3)}, ContextTime+Ahead: ${(this.context.currentTime + SCHEDULE_AHEAD_TIME).toFixed(3)} %%%%`);
            }

            if (this.audioQueue.length === 0 && this.processingBuffer.length === 0) {
                 if (this.isStreamComplete && this.scheduledSources.size === 0) {
                      this.isPlaying = false;
                 } else if (!this.isStreamComplete) {
                     this.checkIntervalId = setTimeout(this.scheduleNextBuffer, WAIT_TIMEOUT_DELAY);
                 }
            } else if (this.isPlaying) {
                 const timeTillNextScheduleWindow = (this.scheduledTime - this.context.currentTime - SCHEDULE_AHEAD_TIME) * 1000;
                 this.checkIntervalId = setTimeout(this.scheduleNextBuffer, Math.max(MIN_TIMEOUT_DELAY, timeTillNextScheduleWindow));
            }

        } catch (error) {
            console.error('%%%% [AudioStreamer scheduleNextBuffer] Error (v6):', error, '%%%%');
            this.stop();
        }
    }

    stop() {
        console.log('%%%% [AudioStreamer stop] Called (v6). %%%%');
        this.isPlaying = false;
        this.isStreamComplete = true; // Assume stop means no more data, current stream is done.
        this.scheduledTime = 0; // Reset scheduled time
        
        if (this.checkIntervalId) {
            clearTimeout(this.checkIntervalId); 
            this.checkIntervalId = null;
        }

        if (this.gainNode && this.context.state === 'running') {
            this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
            this.gainNode.gain.setValueAtTime(0, this.context.currentTime); 
            console.log('%%%% [AudioStreamer stop] Gain node value instantly set to 0 via stop(). %%%%');
        }
        
        const sourcesToStop = new Set(this.scheduledSources);
        sourcesToStop.forEach(source => {
            try { 
                source.onended = null;
                source.stop(0);         // Stop playback immediately
                source.disconnect();    // Disconnect from graph
            } catch (e) {
                // console.warn("[AudioStreamer stop] Error stopping/disconnecting a source:", e);
            }
        });
        this.scheduledSources.clear();

        if (this.endOfQueueAudioSource) {
             this.endOfQueueAudioSource.onended = null;
             this.endOfQueueAudioSource = null;
        }
        
        this.audioQueue = []; 
        this.processingBuffer = new Float32Array(0);
        
        console.info('%%%% [AudioStreamer stop] Stop processing complete (v6). Queues cleared, sources stopped, gain set to 0. %%%%');
    }

    async initialize() {
        console.log(`%% [AudioStreamer initialize] Called (v6). Context state: ${this.context.state} %%`);
        if (this.context.state === 'suspended') {
            console.warn("[AudioStreamer initialize] AudioContext is suspended. It must be resumed by a user gesture.");
            // Do not throw or block here; allow initialization to proceed as much as possible.
            // The context can be resumed later.
            // However, gainNode and destination connections might fail if context isn't running.
            // We can try to set them up and they might connect once resumed.
        }

        try {
            this.gainNode = this.context.createGain();
            this.gainNode.connect(this.context.destination);
            this.isInitialized = true;
            console.log(`%% [AudioStreamer initialize] Initialization attempt marked as complete (v6). Actual context state: ${this.context.state} %%`);
        } catch (error) {
            console.error("[AudioStreamer initialize] Error setting up gain node or connecting to destination:", error);
            this.isInitialized = false; // Mark as not initialized if setup fails
            // Do not re-throw here to allow agent initialization to continue
        }
    }

    async resumePlaybackContext() {
        if (this.context && this.context.state === 'suspended') {
            console.info('[AudioStreamer resumePlaybackContext] Attempting to resume AudioContext...');
            try {
                await this.context.resume();
                console.info(`[AudioStreamer resumePlaybackContext] AudioContext resumed. New state: ${this.context.state}`);
                // Re-check gainNode connection as it might have failed if context was suspended during initialize
                if (this.gainNode && this.context.destination && this.gainNode.context.state === 'running') {
                    try {
                        this.gainNode.disconnect(); // Disconnect if already connected to avoid issues
                    } catch(e) { /* ignore */ }
                    this.gainNode.connect(this.context.destination);
                    console.info('[AudioStreamer resumePlaybackContext] Re-connected gainNode to destination.');
                }
            } catch (error) {
                console.error('[AudioStreamer resumePlaybackContext] Error resuming AudioContext:', error);
                return false;
            }
        }
        return this.context && this.context.state === 'running';
    }
}
