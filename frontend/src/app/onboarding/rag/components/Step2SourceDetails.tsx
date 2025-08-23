'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { 
  UilArrowLeft, 
  UilArrowRight, 
  UilUpload, 
  UilFile,
  UilInfoCircle
} from '@tooni/iconscout-unicons-react';

interface Step2SourceDetailsProps {
  selectedSourceType: string;
  sourceInput: string;
  uploadedFiles: File[];
  onSourceInputChange: (value: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onContinue: () => void;
  canProceed: boolean;
}

export function Step2SourceDetails({
  selectedSourceType,
  sourceInput,
  uploadedFiles,
  onSourceInputChange,
  onFileUpload,
  onBack,
  onContinue,
  canProceed
}: Step2SourceDetailsProps) {

  const getSourceTitle = () => {
    switch (selectedSourceType) {
      case 'youtube': return 'YOUTUBE SOURCE';
      case 'tiktok': return 'TIKTOK SOURCE';
      case 'twitch': return 'TWITCH SOURCE';
      case 'documents': return 'UPLOAD DOCUMENTS';
      case 'urls': return 'WEB PAGES';
      case 'csv': return 'STRUCTURED DATA';
      default: return 'SOURCE DETAILS';
    }
  };

  const getHelpText = () => {
    switch (selectedSourceType) {
      case 'youtube':
        return 'Paste any YouTube video, channel, or playlist URL. We\'ll extract transcripts automatically.';
      case 'tiktok':
        return 'Enter TikTok creator username or video URLs. We\'ll process creator content and trends.';
      case 'twitch':
        return 'Enter Twitch channel name or VOD URLs. We\'ll extract content from streams and archives.';
      case 'documents':
        return 'Upload PDFs, Word docs, or text files. Maximum 20 files, each under 50MB.';
      case 'urls':
        return 'Enter website URLs to scrape. We\'ll extract clean text content from each page.';
      case 'csv':
        return 'Upload structured data in CSV format. First row should contain column headers.';
      default:
        return 'Provide the required information for your selected source type.';
    }
  };

  return (
    <Card className="transform -rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            {getSourceTitle()}
          </h1>
        </div>
        
        {(selectedSourceType === 'youtube' || selectedSourceType === 'tiktok' || selectedSourceType === 'twitch') && (
          <div className="space-y-6">
            <div>
              <label className="text-xl font-black uppercase mb-3 block">
                {selectedSourceType === 'youtube' && 'YOUTUBE CHANNEL OR VIDEO URL'}
                {selectedSourceType === 'tiktok' && 'TIKTOK CREATOR OR VIDEO URL'}
                {selectedSourceType === 'twitch' && 'TWITCH CHANNEL OR VOD URL'}
              </label>
              <Input
                type="text"
                value={sourceInput}
                onChange={(e) => onSourceInputChange(e.target.value)}
                placeholder={
                  selectedSourceType === 'youtube' ? "https://youtube.com/@channel or video URL" :
                  selectedSourceType === 'tiktok' ? "@creator or https://tiktok.com/@username" :
                  "twitch.tv/channel or VOD URL"
                }
                className="h-16 text-lg font-semibold border-4 border-black rounded-[3px]"
              />
              <p className="text-sm text-gray-600 mt-2">
                {selectedSourceType === 'youtube' && 'We can process up to 100 videos from a channel or playlist'}
                {selectedSourceType === 'tiktok' && 'Enter creator username (@username) or paste video URLs'}
                {selectedSourceType === 'twitch' && 'Enter channel name or paste VOD/stream URLs'}
              </p>
            </div>
          </div>
        )}



        {selectedSourceType === 'documents' && (
          <div className="space-y-6">
            <div>
              <label className="text-xl font-black uppercase mb-3 block">
                UPLOAD YOUR DOCUMENTS
              </label>
              <div className="border-4 border-dashed border-black rounded-lg p-8 text-center bg-cyan-50">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={onFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button size="icon" variant="header" className="w-16 h-16 mb-4 bg-cyan-500 hover:bg-cyan-600">
                    <UilUpload className="h-8 w-8 text-white" />
                  </Button>
                  <p className="text-lg font-bold">Click to upload or drag files here</p>
                  <p className="text-sm text-gray-600 mt-2">PDF, Word, or text files (max 20 files)</p>
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-cyan-100 rounded border-2 border-black">
                      <UilFile className="h-5 w-5" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm text-gray-600">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedSourceType === 'urls' && (
          <div className="space-y-6">
            <div>
              <label className="text-xl font-black uppercase mb-3 block">
                WEB PAGE URLS
              </label>
              <textarea
                value={sourceInput}
                onChange={(e) => onSourceInputChange(e.target.value)}
                placeholder="Enter URLs (one per line)\nhttps://example.com\nhttps://docs.example.com"
                className="w-full h-32 p-4 text-lg font-semibold border-4 border-black rounded-[3px] resize-none"
              />
              <p className="text-sm text-gray-600 mt-2">
                Enter up to 20 URLs to scrape content from. We'll use Jina Reader API to extract clean content.
              </p>
            </div>
          </div>
        )}

        {selectedSourceType === 'csv' && (
          <div className="space-y-6">
            <div>
              <label className="text-xl font-black uppercase mb-3 block">
                UPLOAD CSV FILE
              </label>
              <div className="border-4 border-dashed border-black rounded-lg p-8 text-center bg-cyan-50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={onFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Button size="icon" variant="header" className="w-16 h-16 mb-4 bg-green-500 hover:bg-green-600">
                    <UilUpload className="h-8 w-8 text-white" />
                  </Button>
                  <p className="text-lg font-bold">Click to upload CSV file</p>
                  <p className="text-sm text-gray-600 mt-2">Maximum file size: 50MB</p>
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-cyan-100 rounded border-2 border-black">
                      <UilFile className="h-5 w-5" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm text-gray-600">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Help Hint */}
        <div className="mt-8">
          <Card className="bg-yellow-200 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Button 
                  size="sm" 
                  variant="neutral" 
                  className="bg-yellow-400 hover:bg-yellow-500 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] flex-shrink-0"
                >
                  <UilInfoCircle className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm font-bold uppercase">CONTENT REQUIREMENTS</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {getHelpText()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
            onClick={onBack}
          >
            <UilArrowLeft className="mr-2 h-6 w-6" />
            BACK
          </Button>
          <Button
            className="flex-1 h-14 text-lg font-black uppercase bg-cyan-400 hover:bg-cyan-400/90 text-black"
            onClick={onContinue}
            disabled={!canProceed}
          >
            CONTINUE
            <UilArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}