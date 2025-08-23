import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UilClock,
  UilVideo,
  UilArrowRight,
  UilAward,
  UilStar,
  UilGraduationCap,
  UilCheckCircle,
  UilLock,
  UilPlay,
  UilFileAlt
} from '@tooni/iconscout-unicons-react';

interface Module {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface CourseCardProps {
  title: string;
  description: string;
  instructor: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  modules: Module[];
  enrolled: boolean;
  progress: number;
  rating: number;
  students: number;
  certificate: boolean;
  selected?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  onToggleModules?: () => void;
}

export function CourseCard({
  title,
  description,
  instructor,
  level,
  duration,
  modules,
  enrolled,
  progress,
  rating,
  students,
  certificate,
  selected = false,
  expanded = false,
  onClick,
  onToggleModules
}: CourseCardProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  return (
    <Card 
      className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
        selected ? 'bg-purple-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Course Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h4 className="font-black uppercase text-xl mb-2">{title}</h4>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
          </div>
          {certificate && (
            <Badge className="bg-purple-500 text-white border-2 border-black flex-shrink-0 ml-4">
              <UilAward className="h-3 w-3 mr-1" />
              CERTIFICATE
            </Badge>
          )}
        </div>

        {/* Course Meta */}
        <div className="flex flex-wrap gap-4 mb-4">
          <Badge className={`border-2 ${getLevelColor(level)}`}>
            {level.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-1">
            <UilClock className="h-4 w-4" />
            <span className="text-sm font-bold">{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <UilVideo className="h-4 w-4" />
            <span className="text-sm font-bold">{modules.length} modules</span>
          </div>
          <div className="flex items-center gap-1">
            <UilStar className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-bold">{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <UilGraduationCap className="h-4 w-4" />
            <span className="text-sm font-bold">{students} students</span>
          </div>
        </div>

        {/* Instructor */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">Instructor: <span className="font-bold text-black">{instructor}</span></p>
        </div>

        {/* Progress Bar (if enrolled) */}
        {enrolled && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold">PROGRESS</span>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3 border-2 border-black" />
          </div>
        )}

        {/* Module List Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleModules?.();
          }}
          className="mb-4 text-sm font-bold uppercase hover:bg-purple-50"
        >
          <UilFileAlt className="h-4 w-4 mr-2" />
          {expanded ? 'HIDE' : 'VIEW'} CURRICULUM
        </Button>

        {/* Module List */}
        {expanded && (
          <div className="mb-4 space-y-2 border-t-2 border-black pt-4">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  {module.completed ? (
                    <UilCheckCircle className="h-5 w-5 text-green-600" />
                  ) : module.locked ? (
                    <UilLock className="h-5 w-5 text-gray-400" />
                  ) : (
                    <UilPlay className="h-5 w-5 text-purple-600" />
                  )}
                  <span className={`text-sm ${module.locked ? 'text-gray-400' : 'text-black'} ${module.completed ? 'line-through' : ''}`}>
                    {moduleIndex + 1}. {module.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{module.duration}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <Button 
          className={`w-full ${
            enrolled 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'bg-purple-500 hover:bg-purple-600'
          } text-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)]`}
        >
          {enrolled ? 'CONTINUE LEARNING' : 'ENROLL NOW'}
          <UilArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}