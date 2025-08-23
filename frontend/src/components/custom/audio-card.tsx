import * as React from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { UilPlay, UilPause, UilSquare, UilStepBackward, UilStepForward, UilVolumeUp, UilVolumeOff, UilMusicNote } from '@tooni/iconscout-unicons-react';

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
import ImageCard from '../ui/image-card';

interface AudioCardProps {
  fileName: string;
  imageUrl: string;
  isSelected: boolean;
  onSelect: (fileName: string) => void;
  category?: string;
}

const AudioCard: React.FC<AudioCardProps> = ({ fileName, imageUrl, isSelected, onSelect, category = 'audio' }) => {
  const baseFileName = fileName.split('.').slice(0, -1).join('.');
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState([0]);
  const [duration, setDuration] = React.useState(30);
  const [volume, setVolume] = React.useState([80]);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Create audio URL from filename
  const audioUrl = `/audio/${fileName}`;

  // Initialize audio element
  React.useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedData = () => {
        setDuration(audio.duration || 30);
        setIsLoaded(true);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime([audio.currentTime]);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime([0]);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
      
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  // Handle volume changes
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
    }
  }, [volume, isMuted]);

  // Auto-play when card is selected
  React.useEffect(() => {
    if (isSelected && isLoaded && audioRef.current) {
      audioRef.current.currentTime = 0;
      setIsMuted(false);  // Unmute when selected
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.log('Auto-play failed:', error);
      });
    } else if (!isSelected && isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime([0]);
      setIsMuted(true);  // Mute when deselected
    }
  }, [isSelected, isLoaded]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle timeline seek
  const handleTimelineChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime([newTime]);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Handle rewind (go back 10 seconds)
  const handleRewind = () => {
    if (audioRef.current) {
      const newTime = Math.max(0, audioRef.current.currentTime - 10);
      audioRef.current.currentTime = newTime;
      setCurrentTime([newTime]);
    }
  };

  // Handle fast forward (go forward 10 seconds)
  const handleFastForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(duration, audioRef.current.currentTime + 10);
      audioRef.current.currentTime = newTime;
      setCurrentTime([newTime]);
    }
  };

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
        onClick={() => onSelect(fileName)}
      >
      {/* Category label at top */}
      <div className="bg-[rgb(0,82,255)] text-white px-4 py-3 text-sm border-b-4 border-black flex items-center gap-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
        <UilMusicNote className="h-4 w-4 text-white" />
        {category}
      </div>

      {/* Main content area with image */}
      <div className="flex-grow relative overflow-hidden p-3 card-body">
        <div className="relative w-full h-full overflow-hidden border-4 border-black">
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Bottom section with timeline and controls */}
      <div className="p-3 card-body">
        {/* Timeline slider with controls */}
        <div className="flex items-center gap-3">
          {/* Play/Pause button on the left */}
          <Button
            size="sm"
            variant="reverse"
            className="p-1 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
          >
            {isPlaying ? (
              <UilPause className="h-3 w-3 text-black" />
            ) : (
              <UilPlay className="h-3 w-3 text-black" />
            )}
          </Button>
          
          <Slider
            value={currentTime}
            onValueChange={handleTimelineChange}
            max={duration}
            step={0.1}
            className="flex-1 [&_[data-orientation=horizontal]]:h-2 [&_[data-orientation=horizontal]_span[data-orientation=horizontal]]:h-2"
          />
          
          {/* Rewind, Volume, and Fast Forward buttons on the right */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="reverse"
              className="p-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleRewind();
              }}
            >
              <UilStepBackward className="h-3 w-3 text-black" />
            </Button>
            <div 
              className="relative"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              {/* Extended hover area for smooth interaction */}
              {showVolumeSlider && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-28 z-10" />
              )}
              
              {/* Volume slider - appears above button on hover */}
              {showVolumeSlider && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[rgb(0,82,255)] border-2 border-black p-2 shadow-[2px_2px_0_rgba(0,0,0,1)] z-20">
                  <div className="h-16 flex items-center justify-center py-1.5">
                    <div style={{ '--tw-shadow': 'none', '--tw-shadow-colored': 'none' } as React.CSSProperties}>
                      <Slider
                        value={volume}
                        onValueChange={(value) => {
                          setVolume(value);
                          if (value[0] > 0) setIsMuted(false);
                          if (value[0] === 0) setIsMuted(true);
                        }}
                        max={100}
                        step={1}
                        orientation="vertical"
                        className="h-14 w-3 px-0 py-1.5 [&_[data-orientation=vertical]]:w-2 [&_[data-orientation=vertical]]:h-full [&_span[role=slider]]:!w-3 [&_span[role=slider]]:!h-3 [&_span[role=slider]]:!border-2 [&_span[role=slider]]:!shadow-none [&_span[role=slider]]:shadow-none"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <Button
                size="sm"
                variant="reverse"
                className="p-1 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
              >
                {isMuted ? (
                  <UilVolumeOff className="h-3 w-3 text-black" />
                ) : (
                  <UilVolumeUp className="h-3 w-3 text-black" />
                )}
              </Button>
            </div>
            <Button
              size="sm"
              variant="reverse"
              className="p-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleFastForward();
              }}
            >
              <UilStepBackward className="h-3 w-3 text-black scale-x-[-1]" />
            </Button>
          </div>
        </div>
      </div>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />
    </div>
    </div>
  );
};

export default AudioCard;