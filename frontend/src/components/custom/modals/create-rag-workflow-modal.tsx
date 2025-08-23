import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { 
  UilTimes, 
  UilLock, 
  UilUpload,
  UilFile,
  UilYoutube,
  UilLink,
  UilTrash,
  UilPlay
} from '@tooni/iconscout-unicons-react';

interface CreateRAGWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflowData: RAGWorkflowData) => void;
}

export interface RAGWorkflowData {
  name: string;
  sources: string[];
  youtubeUrl: string;
  urls: string;
  embeddingModel: string;
  vectorStore: string;
  chunkSize: number;
  overlap: number;
}

export default function CreateRAGWorkflowModal({ isOpen, onClose, onSave }: CreateRAGWorkflowModalProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState<RAGWorkflowData>({
    name: '',
    sources: [],
    youtubeUrl: '',
    urls: '',
    embeddingModel: 'text-embedding-ada-002',
    vectorStore: 'pinecone',
    chunkSize: 512,
    overlap: 50
  });
  
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        sources: [],
        youtubeUrl: '',
        urls: '',
        embeddingModel: 'text-embedding-ada-002',
        vectorStore: 'pinecone',
        chunkSize: 512,
        overlap: 50
      });
      setUploadedFiles([]);
    }
  }, [isOpen]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setFormData(prev => ({
        ...prev,
        sources: [...prev.sources, ...newFiles.map(f => f.name)]
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  const hasContentSources = formData.sources.length > 0 || formData.youtubeUrl || formData.urls;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-white max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b-4 border-black bg-[rgb(0,82,255)] relative">
          <CardTitle className="text-2xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            CREATE RAG WORKFLOW - STEP {currentStep} OF 4
          </CardTitle>
          <Button
            variant="neutral"
            size="sm"
            className="absolute top-4 right-4 bg-white p-2"
            onClick={onClose}
          >
            <UilTimes className="h-4 w-4 text-black" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-1 sm:gap-2">
              {[1, 2, 3, 4].map((step, index) => (
                <React.Fragment key={step}>
                  <div className={`px-2 py-1 border-2 border-black font-bold text-xs sm:px-4 sm:py-2 sm:border-4 sm:text-sm ${
                    currentStep === step
                      ? 'bg-[rgb(0,82,255)] text-white scale-105 shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[3px_3px_0_rgba(0,0,0,1)]'
                      : currentStep > step
                      ? 'bg-[rgb(0,82,255)] text-white shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]'
                      : 'bg-gray-300 text-gray-600 shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]'
                  }`}>
                    {step}
                  </div>
                  {index < 3 && (
                    <div className={`w-4 h-1 mx-1 border border-black sm:w-8 sm:h-2 sm:mx-2 sm:border-2 ${
                      currentStep > step + 1
                        ? 'bg-white shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]'
                        : 'bg-gray-400'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step 1: Workflow Name */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Name your knowledge base
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="E.g., Sales Training Knowledge Base"
                />
                <p className="text-xs text-gray-600 mt-2">Choose a descriptive name for your RAG-enabled knowledge base</p>
              </div>

              <div className="flex justify-end">
                <Button
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleNext}
                  disabled={!formData.name}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Content Sources */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-black uppercase">Add your content sources</h3>
                
                {/* File Upload */}
                <Card className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <div className="border-2 border-black">
                    <CardHeader className="border-b-2 border-black bg-yellow-100 py-3">
                      <CardTitle className="text-md font-black uppercase flex items-center gap-2">
                        <UilFile className="w-5 h-5" />
                        Upload Files
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.docx,.txt,.csv,.json"
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-400 rounded-[8px] p-4 text-center hover:border-black transition-colors cursor-pointer"
                      >
                        <UilUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="font-bold text-gray-600 text-sm">CLICK TO SELECT FILES</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT, CSV, JSON</p>
                      </div>
                      {uploadedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {uploadedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border-2 border-black rounded-[6px]">
                              <span className="text-sm font-bold truncate">{file.name}</span>
                              <Button
                                variant="neutral"
                                size="sm"
                                className="bg-white p-2"
                                onClick={() => {
                                  setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                                  setFormData(prev => ({
                                    ...prev,
                                    sources: prev.sources.filter((_, i) => i !== idx)
                                  }));
                                }}
                              >
                                <UilTrash className="w-4 h-4 text-black" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>

                {/* YouTube Premium Feature */}
                <Card className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-white relative overflow-hidden">
                  <div className="border-2 border-black">
                    <CardHeader className="border-b-2 border-black bg-red-100 py-3 relative">
                      <CardTitle className="text-md font-black uppercase flex items-center gap-2">
                        <UilYoutube className="w-5 h-5" />
                        YouTube Embedding
                        <span className="px-2 py-1 bg-yellow-400 border-2 border-black text-xs font-bold uppercase rounded-lg shadow-[2px_2px_0_rgba(0,0,0,1)]">
                          PREMIUM
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 relative">
                      <div>
                        <Input
                          disabled
                          placeholder="https://youtube.com/@channel or video URL"
                          className="border-2 border-black"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-gray-700 font-medium">Extract & transcribe YouTube videos automatically</p>
                        <Button
                          size="sm"
                          className="px-4 py-2 text-xs font-bold"
                        >
                          UPGRADE →
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>

                {/* URL Input */}
                <Card className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <div className="border-2 border-black">
                    <CardHeader className="border-b-2 border-black bg-blue-100 py-3">
                      <CardTitle className="text-md font-black uppercase flex items-center gap-2">
                        <UilLink className="w-5 h-5" />
                        Web URLs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Textarea
                        value={formData.urls}
                        onChange={(e) => setFormData({...formData, urls: e.target.value})}
                        placeholder="Enter URLs separated by new lines"
                        className="min-h-[80px] border-2 border-black"
                      />
                    </CardContent>
                  </div>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleBack}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  ← Back
                </Button>
                <Button
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleNext}
                  disabled={!hasContentSources}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Configuration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase">Configure processing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-black uppercase text-gray-700 mb-2 block">Embedding Model</label>
                  <select
                    value={formData.embeddingModel}
                    onChange={(e) => setFormData({...formData, embeddingModel: e.target.value})}
                    className="w-full border-2 border-black rounded p-2"
                  >
                    <option value="text-embedding-ada-002">OpenAI Ada-002</option>
                    <option value="text-embedding-3-small">OpenAI 3-Small</option>
                    <option value="text-embedding-3-large">OpenAI 3-Large</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-black uppercase text-gray-700 mb-2 block">Vector Store</label>
                  <select
                    value={formData.vectorStore}
                    onChange={(e) => setFormData({...formData, vectorStore: e.target.value})}
                    className="w-full border-2 border-black rounded p-2"
                  >
                    <option value="pinecone">Pinecone</option>
                    <option value="chroma">ChromaDB</option>
                    <option value="weaviate">Weaviate</option>
                    <option value="qdrant">Qdrant</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-black uppercase text-gray-700 mb-2 block">Chunk Size</label>
                  <Input
                    type="number"
                    value={formData.chunkSize}
                    onChange={(e) => setFormData({...formData, chunkSize: parseInt(e.target.value) || 512})}
                  />
                </div>

                <div>
                  <label className="text-sm font-black uppercase text-gray-700 mb-2 block">Overlap</label>
                  <Input
                    type="number"
                    value={formData.overlap}
                    onChange={(e) => setFormData({...formData, overlap: parseInt(e.target.value) || 50})}
                  />
                </div>
              </div>

              {/* Advanced Settings - Premium */}
              <Card className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-white relative overflow-hidden mt-4">
                <CardContent className="p-4 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black text-black uppercase flex items-center gap-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                        ADVANCED SETTINGS
                        <span className="px-2 py-1 bg-yellow-400 border-2 border-black text-xs font-bold uppercase rounded-lg shadow-[2px_2px_0_rgba(0,0,0,1)]">
                          PREMIUM
                        </span>
                      </h4>
                      <p className="text-sm text-gray-700 mt-1">Custom embeddings, metadata extraction, smart chunking</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 font-bold">$49/month</span>
                      <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                        <UilLock className="h-5 w-5 text-black" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleBack}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  ← Back
                </Button>
                <Button
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleNext}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Create */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase">Review & Create</h3>
              
              {/* Summary */}
              <Card className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-yellow-50">
                <CardContent className="p-4">
                  <h4 className="font-black uppercase mb-3">Workflow Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-bold">Name:</span>
                      <span>{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Content Sources:</span>
                      <span>{formData.sources.length + (formData.urls ? formData.urls.split('\n').filter(u => u.trim()).length : 0)} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Embedding Model:</span>
                      <span>{formData.embeddingModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Vector Store:</span>
                      <span>{formData.vectorStore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Processing:</span>
                      <span>Chunk {formData.chunkSize} / Overlap {formData.overlap}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Process Info */}
              <Card className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-blue-50">
                <CardContent className="p-4">
                  <h4 className="font-black uppercase mb-2">What happens next?</h4>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-black">1.</span>
                      <span>Your content will be extracted and processed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black">2.</span>
                      <span>Text will be chunked and converted to embeddings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black">3.</span>
                      <span>Embeddings will be indexed in {formData.vectorStore}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black">4.</span>
                      <span>Your agents can query this knowledge base instantly</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleBack}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  ← Back
                </Button>
                <Button
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleSubmit}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  <UilPlay className="w-5 h-5 mr-2" />
                  Start Workflow
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}