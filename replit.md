# Business Management System

## Overview

This is a full-stack business management system built with React, Express, and PostgreSQL. The application features role-based authentication with two user roles (MANAGER and ENGINEER), a clean modern UI using shadcn/ui components, and a scalable architecture designed for business operations management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **API Design**: RESTful endpoints with proper error handling
- **Development**: TSX for TypeScript execution

### Authentication System
- **Strategy**: Simple token-based authentication (mock JWT tokens)
- **User Management**: Username-based login with automatic user creation
- **Role System**: Two-tier role system (ENGINEER/MANAGER)
- **Authorization**: Route-level access control based on user roles

## Key Components

### Database Schema
- **Users Table**: Stores user information with roles and timestamps
- **Schema Validation**: Zod schemas for type-safe data validation
- **Migrations**: Drizzle Kit for database schema management

### Frontend Components
- **Authentication**: LoginModal for user authentication
- **Layout**: Header with navigation and user profile
- **Admin Panel**: Role management interface for administrators
- **Page Components**: Dashboard, Menu1-4 pages with role-based access
- **UI Components**: Complete shadcn/ui component library

### Backend Services
- **Storage Layer**: DatabaseStorage class for data persistence
- **Route Handlers**: Express routes for authentication and user management
- **Database Connection**: Neon serverless connection with connection pooling

## Data Flow

1. **User Authentication**: Users log in with username, system creates account if needed
2. **Token Management**: Client stores authentication token in localStorage
3. **API Requests**: All requests include authorization headers when authenticated
4. **Role Verification**: Server validates user roles for protected endpoints
5. **State Synchronization**: TanStack Query manages client-server state synchronization

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **wouter**: Lightweight React router
- **react-hook-form**: Form state management with validation

### Development Tools
- **vite**: Modern build tool with HMR
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reload**: Full-stack hot module replacement
- **Database**: Neon serverless PostgreSQL instance

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code for Node.js
- **Deployment Target**: Replit autoscale deployment
- **Port Configuration**: Server runs on port 5000, exposed as port 80

### Environment Configuration
- **Database**: Requires DATABASE_URL environment variable
- **Node Modules**: nodejs-20, web, and postgresql-16 Replit modules
- **Build Process**: npm run build creates production-ready assets

## Changelog

Changelog:
- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.