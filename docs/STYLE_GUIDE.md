# Lex Business Style Guide

## Table of Contents
1. [Design Principles](#design-principles)
2. [Colors](#colors)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Components](#components)
6. [Code Style](#code-style)

## Design Principles

### 1. Clarity First
- Clear visual hierarchy
- Intuitive navigation
- Readable content

### 2. Consistency
- Consistent spacing
- Uniform component styling
- Predictable interactions

### 3. Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support

### 4. Performance
- Optimized images
- Lazy loading
- Minimal bundle size

## Colors

### Primary Palette
```css
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6; /* Main */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
```

### Neutral Palette
```css
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;
```

### Semantic Colors
- **Success**: `#22c55e`
- **Warning**: `#f59e0b`
- **Error**: `#ef4444`
- **Info**: `#3b82f6`

## Typography

### Font Families
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif; /* Body */
font-family: 'Sora', system-ui, sans-serif; /* Display */
font-family: 'JetBrains Mono', monospace; /* Code */
```

### Font Sizes
```css
text-xs: 0.75rem;     /* 12px */
text-sm: 0.875rem;    /* 14px */
text-base: 1rem;      /* 16px */
text-lg: 1.125rem;    /* 18px */
text-xl: 1.25rem;     /* 20px */
text-2xl: 1.5rem;     /* 24px */
text-3xl: 1.875rem;   /* 30px */
text-4xl: 2.25rem;    /* 36px */
text-5xl: 3rem;       /* 48px */
```

### Line Heights
- **Tight**: 1.25
- **Snug**: 1.375
- **Normal**: 1.5
- **Relaxed**: 1.625
- **Loose**: 2

## Spacing

### Scale
```css
spacing-0: 0;
spacing-1: 0.25rem;   /* 4px */
spacing-2: 0.5rem;    /* 8px */
spacing-3: 0.75rem;   /* 12px */
spacing-4: 1rem;      /* 16px */
spacing-5: 1.25rem;   /* 20px */
spacing-6: 1.5rem;    /* 24px */
spacing-8: 2rem;      /* 32px */
spacing-10: 2.5rem;   /* 40px */
spacing-12: 3rem;     /* 48px */
spacing-16: 4rem;     /* 64px */
spacing-20: 5rem;     /* 80px */
spacing-24: 6rem;     /* 96px */
```

### Container
- Max width: `1280px`
- Padding: `1rem` (mobile), `1.5rem` (tablet), `2rem` (desktop)

## Components

### Buttons

#### Variants
1. **Primary**: Blue background, white text
2. **Secondary**: Gray background, white text
3. **Outline**: Transparent background, colored border
4. **Ghost**: Transparent background, no border

#### Sizes
- **Small**: `px-3 py-1.5 text-sm`
- **Medium**: `px-4 py-2 text-sm`
- **Large**: `px-6 py-3 text-base`

#### States
- **Hover**: Darker shade, scale 1.02
- **Active**: Scale 0.98
- **Disabled**: 50% opacity, no interactions
- **Loading**: Show spinner, disable interactions

### Cards

```jsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
  {/* Card content */}
</div>
```

### Forms

#### Input Fields
```jsx
<input className="form-input" />
/* Applies: w-full px-4 py-2 border rounded-lg focus:ring-2 */
```

#### Labels
```jsx
<label className="form-label">
  Field Label
</label>
/* Applies: block text-sm font-medium mb-2 */
```

### Modals

- **Overlay**: `bg-black/50`
- **Content**: `bg-white rounded-xl shadow-2xl`
- **Max widths**: sm (28rem), md (32rem), lg (42rem), xl (56rem)

## Code Style

### React Components

#### Functional Components
```tsx
interface ComponentProps {
  prop1: string
  prop2?: number
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 = 0 }) => {
  return <div>{prop1}</div>
}
```

#### Naming Conventions
- **Components**: PascalCase (`UserProfile`)
- **Props**: camelCase (`userName`)
- **Files**: PascalCase for components (`Button.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth`)

### CSS Classes

#### Ordering
1. Layout (display, position)
2. Sizing (width, height)
3. Spacing (margin, padding)
4. Typography
5. Colors & Borders
6. Effects (shadows, transforms)

Example:
```jsx
className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
```

### TypeScript

#### Interfaces over Types
```tsx
// Preferred
interface UserData {
  id: string
  name: string
}

// Avoid for objects
type UserData = {
  id: string
  name: string
}
```

#### Strict Mode
Always use strict TypeScript configuration:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`

## Animation Guidelines

### Durations
- **Fast**: 150ms (tooltips, small transitions)
- **Normal**: 300ms (most interactions)
- **Slow**: 500ms (page transitions, complex animations)

### Easing
- **Default**: `ease-out`
- **Entrance**: `ease-out`
- **Exit**: `ease-in`
- **Bounce**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`

### Common Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

## Accessibility Checklist

- [ ] All interactive elements have focus styles
- [ ] Color contrast ratio >= 4.5:1 for normal text
- [ ] Color contrast ratio >= 3:1 for large text
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Keyboard navigation works for all features
- [ ] ARIA labels for icon-only buttons
- [ ] Skip to main content link
- [ ] Proper heading hierarchy

## Dark Mode

### Implementation
```tsx
// Use Tailwind's dark: modifier
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">Content</p>
</div>
```

### Color Mappings
- White backgrounds → `gray-900`
- Light grays → Dark grays
- Primary colors → Slightly lighter in dark mode
- Shadows → Reduced opacity in dark mode