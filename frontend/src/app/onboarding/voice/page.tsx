import App from '@/components/custom/app';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';

export default function VoiceOnboarding() {
  return (
    <div className="min-h-screen flex flex-col relative bg-[rgb(0,82,255)]" style={{ 
      backgroundImage: `
        linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px'
    }}>
      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-7xl">
          <App />
        </div>
      </div>
      <div className="relative z-10">
        <OnboardingFooter />
      </div>
    </div>
  );
}