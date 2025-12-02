# Shift Trades Tracker

## Overview

Shift Trades Tracker is a web application for visualizing and managing employee shift trade data. Users upload Excel files containing shift trade records, which are then processed and displayed through interactive charts, tables, and summary statistics. The application follows Microsoft's Fluent Design System to replicate a Power BI dashboard aesthetic, emphasizing data density and professional presentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: shadcn/ui components built on top of Radix UI primitives, providing a comprehensive set of accessible, customizable components following the Fluent Design System

**Styling**: Tailwind CSS with custom design tokens aligned to Microsoft's Fluent Design language, including specific typography (Segoe UI/Inter), color schemes, and spacing primitives

**State Management**: Client-side state using React hooks (useState, useMemo) combined with TanStack Query for server state management. Trade data is ephemeral - stored only in component state after each Excel upload

**Routing**: Wouter for lightweight client-side routing with a simple dashboard and 404 page structure

**Data Visualization**: Recharts library for rendering interactive bar charts and composed charts showing worked hours, trade balances, and person-wise summaries

**Key Design Decisions**:
- Single-page dashboard application with no persistent user sessions
- All data processing happens client-side after upload
- Responsive grid layout (1 column mobile, 3 column desktop) following design guidelines
- Real-time data filtering and sorting without backend calls

### Backend Architecture

**Framework**: Express.js server with TypeScript

**File Processing**: Multer middleware for handling Excel file uploads (10MB limit, .xlsx/.xls files only)

**Excel Parsing**: SheetJS (xlsx) library to read and parse uploaded Excel workbooks into trade records

**API Design**: 
- Single POST endpoint `/api/upload` that accepts Excel files and returns parsed trade data as JSON
- Stateless processing - no data persistence between requests
- In-memory parsing with buffer-based file handling

**Development Setup**: 
- Vite dev server with HMR for frontend development
- Express middleware mode integration for seamless full-stack development
- Custom build script using esbuild for production server bundling

**Key Design Decisions**:
- No authentication/authorization required - public upload functionality
- Ephemeral data model - trades exist only in the upload response
- Minimal storage layer (MemStorage placeholder) as persistence is not needed
- Request logging with timing for performance monitoring

### Data Storage Solutions

**Database**: Drizzle ORM configured with PostgreSQL dialect (via Neon serverless driver)

**Schema**: Defined in `shared/schema.ts` using Zod for runtime validation
- Trade records with person1, person2, date, and hours fields
- Computed summary data for person-wise balances (youWorked, theyWorked, total)
- Chart data structures for visualization

**Current Implementation**: No active database usage - data flows from Excel upload through in-memory processing to client display. Database infrastructure is provisioned but not utilized in current workflow.

**Design Rationale**: Trade data is transient by nature (uploaded per session), eliminating the need for persistent storage. The database setup suggests potential future features like saving trade history or user accounts.

### External Dependencies

**UI & Visualization**:
- @radix-ui/* - Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- recharts - Chart rendering library
- tailwindcss - Utility-first CSS framework
- lucide-react - Icon library

**Data Handling**:
- xlsx - Excel file parsing
- zod - Runtime schema validation
- date-fns - Date manipulation utilities

**Backend Services**:
- @neondatabase/serverless - PostgreSQL database driver
- drizzle-orm - Type-safe ORM
- multer - Multipart form data handling

**Development Tools**:
- vite - Frontend build tool and dev server
- tsx - TypeScript execution for development
- esbuild - Production server bundling

**Design Considerations**:
- Comprehensive UI component library enables rapid feature development while maintaining consistency
- Excel parsing dependency allows users to leverage familiar tools for data entry
- Database infrastructure ready for future persistence features without architectural changes
- Modern build tooling optimized for both development experience and production performance