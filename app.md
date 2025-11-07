# Atlas - CI/CD Deployment Platform

## Overview

Atlas is a DevOps deployment dashboard designed for managing AWS Elastic Beanstalk blue/green deployments. The platform provides real-time monitoring, automated health checks, instant rollback capabilities, and zero-downtime promotion between environments. It enables teams to visualize deployment status, track metrics, manage traffic distribution, and monitor application health across multiple environments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **UI Framework:** Shadcn/ui with Radix UI primitives
- **Styling:** Tailwind CSS with custom design system

**Design System:**
The application follows a system-based approach inspired by modern DevOps platforms (Vercel, Linear, Railway), emphasizing data clarity and operational efficiency. Uses the Inter font family and implements a comprehensive component library with status indicators, metric cards, timelines, and health check panels.

**Component Architecture:**
- Modular component structure with examples provided for each major component
- Dashboard-style layout with sidebar navigation and main content area
- Real-time data visualization components for deployments, health checks, and logs
- Responsive design with mobile considerations

**Client-Side Structure:**
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)
- Components organized by feature (deployment cards, timelines, health panels, metrics)
- Centralized query client configuration for API communication
- Toast notifications for user feedback

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL via Neon serverless
- **ORM:** Drizzle ORM with Zod validation
- **Build Tool:** Vite for development, esbuild for production

**API Design:**
RESTful endpoints following resource-based patterns:
- `/api/deployments` - Deployment CRUD operations
- `/api/deployments/environment/:env` - Environment-specific queries
- `/api/deployments/current` - Current deployment status across environments
- Health check endpoints for monitoring deployment health
- Traffic management endpoints for blue/green traffic splitting

**Data Storage Strategy:**
Dual-mode storage implementation:
- In-memory storage (MemStorage) for development and testing with sample data
- PostgreSQL database for production via Drizzle ORM
- Storage interface (IStorage) allows easy switching between implementations

**Database Schema:**
- `users` table - Authentication and user management
- `deployments` table - Deployment records with version, environment, status, and metrics
- `health_checks` table - Health check results linked to deployments

**Session Management:**
Uses connect-pg-simple for PostgreSQL-backed session storage, ensuring session persistence across server restarts.

### Development & Build System

**Development Mode:**
- Vite dev server with HMR (Hot Module Replacement)
- Express middleware integration for API routes
- TypeScript compilation with strict mode enabled
- Custom error overlay for runtime errors

**Production Build:**
- Vite builds optimized client bundle to `dist/public`
- esbuild bundles server code to `dist/index.js`
- Static file serving for production deployment
- Environment-based configuration

**Development Tools:**
- Replit-specific plugins for enhanced development experience (cartographer, dev banner)
- Runtime error modal for better debugging
- TypeScript incremental compilation for faster builds

### External Dependencies

**Third-Party UI Libraries:**
- Radix UI - Comprehensive set of accessible React primitives (dialogs, dropdowns, tooltips, etc.)
- Lucide React - Icon library for consistent iconography
- class-variance-authority - Type-safe variant API for component styling
- cmdk - Command palette component
- embla-carousel-react - Carousel functionality

**Database & ORM:**
- @neondatabase/serverless - Serverless PostgreSQL driver
- Drizzle ORM - Type-safe ORM with schema management
- drizzle-zod - Zod schema generation from Drizzle tables

**Form & Validation:**
- react-hook-form - Form state management
- @hookform/resolvers - Validation resolver integration
- Zod - Schema validation library

**Date Handling:**
- date-fns - Modern date utility library

**Development:**
- Google Fonts CDN - Inter font family
- PostCSS with Tailwind CSS - Styling compilation
- TypeScript - Type safety across the stack

**Configuration:**
- Environment variables required: `DATABASE_URL` for PostgreSQL connection
- Drizzle Kit for database migrations and schema management
- Tailwind configuration with custom color system and design tokens