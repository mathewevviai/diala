"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Code, Play, AlertCircle, CheckCircle, 
  HelpCircle, Copy, Braces
} from 'lucide-react'
import { ExpressionParser } from '@/lib/workflow/core/ExpressionParser'

interface ExpressionEditorProps {
  value: string
  onChange: (value: string) => void
  context?: Record<string, any>
  placeholder?: string
}

interface ExpressionSuggestion {
  label: string
  value: string
  description?: string
  category?: string
}

const EXPRESSION_EXAMPLES = [
  {
    category: 'Basic',
    examples: [
      { label: 'Current Item', value: '{{ $json }}', description: 'Access the current item data' },
      { label: 'Item Property', value: '{{ $json.propertyName }}', description: 'Access a specific property' },
      { label: 'Previous Node', value: '{{ $("NodeName").json }}', description: 'Access data from previous node' },
    ]
  },
  {
    category: 'Variables',
    examples: [
      { label: 'Workflow Name', value: '{{ $workflow.name }}', description: 'Get workflow name' },
      { label: 'Workflow ID', value: '{{ $workflow.id }}', description: 'Get workflow ID' },
      { label: 'Node Name', value: '{{ $node.name }}', description: 'Get current node name' },
      { label: 'Item Index', value: '{{ $position }}', description: 'Get current item index' },
      { label: 'Current Date', value: '{{ $now }}', description: 'Get current timestamp' },
      { label: 'Today', value: '{{ $today }}', description: 'Get today\'s date' },
    ]
  },
  {
    category: 'Functions',
    examples: [
      { label: 'To String', value: '{{ $json.value.toString() }}', description: 'Convert to string' },
      { label: 'To Number', value: '{{ Number($json.value) }}', description: 'Convert to number' },
      { label: 'To Upper Case', value: '{{ $json.text.toUpperCase() }}', description: 'Convert to uppercase' },
      { label: 'Replace Text', value: '{{ $json.text.replace("old", "new") }}', description: 'Replace text' },
      { label: 'Array Length', value: '{{ $json.items.length }}', description: 'Get array length' },
      { label: 'JSON Parse', value: '{{ JSON.parse($json.jsonString) }}', description: 'Parse JSON string' },
    ]
  },
  {
    category: 'Conditionals',
    examples: [
      { label: 'If/Else', value: '{{ $json.value > 10 ? "high" : "low" }}', description: 'Conditional expression' },
      { label: 'Default Value', value: '{{ $json.value || "default" }}', description: 'Provide default if empty' },
      { label: 'Check Exists', value: '{{ $json.property !== undefined }}', description: 'Check if property exists' },
    ]
  },
  {
    category: 'Date & Time',
    examples: [
      { label: 'Format Date', value: '{{ new Date($json.date).toLocaleDateString() }}', description: 'Format date' },
      { label: 'Add Days', value: '{{ new Date(Date.now() + 86400000 * 7) }}', description: 'Add 7 days to now' },
      { label: 'Time Difference', value: '{{ Date.now() - new Date($json.date).getTime() }}', description: 'Time difference in ms' },
    ]
  }
]

export default function ExpressionEditor({
  value,
  onChange,
  context = {},
  placeholder = 'Enter expression or click examples below...'
}: ExpressionEditorProps) {
  const [editorValue, setEditorValue] = useState(value)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('editor')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditorValue(value)
  }, [value])

  const evaluateExpression = () => {
    try {
      const evaluated = ExpressionParser.evaluate(editorValue, context)
      setResult(evaluated)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Invalid expression')
      setResult(null)
    }
  }

  const insertExpression = (expression: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = 
      editorValue.substring(0, start) + 
      expression + 
      editorValue.substring(end)

    setEditorValue(newValue)
    onChange(newValue)

    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + expression.length,
        start + expression.length
      )
    }, 0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setEditorValue(newValue)
    onChange(newValue)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatResult = (result: any): string => {
    if (result === null) return 'null'
    if (result === undefined) return 'undefined'
    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2)
    }
    return String(result)
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 border-3 border-black">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase">Expression</label>
              <Button
                variant="outline"
                size="sm"
                onClick={evaluateExpression}
                className="gap-2"
              >
                <Play className="w-3 h-3" />
                Test
              </Button>
            </div>

            <textarea
              ref={textareaRef}
              value={editorValue}
              onChange={handleChange}
              placeholder={placeholder}
              className="expression-editor"
              spellCheck={false}
              rows={6}
            />
          </div>

          {(result !== null || error) && (
            <Card className="border-3 border-black p-4">
              {error ? (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-red-600">Error</p>
                    <p className="text-sm text-gray-700">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-sm text-green-600">Result</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(formatResult(result))}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-sm bg-gray-100 p-2 border-2 border-black overflow-auto max-h-32">
                      {formatResult(result)}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          )}

          <div className="space-y-2">
            <p className="text-sm font-bold uppercase">Context Variables</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(context).slice(0, 6).map(([key, value]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => insertExpression(`{{ ${key} }}`)}
                  className="justify-start gap-2 text-xs"
                >
                  <Braces className="w-3 h-3" />
                  {key}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          {EXPRESSION_EXAMPLES.map((category) => (
            <div key={category.category}>
              <h3 className="font-bold text-sm uppercase mb-2">{category.category}</h3>
              <div className="space-y-2">
                {category.examples.map((example) => (
                  <Card
                    key={example.value}
                    className="border-2 border-black p-3 cursor-pointer hover:shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all"
                    onClick={() => insertExpression(example.value)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{example.label}</p>
                        {example.description && (
                          <p className="text-xs text-gray-600">{example.description}</p>
                        )}
                      </div>
                      <code className="text-xs bg-gray-100 px-2 py-1 border border-black">
                        {example.value}
                      </code>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card className="border-3 border-black p-4">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-sm mb-1">Expression Syntax</h4>
                  <p className="text-sm text-gray-700">
                    Expressions must be wrapped in double curly braces: <code className="bg-gray-100 px-1">{'{{ expression }}'}</code>
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-1">Available Variables</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <code>$json</code> - Current item data</li>
                    <li>• <code>$("NodeName")</code> - Data from specific node</li>
                    <li>• <code>$workflow</code> - Workflow information</li>
                    <li>• <code>$node</code> - Current node information</li>
                    <li>• <code>$position</code> - Current item index</li>
                    <li>• <code>$now</code> - Current timestamp</li>
                    <li>• <code>$today</code> - Today's date</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-1">JavaScript Functions</h4>
                  <p className="text-sm text-gray-700">
                    You can use any JavaScript function or method within expressions.
                    Common functions include String methods, Array methods, Math functions, and Date operations.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-1">Tips</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Use dot notation to access nested properties</li>
                    <li>• Use optional chaining (?.) to safely access properties</li>
                    <li>• Test your expressions before saving</li>
                    <li>• Complex logic can use ternary operators or logical operators</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}