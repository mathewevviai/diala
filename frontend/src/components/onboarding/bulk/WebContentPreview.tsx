'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UilFileAlt, UilEye } from '@tooni/iconscout-unicons-react';
import { ExternalLink, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

interface WebContentPreviewProps {
  workflowId: string;
  onBack?: () => void;
  onContinue?: () => void;
}

export function WebContentPreview({ workflowId, onBack, onContinue }: WebContentPreviewProps) {
  const webDocuments = useQuery(api.ragActions.getWebDocuments, { workflowId });

  const [selectedDoc, setSelectedDoc] = React.useState<any>(null);
  const [previewMode, setPreviewMode] = React.useState<'markdown' | 'raw'>('markdown');

  React.useEffect(() => {
    if (webDocuments && webDocuments.length > 0 && !selectedDoc) {
      setSelectedDoc(webDocuments[0]);
    }
  }, [webDocuments, selectedDoc]);

  const handleDownload = (doc: any) => {
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!webDocuments) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-lg">Loading web content...</p>
        </div>
      </div>
    );
  }

  if (webDocuments.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 border-4 border-black rounded-full flex items-center justify-center">
          <UilFileAlt className="h-12 w-12 text-gray-600" />
        </div>
        <h3 className="text-2xl font-black uppercase mb-2">No Web Content</h3>
        <p className="text-gray-600 mb-4">No web documents found for this workflow.</p>
        <Button onClick={onBack} variant="neutral" className="font-black uppercase">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black uppercase">Web Content Preview</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-bold">
            {webDocuments.length} Documents
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-1">
          <Card className="transform -rotate-1">
            <CardContent className="p-4">
              <h4 className="font-black uppercase mb-4">Documents</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {webDocuments.map((doc: any, index: number) => (
                  <div
                    key={doc._id}
                    className={`p-3 border-2 rounded cursor-pointer transition-all ${
                      selectedDoc?._id === doc._id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-black hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm truncate">{doc.title}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {index + 1}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="truncate">{doc.url}</div>
                      <div className="flex justify-between">
                        <span>{doc.metadata.wordCount} words</span>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Preview */}
        <div className="lg:col-span-2">
          {selectedDoc && (
            <Card className="transform rotate-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-black uppercase text-lg">{selectedDoc.title}</h4>
                    <a
                      href={selectedDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {selectedDoc.url}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={previewMode === 'markdown' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('markdown')}
                    >
                      <UilEye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedDoc)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <span className="font-bold">
                    {selectedDoc.metadata.wordCount} words
                  </span>
                  <span className="font-bold">
                    {selectedDoc.metadata.language || 'Unknown'} language
                  </span>
                  {selectedDoc.metadata.publishedTime && (
                    <span className="font-bold">
                      Published: {new Date(selectedDoc.metadata.publishedTime).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="border-2 border-black rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  {previewMode === 'markdown' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedDoc.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedDoc.content}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex gap-4 justify-center mt-8">
        {onBack && (
          <Button variant="neutral" onClick={onBack} className="font-black uppercase">
            Back
          </Button>
        )}
        {onContinue && (
          <Button onClick={onContinue} className="font-black uppercase">
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}