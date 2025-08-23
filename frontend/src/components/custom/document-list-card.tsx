import * as React from 'react';
import { UilFileAlt, UilTrash, UilClock } from '@tooni/iconscout-unicons-react';
import { Button } from '@/components/ui/button';
import { DocumentItem } from '@/components/onboarding/bulk/types';

interface DocumentListCardProps {
  documents: DocumentItem[];
  onRemoveDocument: (id: string) => void;
}

const DocumentListCard: React.FC<DocumentListCardProps> = ({ 
  documents, 
  onRemoveDocument 
}) => {
  
  const getFileIcon = (type: string, fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    if (type.includes('pdf') || extension === 'pdf') {
      return <UilFileAlt className="h-6 w-6 text-red-600" />;
    }
    if (type.includes('word') || ['docx', 'doc'].includes(extension)) {
      return <UilFileAlt className="h-6 w-6 text-blue-600" />;
    }
    if (type.includes('text') || extension === 'txt') {
      return <UilFileAlt className="h-6 w-6 text-gray-600" />;
    }
    if (extension === 'md') {
      return <UilFileAlt className="h-6 w-6 text-purple-600" />;
    }
    if (type.includes('csv') || extension === 'csv') {
      return <UilFileAlt className="h-6 w-6 text-green-600" />;
    }
    if (type.includes('json') || extension === 'json') {
      return <UilFileAlt className="h-6 w-6 text-yellow-600" />;
    }
    return <UilFileAlt className="h-6 w-6 text-orange-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className="
        relative w-full
        border-4 border-black rounded-[3px]
        flex flex-col
        shadow-[4px_4px_0_rgba(0,0,0,1)]
        bg-white overflow-hidden
      "
    >
      {/* Header */}
      <div className="bg-orange-600 text-white px-4 py-3 text-sm border-b-4 border-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
        UPLOADED DOCUMENTS ({documents.length}/50)
      </div>

      {/* Documents List */}
      <div className="flex-grow bg-gradient-to-br from-orange-50 to-yellow-50 p-3">
        <div className="w-full h-full border-2 border-black bg-gray-200 p-4">
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <UilFileAlt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-bold">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-white border-2 border-black p-3 flex items-center gap-3 hover:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(doc.type, doc.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-black truncate" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                      <span className="font-medium">{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span className="font-medium">{doc.type.split('/').pop()?.toUpperCase()}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <UilClock className="h-3 w-3" />
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="subheader"
                    size="sm"
                    onClick={() => onRemoveDocument(doc.id)}
                    className="h-8 w-8 p-0 bg-red-400 hover:bg-red-500 border-2 border-black"
                  >
                    <UilTrash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentListCard;