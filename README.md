# Echo - Real-Time Chat Application

A production-style MVP real-time 1-to-1 direct messaging chat application built with React, Go, and PostgreSQL.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Running the Application](#running-the-application)

---

## Overview

Echo is a full-stack real-time chat application that enables users to have private one-on-one conversations. The application features instant message delivery through WebSocket connections, secure JWT-based authentication, message persistence, read receipts, and image sharing capabilities.

### What Echo Does

- Allows users to create accounts and authenticate securely
- Enables users to search for other users by username
- Supports creating direct message conversations
- Delivers messages in real-time using WebSocket
- Persists all messages in PostgreSQL database
- Shows message delivery and read status
- Allows sharing images in conversations
- Provides message history with pagination

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

## Running the Application

### Development Mode

You need to run both the backend and frontend in separate terminals.

#### Terminal 1: Start Backend

```bash
cd backend
go run cmd/api/main.go
```

#### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```


#### Access the Application

Open your browser and navigate


