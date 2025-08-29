# Overview

This is a MCP (Model Context Protocol) Client application built with React, Express, and TypeScript. The application provides a web-based interface for connecting to remote MCP servers and executing tools either manually or via an integrated AI-powered chat agent. It features a conversational chat interface powered by various LLM providers (including local Ollama models) and supports integration with services like GitHub, Jira, Confluence, Slack, and databases through the Model Context Protocol.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: React Query (TanStack Query) for server state management, local React state for UI state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS custom properties for theming, supporting both dark and light modes

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON responses
- **Development**: Hot module replacement via Vite in development mode
- **Request Logging**: Custom middleware for API request logging with response capture
- **Error Handling**: Centralized error handling middleware

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Development Storage**: In-memory storage implementation for development/testing
- **Database Provider**: Neon Database serverless PostgreSQL

## Authentication and Authorization
- **Permission System**: Multi-level tool execution permissions with risk categorization (low, medium, high)
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **User Management**: Basic user authentication with username/password

## External Service Integrations
- **MCP Protocol**: Stateless connections to remote MCP servers for tool discovery and execution
- **LLM Providers**: Support for multiple AI providers including Ollama (local), OpenAI, and Anthropic
- **Service Integrations**: GitHub, Jira, Confluence, Slack, and database connections through MCP

## Key Design Patterns
- **Component Architecture**: Modular React components with clear separation of concerns
- **Custom Hooks**: Reusable logic abstraction (useMCPClient, useToast, useMobile)
- **Type Safety**: Comprehensive TypeScript usage with Zod schemas for runtime validation
- **Responsive Design**: Mobile-first approach with resizable panels and adaptive layouts
- **Real-time Updates**: Optimistic updates and instant UI synchronization

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Query for state management
- **Build Tools**: Vite for development and building, TypeScript compiler
- **Backend**: Express.js with TypeScript execution via tsx

## Database and ORM
- **Database**: PostgreSQL via Neon Database serverless (@neondatabase/serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations and schema management
- **Validation**: Zod for schema validation and Drizzle-Zod integration

## UI and Styling
- **UI Components**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: Lucide React for consistent iconography
- **Utilities**: clsx and tailwind-merge for conditional styling

## Development Tools
- **Replit Integration**: Replit-specific plugins for development environment
- **Form Handling**: React Hook Form with Hookform Resolvers
- **Date Utilities**: date-fns for date manipulation
- **Carousel**: Embla Carousel for interactive components

## Session and State Management
- **Sessions**: connect-pg-simple for PostgreSQL-backed sessions
- **Client State**: TanStack React Query for server state caching and synchronization
- **Validation**: Comprehensive Zod schemas for type-safe data validation