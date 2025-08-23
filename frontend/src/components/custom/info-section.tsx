import * as React from 'react';
import { Card, CardContent } from '../ui/card';
import { UilInfoCircle, UilFire, UilUsersAlt, UilGlobe, UilQuestionCircle, UilVolumeUp, UilLanguage, UilMicrophone, UilCheckCircle, UilHeadphones, UilMapMarker, UilUser, UilSetting } from '@tooni/iconscout-unicons-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// Star component
const Star9 = ({ color, size, stroke, strokeWidth, pathClassName, width, height, ...props }) => (
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
      d="M195 100c-87.305 4.275-90.725 7.695-95 95-4.275-87.305-7.695-90.725-95-95 87.305-4.275 90.725-7.695 95-95 4.275 87.305 7.695 90.725 95 95"
    />
  </svg>
);

interface FAQ {
  icon: React.ReactElement;
  question: string;
  answer: string;
}

interface InfoSectionProps {
  step?: 'audio' | 'language' | 'voice' | 'complete' | 'customize';
  customContent?: {
    icon: React.ReactElement;
    title: string;
    description: string;
    benefits: string[];
    faqs: FAQ[];
  };
}

const InfoSection: React.FC<InfoSectionProps> = ({ step, customContent }) => {

  const getStepInfo = () => {
    // If custom content is provided, use it
    if (customContent) {
      return customContent;
    }
    
    // Otherwise use predefined steps
    switch (step) {
      case 'customize':
        return {
          icon: <UilSetting className="h-6 w-6 text-white" />,
          title: "Customize Your Experience",
          description: "Select your preferred background audio and language in one easy step. This combination creates the perfect foundation for natural, authentic conversations that feel real.",
          benefits: [
            "Quick setup with preset options",
            "Customizable environments and languages",
            "Natural conversation combinations",
            "Optimized for authenticity"
          ],
          faqs: [
            {
              icon: <UilHeadphones className="h-5 w-5" />,
              question: "Why combine audio and language selection?",
              answer: "Selecting both together ensures your environment matches your language choice naturally. For example, a Spanish call with cafe sounds creates an authentic Madrid coffee shop experience."
            },
            {
              icon: <UilSetting className="h-5 w-5" />,
              question: "What does the Quick Demo do?",
              answer: "Quick Demo instantly sets up a crowded office environment with American English - perfect for testing the system quickly without going through all customization options."
            },
            {
              icon: <UilGlobe className="h-5 w-5" />,
              question: "Can I mix any audio with any language?",
              answer: "Absolutely! While some combinations feel more natural (like French + Cafe), you're free to create any combination that suits your specific use case."
            }
          ]
        };
      case 'audio':
        return {
          icon: <UilVolumeUp className="h-6 w-6 text-white" />,
          title: "Why We Need Background Audio",
          description: "Background sounds make your AI calls incredibly realistic. Whether it's a busy office, coffee shop, or library - these environments help your voice agent blend seamlessly into natural conversations.",
          benefits: [
            "Creates authentic conversation environments",
            "Reduces suspicion during calls", 
            "Makes interactions feel more natural",
            "Improves call success rates"
          ],
          faqs: [
            {
              icon: <UilHeadphones className="h-5 w-5" />,
              question: "How do background sounds improve call quality?",
              answer: "Background audio creates authentic environments that make conversations feel natural and reduce suspicion. It helps your AI agent blend into realistic scenarios."
            },
            {
              icon: <UilMapMarker className="h-5 w-5" />,
              question: "What types of environments work best?",
              answer: "Office environments, cafes, and public spaces work excellently. Choose based on your call context - professional calls work well with office sounds, while casual conversations suit cafe ambience."
            },
            {
              icon: <UilSetting className="h-5 w-5" />,
              question: "Can I upload my own audio files?",
              answer: "Yes! You can upload custom background audio that matches your specific needs. Just make sure the file is in a supported audio format."
            }
          ]
        };
      case 'language':
        return {
          icon: <UilGlobe className="h-6 w-6 text-white" />,
          title: "Choose Your Communication Language", 
          description: "Select the language your AI will speak. Our advanced voice technology adapts to native accents and cultural nuances, ensuring smooth and natural conversations worldwide.",
          benefits: [
            "Native-level pronunciation and accent",
            "Cultural context awareness",
            "Global reach capabilities",
            "Authentic local interactions"
          ],
          faqs: [
            {
              icon: <UilLanguage className="h-5 w-5" />,
              question: "How natural do the accents sound?",
              answer: "Our AI uses native-level pronunciation with authentic regional accents. Each language option includes cultural context awareness for natural interactions."
            },
            {
              icon: <UilSetting className="h-5 w-5" />,
              question: "Can I switch languages later?",
              answer: "Yes, you can change the language setting anytime. However, for best results, we recommend sticking with one language per conversation session."
            },
            {
              icon: <UilGlobe className="h-5 w-5" />,
              question: "Do you support regional dialects?",
              answer: "Currently we support major accent variations (American English, Parisian French, Beijing Mandarin, Spain Spanish). More regional options coming soon!"
            }
          ]
        };
      case 'voice':
        return {
          icon: <UilUsersAlt className="h-6 w-6 text-white" />,
          title: "Voice & Pitch Selection",
          description: "Choose your agent's voice personality and business pitch. The voice determines how your agent sounds, while the pitch defines what they'll say and how they'll handle conversations for your specific use case.",
          benefits: [
            "3 unique voice personalities to choose from",
            "3 pre-configured business pitches", 
            "Custom pitch option for unique needs",
            "Perfect alignment with your business goals"
          ],
          faqs: [
            {
              icon: <UilUser className="h-5 w-5" />,
              question: "What's the difference between voice and pitch?",
              answer: "Voice is HOW your agent speaks (personality, tone, style), while pitch is WHAT they say (sales scripts, support responses, appointment booking). Together they create your perfect AI representative."
            },
            {
              icon: <UilMicrophone className="h-5 w-5" />,
              question: "Can I create a custom pitch?",
              answer: "Yes! Select 'Pitch Your Own' to provide details about your business, products, services, and goals. Your agent will be configured to handle your specific requirements perfectly."
            },
            {
              icon: <UilVolumeUp className="h-5 w-5" />,
              question: "Which pitch should I choose?",
              answer: "Discovery Calls for sales and lead qualification, Customer Support for handling inquiries and technical questions, or Appointment Setter for booking and scheduling. Choose based on your primary business need."
            }
          ]
        };
      case 'complete':
        return {
          icon: <UilInfoCircle className="h-6 w-6 text-white" />,
          title: "You're All Set!",
          description: "Your AI voice agent is now configured and ready to make incredibly realistic calls. The combination of your selected environment, language, and voice creates the perfect setup for natural conversations.",
          benefits: [
            "Instant deployment ready",
            "Optimized configuration",
            "Maximum authenticity",
            "Professional call quality"
          ],
          faqs: [
            {
              icon: <UilCheckCircle className="h-5 w-5" />,
              question: "How do I start making calls?",
              answer: "Click 'Start Call' to begin! You can enter phone numbers and customize your initial message. The system will handle the rest automatically."
            },
            {
              icon: <UilSetting className="h-5 w-5" />,
              question: "Can I modify my settings later?",
              answer: "Absolutely! You can change your background audio, language, or voice agent anytime from your dashboard settings."
            },
            {
              icon: <UilInfoCircle className="h-5 w-5" />,
              question: "What happens during a call?",
              answer: "Your AI agent will make the call using your selected voice and language, with background audio playing naturally. You'll see real-time status updates and conversation logs."
            }
          ]
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="mt-12 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Main Info Card */}
      <Card className="transform -rotate-1 relative overflow-hidden">
        <CardContent className="relative">
          {/* Decorative stars for main card */}
          <Star9 color="#FFD700" size={16} className="absolute top-4 right-4 animate-pulse" />
          <Star9 color="rgb(0,82,255)" size={12} className="absolute bottom-4 right-8 animate-pulse delay-700" />
          <div className="flex items-start gap-4 pt-6">
            <Button
              size="icon"
              variant="default"
              className="w-12 h-12 flex-shrink-0 bg-yellow-400 hover:bg-yellow-400/90 text-black border-black"
            >
              {React.cloneElement(stepInfo.icon, { className: "h-6 w-6 text-black" })}
            </Button>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                {stepInfo.title}
              </h3>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                {stepInfo.description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stepInfo.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-black font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Accordion */}
      <Card className="transform rotate-1 relative overflow-hidden">
        <CardContent className="relative">
          {/* Decorative stars */}
          <Star9 color="#FFD700" size={20} className="absolute top-4 right-4 animate-pulse" />
          <Star9 color="rgb(0,82,255)" size={16} className="absolute bottom-4 left-4 animate-pulse delay-300" />
          <Star9 color="#FFD700" size={12} className="absolute top-1/2 right-8 animate-pulse delay-500" />
          
          <div className="flex items-center gap-4 pt-6 mb-6">
            <Button
              size="icon"
              variant="default"
              className="w-12 h-12 bg-yellow-400 hover:bg-yellow-400/90 text-black border-black"
            >
              <UilQuestionCircle className="h-6 w-6 text-black" />
            </Button>
            <h4 className="text-xl font-black text-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              Frequently Asked Questions
            </h4>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {stepInfo.faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className="overflow-hidden"
              >
                <AccordionTrigger className="text-left font-bold py-4 bg-yellow-400 text-black">
                  <div className="flex items-center gap-3">
                    <div className="bg-black p-1.5 rounded-[3px] border-2 border-yellow-400">
                      {React.cloneElement(faq.icon, { className: "h-5 w-5 text-yellow-400" })}
                    </div>
                    {faq.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed px-4 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default InfoSection;