import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { 
  UilTimes, 
  UilTrashAlt,
  UilExclamationTriangle,
  UilCheckCircle,
  UilDatabase
} from '@tooni/iconscout-unicons-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
  warningMessage?: string;
  consequences?: string[];
  requiresNameConfirmation?: boolean;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName, 
  itemType,
  warningMessage,
  consequences = [],
  requiresNameConfirmation = false,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const [nameConfirmation, setNameConfirmation] = React.useState('');
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setNameConfirmation('');
      setIsConfirmed(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (requiresNameConfirmation) {
      setIsConfirmed(nameConfirmation === itemName);
    } else {
      setIsConfirmed(true);
    }
  }, [nameConfirmation, itemName, requiresNameConfirmation]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isConfirmed && !isLoading) {
      onConfirm();
    }
  };

  const defaultConsequences = [
    'This action cannot be undone',
    'All associated data will be permanently deleted',
    'Any active processes will be immediately stopped'
  ];

  const displayConsequences = consequences.length > 0 ? consequences : defaultConsequences;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-background">
        <CardHeader className="border-b-4 border-black bg-red-500 relative">
          <CardTitle className="text-xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            <UilTrashAlt className="inline w-6 h-6 mr-2" />
            DELETE {itemType.toUpperCase()}
          </CardTitle>
          <Button
            variant="neutral"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
            disabled={isLoading}
          >
            <UilTimes className="h-4 w-4 text-black" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Warning Icon and Message */}
          <div className="flex items-center gap-4 p-4 bg-red-50 border-4 border-black">
            <UilExclamationTriangle className="w-12 h-12 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-black text-red-800 uppercase text-lg">
                Warning!
              </p>
              <p className="text-red-700 font-bold">
                {warningMessage || `You are about to delete the ${itemType}`}
              </p>
            </div>
          </div>

          {/* Item Details */}
          <div className="p-4 bg-gray-50 border-4 border-black">
            <p className="text-xs font-black uppercase text-gray-600 mb-1">{itemType} to delete:</p>
            <p className="font-black text-xl text-black break-words">{itemName}</p>
          </div>

          {/* Consequences */}
          <div className="space-y-3">
            <p className="font-black uppercase text-black text-sm">This will:</p>
            <div className="space-y-2">
              {displayConsequences.map((consequence, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 border border-black mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 font-medium">{consequence}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Name Confirmation Input */}
          {requiresNameConfirmation && (
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase text-black">
                Type "{itemName}" to confirm:
              </label>
              <Input
                value={nameConfirmation}
                onChange={(e) => setNameConfirmation(e.target.value)}
                placeholder={`Enter ${itemName}`}
                className="border-2 border-black rounded-[3px]"
                disabled={isLoading}
              />
              {nameConfirmation && nameConfirmation !== itemName && (
                <p className="text-xs text-red-600">Name doesn't match. Please type exactly: {itemName}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="neutral"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
              style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
            >
              CANCEL
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmed || isLoading}
              className="flex-1 bg-red-500 hover:bg-red-600"
              style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  DELETING...
                </>
              ) : (
                <>
                  <UilTrashAlt className="w-4 h-4 mr-2" />
                  DELETE {itemType.toUpperCase()}
                </>
              )}
            </Button>
          </div>

          {/* Additional Warning for High-Risk Items */}
          {requiresNameConfirmation && (
            <div className="text-center">
              <p className="text-xs text-red-600 font-medium">
                ⚠️ This is a high-risk operation that requires name confirmation
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}