'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UilArrowLeft } from '@tooni/iconscout-unicons-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  category: string;
  featured: boolean;
  date: string;
  content: string;
}

const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'HOW TO BUILD YOUR FIRST AI VOICE AGENT',
    excerpt: 'Learn the fundamentals of creating conversational AI agents that can handle complex business interactions.',
    author: 'Sarah Chen',
    readTime: '5 min read',
    category: 'Getting Started',
    featured: true,
    date: 'January 15, 2024',
    content: `<p>Hey creator,</p><p><strong>Welcome to the world of AI voice agents!</strong></p><p>Building your first AI voice agent might seem daunting, but with the right approach, you'll have a working conversational AI up and running in no time.</p><h3><strong>What you'll need</strong></h3><ul><li><p><strong>Voice recognition:</strong> Choose between cloud-based (Google Speech-to-Text, AWS Transcribe) or on-premise solutions</p></li><li><p><strong>Natural Language Processing:</strong> OpenAI GPT-4, Claude, or open-source alternatives like Llama</p></li><li><p><strong>Text-to-Speech:</strong> ElevenLabs, Azure Cognitive Services, or our own Chatterbox TTS</p></li><li><p><strong>Integration platform:</strong> Webhook endpoints, real-time communication protocols</p></li></ul><h3><strong>Building blocks</strong></h3><ul><li><p>Set up speech recognition pipeline with proper audio preprocessing</p></li><li><p>Design conversation flows and handle context switching</p></li><li><p>Implement error handling and fallback responses</p></li><li><p>Test with real users and iterate based on feedback</p></li></ul><h3><strong>Pro tips for success</strong></h3><p>Consider these essential aspects:</p><ul><li><p>Keep conversations natural and flowing</p></li><li><p>Handle interruptions gracefully</p></li><li><p>Maintain conversation context across multiple turns</p></li><li><p>Implement proper latency optimization</p></li><li><p>Plan for scalability from day one</p></li></ul><p>The key is starting simple and iterating quickly. Don't try to build the perfect agent on your first attempt!</p><p>Happy building,</p><p>Sarah Chen</p><hr contenteditable="false"><p><strong>Resources:</strong></p><ul><li><p>Diala Platform Documentation</p></li><li><p>Voice Agent Best Practices Guide</p></li></ul>`
  },
  {
    id: '2',
    title: 'MAXIMIZING COLD CALL SUCCESS WITH AI',
    excerpt: 'Discover proven strategies for using AI voice agents to improve your outbound sales performance.',
    author: 'Mike Rodriguez',
    readTime: '8 min read',
    category: 'Sales',
    featured: false,
    date: 'January 12, 2024',
    content: `<p>Sales professional,</p><p><strong>AI is revolutionizing cold calling, and here's how you can leverage it.</strong></p><p>After implementing AI voice agents across 500+ sales teams, we've identified the strategies that consistently deliver 3x better conversion rates.</p><h3><strong>The AI advantage</strong></h3><ul><li><p><strong>24/7 availability:</strong> Your AI agents never sleep, maximizing contact opportunities</p></li><li><p><strong>Consistent messaging:</strong> Every call delivers your perfect pitch</p></li><li><p><strong>Instant qualification:</strong> AI pre-qualifies leads before human handoff</p></li><li><p><strong>Data-driven optimization:</strong> Real-time analysis improves performance continuously</p></li></ul><h3><strong>Implementation strategy</strong></h3><ul><li><p>Start with simple qualification calls</p></li><li><p>Train AI on your top performer's conversations</p></li><li><p>Set clear handoff triggers for human intervention</p></li><li><p>Monitor and optimize conversation flows weekly</p></li></ul><h3><strong>Measuring success</strong></h3><p>Track these key metrics:</p><ul><li><p>Contact rate improvements (typically 40-60% increase)</p></li><li><p>Qualification accuracy (aim for 85%+ precision)</p></li><li><p>Conversion to human agent (optimize for quality handoffs)</p></li><li><p>Overall pipeline velocity improvements</p></li></ul><p>Remember: AI doesn't replace human sales skills – it amplifies them by handling routine tasks and providing better qualified opportunities.</p><p>Keep selling,</p><p>Mike Rodriguez</p>`
  },
  {
    id: '3',
    title: 'VOICE CLONING BEST PRACTICES',
    excerpt: 'Essential tips for creating natural-sounding voice clones that maintain authenticity and engagement.',
    author: 'Lisa Park',
    readTime: '6 min read',
    category: 'Voice Technology',
    featured: false,
    date: 'January 10, 2024',
    content: `<p>Audio engineer,</p><p><strong>Creating authentic voice clones requires both technical precision and artistic sensibility.</strong></p><p>After producing voice clones for hundreds of creators, here are the non-negotiable best practices that separate amateur attempts from professional results.</p><h3><strong>Recording requirements</strong></h3><ul><li><p><strong>Clean audio:</strong> Record in a treated room with minimal background noise</p></li><li><p><strong>Consistent levels:</strong> Maintain steady volume throughout your session</p></li><li><p><strong>Natural delivery:</strong> Speak conversationally, avoid over-articulation</p></li><li><p><strong>Sufficient data:</strong> Provide 15-30 minutes of varied content</p></li></ul><h3><strong>Content strategy</strong></h3><ul><li><p>Include emotional range: happy, serious, questioning tones</p></li><li><p>Cover common business scenarios and vocabulary</p></li><li><p>Record phonetically diverse content</p></li><li><p>Include natural pauses and speech patterns</p></li></ul><h3><strong>Technical optimization</strong></h3><p>For best results:</p><ul><li><p>Use 48kHz/24-bit recording quality minimum</p></li><li><p>Apply gentle noise reduction if needed</p></li><li><p>Normalize audio levels consistently</p></li><li><p>Remove mouth sounds and breathing artifacts</p></li><li><p>Split into 10-30 second segments for training</p></li></ul><p>The goal isn't perfection – it's authenticity. Your voice clone should sound like you on your best day, not like a robot trying to be you.</p><p>Keep it real,</p><p>Lisa Park</p>`
  },
  {
    id: '4',
    title: 'INTEGRATING RAG FOR SMARTER AGENTS',
    excerpt: 'How to leverage Retrieval-Augmented Generation to create more knowledgeable and context-aware agents.',
    author: 'David Kim',
    readTime: '10 min read',
    category: 'Advanced',
    featured: false,
    date: 'January 8, 2024',
    content: `<p>AI developer,</p><p><strong>RAG transforms static AI agents into dynamic, knowledge-powered assistants.</strong></p><p>Implementing Retrieval-Augmented Generation correctly can increase your agent's accuracy by 75% while reducing hallucinations to near-zero levels.</p><h3><strong>RAG fundamentals</strong></h3><ul><li><p><strong>Vector databases:</strong> Store and retrieve relevant context efficiently</p></li><li><p><strong>Embedding models:</strong> Convert text into searchable vector representations</p></li><li><p><strong>Retrieval strategies:</strong> Find the most relevant information for each query</p></li><li><p><strong>Context injection:</strong> Seamlessly integrate retrieved data into responses</p></li></ul><h3><strong>Implementation steps</strong></h3><ul><li><p>Choose your vector database (Pinecone, Weaviate, or Chroma)</p></li><li><p>Process and chunk your knowledge base effectively</p></li><li><p>Select appropriate embedding models for your domain</p></li><li><p>Implement semantic search with proper scoring</p></li><li><p>Design context windows for optimal performance</p></li></ul><h3><strong>Advanced techniques</strong></h3><p>Take your RAG system further:</p><ul><li><p><strong>Hybrid search:</strong> Combine semantic and keyword matching</p></li><li><p><strong>Reranking:</strong> Improve relevance with secondary scoring models</p></li><li><p><strong>Query expansion:</strong> Generate related search terms automatically</p></li><li><p><strong>Context compression:</strong> Fit more relevant information in token limits</p></li><li><p><strong>Multi-hop reasoning:</strong> Chain multiple retrievals for complex queries</p></li></ul><h3><strong>Performance optimization</strong></h3><p>Monitor these key metrics:</p><ul><li><p>Retrieval precision and recall rates</p></li><li><p>Response accuracy improvements</p></li><li><p>Query latency (target under 500ms)</p></li><li><p>User satisfaction scores</p></li></ul><p>RAG isn't just about adding a database to your AI – it's about creating intelligent systems that know when and how to find the right information at the right time.</p><p>Build wisely,</p><p>David Kim</p>`
  }
];

