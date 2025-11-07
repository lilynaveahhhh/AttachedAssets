# Design Guidelines: DevOps Deployment Dashboard

## Design Approach
**System-Based Approach** inspired by modern DevOps platforms (Vercel, Linear, Railway)
- Emphasis: Data clarity, status visualization, and operational efficiency
- Reference Pattern: Dashboard-style layouts with real-time monitoring capabilities

## Typography System
**Font Stack:** Inter (via Google Fonts CDN)
- Headers (H1): text-3xl font-bold
- Section Headers (H2): text-2xl font-semibold  
- Subsections (H3): text-xl font-medium
- Body Text: text-base font-normal
- Labels/Metadata: text-sm font-medium
- Status Indicators: text-xs font-semibold uppercase tracking-wide

## Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, py-8)
- Container: max-w-7xl mx-auto px-6
- Section Padding: py-8
- Card Padding: p-6
- Component Gaps: gap-4 for grids, gap-2 for inline elements

## Core Components

### Dashboard Layout
- **Sidebar Navigation** (fixed left, w-64):
  - Logo/branding at top (py-6 px-4)
  - Navigation items (py-3 px-4 each)
  - Status indicator at bottom
  - Icons from Heroicons (CDN)

- **Main Content Area** (ml-64):
  - Top bar with environment selector and user menu (h-16)
  - Content grid (grid-cols-1 lg:grid-cols-3 gap-6)

### Status Cards
- Metric cards in 3-column grid on desktop
- Each card: rounded-lg border p-6
- Structure: Label (text-sm) → Value (text-3xl font-bold) → Trend indicator (text-xs)

### Deployment Timeline
- Vertical timeline component (left border accent)
- Each entry: flex items-start gap-4
- Time badge, status icon, deployment details, action buttons

### Health Check Panel
- Table layout with alternating row treatment
- Columns: Endpoint | Status | Response Time | Last Check
- Status badges: inline-flex items-center px-2.5 py-0.5 rounded-full text-xs

### Environment Switcher
- Tab-style component at page top
- Active/inactive states clearly distinguished
- Shows: Blue Environment | Green Environment | Traffic Split %

### Log Viewer
- Monospace font for log content (font-mono text-sm)
- Fixed height container with overflow-y-auto
- Timestamp | Level | Message structure
- Filter controls above (flex gap-2)

## Data Visualization
- **Progress Bars:** h-2 rounded-full with nested fill indicator
- **Status Badges:** rounded-full px-3 py-1 inline-flex items-center gap-1.5
- **Metrics Grid:** 2-column layout on mobile, 4-column on desktop

## Forms & Controls
- **Input Fields:** border rounded-md px-4 py-2 w-full
- **Buttons Primary:** px-4 py-2 rounded-md font-medium
- **Buttons Secondary:** border px-4 py-2 rounded-md
- **Toggle Switches:** Standard checkbox styled as toggle (w-11 h-6)

## Navigation Patterns
- **Breadcrumbs:** flex items-center gap-2 text-sm (Home > Deployments > #123)
- **Action Bar:** flex justify-between items-center at top of content sections

## Icons Integration
- Use Heroicons via CDN
- Icon sizes: 16px for inline, 20px for buttons, 24px for headers
- Status icons for: Success (check), Error (x-circle), Warning (exclamation), In Progress (arrows-path)

## Responsive Behavior
- Desktop (lg:): Sidebar visible, 3-4 column grids
- Tablet (md:): Collapsible sidebar, 2 column grids  
- Mobile (base): Hidden sidebar (hamburger menu), single column stacks

## Key UI Patterns
- **Empty States:** Centered flex-col gap-4 with icon, heading, description, action button
- **Loading States:** Skeleton screens using animate-pulse on placeholder divs
- **Error States:** Alert boxes with border-l-4 accent and inline icon

## Special Components
- **Deployment Approval Panel:** Card with deployment diff, approval buttons, reviewer list
- **Traffic Distribution:** Horizontal bar showing blue/green split percentage
- **Rollback Interface:** Timeline selector with "Rollback to this version" buttons

No animations except loading spinners for async operations.