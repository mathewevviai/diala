'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UilBook,
  UilClock,
  UilUser,
  UilArrowRight,
  UilFire,
  UilStar,
  UilBookOpen,
  UilApps,
  UilRocket,
  UilChart,
  UilMicrophone,
  UilBrain
} from '@tooni/iconscout-unicons-react';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { Star15 } from '@/components/ui/star';

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

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedPost, setSelectedPost] = React.useState<string | null>(null);

  const categories = [
    { name: 'all', icon: UilApps },
    { name: 'Getting Started', icon: UilRocket },
    { name: 'Sales', icon: UilChart },
    { name: 'Voice Technology', icon: UilMicrophone },
    { name: 'Advanced', icon: UilBrain }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? mockBlogPosts 
    : mockBlogPosts.filter(post => post.category === selectedCategory);

  return (
    <div 
      className="min-h-screen bg-white relative" 
      style={{ 
        fontFamily: 'Noyh-Bold, sans-serif'
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-black uppercase text-black mb-4">
            DIALA BLOG
          </h1>
          <p className="text-xl text-gray-700 font-bold max-w-2xl mx-auto">
            Learn from experts and level up your AI voice game
          </p>
        </div>


        {/* Featured Post - Most Recent */}
        <div className="mb-12 flex gap-8">
          <div className="w-2/3">
            {mockBlogPosts.slice(0, 1).map((post) => (
              <Link key={post.id} href={`/onboarding/blog/${post.id}`}>
                <Card 
                  className="border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                <div className="h-full border-b-4 border-black relative overflow-hidden bg-yellow-400">
                  <img 
                    src="/424f35f4c6837cba6f15.webp" 
                    alt="AI Voice Agents for Small Business"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-8">
                  <h2 className="text-3xl md:text-4xl font-black uppercase text-black mb-4 leading-tight">
                    {post.title}
                  </h2>
                  <span className="font-bold text-lg">{post.author}</span>
                </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* Recent Posts Titles */}
          <div className="w-1/3 space-y-4">
            {mockBlogPosts.slice(1, 6).map((post, index) => (
              <Link key={post.id} href={`/onboarding/blog/${post.id}`}>
                <div 
                  className="px-4 pt-4 pb-2 cursor-pointer border-b-2 border-black hover:bg-gray-50 transition-colors"
                >
                <h4 className="font-black uppercase text-2xl leading-tight">{post.title}</h4>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-base text-gray-600">{post.author}</span>
                </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid - Remaining Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockBlogPosts.slice(1).map((post, index) => {
            const images = ['/gr.png', '/gr2.png', '/gr3.png'];
            const image = images[index % images.length];
            
            return (
              <Link key={post.id} href={`/onboarding/blog/${post.id}`}>
                <Card 
                  className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all cursor-pointer relative"
                >
                <div className="w-full border-b-4 border-black relative overflow-hidden">
                  <img 
                    src={image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-black uppercase text-lg mb-8 leading-tight">{post.title}</h3>
                </CardContent>
                <div className="absolute bottom-6 left-6">
                  <span className="font-bold text-lg text-black">{post.date}</span>
                </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
        
      {/* Footer */}
      <div className="mt-16 bg-gray-50 border-t-4 border-black">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <OnboardingFooter />
        </div>
      </div>
    </div>
  );
}