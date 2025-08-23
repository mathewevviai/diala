import * as React from 'react';

interface SimpleOnboardingNavProps {
  currentStep: number;
  totalSteps: number;
  onStepChange?: (step: number) => void;
}

export default function SimpleOnboardingNav({ 
  currentStep, 
  totalSteps, 
  onStepChange 
}: SimpleOnboardingNavProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          {/* Step rectangle */}
          <div 
            className={`
              relative px-2 py-1 sm:px-4 sm:py-2 border-2 sm:border-4 border-black 
              flex items-center justify-center transition-all duration-300
              font-bold text-xs sm:text-sm min-w-[32px] sm:min-w-[40px]
              ${currentStep === step 
                ? 'bg-[rgb(0,82,255)] text-white scale-105 shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[3px_3px_0_rgba(0,0,0,1)]' 
                : currentStep > step
                  ? 'bg-[rgb(0,82,255)] text-white shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]' 
                  : 'bg-gray-300 text-gray-600 shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]'
              }
              ${onStepChange && currentStep > step ? 'cursor-pointer' : ''}
            `}
            onClick={() => {
              if (onStepChange && currentStep > step) {
                onStepChange(step);
              }
            }}
          >
            <span>{step}</span>
            
            {/* Checkmark for completed steps */}
            {currentStep > step && (
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-green-500 border-2 border-black rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] sm:text-xs">✓</span>
              </div>
            )}
          </div>
          
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className={`w-4 h-1 sm:w-8 sm:h-2 mx-1 sm:mx-2 border sm:border-2 border-black transition-all duration-300 ${
              currentStep > step 
                ? 'bg-white shadow-[1px_1px_0_rgba(0,0,0,1)] sm:shadow-[2px_2px_0_rgba(0,0,0,1)]' 
                : 'bg-gray-400'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}