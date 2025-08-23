import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UilArrowRight, UilUser, UilMicrophone, UilPlay, UilVolumeUp } from '@tooni/iconscout-unicons-react';

interface VoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceCloneModal({ isOpen, onClose }: VoiceCloneModalProps) {
  const [cloneName, setCloneName] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  if (!isOpen) return null;

  const handleStartCloning = () => {
    if (!cloneName.trim()) {
      alert('Please enter a name for your voice clone');
      return;
    }
    
    setIsProcessing(true);
    // TODO: Implement actual voice cloning logic
    setTimeout(() => {
      setIsProcessing(false);
      alert(`Voice clone "${cloneName}" created successfully!`);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full bg-purple-50">
        <CardContent className="p-6 space-y-6 bg-purple-50">
          <h2 className="text-2xl font-black uppercase text-center">
            CREATE VOICE CLONE
          </h2>
          
          <p className="text-lg text-center text-gray-700 font-semibold">
            Clone any voice from your audio file for realistic AI conversations:
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold uppercase mb-2 block">
                Voice Clone Name
              </label>
              <Input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="e.g., Customer Service Agent"
                className="h-12 text-lg font-semibold border-3 border-black"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button variant="reverse-header" size="icon" className="flex-shrink-0 bg-purple-500 hover:bg-purple-600">
                <UilUser className="h-5 w-5 text-white" />
              </Button>
              <span className="text-lg font-semibold">Perfect voice matching technology</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="reverse-header" size="icon" className="flex-shrink-0 bg-purple-500 hover:bg-purple-600">
                <UilMicrophone className="h-5 w-5 text-white" />
              </Button>
              <span className="text-lg font-semibold">Capture unique speech patterns</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="reverse-header" size="icon" className="flex-shrink-0 bg-purple-500 hover:bg-purple-600">
                <UilVolumeUp className="h-5 w-5 text-white" />
              </Button>
              <span className="text-lg font-semibold">Natural tone and emotion replication</span>
            </div>
          </div>

          <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-800 text-center">
              ⚡ Voice cloning typically takes 30-60 seconds
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-gray-200 hover:bg-gray-300 text-black"
              onClick={onClose}
              disabled={isProcessing}
            >
              CANCEL
            </Button>
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-purple-500 hover:bg-purple-600 text-white"
              onClick={handleStartCloning}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  PROCESSING...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  START CLONING
                  <UilArrowRight className="ml-2 h-6 w-6" />
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}