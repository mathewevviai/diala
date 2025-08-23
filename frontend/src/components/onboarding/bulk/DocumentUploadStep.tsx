'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { UilUpload, UilArrowRight, UilArrowLeft, UilInfoCircle, UilFileAlt, UilTrash, UilCheckCircle, UilClock } from '@tooni/iconscout-unicons-react';
import { BulkOnboardingState, DocumentItem } from './types';
import FileUploadCard from '@/components/custom/file-upload-card';
import DocumentListCard from '@/components/custom/document-list-card';

interface DocumentUploadStepProps {
  state: BulkOnboardingState;
  setState: (updates: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
}

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      resolve('PDF content preview is not available in the browser.');
      return;
    }

    if (!file.type.startsWith('text/') && file.type !== 'application/json' && !file.name.endsWith('.md')) {
        resolve('File type cannot be previewed as text.');
        return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};


export function DocumentUploadStep({ 
  state, 
  setState, 
  setCurrentStep,
  handleStepChange
}: DocumentUploadStepProps) {
  
  const canProceedFromStep2 = () => state.uploadedDocuments.length > 0;

  const handleFileSelect = async (files: FileList) => {
    const newDocuments: DocumentItem[] = [];
    const currentCount = state.uploadedDocuments.length;
    const maxFiles = 50;

    if (currentCount + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed. You can upload ${maxFiles - currentCount} more files.`);
      return;
    }

    setState({ uploadProgress: 0 });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Basic validation
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 10MB per file).`);
        continue;
      }

      const content = await readFileAsText(file);

      const documentItem: DocumentItem = {
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        uploadDate: new Date().toISOString(),
        content: content,
      };

      newDocuments.push(documentItem);
      
      setState({ 
        uploadProgress: ((i + 1) / files.length) * 100 
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (newDocuments.length > 0) {
      setState({
        uploadedDocuments: [...state.uploadedDocuments, ...newDocuments],
        selectedInputMethod: 'upload',
        uploadProgress: 100
      });

      setTimeout(() => {
        setState({ uploadProgress: 0 });
      }, 1000);
    }
  };

  const removeDocument = (documentId: string) => {
    setState({
      uploadedDocuments: state.uploadedDocuments.filter(doc => doc.id !== documentId)
    });
  };

  const handleContinue = () => {
    setState({ 
        selectedInputMethod: 'upload',
        // Pre-select the first 10 documents for processing
        selectedContent: state.uploadedDocuments.slice(0, 10).map(d => d.id) 
    });
    setCurrentStep(4);
  };

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
              UPLOAD DOCUMENTS
            </h1>
            <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
              Upload your documents to create vector embeddings. Support for PDF, Word, text, and markdown files.
            </p>
          </div>

          <FileUploadCard
            onFileUpload={(files) => {
              if (files instanceof FileList) {
                handleFileSelect(files);
              }
            }}
            accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
            multiple={true}
            title="Drop Documents Here"
            description="Drag & drop or click to browse"
            fileTypes="PDF, DOCX, TXT, MD, CSV, JSON (max 10MB each)"
            categoryColor="rgb(234, 88, 12)"
            categoryLabel="DOCUMENTS"
            bottomText="Upload your documents"
          />

          {state.uploadProgress > 0 && state.uploadProgress < 100 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold">UPLOADING FILES...</span>
                <span className="text-sm">{Math.round(state.uploadProgress)}%</span>
              </div>
              <Progress value={state.uploadProgress} className="w-full" />
            </div>
          )}

          {state.uploadedDocuments.length > 0 && (
            <div className="mt-8">
              <DocumentListCard 
                documents={state.uploadedDocuments}
                onRemoveDocument={removeDocument}
              />
            </div>
          )}

          <Card className="bg-yellow-100 mt-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Button size="sm" variant="default" className="flex-shrink-0"><UilInfoCircle className="h-4 w-4" /></Button>
                <div>
                  <p className="text-sm font-bold">DOCUMENT PROCESSING INFO</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Upload up to 50 documents. The first 10 will be automatically selected for processing. 
                    Larger documents will be chunked for better embedding quality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-8">
            <Button variant="neutral" size="lg" className="flex-1 h-14 text-lg font-black uppercase" onClick={() => handleStepChange(1)}><UilArrowLeft className="mr-2 h-6 w-6" />BACK</Button>
            <Button variant="default" size="lg" className={`flex-1 h-14 text-lg font-black uppercase ${!canProceedFromStep2() ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={handleContinue} disabled={!canProceedFromStep2()}>
              <span className="flex items-center justify-center">CONTINUE<UilArrowRight className="ml-2 h-6 w-6" /></span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
