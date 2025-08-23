---
description: 
globs: 
alwaysApply: true
---
# Diala Voice Agent Design System Specification

## Core Design Rules

### 1. Icon Badges
- MUST have both border and shadow
DO NOT EVER WRITE CLASSNAMES AS WE HAVE [globals.css](mdc:src/styles/globals.css) styles

### 2. Icon Buttons

#### Analytics Icon Button Hierarchy
- **Header buttons** (main section icons):
  - Variant: `variant="header"`
  - Size: `size="header"` (48px x 48px)
  - Border: `border-4`
  - Usage: Top-level component icons, not nested in cards

- **Subheader buttons** (nested card icons):
  - Variant: `variant="subheader"`
  - Size: `size="icon"` (40px x 40px) 
  - Border: `border-2`
  - Usage: Icons inside cards that contain text content

- **Action buttons** (with text):
  - Variant: `variant="reverse"` or `variant="default"`
  - Contains both icon and text labels
  - Usage: Interactive controls and commands

#### Card Action Buttons
- Top right action buttons in cards:
  - Size: `size="sm"`
  - Variant: `variant="neutral"`
  - Background: `bg-white`
  - Icon size: `w-4 h-4`
  - Icon color: `text-black`
  - Padding: `p-2`
  - Border: `border-2 border-black`
  - Hover: `hover:bg-gray-50`

### 3. Color System
```css
Primary Blue:      rgb(0,82,255)      - Main brand color
Secondary Gold:    #FFD700            - Selection indicators
Black:             #000000            - Borders and text
White:             #FFFFFF            - Backgrounds

/* Status Colors */
Success:           #10B981 (green-500)
Warning:           #F59E0B (yellow-400)
Error:             #EF4444 (red-500)
Idle:              #9CA3AF (gray-400)

/* Card Backgrounds */
Audio Card:        from-yellow-50 to-orange-50  - Audio card gradient background

/* Header Colors */
Discovery:         #C084FC (purple-400)  - Discovery calls header
Support:           #4ADE80 (green-400)   - Customer support header
Appointment:       #FB923C (orange-400)  - Appointment setter header
Custom:            #F472B6 (pink-400)    - Custom pitch header

/* Gradient Patterns */
Discovery:         from-purple-50 to-purple-100
Support:           from-green-50 to-green-100
Appointment:       from-orange-50 to-orange-100
Custom:            from-pink-50 to-pink-100

Badge Color Variations:
Discovery:
- Primary: purple-600
- Secondary: purple-800

Support:
- Primary: green-600
- Secondary: green-800

Appointment:
- Primary: orange-600
- Secondary: orange-800

Technical:
- Primary: pink-600
- Secondary: pink-800
```

### 4. Typography
- **Heading Font**: "Noyh-Bold, sans-serif" - UPPERCASE
- **Body Font**: System default
- **Font Weights**: 
  - `font-black` for headings
  - `font-bold` for emphasis
  - `font-medium` for body text

### 5. Progress Indicators (Modal Steps)
- **Container**: `flex items-center justify-center mb-6`
- **Inner wrapper**: `flex items-center gap-1 sm:gap-2`
- **Step rectangles**: 
  - Mobile: `px-2 py-1 border-2 border-black font-bold text-xs`
  - Desktop: `sm:px-4 sm:py-2 sm:border-4 sm:text-sm`
- **Current step**: 
  - Mobile: `bg-[rgb(0,82,255)] text-white scale-105 shadow-[2px_2px_0_rgba(0,0,0,1)]`
  - Desktop: `sm:shadow-[3px_3px_0_rgba(0,0,0,1)]`
- **Completed step**: 
  - Mobile: `bg-[rgb(0,82,255)] text-white shadow-[1px_1px_0_rgba(0,0,0,1)]`
  - Desktop: `sm:shadow-[2px_2px_0_rgba(0,0,0,1)]`
- **Incomplete step**: 
  - Mobile: `bg-gray-300 text-gray-600 shadow-[1px_1px_0_rgba(0,0,0,1)]`
  - Desktop: `sm:shadow-[2px_2px_0_rgba(0,0,0,1)]`
- **Connector lines**: 
  - Mobile: `w-4 h-1 mx-1 border border-black`
  - Desktop: `sm:w-8 sm:h-2 sm:mx-2 sm:border-2`
- **Active connector**: 
  - Mobile: `bg-white shadow-[1px_1px_0_rgba(0,0,0,1)]`
  - Desktop: `sm:shadow-[2px_2px_0_rgba(0,0,0,1)]`
- **Inactive connector**: `bg-gray-400`
- **Implementation**: Use `{[1, 2, 3, 4].map((step, index) =>` pattern with React.Fragment

### 6. Premium Feature Cards
- **Container**: `Card` with `w-full relative overflow-hidden`
- **Overlay**: `absolute inset-0 bg-gray-200 opacity-50`
- **Content**: `CardContent` with `p-4 relative`
- **Layout**: 
  - Mobile: `flex flex-col gap-3`
  - Desktop: `sm:flex-row sm:items-center sm:justify-between`
- **Title section**: `flex-1`
- **Title/badge**: 
  - Mobile: `flex flex-col gap-2`
  - Desktop: `sm:flex-row sm:items-center`
- **Badge**: `px-2 py-1 bg-yellow-400 border-2 border-black text-xs font-bold uppercase w-fit`
- **Price/lock section**: 
  - Mobile: `flex items-center justify-between gap-3`
  - Desktop: `sm:justify-end`
- **Lock icon**: `w-10 h-10 bg-gray-400 border-4 border-black flex items-center justify-center`
- **Implementation**: Use `PremiumFeatureCard` component with title, description, price props

### 7. Information Boxes
- **Container**: `Card` with `bg-yellow-200 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]`
- **Content**: `CardContent` with `p-4`
- **Layout**: `flex items-start gap-3`
- **Icon Button**:
  - Size: `size="sm"`
  - Variant: `variant="neutral"`
  - Background: `bg-yellow-400 hover:bg-yellow-500`
  - Border: `border-2 border-black`
  - Shadow: `shadow-[2px_2px_0_rgba(0,0,0,1)]`
  - Class: `flex-shrink-0`
  - Icon: `UilInfoCircle` with `h-4 w-4`
- **Text Content**:
  - Title: `text-sm font-bold` (UPPERCASE)
  - Description: `text-sm text-gray-700 mt-1`
- **Usage**: For highlighting important information, benefits, or tips within a form or process

### 8. Step Titles (Decorative Headers)
- **Container**: `CardHeader`
- **Title Element**: `CardTitle`
- **Typography**: 
  - Size: `text-4xl md:text-5xl`
  - Weight: `font-black`
  - Transform: `uppercase`
  - Alignment: `text-center`
  - Color: `text-black`
- **Implementation**: 
  ```tsx
  <CardHeader>
    <CardTitle className="text-4xl md:text-5xl font-black uppercase text-center text-black">
      STEP TITLE HERE
    </CardTitle>
  </CardHeader>
  ```
- **Usage**: Main titles for onboarding steps, wizard sections, or major page headers
- **Examples**: "SELECT AGENTS", "SWARM SETTINGS", "REVIEW & DEPLOY"

