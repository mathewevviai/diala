import * as React from 'react';
import { UilUpload, UilPlus } from '@tooni/iconscout-unicons-react';

interface FileUploadCardProps {
  onFileUpload: (file: File | FileList) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  description?: string;
  fileTypes?: string;
  categoryColor?: string;
  categoryLabel?: string;
  bottomText?: string;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({ 
  onFileUpload,
  accept = 'audio/*',
  multiple = false,
  title = 'Drop Audio File',
  description = 'Drag & drop or click to browse',
  fileTypes = '',
  categoryColor = 'rgb(0,82,255)',
  categoryLabel = 'upload',
  bottomText = 'Upload your own audio'
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (multiple) {
        onFileUpload(files);
      } else {
        const file = files[0];
        // For backward compatibility, default to audio validation
        const isValidFile = accept === 'audio/*' ? file.type.startsWith('audio/') : true;
        if (isValidFile) {
          onFileUpload(file);
        }
      }
    }
  };

  const handleClick = () => {
    console.log('FileUploadCard clicked, triggering file input');
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('FileUploadCard handleFileSelect triggered');
    const files = e.target.files;
    console.log('Selected files:', files ? files.length : 'none', files);
    if (files && files.length > 0) {
      if (multiple) {
        console.log('Multiple mode: passing FileList to onFileUpload');
        // Always pass FileList for multiple uploads
        onFileUpload(files);
      } else {
        console.log('Single mode: validating and passing single file');
        const file = files[0];
        // For backward compatibility, default to audio validation
        const isValidFile = accept === 'audio/*' ? file.type.startsWith('audio/') : true;
        if (isValidFile) {
          onFileUpload(file);
        }
      }
    }
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div
      className={`
        relative w-full h-80
        border-4 border-black rounded-[3px]
        flex flex-col
        transition-all duration-200
        ${isDragOver ? 'scale-105 shadow-[8px_8px_0_rgba(0,0,0,1)] bg-[#E0F2E7]' : 'shadow-[4px_4px_0_rgba(0,0,0,1)]'}
        hover:scale-[1.02] hover:shadow-[6px_6px_0_rgba(0,0,0,1)]
        cursor-pointer overflow-hidden
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Category label at top */}
      <div className="text-white px-4 py-3 text-sm border-b-4 border-black" style={{ fontFamily: 'Noyh-Bold, sans-serif', backgroundColor: categoryColor }}>
        {categoryLabel}
      </div>

      {/* Main upload area */}
      <div className="flex-grow relative overflow-hidden p-3 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="w-full h-full border-2 border-black bg-gray-200 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-black rounded-[3px] flex items-center justify-center mx-auto" style={{ backgroundColor: categoryColor }}>
              <UilUpload className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                {title}
              </h3>
              <p className="text-sm text-gray-600">
                {description}
              </p>
              {fileTypes && (
                <p className="text-xs text-gray-500">
                  {fileTypes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 border-2 border-black p-2">
            <p className="text-sm text-black font-bold text-center" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              {bottomText}
            </p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default FileUploadCard;