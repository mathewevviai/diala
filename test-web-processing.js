// Test the web content processing system
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

// Test the web content processing
async function testWebProcessing() {
  const testUrls = [
    'http://aeon.co/essays/beyond-humans-what-other-kinds-of-minds-might-be-out-there',
    'https://dergipark.org.tr/en/download/article-file/4570887'
  ];

  console.log('Testing web content processing...');  
  // This would be called from ProcessingStepConvex
  const result = await ctx.runAction(internal.ragActions.processWebContentForRAG, {
    workflowId: 'test-workflow-123',
    userId: 'user-placeholder',
    urls: testUrls,
    config: {
      chunkSize: 1000,
      overlap: 200,
      embeddingModel: 'jina-v4',
    },
  });

  console.log('Web processing result:', result);
  return result;
}

// Export for testing
export { testWebProcessing };