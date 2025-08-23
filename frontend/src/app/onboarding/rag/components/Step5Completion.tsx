'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UilCheckCircle, 
  UilDocumentInfo, 
  UilArrowRight,
  UilDatabase
} from '@tooni/iconscout-unicons-react';
import { WorkflowStats } from '../types';

interface Step5CompletionProps {
  workflowStats: WorkflowStats | null;
  workflowId: string | null;
  onViewKnowledgeBase: () => void;
  onGoToDashboard: () => void;
}

export function Step5Completion({ 
  workflowStats, 
  workflowId, 
  onViewKnowledgeBase, 
  onGoToDashboard 
}: Step5CompletionProps) {
  return (
    <Card className="transform rotate-1 relative overflow-hidden">
      <CardHeader className="bg-green-100">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-green-500 border-4 border-black rounded-full flex items-center justify-center">
            <UilCheckCircle className="h-12 w-12 text-white" />
          </div>
        </div>
        <CardTitle className="text-4xl md:text-5xl font-black uppercase text-center text-black">
          KNOWLEDGE BASE READY!
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-6">
          <p className="text-xl text-center text-gray-700">
            Your RAG system has been successfully set up. Your agents can now access this knowledge!
          </p>

          {workflowStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-cyan-50 border-2 border-black transform -rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Content Processed</p>
                  <p className="text-2xl font-black">{workflowStats.totalContent}</p>
                </CardContent>
              </Card>
              <Card className="bg-cyan-50 border-2 border-black transform rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Characters Indexed</p>
                  <p className="text-2xl font-black">{workflowStats.charactersIndexed}</p>
                </CardContent>
              </Card>
              <Card className="bg-cyan-50 border-2 border-black transform -rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Embeddings</p>
                  <p className="text-2xl font-black">{workflowStats.embeddingsGenerated}</p>
                </CardContent>
              </Card>
              <Card className="bg-cyan-50 border-2 border-black transform rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Index Size</p>
                  <p className="text-2xl font-black">{workflowStats.indexSize}</p>
                </CardContent>
              </Card>
              <Card className="bg-cyan-50 border-2 border-black transform -rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Processing Time</p>
                  <p className="text-2xl font-black">{workflowStats.processingTime}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-2 border-black transform rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Status</p>
                  <p className="text-2xl font-black text-green-600">ACTIVE</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-cyan-400 hover:bg-cyan-400/90 text-black"
              onClick={onViewKnowledgeBase}
            >
              VIEW KNOWLEDGE BASE
              <UilDocumentInfo className="ml-2 h-6 w-6" />
            </Button>
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-[rgb(0,82,255)] hover:bg-blue-600 text-white"
              onClick={onGoToDashboard}
            >
              GO TO DASHBOARD
              <UilArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}