import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { rag } from "./jinaIntegration";

const JINA_READER_URL = 'https://r.jina.ai';

/**
 * End-to-End Test Action for Web Content Processing
 * This simulates the complete workflow from URL input to processed embeddings
 */
export const runE2ETest = action({
  args: {
    testUrls: v.optional(v.array(v.string())),
    workflowId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { testUrls, workflowId = 'test-workflow-e2e', userId = 'test-user' }) => {
    const urls = testUrls || [
      'http://aeon.co/essays/beyond-humans-what-other-kinds-of-minds-might-be-out-there',
      'https://dergipark.org.tr/en/download/article-file/4570887'
    ];

    console.log('🧪 Starting E2E Web Content Processing Test');
    console.log('📋 Test URLs:', urls);
    console.log('🔧 Workflow ID:', workflowId);
    console.log('👤 User ID:', userId);

    const testResults = {
      urls,
      workflowId,
      userId,
      startTime: Date.now(),
      jinaApiKey: !!process.env.JINA_API_KEY,
      convexConnected: true,
      steps: [] as string[],
    };

    try {
      // Step 1: Test Jina API connectivity
      console.log('🔌 Testing Jina Reader API...');
      testResults.steps.push('api_connectivity_test');

      const apiTest = await fetch(`${JINA_READER_URL}/https://example.com`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
        },
        timeout: 10000,
      });

      if (apiTest.ok) {
        testResults.steps.push('api_connection_success');
        const apiData = await apiTest.json();
        console.log('✅ Jina API response:', apiData.title);
      } else {
        throw new Error(`Jina API error: ${apiTest.status}`);
      }

      // Step 2: Process URLs with batch processing
      console.log('🔄 Processing URLs...');
      testResults.steps.push('url_processing_started');

      const processResult = await ctx.runAction(internal.ragActions.processWebUrlsBatch, {
        urls,
        workflowId,
        userId,
      });

      testResults.steps.push('url_processing_completed');
      testResults.processingResult = processResult;

      // Step 3: Verify content storage
      console.log('💾 Verifying content storage...');
      testResults.steps.push('storage_verification');

      const storedDocs = await ctx.db
        .query("webDocuments")
        .withIndex("by_workflow", (q) => q.eq("workflowId", workflowId))
        .collect();

      testResults.storedDocuments = storedDocs.map(doc => ({
        id: doc._id,
        url: doc.url,
        title: doc.title,
        wordCount: doc.metadata.wordCount,
        status: doc.status,
      }));

      // Step 4: Test RAG embedding
      console.log('🧠 Testing RAG embedding...');
      testResults.steps.push('rag_embedding_test');

      const ragResult = await ctx.runAction(internal.ragActions.processWebContentForRAG, {
        workflowId,
        userId,
        urls,
        config: {
          chunkSize: 1000,
          overlap: 200,
          embeddingModel: 'jina-embeddings-v4',
        },
      });

      testResults.steps.push('rag_embedding_completed');
      testResults.ragResult = ragResult;

      // Step 5: Verify embeddings
      console.log('🔍 Verifying embeddings...');
      testResults.steps.push('embedding_verification');

      const embeddings = await ctx.db
        .query("ragEmbeddings")
        .filter((e) => e.eq("workflowId", workflowId))
        .collect();

      testResults.embeddings = {
        total: embeddings.length,
        documentsWithEmbeddings: new Set(embeddings.map(e => e.sourceId)).size,
      };

      testResults.endTime = Date.now();
      testResults.duration = testResults.endTime - testResults.startTime;
      testResults.success = true;

      console.log('🎉 E2E Test Completed Successfully!');
      console.log(`⏱️  Duration: ${testResults.duration}ms`);
      console.log(`📊 URLs processed: ${processResult.successful}/${urls.length}`);
      console.log(`🧠 Embeddings created: ${embeddings.length}`);

    } catch (error) {
      console.error('❌ E2E Test Failed:', error.message);
      testResults.error = {
        message: error.message,
        stack: error.stack,
        step: testResults.steps[testResults.steps.length - 1],
      };
      testResults.success = false;
      testResults.endTime = Date.now();
      testResults.duration = testResults.endTime - testResults.startTime;
    }

    return testResults;
  },
});

/**
 * Quick Test - Single URL processing
 */
export const testSingleUrl = action({
  args: {
    url: v.string(),
    workflowId: v.optional(v.string()),
  },
  handler: async (ctx, { url, workflowId = 'quick-test' }) => {
    console.log('🧪 Quick Test - Single URL Processing');
    console.log('📝 URL:', url);

    const result = await ctx.runAction(internal.ragActions.fetchWebContentWithJina, {
      url,
      workflowId,
      userId: 'test-user',
    });

    // Verify content
    const doc = await ctx.db.get(result.documentId);
    
    return {
      success: result.success,
      title: result.title,
      wordCount: result.wordCount,
      content: doc?.content?.substring(0, 200) + '...',
      metadata: doc?.metadata,
    };
  },
});

/**
 * Health Check - Verify all components
 */
export const healthCheck = query({
  args: {},
  handler: async (ctx) => {
    const checks = {
      jinaApi: !!process.env.JINA_API_KEY,
      convex: true,
      webDocuments: 0,
      schema: true,
      timestamp: Date.now(),
    };

    // Check web documents count
    const docCount = await ctx.db.query("webDocuments").count();
    checks.webDocuments = docCount;

    return checks;
  },
});

/**
 * Test Data Generator
 */
export const generateTestData = mutation({
  args: {
    workflowId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { workflowId, userId }) => {
    const testDocs = [
      {
        url: 'http://aeon.co/essays/beyond-humans-what-other-kinds-of-minds-might-be-out-there',
        title: 'Beyond Humans: What Other Kinds of Minds Might Be Out There',
        content: 'This is a test document about consciousness and artificial minds...',
        wordCount: 1500,
      },
      {
        url: 'https://dergipark.org.tr/en/download/article-file/4570887',
        title: 'Academic Paper - Turkish Journal',
        content: 'Test academic content from Turkish research journal...',
        wordCount: 800,
      }
    ];

    const createdIds = [];
    for (const doc of testDocs) {
      const id = await ctx.db.insert("webDocuments", {
        url: doc.url,
        title: doc.title,
        content: doc.content,
        markdown: doc.content,
        workflowId,
        userId,
        metadata: {
          wordCount: doc.wordCount,
          language: 'en',
        },
        status: "completed",
        processed: true,
        createdAt: Date.now(),
        processedAt: Date.now(),
      });
      createdIds.push(id);
    }

    return { success: true, createdIds, count: testDocs.length };
  },
});

/**
 * Cleanup test data
 */
export const cleanupTestData = mutation({
  args: {
    workflowId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { workflowId, userId }) => {
    const docs = await ctx.db
      .query("webDocuments")
      .withIndex("by_workflow", (q) => q.eq("workflowId", workflowId))
      .filter((doc) => doc.eq("userId", userId))
      .collect();

    let deleted = 0;
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
      deleted++;
    }

    return { success: true, deleted };
  },
});