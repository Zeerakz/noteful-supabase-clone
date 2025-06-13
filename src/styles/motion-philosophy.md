
# Motion Philosophy: Purposeful & Physics-Based

## Core Principles

### 1. Every Animation Must Have Purpose
- **Guide Focus**: Direct attention to important changes or new content
- **Explain Transitions**: Show spatial relationships and state changes
- **Provide Feedback**: Confirm user actions and system responses
- **Never Decorative**: No animation exists purely for visual flair

### 2. Physics-Based Movement
- **Natural Easing**: Use curves that mimic real-world physics
- **Momentum**: Objects should feel like they have weight and inertia
- **Friction**: Smooth deceleration rather than abrupt stops
- **Bounce**: Subtle spring physics for confirmatory actions

### 3. Swift, Subtle, Reassuring
- **Duration**: 200-400ms for most transitions (swift but perceptible)
- **Amplitude**: Minimal displacement unless showing spatial relationship
- **Confidence**: Smooth, predictable motion that builds trust

## Implementation Guidelines

### Modal Appearances
- **Entry**: Scale from 0.96 to 1.0 with simultaneous fade-in
- **Backdrop**: Gentle fade-in of overlay (150ms)
- **Exit**: Reverse with slight scale-down to 0.94

### Side Panels & Drawers
- **Entry**: Slide from edge with ease-out curve
- **Content**: Stagger content appearance 50ms after panel
- **Exit**: Slide back with ease-in curve

### Form Interactions
- **Focus**: Subtle scale (1.02x) with ring animation
- **Error**: Gentle shake with red highlight fade-in
- **Success**: Brief green glow with checkmark scale-in

### Data Loading
- **Skeleton**: Gentle pulse with shimmer sweep
- **Content Reveal**: Fade-in with slight upward drift (8px)
- **Progressive Loading**: Cascade from top to bottom

### Micro-Interactions
- **Buttons**: Subtle scale on press (0.98x)
- **Toggles**: Smooth handle slide with bounce
- **Tabs**: Underline slides between states
