'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UilArrowRight,
  UilArrowLeft,
  UilGlobe,
  UilEnvelope,
  UilBuilding,
  UilCrosshair,
  UilInfoCircle,
  UilClipboardNotes
} from '@tooni/iconscout-unicons-react';
import { StepProps } from './types';

export function ValidationCriteriaStep({
  validationCriteria,
  setValidationCriteria,
  setCurrentStep
}: StepProps) {
  return (
    <Card className="transform rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            VALIDATION CRITERIA
          </h1>
        </div>
        <p className="text-xl text-center text-gray-700 mb-8">
          Define what makes a lead valid for your search
        </p>
        <div className="space-y-6">
          <Card className="border-2 border-black bg-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="header" className="w-12 h-12 bg-green-500">
                    <UilGlobe className="h-6 w-6 text-white" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-black uppercase">ACTIVE WEBSITE</h3>
                    <p className="text-sm text-gray-600">Must have a functioning business website</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      checked={validationCriteria.mustHaveWebsite}
                      onCheckedChange={(checked) => 
                        setValidationCriteria({...validationCriteria, mustHaveWebsite: checked})
                      }
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Only include businesses with verified, active websites</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black bg-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="header" className="w-12 h-12 bg-blue-500">
                    <UilEnvelope className="h-6 w-6 text-white" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-black uppercase">CONTACT INFORMATION</h3>
                    <p className="text-sm text-gray-600">Must have visible contact details</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      checked={validationCriteria.mustHaveContactInfo}
                      onCheckedChange={(checked) => 
                        setValidationCriteria({...validationCriteria, mustHaveContactInfo: checked})
                      }
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter out businesses without verifiable contact information</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black bg-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="header" className="w-12 h-12 bg-purple-500">
                    <UilBuilding className="h-6 w-6 text-white" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-black uppercase">INDUSTRY MATCH</h3>
                    <p className="text-sm text-gray-600">Must be in the selected industry</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      checked={validationCriteria.mustBeInIndustry}
                      onCheckedChange={(checked) => 
                        setValidationCriteria({...validationCriteria, mustBeInIndustry: checked})
                      }
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Strictly enforce industry classification matching</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black bg-violet-50">
            <CardContent className="p-6">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="text-lg font-black uppercase mb-3 flex items-center gap-3 cursor-help">
                      <UilCrosshair className="h-6 w-6" />
                      REQUIRED KEYWORDS
                      <UilInfoCircle className="h-4 w-4 text-gray-600" />
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Leads must have ALL of these keywords on their website to be included in results</p>
                  </TooltipContent>
                </Tooltip>
                <p className="text-sm text-gray-600 mb-3">
                  Comma-separated keywords that must appear on the website
                </p>
                <Input
                  type="text"
                  value={validationCriteria.mustHaveSpecificKeywords.join(', ')}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only split by comma if the user is not in the middle of typing
                    if (value.endsWith(',') || value.endsWith(', ')) {
                      setValidationCriteria({
                        ...validationCriteria, 
                        mustHaveSpecificKeywords: value.split(',').map(k => k.trim()).filter(k => k)
                      });
                    } else {
                      // For display purposes, update the array on blur or when needed
                      const keywords = value.split(',').map(k => k.trim()).filter(k => k);
                      setValidationCriteria({
                        ...validationCriteria, 
                        mustHaveSpecificKeywords: keywords
                      });
                    }
                  }}
                  onBlur={(e) => {
                    // Ensure clean split on blur
                    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                    setValidationCriteria({
                      ...validationCriteria, 
                      mustHaveSpecificKeywords: keywords
                    });
                  }}
                  placeholder="e.g., partner, affiliate, reseller, api, integration"
                  className="h-14 text-lg font-semibold border-4 border-black rounded-[3px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black bg-violet-50">
            <CardContent className="p-6">
              <div>
                <h3 className="text-lg font-black uppercase mb-3 flex items-center gap-3">
                  <UilClipboardNotes className="h-6 w-6" />
                  CUSTOM VALIDATION RULES
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Additional requirements or criteria for lead validation
                </p>
                <Textarea
                  value={validationCriteria.customValidationRules}
                  onChange={(e) => setValidationCriteria({
                    ...validationCriteria, 
                    customValidationRules: e.target.value
                  })}
                  placeholder="e.g., Must offer enterprise solutions, Must have case studies, Must serve international clients..."
                  className="min-h-[120px] text-lg font-semibold border-4 border-black rounded-[3px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => setCurrentStep(3)}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
              onClick={() => setCurrentStep(4)}
            >
              CONTINUE
              <UilArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}