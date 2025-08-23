'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UilExport, UilArrowLeft, UilInfoCircle, UilCheckCircle, UilCloudDownload, UilFileAlt, UilDatabase, UilEye, UilChart, UilRefresh } from '@tooni/iconscout-unicons-react';
import { BulkOnboardingState, ExportOption } from './types';
import { useBulkProcessing } from '@/hooks/useBulkProcessing';

interface ExportStepProps {
  state: BulkOnboardingState;
  setState: (updates: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
}

export function ExportStep({ 
  state, 
  setState, 
  setCurrentStep,
  handleStepChange
}: ExportStepProps) {
  
  const { exportResults, downloadFile, isExporting, exportProgress, downloadProgress } = useBulkProcessing();
  
  // Generate export options based on selected vector database
  const getExportOptions = (): ExportOption[] => {
    const baseOptions: ExportOption[] = [
      {
        id: 'json',
        label: 'JSON Export',
        Icon: UilFileAlt,
        color: 'bg-blue-600',
        description: 'Export embeddings and metadata as JSON files for easy integration',
        format: 'JSON'
      },
      {
        id: 'csv',
        label: 'CSV Export',
        Icon: UilFileAlt,
        color: 'bg-green-600',
        description: 'Export as CSV for analysis in spreadsheet applications',
        format: 'CSV'
      }
    ];

    // Add vector database specific option based on selection
    const vectorDbSpecificOptions: ExportOption[] = [];
    
    if (state.selectedVectorDb?.id === 'pinecone') {
      vectorDbSpecificOptions.push({
        id: 'vector',
        label: 'Pinecone Export',
        Icon: UilDatabase,
        color: 'bg-purple-600',
        description: 'Ready-to-import format with Pinecone configuration and import scripts',
        format: 'Pinecone Vector DB'
      });
    } else if (state.selectedVectorDb?.id === 'chromadb') {
      vectorDbSpecificOptions.push({
        id: 'vector',
        label: 'ChromaDB Export',
        Icon: UilDatabase,
        color: 'bg-orange-600',
        description: 'CSV/Parquet format with ChromaDB import scripts and configuration',
        format: 'ChromaDB Vector DB'
      });
      // Add parquet option for ChromaDB
      baseOptions.push({
        id: 'parquet',
        label: 'Parquet Export',
        Icon: UilFileAlt,
        color: 'bg-indigo-600',
        description: 'Efficient columnar format, ideal for ChromaDB and analytics',
        format: 'Parquet'
      });
    } else if (state.selectedVectorDb?.id === 'weaviate') {
      vectorDbSpecificOptions.push({
        id: 'vector',
        label: 'Weaviate Export',
        Icon: UilDatabase,
        color: 'bg-teal-600',
        description: 'GraphQL-ready format with Weaviate schema and import scripts',
        format: 'Weaviate Vector DB'
      });
    }

    const utilityOptions: ExportOption[] = [
      {
        id: 'viewer',
        label: 'Vector Viewer',
        Icon: UilChart,
        color: 'bg-red-600',
        description: 'Interactive visualization of your vector embeddings',
        format: 'Viewer'
      },
      {
        id: 'api',
        label: 'API Endpoint',
        Icon: UilDatabase,
        color: 'bg-gray-600',
        description: 'Generate API endpoints for programmatic access',
        format: 'API'
      }
    ];

    return [...vectorDbSpecificOptions, ...baseOptions, ...utilityOptions];
  };

  const exportOptions = getExportOptions();

  const handleExport = async (exportOption: ExportOption) => {
    console.log(`Exporting to ${exportOption.format}...`);
    
    // Check if we have a completed processing job
    if (!state.processingJob || state.processingJob.status !== 'completed') {
      alert('Please complete the processing step first before exporting.');
      return;
    }

    try {
      if (exportOption.id === 'viewer') {
        // Open vector viewer (future implementation)
        alert('Vector viewer will open in a new tab (coming soon!)');
        return;
      }
      
      if (exportOption.id === 'api') {
        // Generate API endpoint info (future implementation)
        alert('API endpoint configuration will be generated (coming soon!)');
        return;
      }

      // For actual exports, trigger the backend export process
      await exportResults({
        format: exportOption.id,
        jobId: state.processingJob.id
      });

    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStartOver = () => {
    setState({
      currentStep: 1,
      selectedPlatform: '',
      selectedInputMethod: '',
      channelUrl: '',
      pastedUrls: [],
      selectedContent: [],
      selectedEmbeddingModel: null,
      selectedVectorDb: null,
      bulkSettings: {
        chunkSize: 1024,
        chunkOverlap: 100,
        maxTokens: 2048,
      },
      processingJob: null,
      exportFormat: 'json',
      isLoading: false,
      loadProgress: 0,
      isProcessing: false,
      processProgress: 0,
    });
  };

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
              EXPORT & COMPLETE
            </h1>
            <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
              Your vector database is ready! Choose how you want to export and use your embeddings.
            </p>
          </div>

          {/* Success Summary */}
          <Card className="bg-green-50 mb-8 border-4 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-600 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center">
                  <UilCheckCircle className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase text-green-600">VECTOR DATABASE READY!</h3>
                  <p className="text-gray-700">Your embeddings are ready for export</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600">
                    {state.selectedContent.length}
                  </div>
                  <div className="text-sm text-gray-600">Content Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600">
                    {state.selectedContent.length * 10}
                  </div>
                  <div className="text-sm text-gray-600">Embeddings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600">
                    {state.selectedEmbeddingModel?.dimensions || 1024}
                  </div>
                  <div className="text-sm text-gray-600">Dimensions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600">
                    {(state.selectedContent.length * 0.5).toFixed(1)}MB
                  </div>
                  <div className="text-sm text-gray-600">Database Size</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <div className="mb-8">
            <h3 className="text-xl font-black uppercase mb-6">EXPORT OPTIONS</h3>
            <div className="grid grid-cols-2 gap-4">
              {exportOptions.map((option) => (
                <Card 
                  key={option.id}
                  className="cursor-pointer shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all"
                >
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className={`w-16 h-16 mx-auto mb-3 ${option.color} border-4 border-border shadow-shadow flex items-center justify-center`}>
                        <option.Icon className="h-8 w-8 text-white" />
                      </div>
                      <h4 className="font-black uppercase text-lg">{option.label}</h4>
                      <Badge variant="neutral" className="mt-2">
                        {option.format}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {option.description}
                    </p>
                    
                    <Button
                      onClick={() => handleExport(option)}
                      className="w-full h-10 text-sm font-black uppercase"
                      variant={option.id === 'viewer' ? 'default' : 'neutral'}
                      disabled={isExporting}
                    >
                      {option.id === 'viewer' ? (
                        <>
                          <UilEye className="mr-2 h-4 w-4" />
                          OPEN VIEWER
                        </>
                      ) : (
                        <>
                          <UilCloudDownload className="mr-2 h-4 w-4" />
                          {isExporting ? 'EXPORTING...' : 'EXPORT'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <Card className="bg-blue-50 mb-8 border-4 border-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center">
                    <UilCloudDownload className="h-6 w-6 text-white animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase text-blue-600">EXPORTING DATA</h3>
                    <p className="text-gray-700">Preparing your export file...</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{exportProgress}% complete</p>
              </CardContent>
            </Card>
          )}

          {/* Download Ready */}
          {downloadProgress && downloadProgress.status === 'completed' && (
            <Card className="bg-green-50 mb-8 border-4 border-green-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-600 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center">
                    <UilCheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase text-green-600">DOWNLOAD READY!</h3>
                    <p className="text-gray-700">Your export file is ready for download</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-white p-4 border-2 border-black rounded">
                  <div>
                    <p className="font-bold">{downloadProgress.filename}</p>
                    <p className="text-sm text-gray-600">
                      {downloadProgress.fileSize ? `${(downloadProgress.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Ready'}
                    </p>
                  </div>
                  <Button
                    onClick={() => downloadProgress.downloadUrl && downloadProgress.filename && 
                      downloadFile(downloadProgress.downloadUrl, downloadProgress.filename)
                    }
                    className="h-10 text-sm font-black uppercase"
                  >
                    <UilCloudDownload className="mr-2 h-4 w-4" />
                    DOWNLOAD
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuration Summary */}
          <Card className="bg-orange-50 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-black uppercase mb-4">FINAL CONFIGURATION</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold">Platform:</span>
                    <span className="capitalize">{state.selectedPlatform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Input Method:</span>
                    <span className="capitalize">{state.selectedInputMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Content Count:</span>
                    <span>{state.selectedContent.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Embedding Model:</span>
                    <span>{state.selectedEmbeddingModel?.label}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold">Vector Database:</span>
                    <span>{state.selectedVectorDb?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Chunk Size:</span>
                    <span>{state.bulkSettings.chunkSize} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Chunk Overlap:</span>
                    <span>{state.bulkSettings.chunkOverlap} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Total Embeddings:</span>
                    <span>{state.selectedContent.length * 10}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-100 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Button 
                  size="sm" 
                  variant="default" 
                  className="flex-shrink-0"
                >
                  <UilInfoCircle className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm font-bold">NEXT STEPS</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Your vector database is ready for use! You can export the data in various formats, 
                    integrate it with your applications, or use our visualization tools to explore the embeddings. 
                    The database will remain accessible for future exports.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <Button
              variant="reverse"
              size="lg"
              className="w-full h-14 text-lg font-black uppercase"
              onClick={handleStartOver}
            >
              <UilRefresh className="mr-2 h-6 w-6" />
              START NEW PROJECT
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}