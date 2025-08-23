# Onboarding Pages Implementation Rules

This document defines the specific patterns and rules for creating multi-step onboarding pages based on the established patterns in the calls onboarding page.

## Page Structure

### 1. Background and Container
```tsx
<div 
  className="min-h-screen bg-orange-500 relative pb-8" 
  style={{ 
    fontFamily: 'Noyh-Bold, sans-serif',
    backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
    backgroundSize: '60px 60px'
  }}
>
  <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-8 pb-8">
    <div className="w-full max-w-4xl space-y-8">
      {/* Content goes here */}
    </div>
  </div>
</div>
```

### 2. Persistent Title Card
The title card remains visible throughout all steps with dynamic content:

```tsx
<Card className="transform rotate-1 relative overflow-hidden">
  <CardHeader className="relative">
    {/* Decorative elements */}
    <div className="absolute top-2 left-4 w-8 h-8 bg-orange-600 border-2 border-black flex items-center justify-center">
      <UilPhone className="h-4 w-4 text-white" />
    </div>
    <div className="absolute top-2 right-4 w-8 h-8 bg-orange-500 border-2 border-black flex items-center justify-center">
      <UilPhoneVolume className="h-4 w-4 text-white" />
    </div>
    <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
      <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
    </div>
    <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>
    
    {/* Central icon button */}
    <div className="flex justify-center mb-4">
      <Button className="w-20 h-20 bg-orange-600 hover:bg-orange-700 border-4 border-black p-0">
        {currentStep === 1 && <UilBriefcase className="h-12 w-12 text-white" />}
        {/* Add icons for other steps */}
      </Button>
    </div>
    
    {/* Dynamic title */}
    <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
      {currentStep === 1 && 'STEP ONE TITLE'}
      {/* Add titles for other steps */}
    </CardTitle>
    
    {/* Subtitle */}
    <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
      {currentStep === 1 && 'STEP ONE SUBTITLE'}
    </p>
    
    {/* Animated decorative bars */}
    <div className="flex justify-center items-center mt-3 gap-2">
      <div className="w-3 h-3 bg-orange-600 animate-pulse"></div>
      <div className="w-2 h-6 bg-black"></div>
      <div className="w-4 h-4 bg-orange-500 animate-pulse delay-150"></div>
      <div className="w-2 h-8 bg-black"></div>
      <div className="w-3 h-3 bg-orange-600 animate-pulse delay-300"></div>
    </div>
  </CardHeader>
</Card>
```

## Dev Mode Autofill Button

### Overview
A sticky development mode toggle that automatically populates form fields with realistic test data for faster development and testing.

### Implementation Pattern (from hunter/page.tsx)
```tsx
// State management
const [devMode, setDevMode] = React.useState(false);

// Auto-fill effect
React.useEffect(() => {
  if (devMode) {
    setSearchName('Belfast Roofing Contractors Q4');
    setSearchObjective('Finding roofing contractors and construction companies in Belfast area for partnership opportunities');
    setSelectedSources(['web']);
    setSearchCriteria({
      industry: 'Other',
      location: 'Belfast, Northern Ireland',
      companySize: '1-10',
      jobTitles: ['Business Owner', 'Operations Manager'],
      keywords: 'roofing, roof repair, slate, tiles, guttering, Belfast'
    });
    setCustomIndustry('Roofing & Construction');
    setContactPreferences({
      includeEmails: true,
      includePhones: true,
      includeLinkedIn: false
    });
    setValidationCriteria({
      mustHaveWebsite: true,
      mustHaveContactInfo: true,
      mustHaveSpecificKeywords: ['roofing', 'contractor', 'Belfast'],
      mustBeInIndustry: true,
      customValidationRules: 'Must offer residential or commercial roofing services'
    });
  }
}, [devMode]);
```

### Component Implementation (from hunter/page.tsx)
```tsx
{process.env.NODE_ENV === 'development' && (
  <div className="fixed top-4 right-4 z-50">
    <Button
      onClick={() => setDevMode(!devMode)}
      className={`h-10 px-4 text-sm font-black uppercase ${
        devMode
          ? 'bg-green-500 hover:bg-green-600 text-white'
          : 'bg-gray-200 hover:bg-gray-300 text-black'
      } border-2 border-black`}
    >
      DEV MODE {devMode ? 'ON' : 'OFF'}
    </Button>
  </div>
)}
```

