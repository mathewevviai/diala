'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UilUpload, UilFileAlt, UilCheckCircle, UilExclamationTriangle } from '@tooni/iconscout-unicons-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DragDropUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxFileSize?: number;
  disabled?: boolean;
}

export function DragDropUpload({ 
  onFileSelect, 
  acceptedFormats = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac'],
  maxFileSize = 25 * 1024 * 1024, // 25MB
  disabled = false
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 25MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload an audio file.');
      } else {
        setError('File upload failed. Please try again.');
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => ({ ...acc, [format]: [] }), {}),
    maxSize: maxFileSize,
    multiple: false,
    disabled: disabled
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-4 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer',
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500 bg-red-50'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <UilUpload className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {isDragActive ? 'Drop your audio file here' : 'Drag & drop your audio file'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              or <span className="text-blue-600 font-medium">click to browse</span>
            </p>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>Supported: MP3, WAV, OGG, M4A, FLAC</p>
            <p>Max size: 25MB</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <UilExclamationTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}