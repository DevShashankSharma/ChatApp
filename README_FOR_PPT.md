# ChatApp — Project Summary (Temp README for PPT)

## Project Overview
- Name: ChatApp
- Purpose: A realtime chat web application with user auth, direct messages, announcements, and a meeting feature (peer-to-peer). Built as a full-stack app with a Node.js + Express backend and a React + Vite frontend.

## Key Features
- User authentication (signup/login/logout) with JWT and cookie-based session handling.
- Private/direct messaging with text, images, attachments, edit/delete, read receipts, reactions, and message threading.
- Real-time communication using Socket.IO for messages and presence (online users).
- Announcements system with admin capabilities, pinned announcements, and TTL-based expiry.
- Meeting (WebRTC) functionality using `simple-peer` for peer-to-peer calls.
- Image/media upload support (Cloudinary integration).

## Tech Stack
- Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO, Cloudinary, JWT.
- Frontend: React 19, Vite, TailwindCSS, Zustand (state), React Router, socket.io-client, simple-peer.

## Architecture (high level)
- Client (React) ↔️ REST API (Express) for auth, messages, announcements
- Client ↔️ WebSocket (Socket.IO) for realtime message delivery, presence, typing indicators
- MongoDB stores users, messages, announcements; backend seeds an admin user if `ADMIN_EMAIL`/`ADMIN_PASSWORD` present.
- Cloudinary handles image uploads (profile pics, message images).

## Backend — Structure & Entry
- Entry: `backend/src/index.js` — initializes Express app, socket server, CORS, cookie parsing, and mounts routes.
- Main routes mounted:
  - `/api/auth` — authentication routes
  - `/api/messages` — messaging-related endpoints
  - `/api/announcements` — create/read/update/delete announcements

## Backend — Important Files
- DB connection and admin seeding: `backend/src/lib/db.js` (reads `MONGODB_URI`, seeds admin user if `ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- Socket server: `backend/src/lib/socket.js` (Socket.IO integration and server instance used by `index.js`).
- Cloudinary helper: `backend/src/lib/cloudinary.js` (image upload configuration).
- Auth middleware: `backend/src/middleware/auth.middleware.js` (route protection using JWT).

## Backend — Routes & Endpoints (summary)
- Auth (`/api/auth`):
  - POST `/signup` — create account
  - POST `/login` — login and set auth cookie
  - POST `/logout` — clear cookie
  - PUT `/update-profile` — protected; update user profile
  - GET `/check` — protected; verify token / get user info
- Messages (`/api/messages`):
  - GET `/users` — get users for sidebar
  - GET `/:id` — get messages with user `id`
  - GET `/search` — search messages
  - POST `/send/:id` — send message to user `id`
  - PUT `/edit/:messageId` — edit message
  - DELETE `/:messageId` — delete message
  - POST `/:id/read` — mark messages as read
  - POST `/:id/reaction` — add reaction
- Announcements (`/api/announcements`):
  - GET `/` — get announcements (protected)
  - GET `/all` — get all announcements (protected)
  - POST `/` — create announcement (protected)
  - PUT `/:id` — update announcement
  - DELETE `/:id` — delete announcement

## Data Models (Mongoose) — Key Fields
- User (`backend/src/models/user.model.js`): `name`, `email` (unique), `password`, `profilePic`, timestamps.
- Message (`backend/src/models/message.model.js`): `senderId`, `receiverId`, `text`, `image`, `edited`, `deleted`, `readBy` (array), `reactions` (array of {userId, emoji}), optional `threadId`, `attachments`, `isGroup`, `groupId`, timestamps.
- Announcement (`backend/src/models/announcement.model.js`): `senderId`, `text`, `pinned`, `isAdmin`, `startAt`, `endAt` — includes TTL index on `endAt` for automatic expiry.

## Frontend — Structure & Entry
- Entry: `frontend/src/main.jsx` — mounts React app and sets up router.
- App component: `frontend/src/App.jsx` — routing and high-level auth/theme checks; routes include Home, Login, Signup, Settings, Meeting, Profile, Admin Announcements.
- State management: `frontend/src/store/*` uses `zustand` for auth, chat, and theme.

## Frontend — Pages & Components (high level)
- Pages: `HomePage`, `LoginPage`, `SignupPage`, `SettingsPage`, `ProfilePage`, `MeetingPage`, `MeetingRoom`, `AdminAnnouncements`.
- Components: `Navbar`, `SideBar`, `ChatContainer`, `ChatHeader`, `MessageBubble`, `MessageInput`, `AnnouncementPanel`, plus skeleton loading components.

## Environment Variables (backend)
Copy `.env.example` to `.env` and set values:
- `MONGODB_URI` — MongoDB connection string
- `PORT` — server port (e.g., `5000`)
- `JWT_SECRET` — signing secret for auth tokens
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — optional admin seeding credentials
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — for Cloudinary uploads

## Setup & Run (local)
1. Backend
   - Install: `cd backend && npm install`
   - Copy `.env.example` → `.env` and fill values
   - Dev: `npm run dev` (uses `nodemon`)
   - Start: `npm start`
2. Frontend
   - Install: `cd frontend && npm install`
   - Dev: `npm run dev` (Vite — default `http://localhost:5173`)

## Demo / How to present in PPT (suggested slides)
1. Title slide: Project name, author, date
2. Motivation & Goals: Why the app exists and main objectives
3. Architecture: diagram showing React client, Express API, Socket.IO, MongoDB, Cloudinary
4. Key Features: bullet list + screenshots of chat, announcements, meeting
5. API & Data Models: list endpoints and model summaries (use bullets from this README)
6. Live Demo Steps: how to run backend/frontend and demo user flows (signup → chat → send image → announcement)
7. Challenges & Future Work: rate-limiting, groups, file storage improvements, test coverage, CI/CD
8. Q&A / Credits

## Deployment Notes
- Backend: deployable to environments supporting Node.js (Heroku, Azure Web App, DigitalOcean App, etc.). Ensure `PORT` and `MONGODB_URI` env vars are set.
- Frontend: build with `npm run build` and host on Vercel/Netlify or as a static site behind a CDN. Configure CORS and allowed origins in backend.

## Future Improvements (suggestions)
- Add end-to-end tests and CI pipeline
- Add TLS/HTTPS and refresh token strategy for auth
- Add typing indicators, delivery receipts, and message search optimizations
- Optimize media storage (signed uploads), add file size limits and content moderation
- Support group chats and roles/permissions

## Quick File Map (use when making PPT slides)
- Backend entry: [backend/src/index.js](backend/src/index.js)
- DB & seeding: [backend/src/lib/db.js](backend/src/lib/db.js)
- Auth routes: [backend/src/routes/auth.route.js](backend/src/routes/auth.route.js)
- Message routes: [backend/src/routes/message.route.js](backend/src/routes/message.route.js)
- Announcement routes: [backend/src/routes/announcement.route.js](backend/src/routes/announcement.route.js)
- Models: [backend/src/models/user.model.js](backend/src/models/user.model.js), [backend/src/models/message.model.js](backend/src/models/message.model.js), [backend/src/models/announcement.model.js](backend/src/models/announcement.model.js)
- Frontend entry: [frontend/src/main.jsx](frontend/src/main.jsx)
- App routing: [frontend/src/App.jsx](frontend/src/App.jsx)

---
This temporary README is tailored for creating a presentation. If you want, I can:
- Generate a slide-by-slide PPTX draft from this README.
- Capture screenshots and suggested speaker notes for each slide.

File created: `README_FOR_PPT.md`
