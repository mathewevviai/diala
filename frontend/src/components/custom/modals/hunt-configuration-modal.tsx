import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Slider } from '../../ui/slider';
import PremiumFeatureCard from '../premium-feature-card';
import { 
  UilTimes, 
  UilLock, 
  UilLinkedin,
  UilSearchAlt,
  UilBuilding,
  UilMapMarker,
  UilFilter,
  UilUsersAlt,
  UilDollarSign
} from '@tooni/iconscout-unicons-react';

interface HuntConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (huntData: HuntConfigurationData) => void;
}

export interface HuntConfigurationData {
  name: string;
  location: string;
  businessType: string;
  keywords: string[];
  includeLinkedIn: boolean;
  searchDepth: number;
  advancedFilters: {
    employeeRange?: string;
    revenueRange?: string;
    yearsInBusiness?: string;
  };
  dataEnrichment: {
    emailFinder: boolean;
    socialProfiles: boolean;
    technographics: boolean;
  };
}

export default function HuntConfigurationModal({ isOpen, onClose, onSave }: HuntConfigurationModalProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState<HuntConfigurationData>({
    name: '',
    location: '',
    businessType: '',
    keywords: [],
    includeLinkedIn: true,
    searchDepth: 3,
    advancedFilters: {},
    dataEnrichment: {
      emailFinder: false,
      socialProfiles: false,
      technographics: false
    }
  });
  const [keywordInput, setKeywordInput] = React.useState('');

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        location: '',
        businessType: '',
        keywords: [],
        includeLinkedIn: true,
        searchDepth: 3,
        advancedFilters: {},
        dataEnrichment: {
          emailFinder: false,
          socialProfiles: false,
          technographics: false
        }
      });
      setKeywordInput('');
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof HuntConfigurationData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < 5) {
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
      <Card className="w-full max-w-2xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-background max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b-4 border-black bg-[rgb(0,82,255)] relative sticky top-0 z-10">
          <CardTitle className="text-2xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            CONFIGURE HUNT - STEP {currentStep} OF 5
          </CardTitle>
          <Button
            variant="neutral"
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
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((step, index) => (
                <React.Fragment key={step}>
                  <div className={`
                    relative px-4 py-2 border-4 border-black flex items-center justify-center font-bold text-sm
                    transition-all duration-300
                    ${currentStep === step 
                      ? 'bg-[rgb(0,82,255)] text-white scale-105 shadow-[3px_3px_0_rgba(0,0,0,1)]' 
                      : currentStep > step 
                        ? 'bg-[rgb(0,82,255)] text-white shadow-[2px_2px_0_rgba(0,0,0,1)]'
                        : 'bg-gray-300 text-gray-600 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                    }
                  `}>
                    {step}
                  </div>
                  {index < 4 && (
                    <div className={`w-8 h-2 mx-2 border-2 border-black transition-all duration-300 ${
                      currentStep > step 
                        ? 'bg-white shadow-[2px_2px_0_rgba(0,0,0,1)]' 
                        : 'bg-gray-400'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step 1: Hunt Name & Type */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Name Your Hunt
                </label>
                <Input
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder="E.g., SaaS Companies Bay Area Q1"
                  className="border-2 border-black rounded-[3px] text-lg"
                />
                <p className="text-xs text-gray-600 mt-1">Give your hunt a memorable name to track it later</p>
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Business Type / Industry
                </label>
                <Input
                  value={formData.businessType}
                  onChange={handleInputChange('businessType')}
                  placeholder="E.g., Software, E-commerce, Healthcare"
                  className="border-2 border-black rounded-[3px] text-lg"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!formData.name || !formData.businessType}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Location & Keywords */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  <UilMapMarker className="inline w-4 h-4 mr-1" />
                  Target Location
                </label>
                <Input
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  placeholder="E.g., San Francisco, CA or United States"
                  className="border-2 border-black rounded-[3px] text-lg"
                />
                <p className="text-xs text-gray-600 mt-1">City, state, country, or region</p>
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  <UilFilter className="inline w-4 h-4 mr-1" />
                  Search Keywords
                </label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Add a keyword..."
                    className="border-2 border-black rounded-[3px]"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <Button
                    onClick={handleAddKeyword}
                    variant="neutral"
                  >
                    ADD
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      className="px-3 py-1 border-2 border-black bg-white text-black font-bold cursor-pointer hover:bg-red-100"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
                {formData.keywords.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">Add keywords like "B2B", "Enterprise", "Cloud", etc.</p>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  onClick={handleBack}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!formData.location || formData.keywords.length === 0}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Search Settings */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-4" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  <UilSearchAlt className="inline w-4 h-4 mr-1" />
                  Search Depth (1-5 Levels)
                </label>
                <div className="space-y-2">
                  <Slider 
                    value={[formData.searchDepth]} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, searchDepth: value[0] }))}
                    min={1} 
                    max={5} 
                    step={1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-gray-600 font-bold">
                    <span>Shallow</span>
                    <span className="text-lg text-black">{formData.searchDepth}</span>
                    <span>Deep</span>
                  </div>
                  <p className="text-xs text-gray-600 text-center mt-2">
                    Level {formData.searchDepth}: ~{formData.searchDepth * 1000} pages to analyze
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  <UilLinkedin className="inline w-4 h-4 mr-1" />
                  LinkedIn Integration
                </label>
                <PremiumFeatureCard
                  title="LINKEDIN SEARCH & ENRICHMENT"
                  description="Find decision makers and enrich contact information from LinkedIn profiles"
                  price="$59/month"
                />
              </div>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  onClick={handleBack}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleNext}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Advanced Filters (Premium) */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black uppercase text-black mb-4" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Advanced Filters
                </h3>
                
                {/* Premium Features */}
                <div className="space-y-3">
                  <Card className="w-full border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] bg-gray-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-200 opacity-50"></div>
                    <CardContent className="p-4 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-black uppercase flex items-center gap-2">
                            <UilUsersAlt className="w-5 h-5" />
                            Employee Range Filter
                            <Badge className="bg-yellow-400 border-2 border-black text-xs">PREMIUM</Badge>
                          </h4>
                          <p className="text-sm text-gray-700 mt-1">Filter by company size (1-50, 50-200, etc.)</p>
                        </div>
                        <UilLock className="w-6 h-6 text-gray-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="w-full border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] bg-gray-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-200 opacity-50"></div>
                    <CardContent className="p-4 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-black uppercase flex items-center gap-2">
                            <UilDollarSign className="w-5 h-5" />
                            Revenue Range Filter
                            <Badge className="bg-yellow-400 border-2 border-black text-xs">PREMIUM</Badge>
                          </h4>
                          <p className="text-sm text-gray-700 mt-1">Target by annual revenue brackets</p>
                        </div>
                        <UilLock className="w-6 h-6 text-gray-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="w-full border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] bg-gray-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-200 opacity-50"></div>
                    <CardContent className="p-4 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-black uppercase flex items-center gap-2">
                            <UilBuilding className="w-5 h-5" />
                            Years in Business
                            <Badge className="bg-yellow-400 border-2 border-black text-xs">PREMIUM</Badge>
                          </h4>
                          <p className="text-sm text-gray-700 mt-1">Find established or new companies</p>
                        </div>
                        <UilLock className="w-6 h-6 text-gray-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 border-3 border-yellow-400 rounded-lg">
                  <p className="text-sm font-bold text-yellow-800">
                    🚀 Upgrade to Premium to unlock advanced filtering and get 3x more qualified leads
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  onClick={handleBack}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleNext}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Launch */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase text-black mb-4" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Review Your Hunt Configuration
              </h3>

              {/* Configuration Summary */}
              <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-yellow-50">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-black text-gray-600 uppercase">Hunt Name</p>
                      <p className="font-bold text-lg">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-600 uppercase">Business Type</p>
                      <p className="font-bold text-lg">{formData.businessType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-600 uppercase">Location</p>
                      <p className="font-bold text-lg">{formData.location}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-600 uppercase">Search Depth</p>
                      <p className="font-bold text-lg">Level {formData.searchDepth}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-black text-gray-600 uppercase mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map((keyword) => (
                        <Badge key={keyword} className="border-2 border-black bg-white">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${formData.includeLinkedIn ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-bold">LinkedIn Integration</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estimated Results */}
              <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-blue-50">
                <CardContent className="p-4">
                  <h4 className="font-black uppercase mb-2">Estimated Results</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-black text-black">{Math.floor(Math.random() * 2000 + 500)}</p>
                      <p className="text-xs text-gray-600">Pages to Scan</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-black">{Math.floor(Math.random() * 300 + 100)}</p>
                      <p className="text-xs text-gray-600">Expected Businesses</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-black">2-4h</p>
                      <p className="text-xs text-gray-600">Processing Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  onClick={handleBack}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  🚀 LAUNCH HUNT
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}