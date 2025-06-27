# Virtual Friend Voice Testing Application

## Overview

This is a full-stack React application built for testing voice synthesis with different virtual friends using ElevenLabs text-to-speech API. The application allows users to create and manage virtual friends with detailed personality profiles and test how different voice settings affect speech generation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query for server state and local React state for UI
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful endpoints for CRUD operations on friends
- **Development**: Hot module replacement with Vite integration

### Project Structure
```
├── client/           # Frontend React application
├── server/           # Backend Express server
├── shared/           # Shared TypeScript types and schemas
├── migrations/       # Database migration files
└── attached_assets/  # Additional documentation
```

## Key Components

### Data Models
- **Users**: Authentication system with username/password
- **Friends**: Virtual friend profiles with comprehensive attributes including:
  - Personal details (name, age, gender, race, religion)
  - Voice characteristics (voice ID, stability, similarity settings)
  - Personality traits (cheerful, romantic, unhinged, sarcastic, wise)
  - Political alignment (-100 to +100 scale)
  - Timestamps for creation and updates
- **Voice Moods**: Sentiment analysis data for voice recommendations

### Voice Integration
- **ElevenLabs API**: Text-to-speech generation with customizable voice parameters
- **Enhanced Voice Selection**: Rich interface with voice descriptions, metadata, and sample audio
- **Voice Metadata System**: Comprehensive voice profiles including accent, age, gender, and use cases
- **Sample Voice Testing**: Preview any voice with sample text before selection
- **Personality Mapping**: 12 personality types with specific voice stability and similarity settings
- **Sentiment Analysis**: Real-time text mood analysis with voice setting recommendations
- **Voice Mood Matcher**: Suggests optimal voice parameters based on text sentiment and personality
- **Audio Playback**: Browser Audio API for real-time voice testing
- **Batch Testing**: Ability to test all friends' voices simultaneously
- **Conversation Templates**: Pre-built scenarios for testing different conversation contexts

### Voice Conversation System
- **Web Speech API Integration**: Browser-based speech-to-text for hands-free input
- **Autonomous Conversation Engine**: Virtual friends chat naturally among themselves without user input
- **Happy Moderator Host**: AI host keeps conversations flowing with encouraging comments
- **Personality-Based Dialogue**: Each friend speaks authentically based on their personality traits
- **Dynamic Topic Generation**: Rich conversation content tailored to each personality type
- **Auto Voice Generation**: Automatic text-to-speech for all conversation participants
- **Message Threading**: Chronological conversation history with speaker identification
- **Audio Message Playback**: Click-to-replay functionality for all spoken messages
- **Conversation Timing**: Smart delays between speakers for natural conversation flow

### Data Persistence
- **PostgreSQL Database**: Primary storage for friend configurations and voice mood data
- **Local Storage**: Backup system for friend configurations and app settings
- **Import/Export**: JSON backup and restore functionality for data portability

### User Interface
- **Friend Management**: Create, edit, and delete virtual friends
- **Voice Testing**: Text input with real-time voice generation
- **Global Controls**: Master volume and playback speed controls
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Data Flow

1. **Friend Management**: Users create/edit friends through modal forms with validation
2. **Voice Generation**: Text input triggers API calls to ElevenLabs with friend-specific parameters
3. **Audio Processing**: Generated audio is played through browser with configurable speed/volume
4. **State Synchronization**: React Query manages server state with automatic cache invalidation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI component primitives
- **zod**: Runtime type validation and schema definition

### Development Tools
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast JavaScript bundling for production
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development tools

### Voice Processing
- **ElevenLabs API**: External text-to-speech service
- **Browser Audio API**: Native audio playback capabilities

## Deployment Strategy

### Development Environment
- **Local Development**: `npm run dev` starts both client and server with HMR
- **Database Management**: `npm run db:push` for schema migrations
- **Port Configuration**: Server runs on port 5000 with Vite proxy

### Production Deployment
- **Build Process**: Vite bundles client, esbuild bundles server
- **Static Assets**: Client built to `dist/public`, served by Express
- **Environment Variables**: DATABASE_URL required for PostgreSQL connection
- **Replit Integration**: Configured for autoscale deployment with PostgreSQL module

### Storage Implementation
- **Database**: PostgreSQL with Drizzle ORM for production
- **Fallback**: In-memory storage implementation for development/testing
- **Migration Strategy**: Schema-first approach with type generation

