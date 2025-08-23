'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UilGraduationCap,
  UilClock,
  UilVideo,
  UilArrowRight,
  UilAward,
  UilStar,
  UilCheckCircle,
  UilLock,
  UilPlay,
  UilFileAlt
} from '@tooni/iconscout-unicons-react';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { Star15 } from '@/components/ui/star';

interface Module {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface Course {
  id: string;
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
}

const mockCourses: Course[] = [
  {
    id: '1',
    title: 'AI VOICE AGENTS MASTERCLASS',
    description: 'Complete training from zero to expert. Learn everything about building, deploying, and scaling AI voice agents.',
    instructor: 'Dr. Sarah Chen',
    level: 'beginner',
    duration: '8 weeks',
    modules: [
      { id: '1-1', title: 'Introduction to AI Voice Technology', duration: '45 min', completed: true, locked: false },
      { id: '1-2', title: 'Setting Up Your First Agent', duration: '60 min', completed: true, locked: false },
      { id: '1-3', title: 'Conversation Design Principles', duration: '90 min', completed: false, locked: false },
      { id: '1-4', title: 'Advanced Voice Customization', duration: '75 min', completed: false, locked: true }
    ],
    enrolled: true,
    progress: 45,
    rating: 4.9,
    students: 1250,
    certificate: true
  },
  {
    id: '2',
    title: 'SALES AUTOMATION WITH AI',
    description: 'Transform your sales process with AI-powered voice agents. Learn to automate outreach and qualify leads at scale.',
    instructor: 'Mike Rodriguez',
    level: 'intermediate',
    duration: '6 weeks',
    modules: [
      { id: '2-1', title: 'Sales Psychology & AI', duration: '50 min', completed: false, locked: false },
      { id: '2-2', title: 'Building High-Converting Scripts', duration: '80 min', completed: false, locked: true },
      { id: '2-3', title: 'Lead Qualification Strategies', duration: '65 min', completed: false, locked: true },
      { id: '2-4', title: 'Performance Analytics', duration: '55 min', completed: false, locked: true }
    ],
    enrolled: false,
    progress: 0,
    rating: 4.8,
    students: 890,
    certificate: true
  },
  {
    id: '3',
    title: 'VOICE CLONING DEEP DIVE',
    description: 'Master the art and science of voice cloning. Create authentic, natural-sounding voice agents.',
    instructor: 'Lisa Park',
    level: 'advanced',
    duration: '4 weeks',
    modules: [
      { id: '3-1', title: 'Voice Cloning Fundamentals', duration: '70 min', completed: false, locked: false },
      { id: '3-2', title: 'Advanced Cloning Techniques', duration: '85 min', completed: false, locked: true },
      { id: '3-3', title: 'Ethics & Best Practices', duration: '45 min', completed: false, locked: true },
      { id: '3-4', title: 'Production Workflows', duration: '90 min', completed: false, locked: true }
    ],
    enrolled: false,
    progress: 0,
    rating: 4.7,
    students: 456,
    certificate: true
  }
];

export default function CoursesPage() {
  const [selectedLevel, setSelectedLevel] = React.useState('all');
  const [selectedCourse, setSelectedCourse] = React.useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = React.useState<string | null>(null);

  const levels = ['all', 'beginner', 'intermediate', 'advanced'];

  const filteredCourses = selectedLevel === 'all' 
    ? mockCourses 
    : mockCourses.filter(course => course.level === selectedLevel);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  return (
    <div 
      className="min-h-screen bg-purple-500 relative pb-8" 
      style={{ 
        fontFamily: 'Noyh-Bold, sans-serif',
        backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}
    >
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-8 pb-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Title Card */}
          <Card className="transform rotate-1 relative overflow-hidden">
            <CardHeader className="relative">
              {/* Decorative elements */}
              <div className="absolute top-2 left-4 w-8 h-8 bg-purple-600 border-2 border-black flex items-center justify-center">
                <UilGraduationCap className="h-4 w-4 text-white" />
              </div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-purple-500 border-2 border-black flex items-center justify-center">
                <UilAward className="h-4 w-4 text-white" />
              </div>
              <div className="absolute bottom-3 left-6 w-6 h-6 bg-pink-400 border-2 border-black rotate-12">
                <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
              </div>
              <div className="absolute bottom-2 right-8 w-4 h-4 bg-yellow-500 border-2 border-black -rotate-12"></div>
              
              {/* Central icon button */}
              <div className="flex justify-center mb-4">
                <Button className="w-20 h-20 bg-purple-600 hover:bg-purple-700 border-4 border-black p-0">
                  <UilGraduationCap className="h-12 w-12 text-white" />
                </Button>
              </div>
              
              <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                COURSES
              </CardTitle>
              
              <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                Structured learning paths to AI voice mastery
              </p>
              
              {/* Animated decorative bars */}
              <div className="flex justify-center items-center mt-3 gap-2">
                <div className="w-3 h-3 bg-purple-600 animate-pulse"></div>
                <div className="w-2 h-6 bg-black"></div>
                <div className="w-4 h-4 bg-purple-500 animate-pulse delay-150"></div>
                <div className="w-2 h-8 bg-black"></div>
                <div className="w-3 h-3 bg-purple-600 animate-pulse delay-300"></div>
              </div>
            </CardHeader>
          </Card>

          {/* Level Filter */}
          <div className="flex flex-wrap gap-2 justify-center">
            {levels.map((level) => (
              <Button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`uppercase font-black ${
                  selectedLevel === level
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-white hover:bg-gray-100 text-black'
                } border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)]`}
              >
                {level}
              </Button>
            ))}
          </div>

          {/* Achievement Banner */}
          <Card className="transform -rotate-1 relative overflow-hidden bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Button
                  size="icon"
                  variant="default"
                  className="w-12 h-12 flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white border-black"
                >
                  <UilAward className="h-6 w-6 text-white" />
                </Button>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                    EARN CERTIFICATES
                  </h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    Complete courses to earn <span className="font-black text-purple-600">verified certificates</span> and showcase your expertise.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-black font-medium">Industry recognized</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-black font-medium">Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-black font-medium">Expert instructors</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          <div className="space-y-6">
            {filteredCourses.map((course, index) => (
              <div key={course.id} className="relative">
                {selectedCourse === course.id && (
                  <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" 
                       style={{animation: 'overshoot 0.3s ease-out'}}>
                    <div className="relative">
                      <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                        <Star15 color="#9333EA" size={80} 
                                className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" 
                                stroke="black" strokeWidth={8} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" 
                              style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                          {course.enrolled ? 'ENROLLED' : 'SELECTED'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <Card 
                  className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all transform ${
                    index % 2 === 0 ? 'rotate-1' : '-rotate-1'
                  } ${
                    selectedCourse === course.id ? 'bg-purple-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                  }`}
                  onClick={() => setSelectedCourse(course.id)}
                >
                  <CardContent className="p-6">
                    {/* Course Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-black uppercase text-xl mb-2">{course.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                      </div>
                      {course.certificate && (
                        <Badge className="bg-purple-500 text-white border-2 border-black flex-shrink-0 ml-4">
                          <UilAward className="h-3 w-3 mr-1" />
                          CERTIFICATE
                        </Badge>
                      )}
                    </div>

                    {/* Course Meta */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <Badge className={`border-2 ${getLevelColor(course.level)}`}>
                        {course.level.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <UilClock className="h-4 w-4" />
                        <span className="text-sm font-bold">{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UilVideo className="h-4 w-4" />
                        <span className="text-sm font-bold">{course.modules.length} modules</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UilStar className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-bold">{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UilGraduationCap className="h-4 w-4" />
                        <span className="text-sm font-bold">{course.students} students</span>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Instructor: <span className="font-bold text-black">{course.instructor}</span></p>
                    </div>

                    {/* Progress Bar (if enrolled) */}
                    {course.enrolled && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold">PROGRESS</span>
                          <span className="text-sm font-bold">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-3 border-2 border-black" />
                      </div>
                    )}

                    {/* Module List Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCourse(expandedCourse === course.id ? null : course.id);
                      }}
                      className="mb-4 text-sm font-bold uppercase hover:bg-purple-50"
                    >
                      <UilFileAlt className="h-4 w-4 mr-2" />
                      {expandedCourse === course.id ? 'HIDE' : 'VIEW'} CURRICULUM
                    </Button>

                    {/* Module List */}
                    {expandedCourse === course.id && (
                      <div className="mb-4 space-y-2 border-t-2 border-black pt-4">
                        {course.modules.map((module, moduleIndex) => (
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
                        course.enrolled 
                          ? 'bg-purple-600 hover:bg-purple-700' 
                          : 'bg-purple-500 hover:bg-purple-600'
                      } text-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)]`}
                    >
                      {course.enrolled ? 'CONTINUE LEARNING' : 'ENROLL NOW'}
                      <UilArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <Card className="bg-purple-100 border-2 border-black mt-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Button 
                  size="sm" 
                  variant="neutral" 
                  className="bg-purple-400 hover:bg-purple-500 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] flex-shrink-0"
                >
                  <UilGraduationCap className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm font-bold">LEARNING PATHS</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Our courses are designed to build on each other. Start with beginner courses to establish fundamentals, then progress to intermediate and advanced topics for specialized skills.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8">
            <OnboardingFooter />
          </div>
        </div>
      </div>
    </div>
  );
}