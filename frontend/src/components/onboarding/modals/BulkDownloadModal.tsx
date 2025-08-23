import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UilArrowRight, UilCloudDownload, UilFilter, UilDatabase } from '@tooni/iconscout-unicons-react';

interface BulkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkDownloadModal({ isOpen, onClose }: BulkDownloadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full bg-yellow-50">
        <CardContent className="p-6 space-y-6 bg-yellow-50">
          <h2 className="text-2xl font-black uppercase text-center">
            BULK DOWNLOAD TRANSCRIPTS
          </h2>
          
          <p className="text-lg text-center text-gray-700 font-semibold">
            Scale your training data collection with our powerful bulk download system:
          </p>
          
          <div className="rounded-lg bg-gray-100 p-4 flex items-center justify-center">
            <Image 
              src="/example.png" 
              alt="Bulk download" 
              width={400}
              height={200}
              className="max-w-full h-auto"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button variant="reverse-header" size="icon" className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-400/90">
                <UilCloudDownload className="h-5 w-5 text-black" />
              </Button>
              <span className="text-lg font-semibold">Process thousands of videos simultaneously</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="reverse-header" size="icon" className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-400/90">
                <UilDatabase className="h-5 w-5 text-black" />
              </Button>
              <span className="text-lg font-semibold">Extract transcripts for training datasets</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="reverse-header" size="icon" className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-400/90">
                <UilFilter className="h-5 w-5 text-black" />
              </Button>
              <span className="text-lg font-semibold">Filter by channel, playlist, or keywords</span>
            </div>
          </div>
          
          <Button
            className="w-full h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
            onClick={onClose}
          >
            <span className="flex items-center justify-center">
              CONTINUE
              <UilArrowRight className="ml-2 h-6 w-6" />
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}