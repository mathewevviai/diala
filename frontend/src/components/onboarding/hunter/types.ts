import * as React from 'react';

export interface SearchCriteria {
  industry: string;
  location: string;
  companySize: string;
  jobTitles: string[];
  keywords: string;
}

export interface ValidationCriteria {
  mustHaveWebsite: boolean;
  mustHaveContactInfo: boolean;
  mustHaveSpecificKeywords: string[];
  mustBeInIndustry: boolean;
  customValidationRules: string;
}

export interface LeadSource {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export interface ContactPreferences {
  includeEmails: boolean;
  includePhones: boolean;
  includeLinkedIn: boolean;
}

export interface SearchResults {
  totalLeads: number;
  verifiedEmails: number;
  verifiedPhones: number;
  businessWebsites: number;
  avgResponseRate: string;
  searchTime: string;
}

export interface StepProps {
  // Step state
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  // Search definition state
  searchName: string;
  setSearchName: (name: string) => void;
  searchObjective: string;
  setSearchObjective: (objective: string) => void;
  selectedSources: string[];
  setSelectedSources: (sources: string[]) => void;
  
  // Search criteria state
  searchCriteria: SearchCriteria;
  setSearchCriteria: (criteria: SearchCriteria) => void;
  customIndustry: string;
  setCustomIndustry: (industry: string) => void;
  
  // Contact preferences state
  contactPreferences: ContactPreferences;
  setContactPreferences: (preferences: ContactPreferences) => void;
  
  // Validation criteria state
  validationCriteria: ValidationCriteria;
  setValidationCriteria: (criteria: ValidationCriteria) => void;
  
  // Search execution state
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  searchProgress: number;
  setSearchProgress: (progress: number) => void;
  currentStatus: string;
  setCurrentStatus: (status: string) => void;
  searchResults: SearchResults | null;
  setSearchResults: (results: SearchResults | null) => void;
  currentSearchId: string | null;
  setCurrentSearchId: (id: string | null) => void;
  
  // Verification state
  showVerification: boolean;
  setShowVerification: (show: boolean) => void;
  
  // Dev mode state
  devMode: boolean;
  setDevMode: (mode: boolean) => void;
  
  // Functions
  handleSourceSelect: (sourceId: string) => void;
  toggleJobTitle: (title: string) => void;
  canStartSearch: () => boolean;
  startSearch: () => Promise<void>;
  handleVerificationComplete: (email: string, phone: string) => Promise<void>;
  handleStepChange: (step: number) => void;
  
  // Convex data
  userUsageStats?: any;
  createLeadSearch?: any;
  getSearchStatus?: any;
  
  // Constants
  leadSources: LeadSource[];
  industries: string[];
  jobTitles: string[];
}