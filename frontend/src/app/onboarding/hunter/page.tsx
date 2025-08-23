'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import SimpleOnboardingNav from '@/components/custom/simple-onboarding-nav';
import VerificationModal from '@/components/custom/modals/verification-modal';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { useConvexErrorHandler } from '@/hooks/useConvexErrorHandler';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { 
  UilSearch, 
  UilPhone, 
  UilAnalytics,
  UilFilter,
  UilUserCheck,
  UilPlay,
  UilCheckCircle,
  UilCrosshair,
  UilGlobe,
  UilDatabase,
  UilBuilding
} from '@tooni/iconscout-unicons-react';

// Import step components
import { SearchDefinitionStep, SearchDefinitionInfoSections } from '@/components/onboarding/hunter/SearchDefinitionStep';
import { IndustryLocationStep } from '@/components/onboarding/hunter/IndustryLocationStep';
import { CompanyDetailsStep } from '@/components/onboarding/hunter/CompanyDetailsStep';
import { SearchKeywordsStep } from '@/components/onboarding/hunter/SearchKeywordsStep';
import { ContactPreferencesStep } from '@/components/onboarding/hunter/ContactPreferencesStep';
import { ValidationCriteriaStep } from '@/components/onboarding/hunter/ValidationCriteriaStep';
import { SearchPreviewStep } from '@/components/onboarding/hunter/SearchPreviewStep';
import { SearchProgressStep } from '@/components/onboarding/hunter/SearchProgressStep';
import { SearchResultsStep } from '@/components/onboarding/hunter/SearchResultsStep';

import { 
  SearchCriteria, 
  ValidationCriteria, 
  ContactPreferences, 
  SearchResults, 
  LeadSource,
  StepProps 
} from '@/components/onboarding/hunter/types';

// Constants
const leadSources: LeadSource[] = [
  {
    id: 'web',
    name: 'Web Search',
    icon: <UilGlobe className="h-8 w-8" />,
    description: 'Crawl websites and online directories',
    color: 'bg-green-600'
  },
  {
    id: 'database',
    name: 'B2B Database',
    icon: <UilDatabase className="h-8 w-8" />,
    description: 'Access verified business contacts',
    color: 'bg-purple-600'
  },
  {
    id: 'directory',
    name: 'Business Directories',
    icon: <UilBuilding className="h-8 w-8" />,
    description: 'Search Yellow Pages and industry directories',
    color: 'bg-orange-600'
  }
];

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Real Estate',
  'Retail',
  'Manufacturing',
  'Education',
  'Consulting',
  'Other'
];

const jobTitles = [
  'CEO',
  'CTO',
  'VP Sales',
  'Marketing Director',
  'HR Manager',
  'Operations Manager',
  'Product Manager',
  'Business Owner'
];

