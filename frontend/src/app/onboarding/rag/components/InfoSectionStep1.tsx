'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UilBrain, UilRocket } from '@tooni/iconscout-unicons-react';

export function InfoSectionStep1() {
  return (
    <div className="space-y-6">
      <Card className="transform -rotate-1 relative overflow-hidden bg-cyan-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Button
              size="icon"
              variant="default"
              className="w-12 h-12 flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white border-black"
            >
              <UilBrain className="h-6 w-6 text-white" />
            </Button>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                RAG-POWERED INTELLIGENCE
              </h3>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                Transform any knowledge source into a <span className="font-black text-cyan-600">queryable AI brain</span>. 
                Our RAG system processes millions of tokens to create semantic embeddings that power instant, accurate answers. 
                Your agents will have photographic memory of every document, video, or webpage you feed them.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                  <span className="text-black font-medium">Semantic search across all content</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                  <span className="text-black font-medium">Context-aware responses</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                  <span className="text-black font-medium">Multi-format support</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                  <span className="text-black font-medium">Real-time indexing</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transform rotate-1 relative overflow-hidden bg-cyan-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Button
              size="icon"
              variant="default"
              className="w-12 h-12 flex-shrink-0 bg-yellow-400 hover:bg-yellow-400/90 text-black"
            >
              <UilRocket className="h-6 w-6 text-black" />
            </Button>
            <div className="flex-1">
              <h3 className="text-xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                ENTERPRISE-SCALE PROCESSING
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Process up to <span className="font-black text-cyan-600">10GB of knowledge per workflow</span> with our distributed infrastructure. 
                Advanced chunking algorithms ensure optimal retrieval performance while maintaining context. 
                Your data is vectorized using state-of-the-art embedding models for unmatched accuracy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}