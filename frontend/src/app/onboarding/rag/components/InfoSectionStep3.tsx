'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UilSetting } from '@tooni/iconscout-unicons-react';

export function InfoSectionStep3() {
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
              <UilSetting className="h-6 w-6 text-white" />
            </Button>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                INTELLIGENT CHUNKING ENGINE
              </h3>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                Our advanced chunking algorithms ensure <span className="font-black text-cyan-600">optimal context preservation</span> while maximizing retrieval accuracy. 
                Each chunk is carefully crafted to maintain semantic coherence, with intelligent overlap to prevent information loss at boundaries.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                  <span className="text-black font-medium">Smart boundary detection</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                  <span className="text-black font-medium">Context-aware chunking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                  <span className="text-black font-medium">Metadata preservation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                  <span className="text-black font-medium">Optimal embedding size</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}