export default function HunterOnboarding() {
  // const { user } = useUser(); // Temporarily commented out for backend integration
  const user = { id: "temp-user-123" }; // Temporary mock user for testing
  const createTestSubscription = useMutation(api.testSetup.createTestSubscription);
  const updateSubscriptionLimits = useMutation(api.testSetup.updateSubscriptionLimits);
  const { handleConvexError } = useConvexErrorHandler();
  
  // Step state
  const [currentStep, setCurrentStep] = React.useState(1);
  
  // Search definition state
  const [searchName, setSearchName] = React.useState('');
  const [searchObjective, setSearchObjective] = React.useState('');
  const [selectedSources, setSelectedSources] = React.useState<string[]>([]);
  
  // Search criteria state
  const [searchCriteria, setSearchCriteria] = React.useState<SearchCriteria>({
    industry: '',
    location: '',
    companySize: '1-100',
    jobTitles: [],
    keywords: ''
  });
  const [customIndustry, setCustomIndustry] = React.useState('');
  
  // Contact preferences state
  const [contactPreferences, setContactPreferences] = React.useState<ContactPreferences>({
    includeEmails: true,
    includePhones: true,
    includeLinkedIn: false
  });
  
  // Validation criteria state
  const [validationCriteria, setValidationCriteria] = React.useState<ValidationCriteria>({
    mustHaveWebsite: true,
    mustHaveContactInfo: true,
    mustHaveSpecificKeywords: [],
    mustBeInIndustry: true,
    customValidationRules: ''
  });
  
  // Search execution state
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchProgress, setSearchProgress] = React.useState(0);
  const [currentStatus, setCurrentStatus] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResults | null>(null);
  const [showVerification, setShowVerification] = React.useState(false);
  const [currentSearchId, setCurrentSearchId] = React.useState<string | null>(null);
  const [devMode, setDevMode] = React.useState(false);

  // Convex actions and queries
  const createLeadSearch = useAction(api.hunterActions.createLeadSearch);
  const getSearchStatus = useAction(api.hunterActions.getSearchStatus);
  const userUsageStats = useQuery(api.rateLimitHelpers.getUserUsageStats, 
    user?.id ? { userId: user.id } : "skip"
  );

  // Auto-fill function for dev mode
  React.useEffect(() => {
    if (devMode) {
      setSearchName('Northern Ireland Roofing Contractors Q4');
      setSearchObjective('Finding roofing contractors and construction companies across Northern Ireland for partnership opportunities');
      setSelectedSources(['web']);
      setSearchCriteria({
        industry: 'Other',
        location: 'Northern Ireland',
        companySize: '1-100',
        jobTitles: ['Business Owner', 'Operations Manager'],
        keywords: 'roofing, roof repair, slate, tiles, guttering, Belfast, Derry, Londonderry, Newry, Lisburn, Bangor, Antrim, Armagh, Coleraine'
      });
      setCustomIndustry('Roofing & Construction');
      setContactPreferences({
        includeEmails: true,
        includePhones: true,
        includeLinkedIn: false
      });
      setValidationCriteria({
        mustHaveWebsite: true,
        mustHaveContactInfo: true,
        mustHaveSpecificKeywords: ['roofing', 'contractor', 'Northern Ireland'],
        mustBeInIndustry: true,
        customValidationRules: 'Must offer residential or commercial roofing services in Northern Ireland'
      });
    }
  }, [devMode]);

  // Create test subscription and update limits on mount
  React.useEffect(() => {
    if (user?.id) {
      createTestSubscription({ userId: user.id })
        .then(() => {
          return updateSubscriptionLimits({ userId: user.id });
        })
        .catch((err) => {
          console.log("Subscription handling:", err.message);
          updateSubscriptionLimits({ userId: user.id }).catch(console.error);
        });
    }
  }, [user?.id, createTestSubscription, updateSubscriptionLimits]);

  // Handler functions
  const handleSourceSelect = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(selectedSources.filter(s => s !== sourceId));
    } else {
      setSelectedSources([...selectedSources, sourceId]);
    }
  };

  const toggleJobTitle = (title: string) => {
    setSearchCriteria(prev => ({
      ...prev,
      jobTitles: prev.jobTitles.includes(title)
        ? prev.jobTitles.filter(t => t !== title)
        : [...prev.jobTitles, title]
    }));
  };

  const canStartSearch = () => {
    if (!searchName || !searchObjective || selectedSources.length === 0 || 
        !searchCriteria.industry || !searchCriteria.location) {
      return false;
    }
    if (searchCriteria.location.toLowerCase() === searchCriteria.industry.toLowerCase()) {
      return false;
    }
    if (searchName.toLowerCase() === searchCriteria.industry.toLowerCase()) {
      return false;
    }
    return true;
  };

  const startSearch = async () => {
    if (!user?.id) {
      toast.error('Please sign in to start a search');
      return;
    }

    setIsSearching(true);
    setCurrentStep(5);
    setCurrentStatus('Initializing search...');
    setSearchProgress(10);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowVerification(true);
  };

  const handleVerificationComplete = async (email: string, phone: string) => {
    setShowVerification(false);
    
    if (!user?.id) {
      toast.error('Please sign in to continue');
      return;
    }

    try {
      const searchConfig = {
        searchName,
        searchObjective,
        selectedSources,
        industry: searchCriteria.industry === 'Other' ? customIndustry : searchCriteria.industry,
        location: searchCriteria.location,
        companySize: searchCriteria.companySize || '1-100',
        jobTitles: searchCriteria.jobTitles,
        keywords: searchCriteria.keywords,
        includeEmails: contactPreferences.includeEmails,
        includePhones: contactPreferences.includePhones,
        includeLinkedIn: contactPreferences.includeLinkedIn,
        validationCriteria: {
          mustHaveWebsite: validationCriteria.mustHaveWebsite,
          mustHaveContactInfo: validationCriteria.mustHaveContactInfo,
          mustHaveSpecificKeywords: validationCriteria.mustHaveSpecificKeywords,
          mustBeInIndustry: validationCriteria.mustBeInIndustry,
          customValidationRules: validationCriteria.customValidationRules,
        },
      };

      const result = await createLeadSearch({
        userId: user.id,
        searchConfig,
      });

      setCurrentSearchId(result.searchId);
      pollSearchProgress(result.searchId);
      
    } catch (error) {
      console.error('Search creation failed:', error);
      setCurrentStatus('Search failed: ' + (error.message || 'Unknown error'));
      setIsSearching(false);
      handleConvexError(error);
    }
  };

  // Poll search progress
  const pollSearchProgress = async (searchId: string) => {
    const maxAttempts = 60;
    let attempts = 0;
    let lastProgress = 0;
    let stuckCounter = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setCurrentStatus('Search timed out - please check back later');
        setIsSearching(false);
        return;
      }

      try {
        const status = await getSearchStatus({ searchId });
        
        const newProgress = status.progress || 0;
        if (newProgress > lastProgress) {
          const increment = (newProgress - lastProgress) / 10;
          for (let i = 1; i <= 10; i++) {
            setTimeout(() => {
              setSearchProgress(prev => Math.min(prev + increment, newProgress));
            }, i * 50);
          }
          lastProgress = newProgress;
          stuckCounter = 0;
        } else {
          stuckCounter++;
          if (stuckCounter > 6) {
            setCurrentStatus(status.currentStage + ' (this may take a while...)');
          }
        }

        setCurrentStatus(status.currentStage || 'Processing...');

        if (status.status === 'completed') {
          setSearchProgress(100);
          setSearchResults({
            totalLeads: status.totalLeads || 0,
            verifiedEmails: status.verifiedEmails || 0,
            verifiedPhones: status.verifiedPhones || 0,
            businessWebsites: status.businessWebsites || 0,
            avgResponseRate: status.avgResponseRate || '0%',
            searchTime: status.searchTime || '0m 0s'
          });
          setIsSearching(false);
          setCurrentStep(6);
          return;
        } else if (status.status === 'failed') {
          setCurrentStatus('Search failed: ' + (status.error || 'Unknown error'));
          setIsSearching(false);
          
          toast.error('Search failed. Click to retry', {
            action: {
              label: 'Retry',
              onClick: () => {
                setCurrentStep(4);
                setSearchProgress(0);
                setCurrentStatus('');
              }
            },
            duration: 10000
          });
          return;
        }

        attempts++;
        const pollInterval = newProgress > 90 ? 5000 : 10000;
        setTimeout(poll, pollInterval);
        
      } catch (error) {
        console.error('Error polling search status:', error);
        attempts++;
        
        if (attempts > 3) {
          setCurrentStatus('Connection issue - retrying...');
        }
        
        setTimeout(poll, 15000);
      }
    };

    poll();
  };

  const handleStepChange = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // Create step props object
  const stepProps: StepProps = {
    currentStep,
    setCurrentStep,
    searchName,
    setSearchName,
    searchObjective,
    setSearchObjective,
    selectedSources,
    setSelectedSources,
    searchCriteria,
    setSearchCriteria,
    customIndustry,
    setCustomIndustry,
    contactPreferences,
    setContactPreferences,
    validationCriteria,
    setValidationCriteria,
    isSearching,
    setIsSearching,
    searchProgress,
    setSearchProgress,
    currentStatus,
    setCurrentStatus,
    searchResults,
    setSearchResults,
    currentSearchId,
    setCurrentSearchId,
    showVerification,
    setShowVerification,
    devMode,
    setDevMode,
    handleSourceSelect,
    toggleJobTitle,
    canStartSearch,
    startSearch,
    handleVerificationComplete,
    handleStepChange,
    userUsageStats,
    createLeadSearch,
    getSearchStatus,
    leadSources,
    industries,
    jobTitles
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-violet-400 relative pb-8" style={{ 
        fontFamily: 'Noyh-Bold, sans-serif',
        backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}>
      {/* Dev Mode Toggle */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setDevMode(!devMode)}
            className={`h-10 px-4 text-sm font-black uppercase ${
              devMode 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-black'
            } border-2 border-black`}
          >
            DEV MODE {devMode ? 'ON' : 'OFF'}
          </Button>
        </div>
      )}
      
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Persistent Title Card */}
          <Card className="transform -rotate-1 relative overflow-hidden">
            <CardHeader className="relative">
              <div className="absolute top-2 left-4 w-8 h-8 bg-violet-600 border-2 border-black flex items-center justify-center">
                <UilSearch className="h-4 w-4 text-white" />
              </div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-violet-500 border-2 border-black flex items-center justify-center">
                <UilCrosshair className="h-4 w-4 text-white" />
              </div>
              <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
              </div>
              <div className="absolute bottom-2 right-8 w-4 h-4 bg-pink-500 border-2 border-black -rotate-12"></div>
              <div className="flex justify-center mb-4">
                <Button className="w-20 h-20 bg-violet-600 hover:bg-violet-700 border-4 border-black p-0">
                  {currentStep === 1 && <UilSearch className="h-12 w-12 text-white" />}
                  {currentStep === 2 && <UilBuilding className="h-12 w-12 text-white" />}
                  {currentStep === 2.5 && <UilFilter className="h-12 w-12 text-white" />}
                  {currentStep === 2.75 && <UilCrosshair className="h-12 w-12 text-white" />}
                  {currentStep === 3 && <UilUserCheck className="h-12 w-12 text-white" />}
                  {currentStep === 3.5 && <UilFilter className="h-12 w-12 text-white" />}
                  {currentStep === 4 && <UilPlay className="h-12 w-12 text-white" />}
                  {currentStep === 5 && <UilAnalytics className="h-12 w-12 text-white" />}
                  {currentStep === 6 && <UilCheckCircle className="h-12 w-12 text-white" />}
                </Button>
              </div>
              <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                {currentStep === 1 && 'SEARCH DEFINITION'}
                {currentStep === 2 && 'INDUSTRY & LOCATION'}
                {currentStep === 2.5 && 'COMPANY DETAILS'}
                {currentStep === 2.75 && 'SEARCH KEYWORDS'}
                {currentStep === 3 && 'CONTACT PREFERENCES'}
                {currentStep === 3.5 && 'VALIDATION CRITERIA'}
                {currentStep === 4 && 'SEARCH PREVIEW'}
                {currentStep === 5 && 'SEARCHING LEADS'}
                {currentStep === 6 && 'SEARCH COMPLETE'}
              </CardTitle>
              <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                {currentStep === 1 && 'DEFINE YOUR SEARCH OBJECTIVES'}
                {currentStep === 2 && 'SET TARGET MARKET & GEOGRAPHY'}
                {currentStep === 2.5 && 'SPECIFY COMPANY PROFILE'}
                {currentStep === 2.75 && 'REFINE WITH KEYWORDS'}
                {currentStep === 3 && 'CHOOSE CONTACT INFORMATION'}
                {currentStep === 3.5 && 'SET VALIDATION RULES'}
                {currentStep === 4 && 'REVIEW AND LAUNCH SEARCH'}
                {currentStep === 5 && 'FINDING YOUR PERFECT CUSTOMERS'}
                {currentStep === 6 && 'YOUR LEADS ARE READY'}
              </p>
              <div className="flex justify-center items-center mt-3 gap-2">
                <div className="w-3 h-3 bg-violet-600 animate-pulse"></div>
                <div className="w-2 h-6 bg-black"></div>
                <div className="w-4 h-4 bg-violet-500 animate-pulse delay-150"></div>
                <div className="w-2 h-8 bg-black"></div>
                <div className="w-3 h-3 bg-violet-600 animate-pulse delay-300"></div>
              </div>
            </CardHeader>
          </Card>

          {/* Step Components */}
          {currentStep === 1 && <SearchDefinitionStep {...stepProps} />}
          {currentStep === 2 && <IndustryLocationStep {...stepProps} />}
          {currentStep === 2.5 && <CompanyDetailsStep {...stepProps} />}
          {currentStep === 2.75 && <SearchKeywordsStep {...stepProps} />}
          {currentStep === 3 && <ContactPreferencesStep {...stepProps} />}
          {currentStep === 3.5 && <ValidationCriteriaStep {...stepProps} />}
          {currentStep === 4 && <SearchPreviewStep {...stepProps} />}
          {currentStep === 5 && <SearchProgressStep {...stepProps} />}
          {currentStep === 6 && <SearchResultsStep {...stepProps} />}
        </div>
        
        {/* Info Sections - Only on Step 1 */}
        {currentStep === 1 && <SearchDefinitionInfoSections />}
      </div>



      {/* Verification Modal */}
      {showVerification && (
        <VerificationModal
          isOpen={showVerification}
          onClose={() => setShowVerification(false)}
          onComplete={handleVerificationComplete}
          devMode={devMode}
        />
      )}
      
      <div className="mt-8">
        <OnboardingFooter />
      </div>
    </div>
    </TooltipProvider>
  );
}