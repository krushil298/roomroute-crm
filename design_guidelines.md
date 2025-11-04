# CRM Application Design Guidelines

## Design Approach
**Reference-Based Approach** drawing inspiration from **Linear** and **Notion** for their clean, efficient productivity interfaces that prioritize speed and minimal friction. The design emphasizes data clarity, fast navigation, and functional simplicity over decorative elements.

## Core Design Principles
1. **Dashboard-First Navigation**: Everything accessible within one click from the main dashboard
2. **Information Density Balance**: Display maximum useful data without overwhelming users
3. **Speed Over Style**: Prioritize fast loading, instant feedback, minimal animations
4. **Consistent Data Patterns**: Uniform treatment of contacts, deals, activities across all views

---

## Typography System

**Font Stack**: Inter (primary), System UI fallback
- **Headings**: 
  - Page titles: text-2xl font-semibold (24px)
  - Section headers: text-lg font-semibold (18px)
  - Card titles: text-base font-medium (16px)
- **Body Text**: text-sm (14px) for all data tables, forms, and content
- **Metadata/Labels**: text-xs font-medium uppercase tracking-wide (12px) for field labels and status badges
- **Numbers/Metrics**: text-3xl font-bold for dashboard KPIs, tabular-nums for data consistency

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, and 8** for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card spacing: p-6
- Form field gaps: space-y-4

**Grid Structure**:
- Dashboard: 3-4 column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4) for KPI cards
- Main content area: max-w-7xl with sidebar navigation (w-64 fixed left sidebar)
- Data tables: Full-width within content area with horizontal scroll for overflow
- Forms: Single column max-w-2xl for focused data entry

---

## Component Library

### Navigation
- **Fixed Left Sidebar**: 64px collapsed icons, 256px expanded with labels
  - Dashboard, Contacts, Deals, Pipeline, Activities, Calculator sections
  - User profile and settings at bottom
  - Active state: Subtle background highlight, no border
- **Top Bar**: Breadcrumb navigation, global search, notification bell, user avatar

### Dashboard Components
- **KPI Cards**: Grid layout showing total contacts, active deals, pipeline value, activities this week
  - Large metric number (text-3xl font-bold)
  - Label below (text-sm text-muted)
  - Trend indicator (small arrow + percentage)
- **Quick Action Buttons**: Prominent "Add Contact", "Add Deal", "Import Leads" buttons
- **Recent Activity Feed**: Chronological list with timestamps, user avatars, activity type icons
- **Pipeline Overview**: Horizontal stage cards showing deal counts and total value per stage

### Data Tables
- **Contacts/Deals List**: Sortable columns (name, company, value, stage, last contact)
  - Row height: py-3 for comfortable scanning
  - Alternating row backgrounds for readability
  - Row hover: Subtle background change
  - Checkbox column for bulk actions
  - Action menu (3-dot) on right
- **Pagination**: Bottom-aligned with "Showing X-Y of Z" text and page controls

### Forms & Inputs
- **Input Fields**: h-10 with border, rounded corners, focus:ring state
  - Labels above inputs (text-sm font-medium mb-2)
  - Helper text below in muted text-xs
- **Select Dropdowns**: Match input height, custom styling with chevron icon
- **Potential Value Calculator**: 
  - 4-input grid (rooms, nights/week, weeks, price/night)
  - Real-time calculation display as large emphasized number
  - "Add to Deal" button to save calculation
- **File Upload**: Drag-and-drop zone with dashed border
  - "Upload CSV" and "Paste Data" tabs for lead import

### Cards & Containers
- **Contact/Deal Cards**: Rounded borders, p-6 padding
  - Header with name/title and status badge
  - Key info in 2-column grid (email, phone, value, stage)
  - Activity timeline below
  - Quick action buttons at bottom
- **Pipeline Stages**: Vertical columns in horizontal scroll container
  - Stage header with count and total value
  - Deal cards stacked within (simplified view with drag handles)

### Modals & Overlays
- **Quick Add Forms**: Centered modal (max-w-lg) with minimal required fields
  - "Add Contact" → Name, Email, Phone, Company
  - "Add Deal" → Contact select, Value, Stage
- **Detail Panels**: Right-side slide-out panel (w-1/3) for viewing full contact/deal details

### Status & Feedback
- **Status Badges**: Rounded pills with text-xs font-medium
  - Deal stages: New, Qualified, Proposal, Negotiation, Closed
  - Activity types: Call, Email, Meeting, Note
- **Toast Notifications**: Top-right corner for success/error messages
- **Loading States**: Skeleton screens matching component structure (not spinners)

---

## Icons
**Icon Library**: Heroicons (outline style via CDN)
- Navigation icons: 20px
- Action buttons: 16px
- Status indicators: 14px
- Consistent weight and style throughout

---

## Accessibility
- All form inputs include visible labels and proper ARIA attributes
- Keyboard navigation for all interactive elements (Tab order follows visual hierarchy)
- Focus indicators visible on all focusable elements (ring-2 offset-2)
- Color is never the only indicator of status (combine with icons/text)
- Data tables include proper table markup with headers

---

## Layout Patterns

**Dashboard Layout**: 
- Left sidebar (w-64) + Main content area (flex-1)
- Grid of 4 KPI cards at top
- 2-column layout below: Recent Activity (2/3 width) + Quick Actions sidebar (1/3 width)

**List Views** (Contacts, Deals):
- Search bar and filters at top (sticky)
- Action toolbar (bulk actions, add new, import)
- Data table with pagination

**Detail Views**:
- Header with name/title and primary actions
- Tabs for different sections (Overview, Activities, Notes, Files)
- 2-column layout: Main info left (2/3), metadata sidebar right (1/3)

---

## Special Features

**Potential Value Calculator**:
- Prominent placement in sidebar or as dashboard widget
- Simple grid of 4 number inputs with clear labels
- Live calculation display (updates on any input change)
- "Save to Deal" button links calculation to existing or new deal

**Lead Import Interface**:
- Tab switcher: "Upload File" vs "Paste Data"
- File upload: Drag-drop zone with file type indicators (.csv, .xlsx)
- Paste mode: Large textarea with "Auto-detect columns" checkbox
- Preview table showing first 5 rows before import
- Column mapping interface if headers don't match

---

## Animation Strategy
**Minimal, Purposeful Motion**:
- Page transitions: None (instant navigation for speed)
- Modal entry/exit: Fast fade + slight scale (150ms)
- Dropdown menus: Instant appearance (no animation)
- Data updates: Subtle highlight flash on changed values (300ms)
- No decorative animations or scroll effects