export default function BlogPostPage({ params }: { params: { blogId: string } }) {
  const post = mockBlogPosts.find(p => p.id === params.blogId);

  if (!post) {
    notFound();
  }

  return (
    <div 
      className="min-h-screen bg-white relative" 
      style={{ 
        fontFamily: 'Noyh-Bold, sans-serif'
      }}
    >
      <div className="container mx-auto px-8 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Back to Blog Navigation */}
          <div className="mb-6">
            <Link 
              href="/onboarding/blog" 
              className="text-pink-600 hover:text-pink-800 mt-4 flex items-center font-medium transition-colors"
            >
              <UilArrowLeft className="mr-1.5" style={{width: '18px', height: '18px'}} />
              Back to Blog
            </Link>
          </div>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black mb-4 leading-tight">
              {post.title}
            </h1>
            <time className="text-gray-600 text-lg font-bold">
              {post.date}
            </time>
          </header>

          {/* Content */}
          <div className="mx-auto grid max-w-3xl gap-6 border-b-4 border-black py-12 text-xl">
            <div className="rich-text">
              <div 
                className="prose prose-xl max-w-none prose-headings:font-black prose-headings:uppercase prose-h3:text-2xl prose-h3:mb-4 prose-p:mb-4 prose-p:leading-relaxed prose-ul:mb-6 prose-li:mb-2 prose-strong:font-black prose-hr:border-black prose-hr:border-2"
                dangerouslySetInnerHTML={{ __html: post.content }}
                style={{
                  fontFamily: 'inherit',
                  color: '#000'
                }}
              />
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-8">
            <Link 
              href="/onboarding/blog" 
              className="text-pink-600 hover:text-pink-800 mt-4 flex items-center font-medium transition-colors"
            >
              <UilArrowLeft className="mr-1.5" style={{width: '18px', height: '18px'}} />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}