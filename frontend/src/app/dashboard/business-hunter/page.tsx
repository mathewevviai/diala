'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import HuntConfigurationModal from '@/components/custom/modals/hunt-configuration-modal';
import ViewWorkflowModal from '@/components/custom/modals/view-workflow-modal';
import SettingsWorkflowModal from '@/components/custom/modals/settings-workflow-modal';
import DeleteConfirmationModal from '@/components/custom/modals/delete-confirmation-modal';
import StatCard from '@/components/custom/stat-card';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useHunterSearches } from '@/hooks/useHunterSearch';
import { 
  UilSearchAlt,
  UilBuilding,
  UilMapMarker,
  UilPhone,
  UilEnvelope,
  UilGlobe,
  UilUsersAlt,
  UilDollarSign,
  UilFilter,
  UilExport,
  UilBookmark,
  UilCheckCircle,
  UilClock,
  UilExclamationTriangle,
  UilPlay,
  UilPause,
  UilStopCircle,
  UilPlus,
  UilEdit,
  UilTrash,
  UilLink,
  UilLinkedin,
  UilDatabase,
  UilFileExport,
  UilEye,
  UilSync,
  UilCog,
  UilTrashAlt
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
  searchId?: string;
  currentStage?: string;
}

// TODO: Replace with actual user ID from auth
const MOCK_USER_ID = 'user_demo_123';