### Styling Rules
- **Position**: `fixed top-4 right-4 z-50`
- **Visual State**: Green when active, gray when inactive
- **Size**: `h-10 px-4 text-sm`
- **Border**: `border-2 border-black`
- **Z-index**: `z-50` to ensure visibility above all content
- **Environment Check**: `process.env.NODE_ENV === 'development'`
- **Toggle Behavior**: Click to enable/disable auto-fill
- **Font**: `font-black uppercase text-sm`

### Data Patterns by Page Type

#### Hunter Onboarding (Lead Generation)
```tsx
// Search Definition
searchName: 'Belfast Roofing Contractors Q4',
searchObjective: 'Finding roofing contractors and construction companies in Belfast area for partnership opportunities',
selectedSources: ['web'],
searchCriteria: {
  industry: 'Other',
  location: 'Belfast, Northern Ireland',
  companySize: '1-10',
  jobTitles: ['Business Owner', 'Operations Manager'],
  keywords: 'roofing, roof repair, slate, tiles, guttering, Belfast'
},
customIndustry: 'Roofing & Construction'
```

#### Voice Agents
```tsx
agentName: 'Sarah - Sales Assistant',
description: 'Professional sales agent for B2B software outreach',
purpose: 'sales',
voiceProvider: 'elevenlabs',
voiceId: 'pNInz6obpgDQGcFmaJgB',
voiceStyle: 'professional',
systemPrompt: 'You are Sarah, a professional sales assistant...'
```

#### RAG Workflows
```tsx
workflowName: 'Tech Startup Documentation',
description: 'Knowledge base for tech startup documentation and FAQs',
sourceType: 'mixed',
embeddingModel: 'jina-clip-v2',
chunkSize: 512,
chunkOverlap: 50
```

### Best Practices
1. **Environment Check**: Only show in development mode
2. **Realistic Data**: Use actual business scenarios
3. **Complete Coverage**: Populate all required fields
4. **Contextual**: Tailor data to the specific onboarding flow
5. **Toggle Behavior**: Click to enable/disable auto-fill
6. **Visual Feedback**: Clear on/off states with color coding

### Integration Steps
1. Add `devMode` state to your component
2. Create the sticky button with environment check
3. Implement the auto-fill effect with realistic data
4. Ensure all form fields are populated correctly
5. Test toggle functionality in development

### Alternative Patterns
- **Floating Action Button**: Bottom-right corner for mobile
- **Keyboard Shortcut**: Add `Ctrl+D` or `Cmd+D` toggle
- **Context Menu**: Right-click to enable dev mode
- **Console Toggle**: `window.toggleDevMode()` for debugging

## Selection Cards with Star15

### Implementation Pattern
```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <div className="relative"> {/* IMPORTANT: No overflow-hidden */}
    {selectedItem === 'item-id' && (
      <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" 
           style={{animation: 'overshoot 0.3s ease-out'}}>
        <div className="relative">
          <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
            <Star15 color="#FFD700" size={80} 
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" 
                    stroke="black" strokeWidth={8} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" 
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              SELECTED
            </span>
          </div>
        </div>
      </div>
    )}
    <Card 
      className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
        selectedItem === 'item-id' ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
      }`}
      onClick={() => setSelectedItem('item-id')}
    >
      <CardContent className="p-4 text-center">
        <UilIcon className="h-8 w-8 mx-auto mb-2" />
        <h4 className="font-black uppercase">ITEM TITLE</h4>
        <p className="text-sm text-gray-600">Item description</p>
      </CardContent>
    </Card>
  </div>
</div>
```

### Key Rules for Star15:
1. **NEVER** add `overflow-hidden` to the parent card wrapper
2. Use responsive positioning for the star (-top-8/-right-8 on mobile, scaling up)
3. Animation duration: 15s for spin, 0.3s delay
4. Overshoot animation on initial appearance
5. "SELECTED" text rotated 12 degrees inside the star

## Info/Tip Boxes

### Standard Info Box Pattern
```tsx
<Card className="bg-yellow-100 border-2 border-black mt-6">
  <CardContent className="p-4">
    <div className="flex items-start gap-3">
      <Button 
        size="sm" 
        variant="neutral" 
        className="bg-yellow-400 hover:bg-yellow-500 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] flex-shrink-0"
      >
        <UilInfoCircle className="h-4 w-4" />
      </Button>
      <div>
        <p className="text-sm font-bold">INFO BOX TITLE</p>
        <p className="text-sm text-gray-700 mt-1">
          Helpful information or tips about the current step go here.
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

