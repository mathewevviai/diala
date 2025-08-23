import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Progress } from "@/components/ui/progress";
import { UilVolumeUp, UilLanguage, UilRobot, UilCheckCircle } from "@tooni/iconscout-unicons-react";

interface OnboardingNavProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  userName: string | null;
  selectedAudio: string | null;
  selectedLanguage: string | null;
  selectedVoiceAgent: string | null;
  selectedPitch?: string | null;
}

export default function OnboardingNav({ currentStep, onStepChange, userName, selectedAudio, selectedLanguage, selectedVoiceAgent, selectedPitch }: OnboardingNavProps) {
  const steps = [
    { 
      id: 1, 
      title: "Welcome", 
      icon: UilCheckCircle,
      color: "rgb(0,82,255)", 
      bgColor: "bg-[rgb(0,82,255)]",
      completed: userName !== null 
    },
    { 
      id: 2, 
      title: "Audio & Language", 
      icon: UilVolumeUp,
      color: "rgb(0,82,255)", 
      bgColor: "bg-[rgb(0,82,255)]",
      completed: selectedAudio !== null && selectedLanguage !== null 
    },
    { 
      id: 3, 
      title: "Agent & Pitch", 
      icon: UilRobot,
      color: "rgb(0,82,255)", 
      bgColor: "bg-[rgb(0,82,255)]",
      completed: selectedVoiceAgent !== null && selectedPitch !== null 
    },
    { 
      id: 4, 
      title: "Done", 
      icon: UilCheckCircle,
      color: "rgb(0,82,255)", 
      bgColor: "bg-[rgb(0,82,255)]",
      completed: currentStep >= 4 
    }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 bg-[rgb(0,82,255)] border-b-4 border-black py-4 px-2 sm:p-4 z-50" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        {/* Step indicators */}
        <div className="flex justify-center items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step rectangle */}
              <div 
                className={`
                  relative px-2 sm:px-4 py-1 sm:py-2 border-2 sm:border-4 border-black flex items-center justify-center
                  transition-all duration-300 cursor-pointer min-w-fit
                  ${currentStep === step.id 
                    ? `${step.bgColor} scale-105 shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[3px_3px_0_rgba(0,0,0,1)]` 
                    : step.completed 
                      ? `${step.bgColor} shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]` 
                      : 'bg-gray-300 shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]'
                  }
                `}
                onClick={() => {
                  if ((step.id === 1) || 
                      (step.id === 2 && userName) || 
                      (step.id === 3 && userName && selectedAudio) || 
                      (step.id === 4 && userName && selectedAudio && selectedLanguage) || 
                      (step.id === 5 && userName && selectedAudio && selectedLanguage && selectedVoiceAgent)) {
                    onStepChange(step.id);
                  }
                }}
              >
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white mr-1 sm:mr-2" />
                <span className="text-sm sm:text-lg font-bold text-white hidden sm:inline">{step.title}</span>
                <span className="text-sm font-bold text-white sm:hidden">{step.id}</span>
                
                {/* Checkmark for completed steps */}
                {step.completed && currentStep > step.id && (
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-black border-2 border-white rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] sm:text-xs">✓</span>
                  </div>
                )}
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-1 sm:h-2 mx-1 sm:mx-4 border sm:border-2 border-black transition-all duration-300 ${
                  currentStep > step.id 
                    ? 'bg-white shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]' 
                    : 'bg-gray-400'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Progress text */}
        <div className="text-center mt-2 sm:mt-4">
          <span className="text-white text-sm sm:text-lg">
            <span className="hidden sm:inline">Step {currentStep} of 4: {steps[currentStep - 1].title}</span>
            <span className="sm:hidden">{steps[currentStep - 1].title}</span>
          </span>
        </div>
      </div>
    </div>
  );
}