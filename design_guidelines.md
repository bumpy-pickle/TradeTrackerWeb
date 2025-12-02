# Shift Trades Tracker - Design Guidelines

## Design Approach

**Selected System**: Fluent Design System (Microsoft)  
**Rationale**: Replicating a Power BI dashboard requires alignment with Microsoft's design language. Fluent Design provides the data-dense, professional aesthetic needed for business intelligence tools while maintaining clarity and usability.

**Key Design Principles**:
- Data hierarchy over decoration
- Scannable information architecture
- Professional, trustworthy interface
- Efficiency-focused interactions

---

## Typography

**Font Stack**: Segoe UI (primary), system-ui fallback via Google Fonts CDN alternative (Inter or Roboto)

**Hierarchy**:
- Page Title: 2xl, semibold (Shift Trades Tracker)
- Section Headers: lg, semibold (Worked Hours, Trade List, Summary)
- Data Labels: sm, medium (column headers, filter labels)
- Data Values: base, regular (table cells, chart labels)
- Metrics/Numbers: lg-xl, semibold (large summary numbers)

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-4 to p-6
- Section margins: mb-6 to mb-8
- Card spacing: gap-6
- Element spacing: space-y-4

**Grid Structure**:
- Main container: max-w-7xl with responsive padding (px-4 md:px-6 lg:px-8)
- Dashboard layout: Two-column grid on desktop (grid-cols-1 lg:grid-cols-3)
  - Left column: span-2 (charts and primary data)
  - Right column: span-1 (filters and summary)
- All sections use natural height based on content

---

## Component Library

### Header Section
- Application title (left-aligned)
- Upload Excel button (right-aligned)
- Clean horizontal layout with border-bottom separator

### Filter Panel (Top Right)
- Label: "Name Filter"
- Dropdown select with search capability
- Full-width within its container
- Clear visual hierarchy with label above input

### Chart Card - Worked Hours
- Card container with subtle border and shadow
- Title: "Worked Hours" (section header style)
- Bar chart visualization showing comparative data
- Legend below chart (horizontal layout)
- Axis labels and gridlines for clarity
- Chart library: Chart.js via CDN

### Data Table - Trade List
- Card container matching chart style
- Column headers: Person 1, Date, Hours, Person 2
- Sortable columns (interactive headers)
- Row hover states
- Alternating row treatment for scannability
- Compact row height (py-2)

### Summary Table
- Compact card layout
- Columns: Name, You Worked, They Worked, Total
- Right-aligned numeric values
- Visual indicators (small triangles/arrows) for totals
- Bold treatment for total values

### File Upload Component
- Drag-and-drop zone with bordered area
- "Click to upload" state
- Accepted format indicator (.xlsx)
- File name display after upload
- Upload icon from Heroicons (document-arrow-up)

---

## Navigation & Icons

**Icon Library**: Heroicons via CDN (outline style for UI, solid for emphasis)

**Essential Icons**:
- Upload: document-arrow-up
- Filter: funnel
- Sort: chevron-up/down
- Success indicator: check-circle
- Data indicator: triangle (for summary table)

---

## Component Interactions

**Tables**:
- Sortable headers with sort direction indicators
- Row hover with subtle background change
- No animations on sort

**Filters**:
- Dropdown with immediate filter application
- Clear/reset option visible when filter active

**Charts**:
- Tooltips on hover (Chart.js default)
- Static, no animated transitions
- Clear data labels

**File Upload**:
- Drag-over state with border emphasis
- Success state showing filename
- Error state for invalid files

---

## Layout Composition

**Desktop Layout** (lg breakpoint):
```
[Header: Title | Upload Button]
[Filter Panel (right) | Chart - Worked Hours (left, 2/3 width)]
[Trade List Table (left, 2/3) | Summary Table (right, 1/3)]
```

**Mobile/Tablet** (stacked):
```
[Header]
[Upload Button]
[Filter Panel]
[Chart - Worked Hours]
[Trade List Table]
[Summary Table]
```

**Vertical Rhythm**: Consistent mb-6 between major sections, mb-4 within cards

---

## Data Presentation

**Number Formatting**:
- Hours: Display with one decimal (e.g., "8.5")
- Dates: Short format (MM/DD/YYYY)
- Names: Title case, truncate with ellipsis if needed

**Empty States**:
- Upload prompt when no data loaded
- "No results" message when filter yields nothing
- Center-aligned with descriptive text

---

## Accessibility

- High contrast text ratios for all data
- Form labels properly associated
- Keyboard navigation for all interactive elements
- Focus states on all inputs and buttons
- ARIA labels for chart elements