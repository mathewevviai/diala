// frontend/convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Voice Agents table
  voiceAgents: defineTable({
    name: v.string(),
    description: v.string(),
    userId: v.string(),
    purpose: v.union(v.literal("sales"), v.literal("support"), v.literal("appointment"), v.literal("technical"), v.literal("custom")),
    customPurpose: v.optional(v.string()),
    voiceProvider: v.union(v.literal("elevenlabs"), v.literal("chatterbox")),
    voiceId: v.string(),
    voiceStyle: v.union(v.literal("professional"), v.literal("friendly"), v.literal("energetic"), v.literal("calm"), v.literal("custom")),
    speechRate: v.number(),
    pitch: v.number(),
    language: v.string(),
    responseDelay: v.number(),
    interruptionSensitivity: v.number(),
    silenceThreshold: v.number(),
    maxCallDuration: v.number(),
    systemPrompt: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),
    enableTranscription: v.boolean(),
    enableAnalytics: v.boolean(),
    webhookUrl: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("offline"), v.literal("configuring"), v.literal("error")),
    createdAt: v.string(),
    updatedAt: v.string(),
    lastActiveAt: v.optional(v.string()),
    totalCalls: v.number(),
    successRate: v.number(),
    avgCallDuration: v.string(),
    satisfactionRating: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_purpose", ["purpose"])
    .index("by_created", ["createdAt"])
    .index("by_user_status", ["userId", "status"]),

  // Call Analytics table
  callAnalytics: defineTable({
    callId: v.string(),
    agentName: v.string(),
    agentId: v.optional(v.id("voiceAgents")),
    customerName: v.string(),
    customerPhone: v.string(),
    status: v.union(v.literal("COMPLETED"), v.literal("FAILED"), v.literal("TRANSFERRED"), v.literal("ABANDONED")),
    startTime: v.string(),
    endTime: v.string(),
    duration: v.string(),
    queueTime: v.string(),
    holdTime: v.string(),
    resolution: v.union(v.literal("RESOLVED"), v.literal("UNRESOLVED"), v.literal("ESCALATED"), v.literal("TRANSFERRED")),
    hasTransfer: v.boolean(),
    sentiment: v.union(v.literal("POSITIVE"), v.literal("NEGATIVE"), v.literal("NEUTRAL"), v.literal("MIXED")),
    qualityScore: v.string(),
    campaignId: v.optional(v.id("campaigns")),
    campaignName: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_callId", ["callId"])
    .index("by_agent", ["agentName"])
    .index("by_agentId", ["agentId"])
    .index("by_customer", ["customerPhone"])
    .index("by_campaign", ["campaignId"])
    .index("by_date", ["startTime"]),

  // Agent Call Logs
  agentCallLogs: defineTable({
    agentId: v.id("voiceAgents"),
    callId: v.string(),
    phoneNumber: v.string(),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    startTime: v.string(),
    endTime: v.optional(v.string()),
    duration: v.optional(v.number()),
    status: v.union(v.literal("completed"), v.literal("failed"), v.literal("no_answer"), v.literal("busy"), v.literal("cancelled")),
    disposition: v.optional(v.string()),
    sentimentScore: v.optional(v.number()),
    satisfactionRating: v.optional(v.number()),
    recordingUrl: v.optional(v.string()),
    webhookSent: v.boolean(),
    webhookResponse: v.optional(v.string()),
  })
    .index("by_agent", ["agentId"])
    .index("by_call", ["callId"])
    .index("by_agent_time", ["agentId", "startTime"]),

  // Live Calls
  liveCalls: defineTable({
    callId: v.string(),
    agentId: v.id("voiceAgents"),
    agentName: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    startTime: v.string(),
    duration: v.string(),
    status: v.union(v.literal("connecting"), v.literal("active"), v.literal("hold"), v.literal("transferring")),
    sentiment: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
    lastTranscriptUpdate: v.string(),
    isRecording: v.boolean(),
  })
    .index("by_agent", ["agentId"])
    .index("by_status", ["status"]),

  // Swarm Campaigns
  campaigns: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("outbound"), v.literal("inbound"), v.literal("hybrid")),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("scheduled")),
    maxConcurrentCalls: v.number(),
    callsPerHour: v.number(),
    retryAttempts: v.number(),
    timeBetweenRetries: v.number(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    activeHours: v.object({ start: v.string(), end: v.string(), timezone: v.string() }),
    totalCalls: v.number(),
    completedCalls: v.number(),
    successfulCalls: v.number(),
    avgCallDuration: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_date", ["createdAt"]),

  // Campaign Agents
  campaignAgents: defineTable({
    campaignId: v.id("campaigns"),
    agentId: v.id("voiceAgents"),
    assignedAt: v.string(),
    callsHandled: v.number(),
    successRate: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_agent", ["agentId"]),

  // Phone Numbers
  phoneNumbers: defineTable({
    number: v.string(),
    displayName: v.string(),
    type: v.union(v.literal("sip"), v.literal("pstn"), v.literal("virtual")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance")),
    provider: v.string(),
    location: v.string(),
    assignedUser: v.optional(v.string()),
    callsToday: v.number(),
    callsThisWeek: v.number(),
    callsThisMonth: v.number(),
    successRate: v.number(),
    avgCallDuration: v.string(),
    lastUsed: v.string(),
    sipConfig: v.optional(v.object({ endpoint: v.string(), username: v.string(), domain: v.string(), port: v.number(), protocol: v.union(v.literal("UDP"), v.literal("TCP"), v.literal("TLS")), codec: v.array(v.string()) })),
    features: v.array(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_provider", ["provider"]),

  // Transcript Entries
  transcriptEntries: defineTable({
    callId: v.string(),
    callAnalyticsId: v.optional(v.id("callAnalytics")),
    timestamp: v.string(),
    speaker: v.union(v.literal("agent"), v.literal("customer"), v.literal("system")),
    content: v.string(),
    sentiment: v.optional(v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral"))),
    order: v.number(),
  })
    .index("by_call", ["callId"])
    .index("by_analytics", ["callAnalyticsId", "order"])
    .index("by_speaker", ["callId", "speaker"]),

  // Dashboard Statistics
  dashboardStats: defineTable({
    userId: v.string(),
    date: v.string(),
    totalCalls: v.number(),
    activeCalls: v.number(),
    successRate: v.number(),
    avgCallDuration: v.string(),
    totalAgents: v.number(),
    activeAgents: v.number(),
    idleAgents: v.number(),
    offlineAgents: v.number(),
    inboundCalls: v.number(),
    outboundCalls: v.number(),
    completedCalls: v.number(),
    failedCalls: v.number(),
    avgSentimentScore: v.number(),
    avgQualityScore: v.number(),
    transferRate: v.number(),
    updatedAt: v.string(),
  })
    .index("by_user_date", ["userId", "date"]),

  // YouTube Transcripts
  youtubeTranscripts: defineTable({
    videoId: v.string(),
    youtubeUrl: v.string(),
    transcript: v.optional(v.string()),
    language: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    createdAt: v.string(),
    userId: v.optional(v.string()),
    videoTitle: v.optional(v.string()),
    videoAuthor: v.optional(v.string()),
    videoDuration: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
  })
    .index("by_video", ["videoId"])
    .index("by_user", ["userId"]),

  // Transcript Jobs Queue
  transcriptJobs: defineTable({
    jobId: v.string(),
    userId: v.string(),
    youtubeUrl: v.string(),
    videoId: v.string(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    error: v.optional(v.string()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
    videoTitle: v.optional(v.string()),
    videoAuthor: v.optional(v.string()),
  })
    .index("by_job", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Hunter Lead Searches
  leadSearches: defineTable({
    searchId: v.string(),
    userId: v.string(),
    searchName: v.string(),
    searchObjective: v.string(),
    selectedSources: v.array(v.string()),
    industry: v.string(),
    location: v.string(),
    companySize: v.optional(v.string()),
    jobTitles: v.array(v.string()),
    keywords: v.optional(v.string()),
    includeEmails: v.boolean(),
    includePhones: v.boolean(),
    includeLinkedIn: v.boolean(),
    validationCriteria: v.optional(v.object({ mustHaveWebsite: v.boolean(), mustHaveContactInfo: v.boolean(), mustHaveSpecificKeywords: v.array(v.string()), mustBeInIndustry: v.boolean(), customValidationRules: v.string() })),
    status: v.union(v.literal("pending"), v.literal("initializing"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    progress: v.number(),
    currentStage: v.optional(v.string()),
    error: v.optional(v.string()),
    totalLeads: v.optional(v.number()),
    verifiedEmails: v.optional(v.number()),
    verifiedPhones: v.optional(v.number()),
    businessWebsites: v.optional(v.number()),
    avgResponseRate: v.optional(v.string()),
    searchTime: v.optional(v.string()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
    updatedAt: v.string(),
    expiresAt: v.optional(v.string()),
    userTier: v.optional(v.union(v.literal("free"), v.literal("premium"), v.literal("enterprise"))),
  })
    .index("by_search", ["searchId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created", ["createdAt"])
    .index("by_expiry", ["expiresAt"]),

  // Lead Search Results
  leadSearchResults: defineTable({
    searchId: v.string(),
    leadId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedInUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    location: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    seniority: v.optional(v.string()),
    emailVerified: v.boolean(),
    phoneVerified: v.boolean(),
    confidence: v.number(),
    dataSource: v.string(),
    extractedAt: v.string(),
    lastUpdated: v.string(),
  })
    .index("by_search", ["searchId"])
    .index("by_lead", ["leadId"])
    .index("by_email", ["email"])
    .index("by_company", ["companyName"])
    .index("by_source", ["dataSource"]),

  // User Subscriptions
  userSubscriptions: defineTable({
    userId: v.string(),
    tier: v.union(v.literal("free"), v.literal("premium"), v.literal("enterprise")),
    searchesPerDay: v.number(),
    leadsPerSearch: v.number(),
    totalLeadsPerMonth: v.number(),
    searchesToday: v.number(),
    leadsThisMonth: v.number(),
    lastResetDate: v.string(),
    subscriptionId: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("expired"), v.literal("trial")),
    createdAt: v.string(),
    updatedAt: v.string(),
    expiresAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_tier", ["tier"])
    .index("by_status", ["status"]),

  // Rate Limit Tracking
  rateLimitTracking: defineTable({
    userId: v.string(),
    feature: v.string(),
    windowStart: v.string(),
    requestCount: v.number(),
    lastRequest: v.string(),
  })
    .index("by_user_feature", ["userId", "feature"])
    .index("by_window", ["windowStart"]),

  // Lead Export Jobs
  leadExportJobs: defineTable({
    exportId: v.string(),
    userId: v.string(),
    searchId: v.string(),
    format: v.union(v.literal("csv"), v.literal("json"), v.literal("xlsx")),
    fields: v.array(v.string()),
    filters: v.optional(v.object({ emailVerified: v.optional(v.boolean()), phoneVerified: v.optional(v.boolean()), minConfidence: v.optional(v.number()), dataSources: v.optional(v.array(v.string())) })),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    progress: v.number(),
    recordCount: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
    expiresAt: v.string(),
    error: v.optional(v.string()),
  })
    .index("by_export", ["exportId"])
    .index("by_user", ["userId"])
    .index("by_search", ["searchId"])
    .index("by_status", ["status"]),

  // RAG Workflows
  ragWorkflows: defineTable({
    workflowId: v.string(),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    sourceType: v.union(v.literal("youtube"), v.literal("tiktok"), v.literal("twitch"), v.literal("documents"), v.literal("urls"), v.literal("csv"), v.literal("mixed")),
    embeddingModel: v.string(),
    chunkSize: v.number(),
    overlap: v.number(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("embedding"), v.literal("completed"), v.literal("failed"), v.literal("expired")),
    progress: v.number(),
    currentStage: v.optional(v.string()),
    totalSources: v.number(),
    processedSources: v.number(),
    totalChunks: v.number(),
    totalEmbeddings: v.number(),
    totalTokens: v.number(),
    indexSize: v.string(),
    userTier: v.union(v.literal("free"), v.literal("premium"), v.literal("enterprise")),
    totalFileSize: v.number(),
    createdAt: v.string(),
    startedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    estimatedCost: v.number(),
    actualCost: v.optional(v.number()),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_expiry", ["expiresAt"]),

  // RAG Sources
  ragSources: defineTable({
    sourceId: v.string(),
    workflowId: v.string(),
    userId: v.string(),
    sourceType: v.union(v.literal("youtube_video"), v.literal("youtube_channel"), v.literal("tiktok_video"), v.literal("tiktok_channel"), v.literal("twitch_video"), v.literal("twitch_channel"), v.literal("document"), v.literal("url")),
    sourceUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("downloading"), v.literal("extracting"), v.literal("chunking"), v.literal("completed"), v.literal("failed")),
    error: v.optional(v.string()),
    content: v.optional(v.string()),
    metadata: v.optional(v.object({ title: v.optional(v.string()), author: v.optional(v.string()), duration: v.optional(v.number()), language: v.optional(v.string()), wordCount: v.optional(v.number()) })),
    chunkCount: v.number(),
    tokenCount: v.number(),
    createdAt: v.string(),
    processedAt: v.optional(v.string()),
  })
    .index("by_source", ["sourceId"])
    .index("by_workflow", ["workflowId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // RAG Embeddings
  ragEmbeddings: defineTable({
    embeddingId: v.string(),
    workflowId: v.string(),
    sourceId: v.string(),
    userId: v.string(),
    chunkIndex: v.number(),
    chunkText: v.string(),
    chunkTokens: v.number(),
    embedding: v.array(v.float64()),
    embeddingModel: v.string(),
    dimensions: v.number(),
    metadata: v.optional(v.object({ sourceType: v.optional(v.string()), position: v.optional(v.object({ start: v.number(), end: v.number() })), context: v.optional(v.string()) })),
    confidence: v.optional(v.number()),
    createdAt: v.string(),
    expiresAt: v.optional(v.string()),
  })
    .index("by_embedding", ["embeddingId"])
    .index("by_workflow", ["workflowId"])
    .index("by_source", ["sourceId"])
    .index("by_user", ["userId"])
    .index("by_expiry", ["expiresAt"]),

  // RAG Export Jobs
  ragExportJobs: defineTable({
    exportId: v.string(),
    workflowId: v.string(),
    userId: v.string(),
    format: v.union(v.literal("json"), v.literal("jsonl"), v.literal("csv"), v.literal("parquet"), v.literal("pinecone"), v.literal("weaviate")),
    includeMetadata: v.boolean(),
    includeChunks: v.boolean(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    progress: v.number(),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    recordCount: v.optional(v.number()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
    expiresAt: v.string(),
    error: v.optional(v.string()),
  })
    .index("by_export", ["exportId"])
    .index("by_workflow", ["workflowId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Audio Transcripts - FINAL, CORRECTED VERSION
  audioTranscripts: defineTable({
    jobId: v.string(),
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileFormat: v.string(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    transcript: v.optional(v.string()),
    speakers: v.optional(v.array(v.object({
      speaker: v.string(),
      start: v.number(),
      end: v.number(),
      duration: v.number(),
      text: v.optional(v.string()),                    // 🔥 Transcribed text for this segment
      sentiment: v.optional(v.string()),               // 🎭 Basic sentiment
      speaker_similarity: v.optional(v.number()),      // 🎯 Speaker ID confidence
      langextract_analysis: v.optional(v.any()),       // 🔥 LangExtract analysis per segment
      emotion2vec: v.optional(v.any())                 // 🎭 Emotion2Vec results per segment
    }))),
    // Optional: structured insights from LangExtract webhook
    langextract: v.optional(v.any()),
    processingStartedAt: v.optional(v.union(v.number(), v.string())),
    completedAt: v.optional(v.union(v.number(), v.string())),
    error: v.optional(v.string()),
    createdAt: v.optional(v.any()),
    expiresAt: v.optional(v.any()),
  })
    .index("by_job", ["jobId"])
    .index("by_user", ["userId", "status"])
    .index("by_user_creation", ["userId"]),

  
  // TikTok Users
  tiktokUsers: defineTable({
    username: v.string(),
    userId: v.string(),
    secUid: v.string(),
    avatar: v.optional(v.string()),
    nickname: v.optional(v.string()),
    signature: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    videoCount: v.optional(v.number()),
    heartCount: v.optional(v.number()),
    privateAccount: v.optional(v.boolean()),
    cachedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_userId", ["userId"])
    .index("by_cached", ["cachedAt"]),
  
  // TikTok Videos
  tiktokVideos: defineTable({
    videoId: v.string(),
    username: v.string(),
    title: v.string(),
    thumbnail: v.optional(v.string()),
    dynamicCover: v.optional(v.string()),
    duration: v.number(),
    createTime: v.number(),
    views: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    saves: v.number(),
    playAddr: v.optional(v.string()),
    downloadAddr: v.optional(v.string()),
    downloadStatus: v.optional(v.union(v.literal("pending"), v.literal("downloading"), v.literal("completed"), v.literal("failed"))),
    localPath: v.optional(v.string()),
    musicId: v.optional(v.string()),
    musicTitle: v.optional(v.string()),
    musicAuthor: v.optional(v.string()),
    musicOriginal: v.optional(v.boolean()),
    hashtags: v.optional(v.array(v.object({ id: v.string(), name: v.string(), title: v.optional(v.string()) }))),
    cachedAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_username", ["username"])
    .index("by_cached", ["cachedAt"])
    .index("by_download_status", ["downloadStatus"]),
  
  // TikTok Jobs
  tiktokJobs: defineTable({
    jobId: v.string(),
    userId: v.string(),
    username: v.string(),
    action: v.union(v.literal("fetch_user"), v.literal("fetch_videos"), v.literal("download_videos")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("downloading"), v.literal("completed"), v.literal("failed")),
    videoIds: v.optional(v.array(v.string())),
    progress: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    completedVideos: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_job", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_username", ["username"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created", ["createdAt"]),
  
  // YouTube Channels
  youtubeChannels: defineTable({
    channelId: v.string(),
    channelName: v.string(),
    channelHandle: v.optional(v.string()),
    channelUrl: v.string(),
    avatar: v.optional(v.string()),
    banner: v.optional(v.string()),
    description: v.optional(v.string()),
    subscriberCount: v.optional(v.number()),
    videoCount: v.optional(v.number()),
    viewCount: v.optional(v.number()),
    joinedDate: v.optional(v.string()),
    country: v.optional(v.string()),
    cachedAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_handle", ["channelHandle"])
    .index("by_name", ["channelName"])
    .index("by_cached", ["cachedAt"]),
  
  // YouTube Videos
  youtubeVideos: defineTable({
    videoId: v.string(),
    channelId: v.string(),
    channelName: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    thumbnails: v.optional(v.array(v.object({ quality: v.string(), url: v.optional(v.string()), width: v.number(), height: v.number() }))),
    duration: v.number(),
    uploadDate: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    likeCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    language: v.optional(v.string()),
    downloadStatus: v.optional(v.union(v.literal("pending"), v.literal("downloading"), v.literal("completed"), v.literal("failed"))),
    localPath: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    hasTranscript: v.optional(v.boolean()),
    transcriptLanguages: v.optional(v.array(v.string())),
    cachedAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_channel", ["channelId"])
    .index("by_channel_name", ["channelName"])
    .index("by_upload", ["uploadDate"])
    .index("by_cached", ["cachedAt"])
    .index("by_download_status", ["downloadStatus"]),
  
  // YouTube Jobs
  youtubeJobs: defineTable({
    jobId: v.string(),
    userId: v.string(),
    channelUrl: v.optional(v.string()),
    channelId: v.optional(v.string()),
    action: v.union(v.literal("fetch_channel"), v.literal("fetch_videos"), v.literal("download_videos")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("downloading"), v.literal("completed"), v.literal("failed")),
    videoIds: v.optional(v.array(v.string())),
    sortBy: v.optional(v.string()),
    count: v.optional(v.number()),
    progress: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    completedVideos: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_job", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_channel", ["channelId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created", ["createdAt"]),
  
  // Twitch Channels
  twitchChannels: defineTable({
    username: v.string(),
    displayName: v.string(),
    profileImage: v.optional(v.string()),
    bio: v.optional(v.string()),
    isVerified: v.boolean(),
    isPartner: v.boolean(),
    followerCount: v.number(),
    videoCount: v.number(),
    isLive: v.boolean(),
    channelUrl: v.string(),
    cachedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_cached", ["cachedAt"]),
  
  // Twitch Videos
  twitchVideos: defineTable({
    videoId: v.string(),
    channelUsername: v.string(),
    title: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.number(),
    viewCount: v.number(),
    createdAt: v.number(),
    url: v.optional(v.string()),
    type: v.union(v.literal("vod"), v.literal("clip"), v.literal("highlight")),
    game: v.optional(v.string()),
    language: v.optional(v.string()),
    description: v.optional(v.string()),
    downloadStatus: v.optional(v.union(v.literal("pending"), v.literal("downloading"), v.literal("completed"), v.literal("failed"))),
    localPath: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    cachedAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_channel", ["channelUsername"])
    .index("by_type", ["type"])
    .index("by_cached", ["cachedAt"])
    .index("by_download_status", ["downloadStatus"]),
  
  // Twitch Jobs
  twitchJobs: defineTable({
    jobId: v.string(),
    userId: v.string(),
    channelUrl: v.optional(v.string()),
    channelName: v.optional(v.string()),
    action: v.union(v.literal("fetch_channel"), v.literal("fetch_videos"), v.literal("download_videos")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("downloading"), v.literal("completed"), v.literal("failed")),
    videoIds: v.optional(v.array(v.string())),
    videoType: v.optional(v.string()),
    count: v.optional(v.number()),
    progress: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    completedVideos: v.optional(v.number()),
    error: v.optional(v.string()),
    result: v.optional(v.any()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_job", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_channel", ["channelName"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created", ["createdAt"]),
  
  // Instagram Users
  instagramUsers: defineTable({
    username: v.string(),
    userId: v.string(),
    fullName: v.optional(v.string()),
    biography: v.optional(v.string()),
    profilePicUrl: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),
    isPrivate: v.optional(v.boolean()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    postCount: v.optional(v.number()),
    externalUrl: v.optional(v.string()),
    cachedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_userId", ["userId"])
    .index("by_cached", ["cachedAt"]),
  
  // Instagram Posts
  instagramPosts: defineTable({
    postId: v.string(),
    username: v.string(),
    caption: v.optional(v.string()),
    mediaType: v.union(v.literal("image"), v.literal("video"), v.literal("carousel")),
    thumbnail: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    likeCount: v.number(),
    commentCount: v.number(),
    timestamp: v.number(),
    location: v.optional(v.string()),
    isVideo: v.boolean(),
    videoDuration: v.optional(v.number()),
    carouselMediaCount: v.optional(v.number()),
    downloadStatus: v.optional(v.union(v.literal("pending"), v.literal("downloading"), v.literal("completed"), v.literal("failed"))),
    localPath: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    cachedAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_username", ["username"])
    .index("by_cached", ["cachedAt"])
    .index("by_download_status", ["downloadStatus"]),
  
  // Instagram Jobs
  instagramJobs: defineTable({
    jobId: v.string(),
    userId: v.string(),
    username: v.string(),
    action: v.union(v.literal("fetch_user"), v.literal("fetch_posts"), v.literal("download_posts")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("downloading"), v.literal("completed"), v.literal("failed")),
    postIds: v.optional(v.array(v.string())),
    count: v.optional(v.number()),
    progress: v.optional(v.number()),
    totalPosts: v.optional(v.number()),
    completedPosts: v.optional(v.number()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_job", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_username", ["username"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created", ["createdAt"]),
  
  // Voice Clone Jobs
  voiceCloneJobs: defineTable({
    jobId: v.string(),
    userId: v.string(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    voiceName: v.string(),
    audioFileUrl: v.optional(v.string()),
    audioFileName: v.optional(v.string()),
    audioFileSize: v.optional(v.number()),
    apiJobId: v.optional(v.string()),
    sampleText: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    resultUrl: v.optional(v.string()),
    workerInfo: v.optional(v.object({ environment: v.string(), gpuType: v.string(), dropletId: v.optional(v.string()), ip: v.optional(v.string()) })),
    error: v.optional(v.string()),
    errorDetails: v.optional(v.object({ code: v.string(), message: v.string(), stack: v.optional(v.string()) })),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    processingTime: v.optional(v.number()),
    settings: v.optional(v.object({ exaggeration: v.optional(v.number()), chunkSize: v.optional(v.number()), cfgWeight: v.optional(v.number()) })),
  })
    .index("by_job", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created", ["createdAt"]),

  // Bulk Processing Jobs - SIMPLIFIED FOR RAG
  bulkJobs: defineTable({
    jobId: v.string(),
    userId: v.string(),
    jobType: v.string(), // e.g., "document-rag"
    status: v.union(v.literal("pending"), v.literal("uploading"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    statusMessage: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    ragEntryId: v.optional(v.string()), // To link to the RAG entry
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_jobId", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),


  // Bulk Job Exports
  bulkJobExports: defineTable({
    exportId: v.string(),
    jobId: v.string(),
    userId: v.string(),
    format: v.union(v.literal("json"), v.literal("csv"), v.literal("parquet"), v.literal("vector"), v.literal("zip")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed"), v.literal("expired")),
    filename: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    filePath: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    errorMessage: v.optional(v.string())
  })
    .index("by_exportId", ["exportId"])
    .index("by_jobId", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_expires", ["expiresAt"]),

  // Procedural Audio Generation Jobs
  proceduralAudioJobs: defineTable({
    jobId: v.string(),
    userId: v.string(),
    config: v.object({
      prompt: v.string(),
      duration: v.number(),
      intensity: v.number(),
      name: v.string()
    }),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    audioUrl: v.optional(v.string()),
    audioId: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    metadata: v.optional(v.object({
      size: v.string(),
      duration: v.string(),
      quality: v.string(),
      format: v.string()
    })),
    error: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    processingTime: v.optional(v.number()),
    backendJobId: v.optional(v.string())
  })
    .index("by_job", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_created", ["createdAt"])
    .index("by_completed", ["completedAt"]),

  // Telephony Calls
  telephonyCalls: defineTable({
    callId: v.string(),
    userId: v.string(),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    phoneNumber: v.string(),
    sipEndpoint: v.optional(v.string()),
    status: v.union(v.literal("connecting"), v.literal("connected"), v.literal("recording"), v.literal("processing"), v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
    audioStreamUrl: v.optional(v.string()),
    recordingUrl: v.optional(v.string()),
    gstreamerPipeline: v.optional(v.string()),
    currentTranscript: v.optional(v.string()),
    currentSentiment: v.optional(v.string()),
    speakerLabels: v.optional(v.array(v.string())),
    fullTranscript: v.optional(v.string()),
    sentimentAnalysis: v.optional(v.any()),
    speakerDiarization: v.optional(v.any()),
    startTime: v.string(),
    endTime: v.optional(v.string()),
    duration: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_call", ["callId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // Real-time Audio Chunks
  audioChunks: defineTable({
    callId: v.string(),
    chunkId: v.string(),
    sequence: v.number(),
    audioData: v.string(),
    format: v.string(),
    sampleRate: v.number(),
    duration: v.number(),
    processed: v.boolean(),
    transcript: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    speaker: v.optional(v.string()),
    timestamp: v.string(),
  })
    .index("by_call", ["callId"])
    .index("by_sequence", ["callId", "sequence"])
    .index("by_processed", ["callId", "processed"]),

  // GStreamer Pipeline Jobs
  gstreamerJobs: defineTable({
    jobId: v.string(),
    callId: v.string(),
    userId: v.string(),
    pipeline: v.string(),
    port: v.number(),
    codec: v.string(),
    status: v.union(v.literal("starting"), v.literal("running"), v.literal("stopping"), v.literal("completed"), v.literal("error")),
    bytesProcessed: v.number(),
    packetsReceived: v.number(),
    errors: v.array(v.string()),
    createdAt: v.string(),
    startedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
  })
    .index("by_job", ["jobId"])
    .index("by_call", ["callId"])
    .index("by_status", ["status"]),

  // Telephony Jobs
  telephonyJobs: defineTable({
    jobId: v.string(),
    userId: v.string(),
    callId: v.string(),
    jobType: v.union(v.literal("call_start"), v.literal("call_process"), v.literal("call_end"), v.literal("asr_analysis"), v.literal("sentiment_analysis")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    progress: v.object({ overall: v.number(), currentStage: v.number(), itemsTotal: v.number(), itemsCompleted: v.number(), itemsFailed: v.number() }),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.string(),
    startedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
  })
    .index("by_job", ["jobId"])
    .index("by_call", ["callId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),
  // Web Content Documents - for Jina Reader API processing
  webDocuments: defineTable({
    url: v.optional(v.string()),
    title: v.string(),
    content: v.string(),
    markdown: v.string(),
    metadata: v.object({
      publishedTime: v.optional(v.string()),
      author: v.optional(v.string()),
      description: v.optional(v.string()),
      keywords: v.optional(v.array(v.string())),
      language: v.optional(v.string()),
      wordCount: v.optional(v.number()),
    }),
    workflowId: v.string(),
    userId: v.string(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    error: v.optional(v.string()),
    processed: v.boolean(),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_url", ["url"])
    .index("by_workflow", ["workflowId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

});
