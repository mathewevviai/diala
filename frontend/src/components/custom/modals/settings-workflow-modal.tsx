import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
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
  UilSync,
  UilPlay,
  UilExclamationTriangle
} from '@tooni/iconscout-unicons-react';

interface SearchWorkflow {
  id: string;
  name: string;
  status: 'idle' | 'searching' | 'scraping' | 'analyzing' | 'validating' | 'completed' | 'failed';
  progress: number;
  parameters: {
    location: string;
    businessType: string;
    keywords: string[];
    includeLinkedIn: boolean;
    searchDepth: number;
  };
  stats: {
    pagesFound: number;
    pagesScraped: number;
    businessesExtracted: number;
    businessesValidated: number;
    matchRate: number;
  };
  createdAt: string;
  completedAt?: string;
  estimatedTime?: string;
}

interface SettingsWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: SearchWorkflow | null;
  onSave: (updatedWorkflow: Partial<SearchWorkflow>) => void;
}

export default function SettingsWorkflowModal({ isOpen, onClose, workflow, onSave }: SettingsWorkflowModalProps) {
  const [formData, setFormData] = React.useState({
    name: '',
    location: '',
    businessType: '',
    keywords: [] as string[],
    includeLinkedIn: false,
    searchDepth: 3
  });
  const [keywordInput, setKeywordInput] = React.useState('');
  const [showRestartWarning, setShowRestartWarning] = React.useState(false);

  // Update form data when workflow changes
  React.useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        location: workflow.parameters.location,
        businessType: workflow.parameters.businessType,
        keywords: [...workflow.parameters.keywords],
        includeLinkedIn: workflow.parameters.includeLinkedIn,
        searchDepth: workflow.parameters.searchDepth
      });
    }
  }, [workflow]);

  // Check if any changes were made
  const hasChanges = React.useMemo(() => {
    if (!workflow) return false;
    return (
      formData.name !== workflow.name ||
      formData.location !== workflow.parameters.location ||
      formData.businessType !== workflow.parameters.businessType ||
      formData.keywords.length !== workflow.parameters.keywords.length ||
      formData.keywords.some((k, i) => k !== workflow.parameters.keywords[i]) ||
      formData.includeLinkedIn !== workflow.parameters.includeLinkedIn ||
      formData.searchDepth !== workflow.parameters.searchDepth
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
    const updatedWorkflow = {
      name: formData.name,
      parameters: {
        location: formData.location,
        businessType: formData.businessType,
        keywords: formData.keywords,
        includeLinkedIn: formData.includeLinkedIn,
        searchDepth: formData.searchDepth
      }
    };
    onSave(updatedWorkflow);
    onClose();
  };

  const isWorkflowActive = workflow.status !== 'completed' && workflow.status !== 'failed' && workflow.status !== 'idle';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-background max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b-4 border-black bg-[rgb(0,82,255)] relative sticky top-0 z-10">
          <CardTitle className="text-2xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            WORKFLOW SETTINGS
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

          {/* Hunt Name & Type */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Workflow Name
              </label>
              <Input
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="E.g., SaaS Companies Bay Area Q1"
                className="border-2 border-black rounded-[3px] text-lg"
              />
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
          </div>

          {/* Location & Keywords */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                <UilMapMarker className="inline w-4 h-4 mr-1" />
                Target Location
              </label>
              <Input
                value={formData.location}
                onChange={handleInputChange('location')}
                placeholder="E.g., San Francisco, CA or United States"
                className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] text-lg"
              />
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
                  className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]"
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
            </div>
          </div>

          {/* Search Depth */}
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

          {/* LinkedIn Integration */}
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
                        Current progress: {workflow.progress}% • {workflow.stats.businessesExtracted} businesses found
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
              disabled={!hasChanges || !formData.name || !formData.location || !formData.businessType}
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
                if (key === 'keywords') {
                  return formData.keywords.length !== workflow.parameters.keywords.length ||
                         formData.keywords.some((k, i) => k !== workflow.parameters.keywords[i]);
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