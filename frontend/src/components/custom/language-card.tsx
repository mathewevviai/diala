import * as React from 'react';
import { UilGlobe } from '@tooni/iconscout-unicons-react';

// Star component
const Star15 = ({ color, size, stroke, strokeWidth, pathClassName, width, height, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 200 200"
    width={size ?? width}
    height={size ?? height}
    {...props}
  >
    <path
      fill={color ?? "currentColor"}
      stroke={stroke}
      strokeWidth={strokeWidth}
      className={pathClassName}
      d="M95.713 9.378a6 6 0 0 1 8.574 0l9.515 9.717a6 6 0 0 0 6.496 1.381l12.645-5.007a6 6 0 0 1 7.833 3.487l4.74 12.748a6 6 0 0 0 5.372 3.903l13.589.57a6 6 0 0 1 5.737 6.371l-.855 13.573a6 6 0 0 0 3.321 5.752l12.182 6.046a6 6 0 0 1 2.649 8.154l-6.301 12.053a6 6 0 0 0 .694 6.604l8.67 10.479a6 6 0 0 1-.897 8.527l-10.658 8.447a6 6 0 0 0-2.052 6.316l3.657 13.099a6 6 0 0 1-4.287 7.426l-13.173 3.381a6 6 0 0 0-4.443 4.936l-1.987 13.454a6 6 0 0 1-6.936 5.04l-13.41-2.269a6 6 0 0 0-6.066 2.701l-7.287 11.483a6 6 0 0 1-8.387 1.783l-11.327-7.527a6 6 0 0 0-6.641 0l-11.328 7.527a6 6 0 0 1-8.387-1.783l-7.287-11.483a6 6 0 0 0-6.066-2.701l-13.41 2.269a6 6 0 0 1-6.936-5.04l-1.987-13.454a6 6 0 0 0-4.443-4.936l-13.173-3.381a6 6 0 0 1-4.287-7.426l3.657-13.099a6 6 0 0 0-2.052-6.316l-10.658-8.447a6 6 0 0 1-.897-8.527l8.67-10.479a6 6 0 0 0 .694-6.604l-6.301-12.053a6 6 0 0 1 2.65-8.154l12.181-6.046a6 6 0 0 0 3.32-5.752l-.854-13.573a6 6 0 0 1 5.737-6.372l13.588-.569a6 6 0 0 0 5.373-3.903l4.74-12.748a6 6 0 0 1 7.833-3.487l12.645 5.007a6 6 0 0 0 6.496-1.38z"
    />
  </svg>
);

interface LanguageCardProps {
  language: {
    id: string;
    name: string;
    flag: string;
    accent: string;
  };
  isSelected: boolean;
  onSelect: (languageId: string) => void;
}

const LanguageCard: React.FC<LanguageCardProps> = ({ language, isSelected, onSelect }) => {
  return (
    <div className="relative">
      {/* Selection badge */}
      {isSelected && (
        <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
          <div className="relative">
            <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
              <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                SELECTED
              </span>
            </div>
          </div>
        </div>
      )}
      <div
        className={`
          relative w-full h-80
          border-4 border-black
          flex flex-col
          transition-all duration-200
          ${isSelected ? 'scale-[1.02] shadow-[8px_8px_0_rgba(0,0,0,1)]' : 'shadow-[4px_4px_0_rgba(0,0,0,1)]'}
          hover:scale-[1.02] hover:shadow-[6px_6px_0_rgba(0,0,0,1)]
          cursor-pointer overflow-hidden
        `}
        onClick={() => onSelect(language.id)}
      >
        {/* Category label at top */}
        <div className="bg-[rgb(0,82,255)] text-white px-4 py-3 text-sm border-b-4 border-black flex items-center gap-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
          <UilGlobe className="h-4 w-4 text-white" />
          language
        </div>

        {/* Main content area with flag */}
        <div className="flex-grow bg-gradient-to-br from-yellow-50 to-orange-50 p-4 relative overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-4">{language.flag}</div>
            <h3 className="text-2xl font-black text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              {language.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{language.accent}</p>
          </div>
        </div>

        {/* Bottom section with accent info */}
        <div className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 border-t-4 border-black">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-[rgb(0,82,255)]"></div>
            <span className="text-sm font-bold text-black" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              {language.accent} Accent
            </span>
            <div className="w-3 h-3 bg-[rgb(0,82,255)]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageCard;