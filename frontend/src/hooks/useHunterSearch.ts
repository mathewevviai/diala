'use client';

import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useEffect, useState } from 'react';
import { useConvexErrorHandler } from './useConvexErrorHandler';

interface SearchWorkflow {
  id: string;
  searchId?: string;
  name: string;
  status: 'idle' | 'searching' | 'scraping' | 'analyzing' | 'validating' | 'completed' | 'failed';
  progress: number;
  currentStage?: string;
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

// Map backend status to frontend status
const mapBackendStatus = (status: string): SearchWorkflow['status'] => {
  const statusMap: Record<string, SearchWorkflow['status']> = {
    'pending': 'idle',
    'initializing': 'searching',
    'processing': 'analyzing',
    'completed': 'completed',
    'failed': 'failed'
  };
  return statusMap[status] || 'searching';
};

// Map progress to stage
const getStageFromProgress = (progress: number): SearchWorkflow['status'] => {
  if (progress === 0) return 'idle';
  if (progress < 25) return 'searching';
  if (progress < 50) return 'scraping';
  if (progress < 75) return 'analyzing';
  if (progress < 100) return 'validating';
  return 'completed';
};

export function useHunterSearches(userId: string) {
  const [searches, setSearches] = useState<SearchWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get user's search history with stats
  const searchHistory = useQuery(api.hunterQueries.getUserSearchesForHunter, { 
    userId,
    includeStats: true 
  });
  
  // Get dashboard data for statistics
  const dashboardData = useQuery(api.hunterQueries.getUserDashboardData, { userId });

  useEffect(() => {
    if (!searchHistory) {
      setIsLoading(true);
      return;
    }

    // Convert backend searches to frontend format
    const convertedSearches: SearchWorkflow[] = searchHistory.map((search: any) => ({
      id: search.searchId,
      searchId: search.searchId, // Include searchId for actions
      name: search.searchName || 'Untitled Search',
      status: search.progress >= 100 ? 'completed' : getStageFromProgress(search.progress || 0),
      progress: search.progress || 0,
      currentStage: search.currentStage || '',
      parameters: {
        location: search.location || 'Unknown',
        businessType: search.industry || 'Unknown',
        keywords: search.keywords ? search.keywords.split(',').map((k: string) => k.trim()) : [],
        includeLinkedIn: search.includeLinkedIn || false,
        searchDepth: 3 // Default value
      },
      stats: {
        pagesFound: 0, // These will be updated from search results
        pagesScraped: 0,
        businessesExtracted: search.totalLeads || 0,
        businessesValidated: search.verifiedEmails || 0,
        matchRate: search.totalLeads > 0 ? 
          Math.round((search.verifiedEmails / search.totalLeads) * 100) : 0
      },
      createdAt: search.createdAt,
      completedAt: search.completedAt,
      estimatedTime: search.status === 'processing' ? 
        `${Math.max(1, Math.round((100 - search.progress) / 2))} min remaining` : undefined
    }));

    setSearches(convertedSearches);
    setIsLoading(false);
  }, [searchHistory]);

  // Poll for updates on active searches
  useEffect(() => {
    const activeSearches = searches.filter(s => 
      s.status !== 'completed' && s.status !== 'failed'
    );
    
    if (activeSearches.length === 0) return;

    // Poll every 3 seconds for active searches
    const interval = setInterval(() => {
      // Trigger a refetch by updating a dummy state
      // This will cause Convex to re-query
      setSearches(prev => [...prev]);
    }, 3000);

    return () => clearInterval(interval);
  }, [searches]);

  return {
    searches,
    isLoading,
    stats: dashboardData?.stats || {
      totalSearches: 0,
      activeSearches: 0,
      totalLeadsThisMonth: 0,
      searchesToday: 0
    }
  };
}

export function useHunterSearch(searchId: string) {
  const search = useQuery(api.hunterQueries.getLeadSearch, { searchId });
  const [pollingEnabled, setPollingEnabled] = useState(true);

  useEffect(() => {
    if (!search) return;
    
    // Stop polling if search is completed or failed
    if (search.status === 'completed' || search.status === 'failed') {
      setPollingEnabled(false);
    }
  }, [search]);

  // Poll for updates if search is active
  useEffect(() => {
    if (!pollingEnabled) return;

    const interval = setInterval(() => {
      // Force re-query by updating state
      // Convex will automatically refetch
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingEnabled]);

  return {
    search,
    isLoading: !search,
    progress: search?.progress || 0,
    status: search?.status || 'pending',
    currentStage: search?.currentStage || ''
  };
}