## Form Elements

### Input Fields
```tsx
<div>
  <label className="text-xl font-black uppercase mb-3 block">
    FIELD LABEL
  </label>
  <Input
    type="text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Placeholder text"
    className="h-16 text-lg font-semibold border-4 border-black rounded-[3px]"
  />
</div>
```

### Textarea Fields
```tsx
<Textarea
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Placeholder text"
  className="min-h-[120px] text-lg font-semibold border-4 border-black rounded-[3px] resize-none"
/>
```

## File Upload Pattern

### CSV Upload Card Implementation
Used for uploading contact lists, data files, or any bulk import functionality.

```tsx
{targetListType === 'upload' && (
  <Card className="bg-orange-50 border-4 border-black">
    <CardContent className="p-8">
      <div className="border-4 border-dashed border-black rounded-lg p-8 text-center bg-white">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="cursor-pointer">
          <Button size="icon" variant="header" className="w-16 h-16 mb-4 bg-orange-500 hover:bg-orange-600">
            <UilUpload className="h-8 w-8 text-white" />
          </Button>
          <p className="text-lg font-bold">Click to upload CSV file</p>
          <p className="text-sm text-gray-600 mt-2">Format: Name, Phone Number, Company (optional)</p>
        </label>
      </div>
      {uploadedFile && (
        <div className="mt-4 p-4 bg-green-50 border-2 border-black rounded">
          <p className="font-bold">✓ {uploadedFile.name} uploaded</p>
          <p className="text-sm text-gray-600">Estimated contacts: {estimatedContacts}</p>
        </div>
      )}
    </CardContent>
  </Card>
)}
```

### File Upload Handler
```tsx
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setUploadedFile(e.target.files[0]);
    // Process file or update contact count
    setEstimatedContacts(Math.floor(Math.random() * 500) + 100);
  }
};
```

## Navigation Controls

### Standard Navigation Layout
```tsx
<div className="flex gap-4 mt-8">
  <Button
    className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
    onClick={() => setCurrentStep(currentStep - 1)}
  >
    <UilArrowLeft className="mr-2 h-6 w-6" />
    BACK
  </Button>
  <Button
    className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
    onClick={() => setCurrentStep(currentStep + 1)}
    disabled={!canProceed()}
  >
    CONTINUE
    <UilArrowRight className="ml-2 h-6 w-6" />
  </Button>
</div>
```

## Color Schemes by Page Type

### Calls Page (Orange Theme)
- Background: `bg-orange-500`
- Primary buttons: `bg-orange-600`
- Info cards: `bg-orange-50`
- Selection highlight: `bg-orange-100`

### Other Pages
- Agents: Blue theme (`bg-blue-500`)
- Hunter: Violet theme (`bg-violet-400`)
- RAG: Cyan theme (`bg-cyan-400`)
- Transcribe: Blue theme (`bg-blue-500`)
- Voice: Pink theme (`bg-pink-500`)

## Important Implementation Notes

1. **Font Family**: Always include `style={{ fontFamily: 'Noyh-Bold, sans-serif' }}` on the root container
2. **Grid Pattern**: Use the specified background image with 60px x 60px grid
3. **Uppercase Text**: All headings and button text should be uppercase
4. **Bold Weights**: Use `font-black` for headings, `font-bold` for emphasis
5. **Shadow Pattern**: Consistent shadow usage (e.g., `shadow-[6px_6px_0_rgba(0,0,0,1)]`)
6. **Border Width**: 4px borders for main elements, 2px for secondary
7. **Transform Effects**: Use rotation (-1 or 1 degree) for Neobrutalist style
8. **Responsive Breakpoints**: Use sm/md prefixes for responsive design
9. **Step Content**: Wrap each step in a single Card, avoid nested cards
10. **Selection UI**: Use grid layouts with cards for selections, not dropdowns
11. **Info Boxes**: Keep them simple with yellow background and minimal decoration
12. **Clean Design**: Focus on functionality over excessive decoration
13. **Dev Mode**: Always include the sticky dev mode toggle for development
14. **Realistic Data**: Use actual business scenarios in dev mode auto-fill