## Changelog
- June 20, 2025: Initial setup and complete implementation
- June 20, 2025: Successfully integrated ElevenLabs API with working voice generation
- June 20, 2025: Completed full testing with 4 virtual friends and voice synthesis
- June 20, 2025: Added PostgreSQL database for data persistence
- June 20, 2025: Implemented sentiment analysis with voice mood matching
- June 20, 2025: Added local storage backup system with import/export functionality
- June 20, 2025: Enhanced voice selection with detailed metadata and working sample playback
- June 20, 2025: Reorganized UI layout with Virtual Friends section positioned after Voice Text Input
- June 20, 2025: Expanded personality types to 12 options with comprehensive descriptions
- June 21, 2025: Integrated Web Speech API for hands-free voice input and conversation system
- June 21, 2025: Added live conversation manager with personality-based response generation
- June 21, 2025: Implemented voice conversation display with real-time audio playback
- June 21, 2025: Created autonomous conversation engine where friends chat naturally without user input
- June 21, 2025: Added happy moderator host system with smart conversation timing and flow control
- June 21, 2025: Restructured app into two sections: Virtual Friends Manager and Voice Test Lab
- June 21, 2025: Added navigation between friend management and voice testing features
- June 21, 2025: Improved contextual conversation responses based on previous messages
- June 21, 2025: Made voice input automatically start autonomous conversations
- June 21, 2025: Enhanced conversation variety with content tracking to prevent repetition
- June 23, 2025: Fixed voice overlap timing with 5-second delays between speakers to prevent audio conflicts
- June 23, 2025: Connected conversation templates to automatically start themed autonomous chats
- June 23, 2025: Added template-specific host messages and enhanced AI prompts for better theme adherence
- June 23, 2025: Updated conversation templates interface to auto-start conversations when templates are selected
- June 23, 2025: Created new "Voice Only" tab with streamlined voice-first interface for virtual friend conversations
- June 23, 2025: Added dedicated voice-only page with primary voice input and alternative text input options
- June 23, 2025: Implemented comprehensive custom voice cloning system with audio recording, file upload, progress tracking, and voice clone management
- June 23, 2025: Added tabbed interface to Friends Manager separating virtual friend management from voice cloning features
- June 23, 2025: Created backend API endpoint for voice clone processing with proper error handling and validation
- June 23, 2025: Added historical conversation context system for personalized AI responses based on previous messages, emails, and social posts
- June 23, 2025: Integrated conversation context manager into Voice Manager with tabbed interface for context management
- June 23, 2025: Enhanced OpenAI conversation generation to reference historical interactions for continuity and personalization
- June 23, 2025: Implemented talking video generator that converts user selfies into speaking avatars using AI voice synthesis
- June 23, 2025: Added camera capture functionality for selfie-to-video conversion with real-time photo capture
- June 23, 2025: Created backend API endpoint for talking video generation with voice audio integration
- June 23, 2025: Created full-screen Voice Only Mode with continuous listening and hands-free conversation interruption
- June 23, 2025: Added mobile-optimized interface with clean design for distraction-free voice interactions
- June 23, 2025: Implemented real-time speech recognition with automatic conversation restart and audio interruption support
- June 26, 2025: Fixed photo capture functionality in Talking Videos with enhanced error handling and video initialization
- June 26, 2025: Improved voice cloning error handling with detailed feedback and API response validation
- June 26, 2025: Enhanced Voice Only Mode with proper user interruption, priority speaking, and conversation topic changes
- June 26, 2025: Fixed camera access issues in Talking Videos with improved getUserMedia error handling and video stream initialization
- June 26, 2025: Enhanced voice cloning audio preview with multiple format support and detailed error feedback
- June 26, 2025: Improved talking video generation API validation and error messaging for better user guidance
- June 26, 2025: Fixed voice cloning by switching to JSON API format and improved audio preview with proper src attribute
- June 26, 2025: Enhanced camera initialization with autoplay, playsInline, and fallback handling for reliable video capture
- June 26, 2025: Fixed Voice Only mode user input processing to properly interrupt conversations and update AI context
- June 26, 2025: Fixed camera capture by setting isCapturingPhoto state before stream request to ensure video element is rendered
- June 26, 2025: Added real voice generation to voice cloning with ElevenLabs API and Test Voice buttons for audio playback
- June 26, 2025: Enhanced talking video generation with proper audioUrl handling and Test Voice functionality
- June 26, 2025: Fixed maximum update depth error in voice-lab by removing conflicting dependencies from useEffect
- June 26, 2025: Fixed talking video runtime error by properly handling mock video data and displaying informative placeholder  
- June 26, 2025: Improved voice recording audio preview by switching to webm format with multiple source fallbacks
- June 27, 2025: Implemented real audio data transmission for voice cloning with base64 encoding
- June 27, 2025: Enhanced voice cloning to use natural-sounding voices instead of default computer voice
- June 27, 2025: Fixed voice cloning API to properly process recorded audio data and generate authentic voice samples

## User Preferences

Preferred communication style: Simple, everyday language.