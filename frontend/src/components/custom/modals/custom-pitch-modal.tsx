import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { UilTimes, UilLock } from '@tooni/iconscout-unicons-react';
import PremiumFeatureCard from '../premium-feature-card';

interface CustomPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pitchData: CustomPitchData) => void;
}

export interface CustomPitchData {
  businessName: string;
  whatYouDo: string;
  howItSpeaks: string;
  mainGoal: string;
  aiDisclosure: boolean;
  customPersonality: boolean;
}

export default function CustomPitchModal({ isOpen, onClose, onSave }: CustomPitchModalProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState<CustomPitchData>({
    businessName: '',
    whatYouDo: '',
    howItSpeaks: 'professional',
    mainGoal: '',
    aiDisclosure: true, // Default to disclosing AI
    customPersonality: false
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        businessName: '',
        whatYouDo: '',
        howItSpeaks: 'professional',
        mainGoal: '',
        aiDisclosure: true,
        customPersonality: false
      });
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof CustomPitchData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg border-2 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-white">
        <CardHeader className="border-b-2 border-black bg-[rgb(0,82,255)] relative">
          <CardTitle className="text-xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            CREATE CUSTOM PITCH - STEP {currentStep} OF 4
          </CardTitle>
          <Button
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <UilTimes className="h-5 w-5 text-black" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-1 sm:gap-2">
              {[1, 2, 3, 4].map((step, index) => (
                <React.Fragment key={step}>
                  <div className={`
                    relative px-2 py-1 sm:px-4 sm:py-2 border-2 sm:border-4 border-black flex items-center justify-center font-bold text-xs sm:text-sm
                    transition-all duration-300
                    ${currentStep === step 
                      ? 'bg-[rgb(0,82,255)] text-white scale-105 shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[3px_3px_0_rgba(0,0,0,1)]' 
                      : currentStep > step 
                        ? 'bg-[rgb(0,82,255)] text-white shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]'
                        : 'bg-gray-300 text-gray-600 shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]'
                    }
                  `}>
                    {step}
                  </div>
                  {index < 3 && (
                    <div className={`w-4 h-1 mx-1 sm:w-8 sm:h-2 sm:mx-2 border sm:border-2 border-black transition-all duration-300 ${
                      currentStep > step 
                        ? 'bg-white shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]' 
                        : 'bg-gray-400'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step 1: Business Name */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  What's your business name?
                </label>
                <Input
                  value={formData.businessName}
                  onChange={handleInputChange('businessName')}
                  placeholder="Acme Corporation"
                  className="border-2 border-black"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleNext}
                  disabled={!formData.businessName}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: What You Do */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  What do you do?
                </label>
                <Textarea
                  value={formData.whatYouDo}
                  onChange={handleInputChange('whatYouDo')}
                  placeholder="We help small businesses manage their inventory with our cloud-based software..."
                  className="border-2 border-black min-h-[120px]"
                />
              </div>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleBack}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  ← Back
                </Button>
                <Button
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleNext}
                  disabled={!formData.whatYouDo}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: How It Speaks */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  How should your agent speak?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Professional', 'Friendly', 'Enthusiastic', 'Casual'].map((tone) => (
                    <Button
                      key={tone}
                      onClick={() => setFormData(prev => ({ ...prev, howItSpeaks: tone.toLowerCase() }))}
                      variant={formData.howItSpeaks === tone.toLowerCase() ? "default" : "neutral"}
                      className="w-full font-black uppercase"
                      style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                    >
                      {tone}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Personality - Premium Feature */}
              <div className="mt-6">
                <PremiumFeatureCard 
                  title="CUSTOM PERSONALITY"
                  description="Create unique speaking styles & personalities"
                  price="$39/month"
                />
              </div>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
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

          {/* Step 4: Goal & AI Disclosure */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  What should your agent do?
                </label>
                <Textarea
                  value={formData.mainGoal}
                  onChange={handleInputChange('mainGoal')}
                  placeholder="Book demos with interested businesses, answer basic product questions, qualify leads..."
                  className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] min-h-[100px]"
                />
              </div>

              {/* AI Disclosure Control - Premium Feature */}
              <div className="mt-6">
                <PremiumFeatureCard 
                  title="AI DISCLOSURE CONTROL"
                  description="Control how your agent discloses its AI nature"
                  price="$39/month"
                />
              </div>

              {/* Preview */}
              <div className="bg-yellow-100 border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <p className="text-sm text-gray-700">
                  <span className="font-black text-black uppercase">Preview:</span> "Hi, this is an AI assistant from {formData.businessName}. 
                  {formData.whatYouDo ? ` We ${formData.whatYouDo}.` : ''} 
                  {formData.mainGoal ? ` I'm calling to ${formData.mainGoal}.` : ''}"
                </p>
                <p className="text-xs text-gray-600 mt-2 italic">
                  Speaking style: {formData.howItSpeaks}
                </p>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  className="px-6 py-2 font-black uppercase"
                  onClick={handleBack}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  ← Back
                </Button>
                <Button
                  className="px-6 py-2 font-black uppercase bg-green-400"
                  onClick={handleSubmit}
                  disabled={!formData.mainGoal}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Create Pitch ✓
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}