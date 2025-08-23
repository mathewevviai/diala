import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Start a new telephony call
export const startCall = action({
  args: {
    callId: v.string(),
    userId: v.string(),
    phoneNumber: v.string(),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
  },
  handler: async (ctx, args) => {
    try {
      // Create call record
      await ctx.runMutation(api.mutations.telephony.createCall, {
        callId: args.callId,
        userId: args.userId,
        phoneNumber: args.phoneNumber,
        direction: args.direction,
      });

      // Create telephony job
      const jobId = `tel_${args.callId}`;
      await ctx.runMutation(api.mutations.telephony.createJob, {
        jobId,
        userId: args.userId,
        callId: args.callId,
        jobType: "call_start",
        status: "pending",
        progress: {
          overall: 0,
          currentStage: 0,
          itemsTotal: 1,
          itemsCompleted: 0,
          itemsFailed: 0
        },
      });

      // Start GStreamer pipeline
      const gstreamerJob = await ctx.runAction(api.actions.telephony.startGStreamer, {
        callId: args.callId,
        userId: args.userId,
        port: 5000 + Math.floor(Math.random() * 1000),
      });

      return {
        callId: args.callId,
        jobId,
        gstreamerPort: gstreamerJob.port,
        websocketUrl: `ws://localhost:${gstreamerJob.port}/audio`,
      };
    } catch (error) {
      console.error("Error starting call:", error);
      throw error;
    }
  },
});

// Process audio chunk with ASR/sentiment
export const processAudioChunk = action({
  args: {
    callId: v.string(),
    chunkId: v.string(),
    audioData: v.string(), // Base64
    sequence: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Store audio chunk
      await ctx.runMutation(api.mutations.telephony.ingestAudioChunk, {
        callId: args.callId,
        chunkId: args.chunkId,
        sequence: args.sequence,
        audioData: args.audioData,
        format: "webm",
        sampleRate: 16000,
        duration: 1.0,
        processed: false,
        timestamp: new Date().toISOString(),
      });

      // Send to backend ASR service
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      const response = await fetch(`${backendUrl}/api/telephony/process-chunk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: args.callId,
          chunk_id: args.chunkId,
          audio_data: args.audioData,
          sequence: args.sequence,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update chunk with results
      await ctx.runMutation(api.mutations.telephony.updateChunk, {
        callId: args.callId,
        chunkId: args.chunkId,
        transcript: result.transcript,
        sentiment: result.sentiment,
        speaker: result.speaker,
        processed: true,
      });

      // Update call with real-time transcript
      await ctx.runMutation(api.mutations.telephony.updateCallTranscript, {
        callId: args.callId,
        transcript: result.transcript,
        sentiment: result.sentiment,
      });

      return result;
    } catch (error) {
      console.error("Error processing audio chunk:", error);
      
      // Mark chunk as failed
      await ctx.runMutation(api.mutations.telephony.updateChunk, {
        callId: args.callId,
        chunkId: args.chunkId,
        processed: true,
      });
      
      throw error;
    }
  },
});

// End call and process final results
export const endCall = action({
  args: {
    callId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Stop GStreamer pipeline
      await ctx.runAction(api.actions.telephony.stopGStreamer, {
        callId: args.callId,
      });

      // Create final processing job
      const jobId = `tel_end_${args.callId}`;
      await ctx.runMutation(api.mutations.telephony.createJob, {
        jobId,
        userId: "anonymous", // Or get from auth
        callId: args.callId,
        jobType: "call_end",
        status: "pending",
        progress: {
          overall: 0,
          currentStage: 0,
          itemsTotal: 1,
          itemsCompleted: 0,
          itemsFailed: 0
        },
      });

      // Process final transcription
      const finalResult = await ctx.runAction(api.actions.telephony.processFinal, {
        callId: args.callId,
      });

      // Update call status
      await ctx.runMutation(api.mutations.telephony.completeCall, {
        callId: args.callId,
        finalTranscript: finalResult.transcript,
        sentimentAnalysis: finalResult.sentiment,
        speakerDiarization: finalResult.speakers,
      });

      return finalResult;
    } catch (error) {
      console.error("Error ending call:", error);
      throw error;
    }
  },
});

// Start GStreamer pipeline
export const startGStreamer = action({
  args: {
    callId: v.string(),
    userId: v.string(),
    port: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const jobId = `gst_${args.callId}`;
      
      await ctx.db.insert("gstreamerJobs", {
        jobId,
        callId: args.callId,
        userId: args.userId,
        pipeline: "webrtc-to-backend",
        port: args.port,
        codec: "opus",
        status: "starting",
        bytesProcessed: 0,
        packetsReceived: 0,
        errors: [],
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
      });

      return { jobId, port: args.port };
    } catch (error) {
      console.error("Error starting GStreamer:", error);
      throw error;
    }
  },
});

// Stop GStreamer pipeline
export const stopGStreamer = action({
  args: {
    callId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const jobs = await ctx.db
        .query("gstreamerJobs")
        .withIndex("by_call", (q) => q.eq("callId", args.callId))
        .collect();

      for (const job of jobs) {
        await ctx.db.patch(job._id, {
          status: "completed",
          completedAt: new Date().toISOString(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error stopping GStreamer:", error);
      throw error;
    }
  },
});

// Process final transcription
export const processFinal = action({
  args: {
    callId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      const response = await fetch(`${backendUrl}/api/telephony/process-final`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: args.callId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error processing final transcription:", error);
      throw error;
    }
  },
});

// Get call status
export const getCallStatus = action({
  args: {
    callId: v.string(),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("telephonyCalls")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (!call) {
      throw new Error(`Call ${args.callId} not found`);
    }

    return call;
  },
});

// Get real-time transcript
export const getRealtimeTranscript = action({
  args: {
    callId: v.string(),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("telephonyCalls")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (!call) {
      throw new Error(`Call ${args.callId} not found`);
    }

    const chunks = await ctx.db
      .query("audioChunks")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .order("desc")
      .take(10);

    return {
      currentTranscript: call.currentTranscript,
      currentSentiment: call.currentSentiment,
      speakerLabels: call.speakerLabels,
      recentChunks: chunks,
    };
  },
});