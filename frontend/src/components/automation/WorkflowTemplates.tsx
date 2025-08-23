"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, Filter, Zap, Phone, Mail, Database,
  Globe, FileText, Calendar, Users, TrendingUp,
  MessageSquare, Shield, Clock, Star, ArrowRight
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  nodeCount: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  popularity: number
  icon: React.ReactNode
  preview?: {
    nodes: any[]
    connections: any[]
  }
}

const templates: WorkflowTemplate[] = [
  {
    id: 'welcome-calls',
    name: 'Welcome Call Campaign',
    description: 'Automatically call new users after signup with a personalized welcome message',
    category: 'Customer Success',
    tags: ['onboarding', 'voice', 'automation'],
    nodeCount: 5,
    difficulty: 'beginner',
    popularity: 95,
    icon: <Phone className="w-6 h-6" />,
    preview: {
      nodes: [
        { id: '1', type: 'webhook', label: 'New User Signup' },
        { id: '2', type: 'code', label: 'Prepare Message' },
        { id: '3', type: 'dialaMakeCall', label: 'Welcome Call' },
        { id: '4', type: 'httpRequest', label: 'Update CRM' },
        { id: '5', type: 'email', label: 'Send Follow-up' }
      ],
      connections: [
        { source: '1', target: '2' },
        { source: '2', target: '3' },
        { source: '3', target: '4' },
        { source: '3', target: '5' }
      ]
    }
  },
  {
    id: 'lead-qualification',
    name: 'Lead Qualification Flow',
    description: 'Score and qualify leads, then route to appropriate sales agents',
    category: 'Sales',
    tags: ['leads', 'scoring', 'routing'],
    nodeCount: 7,
    difficulty: 'intermediate',
    popularity: 88,
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminders',
    description: 'Send automated call reminders for upcoming appointments',
    category: 'Customer Success',
    tags: ['reminders', 'scheduling', 'voice'],
    nodeCount: 4,
    difficulty: 'beginner',
    popularity: 92,
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    id: 'survey-collector',
    name: 'Voice Survey Collection',
    description: 'Collect customer feedback through automated voice surveys',
    category: 'Feedback',
    tags: ['survey', 'feedback', 'voice'],
    nodeCount: 6,
    difficulty: 'intermediate',
    popularity: 75,
    icon: <MessageSquare className="w-6 h-6" />,
  },
  {
    id: 'escalation-handler',
    name: 'Support Escalation',
    description: 'Automatically escalate critical support tickets with voice notifications',
    category: 'Support',
    tags: ['support', 'escalation', 'urgent'],
    nodeCount: 8,
    difficulty: 'advanced',
    popularity: 82,
    icon: <Shield className="w-6 h-6" />,
  },
  {
    id: 'data-enrichment',
    name: 'Contact Data Enrichment',
    description: 'Enrich contact data and validate phone numbers before calling',
    category: 'Data Processing',
    tags: ['data', 'enrichment', 'validation'],
    nodeCount: 5,
    difficulty: 'intermediate',
    popularity: 70,
    icon: <Database className="w-6 h-6" />,
  }
]

const categories = [
  'All',
  'Customer Success',
  'Sales',
  'Support',
  'Feedback',
  'Data Processing'
]

interface WorkflowTemplatesProps {
  onSelectTemplate: (template: WorkflowTemplate) => void
}

export default function WorkflowTemplates({ onSelectTemplate }: WorkflowTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-400'
      case 'intermediate':
        return 'bg-yellow-400'
      case 'advanced':
        return 'bg-red-400'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b-4 border-black bg-white">
        <h2 className="text-2xl font-black uppercase mb-4">Workflow Templates</h2>
        
        {/* Search and Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-10 border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] focus:shadow-[4px_4px_0_rgba(0,0,0,1)] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-40 border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap">
          {['voice', 'automation', 'data', 'integration'].map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-gray-100 border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all"
              onClick={() => setSearchQuery(tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No templates found matching your criteria</p>
          </div>
        ) : (
          <div className="workflow-templates-grid">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="workflow-template-card"
                onClick={() => onSelectTemplate(template)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-blue-100 border-3 border-black flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
                      {template.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 text-xs font-bold uppercase ${getDifficultyColor(template.difficulty)} border-3 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]`}>
                        {template.difficulty}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {template.nodeCount} nodes
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {template.popularity}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-gray-100 border-2 border-black shadow-[1px_1px_0_rgba(0,0,0,1)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-blue-400 hover:bg-blue-500 border-3 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    Use Template
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}