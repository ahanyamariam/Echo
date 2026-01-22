# Echo - Real-Time Chat Application

A production-style MVP real-time 1-to-1 direct messaging chat application built with React, Go, and PostgreSQL.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Installation](#installation)
8. [Environment Variables](#environment-variables)
9. [Database Setup](#database-setup)
10. [Running the Application](#running-the-application)
11. [API Documentation](#api-documentation)
12. [WebSocket Events](#websocket-events)
13. [Database Schema](#database-schema)
14. [Development Phases](#development-phases)
15. [Testing](#testing)
16. [Troubleshooting](#troubleshooting)
17. [Future Enhancements](#future-enhancements)
18. [License](#license)

---

## Overview

Echo is a full-stack real-time chat application that enables users to have private one-on-one conversations. The application features instant message delivery through WebSocket connections, secure JWT-based authentication, message persistence, read receipts, and image sharing capabilities.

### Project Goals

- Build a production-ready MVP in approximately 1 month
- Implement real-time messaging using WebSocket
- Create a clean, responsive user interface
- Follow best practices for code organization and security
- Design for scalability and future enhancements

### What Echo Does

- Allows users to create accounts and authenticate securely
- Enables users to search for other users by username
- Supports creating direct message conversations
- Delivers messages in real-time using WebSocket
- Persists all messages in PostgreSQL database
- Shows message delivery and read status
- Allows sharing images in conversations
- Provides message history with pagination

### What Echo Does NOT Do (Explicit Non-Goals)

- Group chat functionality
- Voice or video calls
- End-to-end encryption
- Push notifications
- Message editing or deletion
- User blocking
- Typing indicators
- User online/offline status

---

## Features

### Authentication
| Feature | Description |
|---------|-------------|
| User Registration | Create account with username, email, and password |
| User Login | Authenticate with email and password |
| JWT Tokens | Secure token-based session management |
| Password Hashing | Bcrypt encryption for password storage |
| Protected Routes | Middleware-based route protection |
| Persistent Sessions | Token storage in localStorage |

### User Management
| Feature | Description |
|---------|-------------|
| User Profile | View current user information |
| User Search | Search users by username |
| Exclude Self | Search results exclude current user |

### Conversations
| Feature | Description |
|---------|-------------|
| Create DM | Start a direct message with any user |
| Idempotent Creation | Returns existing conversation if already exists |
| Conversation List | View all conversations with previews |
| Last Message Preview | See the most recent message in each conversation |
| Unread Count | Badge showing number of unread messages |
| Sorted by Activity | Most recent conversations appear first |

### Messaging
| Feature | Description |
|---------|-------------|
| Real-Time Delivery | Instant message delivery via WebSocket |
| Text Messages | Send and receive text content |
| Image Messages | Share images in conversations |
| Message History | Load previous messages with pagination |
| Chronological Order | Messages displayed in time order |
| Message Persistence | All messages stored in database |

### Read Receipts
| Feature | Description |
|---------|-------------|
| Delivered Status | Indicates message reached the server |
| Seen Status | Indicates recipient has read the message |
| Real-Time Updates | Read status updates instantly |
| Per-Conversation Tracking | Track read position for each conversation |

### Image Sharing
| Feature | Description |
|---------|-------------|
| Image Upload | Upload images via REST API |
| Supported Formats | JPG, PNG, WebP |
| Size Limit | Maximum 5MB per file |
| Image Preview | View images directly in chat |
| Local Storage | Files stored on server disk |

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Go | 1.21+ | Primary programming language |
| Chi | 5.x | HTTP router and middleware |
| gorilla/websocket | 1.5.x | WebSocket implementation |
| pgx | 5.x | PostgreSQL driver and connection pool |
| golang-jwt/jwt | 5.x | JWT token creation and validation |
| bcrypt | - | Password hashing |
| godotenv | 1.5.x | Environment variable loading |
| google/uuid | 1.5.x | UUID generation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.x | UI component library |
| TypeScript | 5.x | Type-safe JavaScript |
| Vite | 5.x | Build tool and development server |
| Tailwind CSS | 3.4.x | Utility-first CSS framework |
| Zustand | 4.4.x | Lightweight state management |
| React Router | 6.x | Client-side routing |

### Database

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15+ | Primary relational database |

### Development Tools

| Technology | Purpose |
|------------|---------|
| Docker | Container runtime |
| Docker Compose | Multi-container orchestration |
| npm | Package manager for frontend |
| Go Modules | Dependency management for backend |

---

## Architecture

### High-Level Architecture
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLIENT │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ React Application │ │
│ │ │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────┐ │ │
│ │ │ Login │ │ Signup │ │ Chat │ │ Components │ │ │
│ │ │ Page │ │ Page │ │ Page │ │ │ │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └───────────────┘ │ │
│ │ │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Zustand State Management │ │ │
│ │ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │ │ │
│ │ │ │ authStore │ │ chatStore │ │ wsStore │ │ │ │
│ │ │ └──────────────┘ └──────────────┘ └──────────────────────┘ │ │ │
│ │ └──────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐ │ │
│ │ │ API Layer │ │ │
│ │ │ ┌────────┐ ┌────────┐ ┌────────────────┐ ┌────────────────┐ │ │ │
│ │ │ │ Auth │ │ Users │ │ Conversations │ │ Messages │ │ │ │
│ │ │ └────────┘ └────────┘ └────────────────┘ └────────────────┘ │ │ │
│ │ └──────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐ │ │
│ │ │ WebSocket Client │ │ │
│ │ └──────────────────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────────────────┘
│
HTTP REST │ WebSocket (WS)
│
┌───────────────────────────────────▼─────────────────────────────────────────┐
│ SERVER │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ Go Backend │ │
│ │ │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Chi Router │ │ │
│ │ │ Middleware: CORS, Logger, Auth, Recovery │ │ │
│ │ └──────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ ┌─────────┐ ┌─────────┐ ┌───────────────┐ ┌─────────┐ ┌─────────┐ │ │
│ │ │ Auth │ │ Users │ │ Conversations │ │Messages │ │ Reads │ │ │
│ │ │ Module │ │ Module │ │ Module │ │ Module │ │ Module │ │ │
│ │ │ │ │ │ │ │ │ │ │ │ │ │
│ │ │-Handler │ │-Handler │ │ -Handler │ │-Handler │ │-Handler │ │ │
│ │ │-Service │ │-Service │ │ -Service │ │-Service │ │-Service │ │ │
│ │ │-Repo │ │-Repo │ │ -Repo │ │-Repo │ │-Repo │ │ │
│ │ └─────────┘ └─────────┘ └───────────────┘ └─────────┘ └─────────┘ │ │
│ │ │ │
│ │ ┌──────────────┐ ┌──────────────────────────────────────────────┐ │ │
│ │ │ Uploads │ │ WebSocket Hub │ │ │
│ │ │ Module │ │ │ │ │
│ │ │ │ │ ┌────────────────────────────────────────┐ │ │ │
│ │ │ -Handler │ │ │ Connection Manager │ │ │ │
│ │ │ -Service │ │ │ Map: UserID -> WebSocket Conn │ │ │ │
│ │ │ -Repo │ │ └────────────────────────────────────────┘ │ │ │
│ │ └──────────────┘ └──────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────────────────┘
│
│ SQL Queries
│
┌───────────────────────────────────▼─────────────────────────────────────────┐
│ DATABASE │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ PostgreSQL 15 │ │
│ │ │ │
│ │ ┌───────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Tables │ │ │
│ │ │ │ │ │
│ │ │ ┌─────────┐ ┌───────────────┐ ┌────────────────────────────┐ │ │ │
│ │ │ │ users │ │ conversations │ │ conversation_members │ │ │ │
│ │ │ └─────────┘ └───────────────┘ └────────────────────────────┘ │ │ │
│ │ │ │ │ │
│ │ │ ┌──────────┐ ┌────────────────────┐ ┌──────────────────────┐ │ │ │
│ │ │ │ messages │ │ conversation_reads │ │ uploads │ │ │ │
│ │ │ └──────────┘ └────────────────────┘ └──────────────────────┘ │ │ │
│ │ └───────────────────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘


### Module Architecture

Each backend module follows a three-layer architecture:
┌─────────────────────────────────────────────────────────────┐
│ Handler │
│ - HTTP request/response handling │
│ - Input validation │
│ - Response formatting │
└─────────────────────────────┬───────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Service │
│ - Business logic │
│ - Data transformation │
│ - Cross-module coordination │
└─────────────────────────────┬───────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Repository │
│ - Database operations │
│ - SQL queries │
│ - Data access layer │
└─────────────────────────────────────────────────────────────┘


### WebSocket Architecture
┌──────────────────────────────────────────────────────────────────────────┐
│ WebSocket Hub │
│ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Connection Registry │ │
│ │ │ │
│ │ UserID_1 ──────► WebSocket Connection 1 │ │
│ │ UserID_2 ──────► WebSocket Connection 2 │ │
│ │ UserID_3 ──────► WebSocket Connection 3 │ │
│ │ ... │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐ │
│ │ Register │ │ Unregister │ │ Broadcast │ │
│ │ Channel │ │ Channel │ │ Channel │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘

Message Flow:

Client A Server Client B
│ │ │
│ message_send │ │
│─────────────────────────►│ │
│ │ │
│ │ Save to Database │
│ │ │
│ │ message_new │
│◄─────────────────────────│ │
│ │ │
│ │ message_new │
│ │───────────────────────────►│
│ │ │


---

## Project Structure
echo/
│
├── backend/ # Go backend application
│ │
│ ├── cmd/ # Application entry points
│ │ └── api/
│ │ └── main.go # Main application file
│ │
│ ├── internal/ # Private application code
│ │ │
│ │ ├── auth/ # Authentication module
│ │ │ ├── handler.go # HTTP handlers for auth endpoints
│ │ │ ├── service.go # Auth business logic, JWT handling
│ │ │ └── repository.go # User database operations
│ │ │
│ │ ├── users/ # Users module
│ │ │ ├── handler.go # HTTP handlers for user endpoints
│ │ │ ├── service.go # User business logic
│ │ │ └── repository.go # User queries
│ │ │
│ │ ├── conversations/ # Conversations module
│ │ │ ├── handler.go # HTTP handlers for conversation endpoints
│ │ │ ├── service.go # Conversation business logic
│ │ │ └── repository.go # Conversation database operations
│ │ │
│ │ ├── messages/ # Messages module
│ │ │ ├── handler.go # HTTP handlers for message endpoints
│ │ │ ├── service.go # Message business logic
│ │ │ └── repository.go # Message database operations
│ │ │
│ │ ├── reads/ # Read receipts module
│ │ │ ├── handler.go # HTTP handlers for read endpoints
│ │ │ ├── service.go # Read receipt business logic
│ │ │ └── repository.go # Read receipt database operations
│ │ │
│ │ ├── uploads/ # File uploads module
│ │ │ ├── handler.go # HTTP handlers for upload endpoints
│ │ │ ├── service.go # Upload business logic, file handling
│ │ │ └── repository.go # Upload metadata database operations
│ │ │
│ │ ├── realtime/ # WebSocket module
│ │ │ ├── hub.go # Connection manager, message routing
│ │ │ ├── client.go # Individual client connection handler
│ │ │ └── handler.go # WebSocket upgrade handler
│ │ │
│ │ ├── middleware/ # HTTP middleware
│ │ │ └── auth.go # JWT authentication middleware
│ │ │
│ │ ├── db/ # Database utilities
│ │ │ └── db.go # PostgreSQL connection pool
│ │ │
│ │ ├── config/ # Configuration
│ │ │ └── config.go # Environment variable loading
│ │ │
│ │ └── common/ # Shared utilities
│ │ ├── errors.go # Common error definitions
│ │ └── response.go # HTTP response helpers
│ │
│ ├── migrations/ # Database migration files
│ │ ├── 001_create_users.up.sql
│ │ ├── 001_create_users.down.sql
│ │ ├── 002_create_conversations.up.sql
│ │ ├── 002_create_conversations.down.sql
│ │ ├── 003_create_messages.up.sql
│ │ ├── 003_create_messages.down.sql
│ │ ├── 004_create_reads.up.sql
│ │ ├── 004_create_reads.down.sql
│ │ ├── 005_create_uploads.up.sql
│ │ └── 005_create_uploads.down.sql
│ │
│ ├── uploads/ # Uploaded files directory (gitignored)
│ │ └── .gitkeep
│ │
│ ├── go.mod # Go module definition
│ ├── go.sum # Go module checksums
│ └── .env # Environment variables (gitignored)
│
├── frontend/ # React frontend application
│ │
│ ├── src/
│ │ │
│ │ ├── api/ # API client layer
│ │ │ ├── client.ts # Base HTTP client with auth
│ │ │ ├── auth.ts # Auth API functions
│ │ │ ├── users.ts # Users API functions
│ │ │ ├── conversations.ts # Conversations API functions
│ │ │ ├── messages.ts # Messages API functions
│ │ │ ├── reads.ts # Read receipts API functions
│ │ │ └── uploads.ts # Upload API functions
│ │ │
│ │ ├── ws/ # WebSocket client
│ │ │ └── client.ts # WebSocket connection manager
│ │ │
│ │ ├── store/ # Zustand state management
│ │ │ ├── authStore.ts # Authentication state
│ │ │ ├── chatStore.ts # Conversations and messages state
│ │ │ └── wsStore.ts # WebSocket connection state
│ │ │
│ │ ├── components/ # Reusable React components
│ │ │ ├── ChatShell.tsx # Main chat layout container
│ │ │ ├── ConversationList.tsx # Left sidebar conversation list
│ │ │ ├── ConversationItem.tsx # Single conversation row
│ │ │ ├── ChatView.tsx # Right panel chat view
│ │ │ ├── MessageList.tsx # Scrollable message container
│ │ │ ├── MessageItem.tsx # Single message bubble
│ │ │ ├── Composer.tsx # Message input with image attach
│ │ │ ├── UserSearch.tsx # User search for new DM
│ │ │ └── ProtectedRoute.tsx # Auth guard component
│ │ │
│ │ ├── pages/ # Page components
│ │ │ ├── Login.tsx # Login page
│ │ │ ├── Signup.tsx # Registration page
│ │ │ └── Chat.tsx # Main chat page
│ │ │
│ │ ├── types/ # TypeScript type definitions
│ │ │ └── index.ts # Shared types and interfaces
│ │ │
│ │ ├── styles/ # Global styles
│ │ │ └── index.css # Tailwind imports and custom CSS
│ │ │
│ │ ├── App.tsx # Root application component
│ │ ├── main.tsx # Application entry point
│ │ └── vite-env.d.ts # Vite type declarations
│ │
│ ├── public/ # Static assets
│ │ └── vite.svg # Favicon
│ │
│ ├── index.html # HTML template
│ ├── package.json # NPM dependencies
│ ├── package-lock.json # NPM lock file
│ ├── tsconfig.json # TypeScript configuration
│ ├── tsconfig.node.json # TypeScript config for Node
│ ├── vite.config.ts # Vite configuration
│ ├── tailwind.config.js # Tailwind CSS configuration
│ ├── postcss.config.js # PostCSS configuration
│ └── .env # Environment variables (gitignored)
│
├── docker-compose.yml # Docker Compose configuration
├── .gitignore # Git ignore rules
├── LICENSE # License file
└── README.md # This file


---

## Prerequisites

### Required Software

| Software | Minimum Version | Installation |
|----------|-----------------|--------------|
| Go | 1.21 | https://golang.org/dl/ |
| Node.js | 18.0 | https://nodejs.org/ |
| npm | 9.0 | Comes with Node.js |
| PostgreSQL | 15 | https://www.postgresql.org/download/ |

### Optional Software

| Software | Purpose | Installation |
|----------|---------|--------------|
| Docker | Run PostgreSQL in container | https://www.docker.com/ |
| Docker Compose | Orchestrate all services | Comes with Docker Desktop |

### Verify Installation


Run these commands to verify your setup:

```bash
# Check Go version
go version
# Expected: go version go1.21.x or higher

# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check PostgreSQL version (if installed locally)
psql --version
# Expected: psql (PostgreSQL) 15.x or higher

# Check Docker version (optional)
docker --version
# Expected: Docker version 20.x.x or higher

## Installation

Step 1: Clone the Repository


git clone https://github.com/ahanyamariam/echo.git
cd echo

Step 2: Backend Setup

# Navigate to backend directory
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your settings (see Environment Variables section)

# Download Go dependencies
go mod download

# Verify dependencies
go mod verify

Step 3: Frontend Setup

# Navigate to frontend directory
cd ../frontend

# Copy environment file
cp .env.example .env

# Install npm dependencies
npm install

Step 4: Database Setup
See the Database Setup section below.

Environment Variables

Backend Environment Variables
Create backend/.env with the following:
# Server Configuration
PORT=8080
ENV=development

# Database Configuration
DATABASE_URL=postgres://echo:echo@localhost:5432/echo?sslmode=disable

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-that-should-be-at-least-32-characters-long
JWT_EXPIRY=24h

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=5242880

Frontend Environment Variables
Create frontend/.env with the following:

VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

Database Setup
 Using Docker (Recommended):
# Start PostgreSQL container
docker run --name echo-postgres \
  -e POSTGRES_USER=echo \
  -e POSTGRES_PASSWORD=echo \
  -e POSTGRES_DB=echo \
  -p 5432:5432 \
  -d postgres:15

# Verify container is running
docker ps

# Wait a few seconds for PostgreSQL to start
sleep 5

Running Migrations
Navigate to the backend directory and run migrations:
cd backend

# Run all migrations
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/001_create_users.up.sql
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/002_create_conversations.up.sql
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/003_create_messages.up.sql
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/004_create_reads.up.sql
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/005_create_uploads.up.sql

# Connect to database
PGPASSWORD=echo psql -h localhost -U echo -d echo

# List all tables
\dt

# Expected output:
#                List of relations
#  Schema |        Name           | Type  | Owner
# --------+-----------------------+-------+-------
#  public | conversation_members  | table | echo
#  public | conversation_reads    | table | echo
#  public | conversations         | table | echo
#  public | messages              | table | echo
#  public | uploads               | table | echo
#  public | users                 | table | echo

# Exit psql

Rollback Migrations (If Needed)
cd backend

# Rollback in reverse order
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/005_create_uploads.down.sql
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/004_create_reads.down.sql
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/003_create_messages.down.sql
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/002_create_conversations.down.sql
PGPASSWORD=echo psql -h localhost -U echo -d echo -f migrations/001_create_users.down.sql

Running the Application

Development Mode
You need to run both the backend and frontend in separate terminals.

Terminal 1: Start Backend

cd backend
go run cmd/api/main.go
Expected output:
2024/01/15 10:00:00 Connected to database
2024/01/15 10:00:00 Server starting on port 8080

Terminal 2: Start Frontend
cd frontend
npm run dev

Expected output:
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help

  Access the Application

Open your browser and navigate to:
http://localhost:5173

Production Build
Build Backend
cd backend

# Build binary
go build -o bin/echo-api cmd/api/main.go

# Run binary
./bin/echo-api

Build Frontend
cd frontend

# Create production build
npm run build

# Preview production build locally
npm run preview

# Or serve the dist folder with any static file server

Using Docker Compose
Create docker-compose.yml in the project root:
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: echo-postgres
    environment:
      POSTGRES_USER: echo
      POSTGRES_PASSWORD: echo
      POSTGRES_DB: echo
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U echo"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: echo-backend
    environment:
      PORT: 8080
      ENV: production
      DATABASE_URL: postgres://echo:echo@postgres:5432/echo?sslmode=disable
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
      JWT_EXPIRY: 24h
      UPLOAD_DIR: /app/uploads
      MAX_UPLOAD_SIZE: 5242880
    ports:
      - "8080:8080"
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: echo-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  uploads_data:

  API Documentation

Base URL
http://localhost:8080

Authentication
All endpoints marked with 🔒 require authentication.

Include the JWT token in the Authorization header:
Authorization: Bearer <your_jwt_token>

Response Format
All responses follow this format:

Success Response:
{
  "data": { ... }
}

Error Response:
{
  "error": "Error message here"
}

Authentication Endpoints
POST /auth/signup

Create a new user account.

Request Body:
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
Validation Rules:

username: Required, 3-50 characters
email: Required, valid email format
password: Required, minimum 6 characters
Success Response (201 Created):

{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Error Responses:

Status	Error	Cause
400	Username, email, and password are required	Missing fields
400	Username must be between 3 and 50 characters	Invalid username length
400	Password must be at least 6 characters	Password too short
409	User with this email or username already exists	Duplicate user
Example:


curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'

POST /auth/login

Authenticate an existing user.

Request Body:



{
  "email": "john@example.com",
  "password": "password123"
}
Success Response (200 OK):



{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Error Responses:

Status	Error	Cause
400	Email and password are required	Missing fields
401	Invalid email or password	Wrong credentials
Example:



curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
Users Endpoints
GET /users/me 🔒

Get current authenticated user's profile.

Success Response (200 OK):



{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com"
}
Error Responses:

Status	Error	Cause
401	Unauthorized	Missing or invalid token
404	User not found	User no longer exists
Example:



curl http://localhost:8080/users/me \
  -H "Authorization: Bearer <your_token>"
GET /users/search?q={query} 🔒

Search for users by username.

Query Parameters:

Parameter	Type	Required	Description
q	string	Yes	Search query (minimum 2 characters)
Success Response (200 OK):



{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "janedoe"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "johndoe2"
    }
  ]
}
Notes:

Returns maximum 20 results
Excludes the current user from results
Case-insensitive search
Matches partial usernames
Example:



curl "http://localhost:8080/users/search?q=john" \
  -H "Authorization: Bearer <your_token>"
Conversations Endpoints
GET /conversations 🔒

List all conversations for the authenticated user.

Success Response (200 OK):



{
  "conversations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "type": "dm",
      "created_at": "2024-01-15T10:30:00Z",
      "other_user": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "janedoe"
      },
      "last_message": {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "message_type": "text",
        "text": "Hey, how are you?",
        "sender_id": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-15T11:45:00Z"
      },
      "unread_count": 2
    }
  ]
}
Notes:

Sorted by most recent message (newest first)
last_message is null if no messages exist
unread_count is the number of unread messages from the other user
Example:



curl http://localhost:8080/conversations \
  -H "Authorization: Bearer <your_token>"
POST /conversations 🔒

Create a new DM conversation or return existing one (idempotent).

Request Body:



{
  "other_user_id": "550e8400-e29b-41d4-a716-446655440001"
}
Success Response (201 Created - New Conversation):



{
  "conversation": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "type": "dm",
    "created_at": "2024-01-15T10:30:00Z",
    "other_user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "janedoe"
    }
  },
  "created": true
}
Success Response (200 OK - Existing Conversation):



{
  "conversation": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "type": "dm",
    "created_at": "2024-01-15T10:30:00Z",
    "other_user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "janedoe"
    }
  },
  "created": false
}
Error Responses:

Status	Error	Cause
400	other_user_id is required	Missing field
400	Cannot create conversation with yourself	Self-conversation attempt
404	User not found	Other user doesn't exist
Example:



curl -X POST http://localhost:8080/conversations \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "other_user_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
Messages Endpoints
GET /messages 🔒

Get messages for a conversation with cursor-based pagination.

Query Parameters:

Parameter	Type	Required	Description
conversation_id	UUID	Yes	Conversation ID
limit	integer	No	Max messages to return (default: 50, max: 100)
before	UUID	No	Return messages before this message ID
Success Response (200 OK):



{
  "messages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
      "sender_id": "550e8400-e29b-41d4-a716-446655440000",
      "message_type": "text",
      "text": "Hello!",
      "created_at": "2024-01-15T11:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440021",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
      "sender_id": 


docker exec -it echo-postgres psql -U echo -d echo
SELECT * FROM users;

