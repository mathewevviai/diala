'use client';

import * as React from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { UilArrowRight, UilArrowLeft, UilMusicNote, UilVolumeUp, UilRobot, UilBriefcase, UilPhone, UilMicrophone, UilLock } from '@tooni/iconscout-unicons-react';
import AudioCard from './audio-card';
import LanguageCard from './language-card';
import VoiceAgentCard from './voice-agent-card';
import PitchCard from './pitch-card';
import OnboardingNav from './onboarding-nav';
import FileUploadCard from './file-upload-card';
import InfoSection from './info-section';
import WelcomeCard from './welcome-card';
import LoadingScreen from './loading-screen';
import VerificationModal from './modals/verification-modal';
import CallingScreen from './calling-screen';
import WebVoiceInterface from './web-voice-interface';
import CustomPitchModal, { CustomPitchData } from './modals/custom-pitch-modal';
import PremiumFeatureCard from './premium-feature-card';

const getRandomUnsplashImage = (width: number, height: number) => {
  return `https://source.unsplash.com/random/${width}x${height}/?audio,music,sound&${Math.random()}`;
};

export default function App() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = React.useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null);
  const [selectedVoiceAgent, setSelectedVoiceAgent] = React.useState<string | null>(null);
  const [selectedPitch, setSelectedPitch] = React.useState<string | null>(null);
  const [showLoading, setShowLoading] = React.useState(false);
  const [showVerification, setShowVerification] = React.useState(false);
  const [showCalling, setShowCalling] = React.useState(false);
  const [showWebInterface, setShowWebInterface] = React.useState(false);
  const [verifiedPhone, setVerifiedPhone] = React.useState('');
  const [showCustomPitchModal, setShowCustomPitchModal] = React.useState(false);
  const [customPitchData, setCustomPitchData] = React.useState<CustomPitchData | null>(null);

  const mockAudioFiles = [
    { name: 'CrowdedOfficeAudio.m4a', category: 'Crowded Office' },
    { name: 'CafeAudio.m4a', category: 'Café Ambience' },
    { name: 'CoworkingAudio.m4a', category: 'Co-Working Space' },
    { name: 'TrainstationAudio.m4a', category: 'Train Station' },
    { name: 'LibraryAudio.m4a', category: 'Library' },
  ];

  const languages = [
    { id: 'english', name: 'English', flag: '🇺🇸', accent: 'American' },
    { id: 'mandarin', name: 'Mandarin', flag: '🇨🇳', accent: 'Beijing' },
    { id: 'spanish', name: 'Spanish', flag: '🇪🇸', accent: 'Spain' },
    { id: 'french', name: 'French', flag: '🇫🇷', accent: 'Parisian' },
    { id: 'german', name: 'German', flag: '🇩🇪', accent: 'Berlin' },
    { id: 'japanese', name: 'Japanese', flag: '🇯🇵', accent: 'Tokyo' },
  ];

  const voiceAgents = [
    { id: 'diala-tone', name: 'Diala-Tone', description: 'Your harmonious vocal guide.', imageUrl: getRandomUnsplashImage(600, 600) },
    { id: 'echo-diala', name: 'Echo-Diala', description: 'Resonating with clarity and charm.', imageUrl: getRandomUnsplashImage(600, 600) },
    { id: 'diala-belle', name: 'Diala-Belle', description: 'The beautiful voice for every call.', imageUrl: getRandomUnsplashImage(600, 600) },
    { id: 'voice-diala', name: 'Voice-Diala', description: 'Speak clearly, listen intently.', imageUrl: getRandomUnsplashImage(600, 600) },
    { id: 'diala-muse', name: 'Diala-Muse', description: 'Inspiring conversations, always.', imageUrl: getRandomUnsplashImage(600, 600) },
    { id: 'chat-diala', name: 'Chat-Diala', description: 'Friendly and fluent, ready to chat.', imageUrl: getRandomUnsplashImage(600, 600) },
  ];

  const pitchOptions = [
    {
      id: 'discovery-calls',
      name: 'DISCOVERY CALLS',
      description: 'Book qualified discovery calls with potential customers for your products and services.',
      backstory: 'Your agent will professionally qualify prospects, understand their needs, overcome objections, and schedule discovery calls with decision-makers to explore how your products or services can help them.'
    },
    {
      id: 'customer-support',
      name: 'CUSTOMER SUPPORT',
      description: 'Handle customer queries and technical questions about your products and services.',
      backstory: 'Your agent will patiently listen to customer concerns, provide accurate technical information about your products and services, troubleshoot issues, and ensure every caller receives helpful support.'
    },
    {
      id: 'appointment-setter',
      name: 'APPOINTMENT SETTER',
      description: 'Enable customers to book appointments and explore your services independently.',
      backstory: 'Your agent will guide callers through available services, check real-time availability, book appointments that match their needs, and handle rescheduling requests seamlessly.'
    },
    {
      id: 'custom-pitch',
      name: 'PITCH YOUR OWN',
      description: 'Create a custom pitch tailored to your specific business needs and use case.',
      backstory: 'Design your own agent persona by providing details about your business, products, services, and specific goals. Your agent will be configured to handle your unique requirements.'
    },
  ];

  const handleSelectAudio = (fileName: string) => {
    setSelectedAudio(selectedAudio === fileName ? null : fileName);
  };

  const handleSelectLanguage = (languageId: string) => {
    setSelectedLanguage(selectedLanguage === languageId ? null : languageId);
  };

  const handleSelectVoiceAgent = (agentId: string) => {
    setSelectedVoiceAgent(selectedVoiceAgent === agentId ? null : agentId);
  };

  const handleSelectPitch = (pitchId: string) => {
    if (pitchId === 'custom-pitch') {
      setShowCustomPitchModal(true);
      // Don't select custom pitch until form is completed
    } else {
      setSelectedPitch(selectedPitch === pitchId ? null : pitchId);
    }
  };

  const handleSaveCustomPitch = (data: CustomPitchData) => {
    setCustomPitchData(data);
    setSelectedPitch('custom-pitch');
  };

  const handleCloseCustomPitchModal = () => {
    setShowCustomPitchModal(false);
    // If custom pitch was selected but form wasn't completed, deselect it
    if (selectedPitch === 'custom-pitch' && !customPitchData) {
      setSelectedPitch(null);
    }
  };

  const handleFileUpload = (file: File) => {
    const fileName = file.name;
    setSelectedAudio(fileName);
    console.log('File uploaded:', fileName);
  };

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    setCurrentStep(2);
  };

  const handleStartCall = () => {
    setShowLoading(true);
  };

  const handleLoadingComplete = () => {
    // Keep loading screen visible, just show verification on top
    setShowVerification(true);
  };

  const handleVerificationComplete = (email: string, phone: string) => {
    setVerifiedPhone(phone);
    setShowVerification(false);
    setShowLoading(false);
    setShowCalling(true);
  };

  const handleContinueWeb = () => {
    setShowCalling(false);
    setShowWebInterface(true);
  };


  if (showWebInterface) {
    return (
      <WebVoiceInterface
        userName={userName!}
        selectedVoiceAgent={voiceAgents.find(a => a.id === selectedVoiceAgent)?.name || ''}
        selectedLanguage={languages.find(l => l.id === selectedLanguage)?.name || ''}
      />
    );
  }

  if (showCalling) {
    return <CallingScreen userName={userName!} phoneNumber={verifiedPhone} onContinueWeb={handleContinueWeb} />;
  }

  if (showLoading) {
    return (
      <>
        <LoadingScreen
          userName={userName!}
          selectedAudio={selectedAudio!}
          selectedLanguage={languages.find(l => l.id === selectedLanguage)?.name || ''}
          selectedVoiceAgent={voiceAgents.find(a => a.id === selectedVoiceAgent)?.name || ''}
          selectedPitch={pitchOptions.find(p => p.id === selectedPitch)?.name || ''}
          onComplete={handleLoadingComplete}
        />
        {showVerification && (
          <VerificationModal onVerified={handleVerificationComplete} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center pt-8 sm:pt-12 relative" style={{
        fontFamily: 'Noyh-Bold, sans-serif'
      }}>
        {currentStep === 1 && (
          <WelcomeCard onNameSubmit={handleNameSubmit} />
        )}

        {currentStep === 2 && (
          <div className="w-full max-w-7xl px-4 sm:px-6">
            {/* Quick Demo Button */}
            <div className="mb-6 flex justify-center">
              <Button
                className="px-8 py-3 text-lg font-bold bg-yellow-400 text-black"
                onClick={() => {
                  setSelectedAudio('crowded_office.wav');
                  setSelectedLanguage('english');
                  setSelectedVoiceAgent('diala-tone');
                  setSelectedPitch('customer-support');
                  setCurrentStep(4);
                }}
              >
                ⚡ Quick Demo - Use Defaults
              </Button>
            </div>

            {/* Title section */}
            <div className="mb-8 flex justify-center">
              <Card className="w-full max-w-3xl transform rotate-1 relative overflow-hidden">
                <CardHeader className="relative">
                  <div className="absolute top-2 left-4 w-8 h-8 bg-[rgb(0,82,255)] border-2 border-black flex items-center justify-center">
                    <UilMusicNote className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute top-2 right-4 w-8 h-8 bg-[rgb(0,82,255)] border-2 border-black flex items-center justify-center">
                    <UilVolumeUp className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                    <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
                  </div>
                  <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>
                  <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                    CUSTOMIZE YOUR EXPERIENCE
                  </CardTitle>
                  <div className="flex justify-center items-center mt-3 gap-2">
                    <div className="w-3 h-3 bg-[rgb(0,82,255)] animate-pulse"></div>
                    <div className="w-2 h-6 bg-black"></div>
                    <div className="w-4 h-4 bg-[rgb(0,82,255)] animate-pulse delay-150"></div>
                    <div className="w-2 h-8 bg-black"></div>
                    <div className="w-3 h-3 bg-[rgb(0,82,255)] animate-pulse delay-300"></div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Audio Selection Section */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white text-center mb-4">Select Background Audio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockAudioFiles.map((file) => (
                    <div key={file.name} className="">
                      <AudioCard
                        fileName={file.name}
                        category={file.category}
                        imageUrl={file.category === 'Crowded Office' ? "/CrowdedOfficeBlue.png" : file.category === 'Café Ambience' ? "/CrowdedCafeBlue.png" : file.category === 'Train Station' ? "/TrainstationBlue.png" : file.category === 'Library' ? "/LibraryBlue.png" : file.category === 'Co-Working Space' ? "/CoworkingBlue.png" : "/CrowdedOffice.png"}
                        isSelected={selectedAudio === file.name}
                        onSelect={handleSelectAudio}
                      />
                    </div>
                  ))}
                  <div className="">
                    <FileUploadCard onFileUpload={handleFileUpload} />
                  </div>
                </div>
              </div>

              {/* Language Selection Section */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white text-center mb-4">Select Language</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {languages.map((language) => (
                    <LanguageCard
                      key={language.id}
                      language={language}
                      isSelected={selectedLanguage === language.id}
                      onSelect={handleSelectLanguage}
                    />
                  ))}
                </div>
              </div>
            </div>



            {/* Navigation buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="default"
                size="lg"
                className="h-14 text-lg font-black uppercase bg-white hover:bg-gray-100 text-black border-2 border-black"
              >
                <UilArrowLeft className="mr-2 h-6 w-6" />
                BACK
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!selectedAudio || !selectedLanguage}
                variant="default"
                size="lg"
                className={`h-14 text-lg font-black uppercase ${!selectedAudio || !selectedLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="flex items-center justify-center">
                  CONTINUE
                  <UilArrowRight className="ml-2 h-6 w-6" />
                </span>
              </Button>
            </div>

            <InfoSection step="customize" />
          </div>
        )}

        {currentStep === 3 && (
          <div className="w-full max-w-5xl px-4 sm:px-6">
            {/* Title section */}
            <div className="mb-8 flex justify-center">
              <Card className="w-full max-w-2xl transform -rotate-1 relative overflow-hidden">
                <CardHeader className="relative">
                  <div className="absolute top-2 left-4 w-8 h-8 bg-[rgb(0,82,255)] border-2 border-black flex items-center justify-center">
                    <UilVolumeUp className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute top-2 right-4 w-8 h-8 bg-[rgb(0,82,255)] border-2 border-black flex items-center justify-center">
                    <UilMusicNote className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                    <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
                  </div>
                  <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>
                  <CardTitle className="text-6xl md:text-7xl font-black uppercase text-center text-black relative z-10">
                    SELECT A VOICE & PITCH
                  </CardTitle>
                  <div className="flex justify-center items-center mt-3 gap-2">
                    <div className="w-3 h-3 bg-[rgb(0,82,255)] animate-pulse"></div>
                    <div className="w-2 h-6 bg-black"></div>
                    <div className="w-4 h-4 bg-[rgb(0,82,255)] animate-pulse delay-150"></div>
                    <div className="w-2 h-8 bg-black"></div>
                    <div className="w-3 h-3 bg-[rgb(0,82,255)] animate-pulse delay-300"></div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Voice Selection */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-white text-center mb-6">Select a Voice</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {voiceAgents.slice(0, 3).map((agent) => (
                  <VoiceAgentCard
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedVoiceAgent === agent.id}
                    onSelect={handleSelectVoiceAgent}
                  />
                ))}
              </div>

              {/* Voice Cloning Premium Feature */}
              <div className="mt-8">
                <PremiumFeatureCard
                  title="VOICE CLONING"
                  description="Clone any voice with just 30 seconds of audio. Create perfect replicas of yourself or your team."
                  price="$49/month"
                />
              </div>
            </div>

            {/* Pitch Selection */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-white text-center mb-6">Select a Pitch</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pitchOptions.map((pitch) => (
                  <PitchCard
                    key={pitch.id}
                    pitch={pitch}
                    isSelected={selectedPitch === pitch.id}
                    onSelect={handleSelectPitch}
                  />
                ))}
              </div>
            </div>

            {/* Custom Pitch Modal */}
            <CustomPitchModal
              isOpen={showCustomPitchModal}
              onClose={handleCloseCustomPitchModal}
              onSave={handleSaveCustomPitch}
            />



            {/* Navigation buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                onClick={() => setCurrentStep(2)}
                variant="default"
                size="lg"
                className="h-14 text-lg font-black uppercase bg-white hover:bg-gray-100 text-black border-2 border-black"
              >
                <UilArrowLeft className="mr-2 h-6 w-6" />
                BACK
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={!selectedVoiceAgent || !selectedPitch}
                variant="default"
                size="lg"
                className={`h-14 text-lg font-black uppercase ${!selectedVoiceAgent || !selectedPitch ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="flex items-center justify-center">
                  CONTINUE
                  <UilArrowRight className="ml-2 h-6 w-6" />
                </span>
              </Button>
            </div>

            <InfoSection step="voice" />
          </div>
        )}

        {currentStep === 4 && (
          <div className="w-full max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center text-center relative z-10">
              {/* Main celebration card */}
              <div className="relative">
                {/* Rotating stars around the main card */}
                <div className="absolute -top-20 -left-20 text-6xl animate-spin" style={{ animationDuration: '8s' }}>⭐</div>
                <div className="absolute -top-8 -right-8 w-12 h-12 bg-[rgb(0,82,255)] border-4 border-black animate-pulse"></div>
                <div className="absolute -bottom-12 -left-8 w-16 h-16 bg-black rotate-45"></div>

                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 transform rotate-1 relative overflow-hidden">
                  <CardHeader className="bg-[rgb(0,82,255)] p-8">
                    <CardTitle className="text-5xl md:text-6xl font-black text-white uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                      READY TO DIAL!
                    </CardTitle>
                    <p className="text-xl text-white mt-4 font-bold">Your AI voice agent is configured and ready!</p>
                  </CardHeader>

                  <CardContent className="p-8 space-y-6">
                    {/* Configuration summary with animated cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Audio card */}
                      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all">
                        <UilMusicNote className="h-8 w-8 text-[rgb(0,82,255)] mb-2" />
                        <h3 className="font-black text-lg mb-1 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>AUDIO</h3>
                        <p className="text-lg font-bold text-black">
                          {selectedAudio?.replace('.wav', '').replace(/_/g, ' ')}
                        </p>
                      </div>

                      {/* Language card */}
                      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all">
                        <div className="text-2xl mb-2">{languages.find(l => l.id === selectedLanguage)?.flag}</div>
                        <h3 className="font-black text-lg mb-1 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>LANGUAGE</h3>
                        <p className="text-lg font-bold text-black">
                          {languages.find(l => l.id === selectedLanguage)?.name}
                        </p>
                      </div>

                      {/* Voice agent card */}
                      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all">
                        <UilRobot className="h-8 w-8 text-[rgb(0,82,255)] mb-2" />
                        <h3 className="font-black text-lg mb-1 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>VOICE</h3>
                        <p className="text-lg font-bold text-black">
                          {voiceAgents.find(a => a.id === selectedVoiceAgent)?.name}
                        </p>
                      </div>

                      {/* Pitch card */}
                      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all">
                        <UilBriefcase className="h-8 w-8 text-[rgb(0,82,255)] mb-2" />
                        <h3 className="font-black text-lg mb-1 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>PITCH</h3>
                        <p className="text-lg font-bold text-black">
                          {selectedPitch === 'custom-pitch' && customPitchData
                            ? customPitchData.businessName
                            : pitchOptions.find(p => p.id === selectedPitch)?.name}
                        </p>
                      </div>
                    </div>

                    {/* Call-to-action button */}
                    <div className="flex justify-center mt-8">
                      <Button
                        className="px-12 py-4 text-xl font-black uppercase bg-[rgb(255,165,0)]"
                        onClick={handleStartCall}
                        style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                      >
                        <span className="flex items-center gap-2">
                          START DIALING NOW
                          <UilPhone className="h-6 w-6" />
                        </span>
                      </Button>
                    </div>

                    {/* Configuration summary */}
                    <div className="mt-6 p-4 bg-white border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <p className="text-lg font-medium text-gray-700">
                        <span className="font-black text-black uppercase">Configuration:</span> {voiceAgents.find(a => a.id === selectedVoiceAgent)?.name} voice • {languages.find(l => l.id === selectedLanguage)?.name} ({languages.find(l => l.id === selectedLanguage)?.accent}) • {selectedAudio?.replace('.wav', '').replace(/_/g, ' ')} background • {pitchOptions.find(p => p.id === selectedPitch)?.name} pitch
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-center gap-4 mt-8">
                <Button
                  onClick={() => setCurrentStep(3)}
                  variant="default"
                  size="lg"
                  className="h-14 text-lg font-black uppercase bg-white hover:bg-gray-100 text-black border-2 border-black"
                >
                  <UilArrowLeft className="mr-2 h-6 w-6" />
                  BACK
                </Button>
                <Button
                  onClick={handleStartCall}
                  variant="default"
                  size="lg"
                  className="h-14 text-lg font-black uppercase bg-[rgb(255,165,0)] hover:bg-orange-600 text-black"
                >
                  <span className="flex items-center justify-center">
                    START DIALING NOW
                    <UilPhone className="ml-2 h-6 w-6" />
                  </span>
                </Button>
              </div>

              <InfoSection step="complete" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
