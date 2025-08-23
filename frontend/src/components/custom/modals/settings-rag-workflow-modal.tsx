import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Slider } from '../../ui/slider';
import { 
  UilTimes, 
  UilBrain,
  UilDatabase,
  UilFile,
  UilLink,
  UilYoutube,
  UilExclamationTriangle,
  UilSync,
  UilPlay,
  UilTrash
} from '@tooni/iconscout-unicons-react';

interface RAGWorkflow {
  id: string;
  name: string;
  status: 'queued' | 'scraping' | 'embedding' | 'indexing' | 'validating' | 'completed' | 'failed';
  progress: number;
  type: 'youtube' | 'documents' | 'urls' | 'mixed';
  parameters: {
    sources: string[];
    chunkSize: number;
    overlap: number;
    embeddingModel: string;
    vectorStore: string;
  };
  stats: {
    totalContent: number;
    contentProcessed: number;
    embeddings: number;
    indexSize: string;
    processingTime?: string;
  };
  createdAt: string;
  completedAt?: string;
  estimatedTime?: string;
}

interface SettingsRAGWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: RAGWorkflow | null;
  onSave: (updatedWorkflow: Partial<RAGWorkflow>) => void;
}

export default function SettingsRAGWorkflowModal({ isOpen, onClose, workflow, onSave }: SettingsRAGWorkflowModalProps) {
  const [formData, setFormData] = React.useState({
    name: '',
    sources: [] as string[],
    chunkSize: 512,
    overlap: 50,
    embeddingModel: 'text-embedding-ada-002',
    vectorStore: 'pinecone'
  });
  const [sourceInput, setSourceInput] = React.useState('');
  const [showRestartWarning, setShowRestartWarning] = React.useState(false);

  // Update form data when workflow changes
  React.useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        sources: [...workflow.parameters.sources],
        chunkSize: workflow.parameters.chunkSize,
        overlap: workflow.parameters.overlap,
        embeddingModel: workflow.parameters.embeddingModel,
        vectorStore: workflow.parameters.vectorStore
      });
    }
  }, [workflow]);

  // Check if any changes were made
  const hasChanges = React.useMemo(() => {
    if (!workflow) return false;
    return (
      formData.name !== workflow.name ||
      formData.sources.length !== workflow.parameters.sources.length ||
      formData.sources.some((s, i) => s !== workflow.parameters.sources[i]) ||
      formData.chunkSize !== workflow.parameters.chunkSize ||
      formData.overlap !== workflow.parameters.overlap ||
      formData.embeddingModel !== workflow.parameters.embeddingModel ||
      formData.vectorStore !== workflow.parameters.vectorStore
    );
  }, [formData, workflow]);

  if (!isOpen || !workflow) return null;

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleAddSource = () => {
    if (sourceInput.trim() && !formData.sources.includes(sourceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sources: [...prev.sources, sourceInput.trim()]
      }));
      setSourceInput('');
    }
  };

  const handleRemoveSource = (source: string) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.filter(s => s !== source)
    }));
  };

  const handleSubmit = () => {
    const updatedWorkflow = {
      name: formData.name,
      parameters: {
        sources: formData.sources,
        chunkSize: formData.chunkSize,
        overlap: formData.overlap,
        embeddingModel: formData.embeddingModel,
        vectorStore: formData.vectorStore
      }
    };
    onSave(updatedWorkflow);
    onClose();
  };

  const isWorkflowActive = workflow.status !== 'completed' && workflow.status !== 'failed' && workflow.status !== 'queued';

  const getSourceIcon = (source: string) => {
    if (source.includes('youtube')) return <UilYoutube className="w-4 h-4 text-red-500" />;
    if (source.startsWith('http')) return <UilLink className="w-4 h-4 text-green-500" />;
    return <UilFile className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-background max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b-4 border-black bg-[rgb(0,82,255)] relative sticky top-0 z-10">
          <CardTitle className="text-2xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            RAG WORKFLOW SETTINGS
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
        
        <CardContent className="p-6 space-y-6">
          {/* Warning for active workflows */}
          {isWorkflowActive && (
            <Card className="border-4 border-orange-400 bg-orange-50 shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <UilExclamationTriangle className="w-6 h-6 text-orange-600" />
                  <div>
                    <p className="font-black text-orange-800 uppercase">Active Workflow</p>
                    <p className="text-sm text-orange-700">
                      Changes will require restarting this workflow and will lose current progress.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workflow Name */}
          <div>
            <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              Workflow Name
            </label>
            <Input
              value={formData.name}
              onChange={handleInputChange('name')}
              placeholder="E.g., Sales Training Knowledge Base"
              className="border-2 border-black rounded-[3px] text-lg"
            />
          </div>

          {/* Content Sources */}
          <div>
            <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              Content Sources
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                placeholder="Add URL, file name, or YouTube link..."
                className="border-2 border-black rounded-[3px]"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSource()}
              />
              <Button
                onClick={handleAddSource}
                variant="neutral"
              >
                ADD
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.sources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black">
                  {getSourceIcon(source)}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{source}</p>
                    <p className="text-xs text-gray-600">
                      {source.includes('youtube') ? 'YouTube' : 
                       source.startsWith('http') ? 'Web URL' : 'Document'}
                    </p>
                  </div>
                  <Button
                    variant="neutral"
                    size="sm"
                    className="bg-white p-2"
                    onClick={() => handleRemoveSource(source)}
                  >
                    <UilTrash className="w-4 h-4 text-black" />
                  </Button>
                </div>
              ))}
            </div>
            {formData.sources.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Add documents, URLs, or YouTube links to process</p>
            )}
          </div>

          {/* Processing Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              Processing Parameters
            </h3>
            
            <div>
              <label className="block text-sm font-black uppercase text-black mb-4" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Chunk Size: {formData.chunkSize} tokens
              </label>
              <Slider 
                value={[formData.chunkSize]} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, chunkSize: value[0] }))}
                min={128} 
                max={1024} 
                step={64}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-600 font-bold">
                <span>Small (128)</span>
                <span>Large (1024)</span>
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">
                Smaller chunks = more precise, Larger chunks = more context
              </p>
            </div>

            <div>
              <label className="block text-sm font-black uppercase text-black mb-4" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Overlap: {formData.overlap} tokens
              </label>
              <Slider 
                value={[formData.overlap]} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, overlap: value[0] }))}
                min={0} 
                max={100} 
                step={5}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-600 font-bold">
                <span>None (0)</span>
                <span>Max (100)</span>
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">
                Overlap between chunks to maintain context continuity
              </p>
            </div>
          </div>

          {/* Model Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              Model Configuration
            </h3>
            
            <div>
              <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                <UilBrain className="inline w-4 h-4 mr-1" />
                Embedding Model
              </label>
              <select
                value={formData.embeddingModel}
                onChange={(e) => setFormData(prev => ({ ...prev, embeddingModel: e.target.value }))}
                className="w-full border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] p-2 text-lg"
              >
                <option value="text-embedding-ada-002">OpenAI Ada-002</option>
                <option value="text-embedding-3-small">OpenAI Embedding-3-Small</option>
                <option value="text-embedding-3-large">OpenAI Embedding-3-Large</option>
                <option value="sentence-transformers">Sentence Transformers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                <UilDatabase className="inline w-4 h-4 mr-1" />
                Vector Store
              </label>
              <select
                value={formData.vectorStore}
                onChange={(e) => setFormData(prev => ({ ...prev, vectorStore: e.target.value }))}
                className="w-full border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] p-2 text-lg"
              >
                <option value="pinecone">Pinecone</option>
                <option value="chroma">Chroma</option>
                <option value="weaviate">Weaviate</option>
                <option value="qdrant">Qdrant</option>
                <option value="redis">Redis</option>
              </select>
            </div>
          </div>

          {/* Current Progress Warning */}
          {isWorkflowActive && workflow.progress > 0 && (
            <Card className="border-4 border-red-400 bg-red-50 shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <UilSync className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-black text-red-800 uppercase">Progress Will Be Lost</p>
                      <p className="text-sm text-red-700">
                        Current progress: {workflow.progress}% • {workflow.stats.embeddings} embeddings created
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-red-600">
                    Applying changes will restart the workflow from the beginning with new parameters.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t-4 border-black">
            <Button
              variant="neutral"
              onClick={onClose}
              className="flex-1"
              style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
            >
              CANCEL
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!hasChanges || !formData.name || formData.sources.length === 0}
              className="flex-1"
              style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
            >
              {isWorkflowActive ? (
                <>
                  <UilSync className="w-5 h-5 mr-2" />
                  RESTART WITH CHANGES
                </>
              ) : (
                <>
                  <UilPlay className="w-5 h-5 mr-2" />
                  SAVE & START
                </>
              )}
            </Button>
          </div>

          {hasChanges && (
            <p className="text-xs text-center text-gray-600">
              {Object.keys(formData).filter(key => {
                if (key === 'sources') {
                  return formData.sources.length !== workflow.parameters.sources.length ||
                         formData.sources.some((s, i) => s !== workflow.parameters.sources[i]);
                }
                return formData[key as keyof typeof formData] !== (workflow as any)[key === 'name' ? 'name' : 'parameters'][key];
              }).length} change(s) detected
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}