export default function BusinessHunterPage() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<SearchWorkflow | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  
  // Use real data from Convex
  const { searches: workflows, isLoading, stats } = useHunterSearches(MOCK_USER_ID);
  const createLeadSearch = useAction(api.hunterActions.createLeadSearch);
  const deleteSearch = useAction(api.hunterActions.deleteSearch);
  
  // Convert between frontend and backend status
  const getBackendStatus = (workflow: SearchWorkflow): string => {
    const statusMap: Record<SearchWorkflow['status'], string> = {
      'idle': 'pending',
      'searching': 'processing',
      'scraping': 'processing',
      'analyzing': 'processing',
      'validating': 'processing',
      'completed': 'completed',
      'failed': 'failed'
    };
    return statusMap[workflow.status];
  };
  
  // Poll for updates every 3 seconds for active workflows
  React.useEffect(() => {
    const activeWorkflows = workflows.filter(w => 
      w.status !== 'completed' && w.status !== 'failed'
    );
    
    if (activeWorkflows.length === 0) return;
    
    const interval = setInterval(() => {
      // The hook will automatically refetch
    }, 3000);
    
    return () => clearInterval(interval);
  }, [workflows]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <UilSync className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
          <p className="text-lg font-bold text-gray-600">Loading your searches...</p>
        </div>
      </div>
    );
  }


  const getStatusColor = (status: SearchWorkflow['status']) => {
    switch (status) {
      case 'idle': return 'bg-gray-100 text-gray-700';
      case 'searching': return 'bg-blue-100 text-blue-700';
      case 'scraping': return 'bg-yellow-100 text-yellow-700';
      case 'analyzing': return 'bg-purple-100 text-purple-700';
      case 'validating': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
    }
  };

  const getStatusIcon = (status: SearchWorkflow['status']) => {
    switch (status) {
      case 'idle': return <UilClock className="w-5 h-5" />;
      case 'searching': return <UilSearchAlt className="w-5 h-5 animate-pulse" />;
      case 'scraping': return <UilLink className="w-5 h-5 animate-pulse" />;
      case 'analyzing': return <UilDatabase className="w-5 h-5 animate-pulse" />;
      case 'validating': return <UilCheckCircle className="w-5 h-5 animate-pulse" />;
      case 'completed': return <UilCheckCircle className="w-5 h-5" />;
      case 'failed': return <UilExclamationTriangle className="w-5 h-5" />;
    }
  };

  const getWorkflowSteps = (workflow: SearchWorkflow) => {
    const steps = [
      { name: 'Search', status: workflow.progress >= 0 },
      { name: 'Scrape', status: workflow.progress >= 25 },
      { name: 'Analyze', status: workflow.progress >= 50 },
      { name: 'Validate', status: workflow.progress >= 75 },
      { name: 'Complete', status: workflow.progress === 100 }
    ];
    return steps;
  };

  // Modal handlers
  const handleViewWorkflow = (workflow: SearchWorkflow) => {
    setSelectedWorkflow(workflow);
    setShowViewModal(true);
  };

  const handleSettingsWorkflow = (workflow: SearchWorkflow) => {
    setSelectedWorkflow(workflow);
    setShowSettingsModal(true);
  };

  const handleDeleteWorkflow = (workflow: SearchWorkflow) => {
    setSelectedWorkflow(workflow);
    setShowDeleteModal(true);
  };

  const handlePauseResumeWorkflow = (workflow: SearchWorkflow) => {
    // TODO: Implement pause/resume functionality
    console.log('Pause/Resume not yet implemented for:', workflow.id);
  };

  const handleSaveWorkflowSettings = (updatedWorkflow: Partial<SearchWorkflow>) => {
    // TODO: Implement settings update
    console.log('Settings update not yet implemented');
  };

  const handleConfirmDelete = async () => {
    if (!selectedWorkflow || !selectedWorkflow.searchId) return;
    
    setIsDeleting(true);
    
    try {
      await deleteSearch({
        userId: MOCK_USER_ID,
        searchId: selectedWorkflow.searchId
      });
      
      setShowDeleteModal(false);
      setSelectedWorkflow(null);
    } catch (error) {
      console.error('Error deleting search:', error);
      alert('Failed to delete search. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportWorkflow = (format: 'csv' | 'crm') => {
    if (!selectedWorkflow) return;
    
    // Simulate export functionality
    const exportData = {
      workflow: selectedWorkflow.name,
      format: format,
      businesses: selectedWorkflow.stats.businessesExtracted,
      timestamp: new Date().toISOString()
    };
    
    console.log('Exporting workflow:', exportData);
    // In real implementation, this would trigger file download or CRM integration
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowSettingsModal(false);
    setShowDeleteModal(false);
    setSelectedWorkflow(null);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black uppercase text-black mb-2">BUSINESS HUNTER</h1>
            <p className="text-lg text-gray-600">Automated business discovery and validation workflows</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            size="lg"
            className="font-bold"
          >
            <UilPlus className="w-5 h-5 mr-2" />
            NEW HUNT
          </Button>
        </div>
      </div>

      {/* Active Workflows Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Hunts"
          value={workflows.filter(w => w.status !== 'completed' && w.status !== 'failed').length}
          icon={<UilSync className="w-6 h-6 text-white animate-spin" />}
          iconBgColor="bg-purple-600"
          bgGradient="from-purple-50 to-purple-100"
        />

        <StatCard
          title="Pages Found"
          value={workflows.reduce((acc, w) => acc + w.stats.pagesFound, 0).toLocaleString()}
          icon={<UilGlobe className="w-6 h-6 text-white" />}
          iconBgColor="bg-green-600"
          bgGradient="from-green-50 to-green-100"
        />

        <StatCard
          title="Businesses Found"
          value={workflows.reduce((acc, w) => acc + w.stats.businessesExtracted, 0)}
          icon={<UilBuilding className="w-6 h-6 text-white" />}
          iconBgColor="bg-orange-600"
          bgGradient="from-orange-50 to-orange-100"
        />

        <StatCard
          title="Avg Match Rate"
          value={`${Math.round(workflows.reduce((acc, w) => acc + w.stats.matchRate, 0) / workflows.length)}%`}
          icon={<UilCheckCircle className="w-6 h-6 text-white" />}
          iconBgColor="bg-pink-600"
          bgGradient="from-pink-50 to-pink-100"
        />
      </div>

      {/* Workflow Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((workflow, index) => (
          <Card 
            key={workflow.id}
            className={`border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all duration-200 bg-white transform ${
              index % 3 === 0 ? 'rotate-1' : index % 3 === 1 ? '-rotate-1' : ''
            }`}
          >
            <CardHeader className={`border-b-4 border-black ${
              workflow.status === 'completed' ? 'bg-green-400' :
              workflow.status === 'failed' ? 'bg-red-400' :
              'bg-yellow-400'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-black uppercase text-black">{workflow.name}</CardTitle>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className={`border-2 border-black font-bold uppercase ${getStatusColor(workflow.status)}`}>
                      {getStatusIcon(workflow.status)}
                      <span className="ml-2">{workflow.status}</span>
                    </Badge>
                    {workflow.estimatedTime && (
                      <span className="text-sm font-bold text-black/70">
                        <UilClock className="w-4 h-4 inline mr-1" />
                        {workflow.estimatedTime}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {workflow.status !== 'completed' && workflow.status !== 'failed' && (
                    <Button
                      size="sm"
                      variant="neutral"
                      className="p-2"
                      onClick={() => handlePauseResumeWorkflow(workflow)}
                      title={workflow.status === 'idle' ? 'Resume workflow' : 'Pause workflow'}
                    >
                      <UilPause className="w-4 h-4 text-black" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="neutral"
                    className="p-2"
                    onClick={() => handleViewWorkflow(workflow)}
                    title="View workflow details"
                  >
                    <UilEye className="w-4 h-4 text-black" />
                  </Button>
                  <Button
                    size="sm"
                    variant="neutral"
                    className="p-2"
                    onClick={() => handleSettingsWorkflow(workflow)}
                    title="Edit workflow settings"
                  >
                    <UilCog className="w-4 h-4 text-black" />
                  </Button>
                  <Button
                    size="sm"
                    variant="neutral"
                    className="p-2"
                    onClick={() => handleDeleteWorkflow(workflow)}
                    title="Delete workflow"
                  >
                    <UilTrashAlt className="w-4 h-4 text-black" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Progress Steps */}
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center gap-3">
                    {getWorkflowSteps(workflow).map((step, idx) => {
                      const stepIcons = [
                        UilSearchAlt, // Search
                        UilLink,      // Scrape  
                        UilDatabase,  // Analyze
                        UilCheckCircle, // Validate
                        UilCheckCircle  // Complete
                      ];
                      const StepIcon = stepIcons[idx];
                      
                      return (
                        <React.Fragment key={idx}>
                          <div className={`
                            relative px-4 py-3 border-4 border-black flex items-center gap-2 font-bold text-sm
                            transition-all duration-300 min-w-fit
                            ${step.status 
                              ? 'bg-[rgb(0,82,255)] text-white shadow-[3px_3px_0_rgba(0,0,0,1)]' 
                              : 'bg-gray-300 text-gray-600 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                            }
                          `}>
                            <StepIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline text-sm">{step.name}</span>
                            <span className="sm:hidden">{idx + 1}</span>
                          </div>
                          {idx < getWorkflowSteps(workflow).length - 1 && (
                            <div className={`w-6 h-2 border-2 border-black transition-all duration-300 ${
                              getWorkflowSteps(workflow)[idx + 1]?.status 
                                ? 'bg-[rgb(0,82,255)] shadow-[2px_2px_0_rgba(0,0,0,1)]' 
                                : 'bg-gray-400'
                            }`}></div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                <Progress value={workflow.progress} className="h-3 border-2 border-black" />
              </div>

              {/* Parameters */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <UilMapMarker className="w-4 h-4 text-gray-500" />
                  <span className="font-bold">Location:</span>
                  <span>{workflow.parameters.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UilBuilding className="w-4 h-4 text-gray-500" />
                  <span className="font-bold">Type:</span>
                  <span>{workflow.parameters.businessType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UilFilter className="w-4 h-4 text-gray-500" />
                  <span className="font-bold">Keywords:</span>
                  <span>{workflow.parameters.keywords.join(', ')}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <UilLinkedin className="w-4 h-4 text-gray-500" />
                    <span className="font-bold">LinkedIn:</span>
                    <span>{workflow.parameters.includeLinkedIn ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UilSearchAlt className="w-4 h-4 text-gray-500" />
                    <span className="font-bold">Depth:</span>
                    <span>{workflow.parameters.searchDepth} levels</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-gray-50 border-2 border-black">
                  <p className="text-xs font-bold text-gray-600 uppercase">Pages Found</p>
                  <p className="text-xl font-black text-black">{workflow.stats.pagesFound.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 border-2 border-black">
                  <p className="text-xs font-bold text-gray-600 uppercase">Scraped</p>
                  <p className="text-xl font-black text-black">{workflow.stats.pagesScraped.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 border-2 border-black">
                  <p className="text-xs font-bold text-gray-600 uppercase">Businesses</p>
                  <p className="text-xl font-black text-black">{workflow.stats.businessesExtracted}</p>
                </div>
                <div className="p-3 bg-gray-50 border-2 border-black">
                  <p className="text-xs font-bold text-gray-600 uppercase">Match Rate</p>
                  <p className="text-xl font-black text-green-600">{workflow.stats.matchRate}%</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {workflow.status === 'completed' && (
                  <>
                    <Button variant="default" className="flex-1 px-3 py-2 text-sm font-bold">
                      <UilFileExport className="w-4 h-4 mr-1" />
                      EXPORT CSV
                    </Button>
                    <Button variant="default" className="flex-1 px-3 py-2 text-sm font-bold">
                      <UilDatabase className="w-4 h-4 mr-1" />
                      TO CRM
                    </Button>
                  </>
                )}
                {workflow.status !== 'completed' && workflow.status !== 'failed' && (
                  <Button variant="default" className="flex-1 px-3 py-2 text-sm font-bold">
                    <UilStopCircle className="w-4 h-4 mr-1" />
                    STOP HUNT
                  </Button>
                )}
              </div>

              {/* Created Date */}
              <p className="text-xs text-gray-500 mt-4">
                Started: {new Date(workflow.createdAt).toLocaleString()}
                {workflow.completedAt && ` • Completed: ${new Date(workflow.completedAt).toLocaleString()}`}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Create New Workflow Card */}
        <Card 
          onClick={() => setShowCreateModal(true)}
          className="border-4 border-dashed border-gray-400 shadow-[4px_4px_0_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0_rgba(0,0,0,0.5)] hover:border-black transition-all duration-200 bg-gray-50 cursor-pointer group min-h-[400px]"
        >
          <CardContent className="h-full flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-gray-200 border-4 border-gray-400 group-hover:border-black group-hover:bg-gray-300 rounded-full flex items-center justify-center mb-4 transition-all">
              <UilPlus className="w-10 h-10 text-gray-600 group-hover:text-black" />
            </div>
            <p className="text-xl font-black text-gray-600 group-hover:text-black uppercase">Start New Hunt</p>
            <p className="text-sm text-gray-500 mt-2 text-center">Configure search parameters and deploy automated discovery workflow</p>
          </CardContent>
        </Card>
      </div>

      {/* Hunt Configuration Modal */}
      <HuntConfigurationModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setIsCreating(false);
        }}
        onSave={async (huntData) => {
          setIsCreating(true);
          
          try {
            // Convert frontend format to backend format
            const searchConfig = {
              searchName: huntData.name,
              searchObjective: `Find ${huntData.businessType} businesses in ${huntData.location}`,
              selectedSources: ['web'], // Default to web search
              industry: huntData.businessType,
              location: huntData.location,
              companySize: undefined, // Not collected in current modal
              jobTitles: [], // Not collected in current modal
              keywords: huntData.keywords.join(', '),
              includeEmails: true,
              includePhones: true,
              includeLinkedIn: huntData.includeLinkedIn,
              validationCriteria: {
                mustHaveWebsite: true,
                mustHaveContactInfo: true,
                mustHaveSpecificKeywords: huntData.keywords,
                mustBeInIndustry: true,
                customValidationRules: ''
              }
            };
            
            const result = await createLeadSearch({
              userId: MOCK_USER_ID,
              searchConfig
            });
            
            console.log('Search created:', result);
            setShowCreateModal(false);
            
            // The searches will auto-refresh due to the subscription
          } catch (error) {
            console.error('Error creating search:', error);
            alert(`Failed to create search: ${error.message || 'Unknown error'}`);
          } finally {
            setIsCreating(false);
          }
        }}
      />

      {/* View Workflow Modal */}
      <ViewWorkflowModal
        isOpen={showViewModal}
        onClose={closeAllModals}
        workflow={selectedWorkflow}
        onExport={handleExportWorkflow}
      />

      {/* Settings Workflow Modal */}
      <SettingsWorkflowModal
        isOpen={showSettingsModal}
        onClose={closeAllModals}
        workflow={selectedWorkflow}
        onSave={handleSaveWorkflowSettings}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeAllModals}
        onConfirm={handleConfirmDelete}
        itemName={selectedWorkflow?.name || ''}
        itemType="workflow"
        warningMessage="This will permanently delete the workflow and all its data"
        consequences={[
          'All collected business data will be lost',
          'Workflow progress cannot be recovered',
          'This action cannot be undone',
          selectedWorkflow?.status !== 'completed' && selectedWorkflow?.status !== 'failed' 
            ? 'Active search process will be immediately stopped' 
            : 'Historical results will be permanently deleted'
        ].filter(Boolean) as string[]}
        requiresNameConfirmation={selectedWorkflow?.stats.businessesExtracted > 50}
        isLoading={isDeleting}
      />
    </div>
  );
}