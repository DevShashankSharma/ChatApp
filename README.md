# ChatApp

Comprehensive documentation and analysis for the ChatApp project — a realtime chat web application with a Node.js/Express backend and a React (Vite) frontend.

Contents
- Overview
- Quick start
- Environment variables (.env.example)
- Data models
- Authentication flow
- API reference (routes + examples)
- Realtime / Socket.IO contract
- Frontend integration notes
- Deployment & production recommendations
- Project structure

Overview
--------
ChatApp provides user authentication, profile management (profile picture via Cloudinary), user listing, and realtime one-to-one messaging. The backend uses JWT stored in an HTTP-only cookie for auth and Socket.IO for realtime delivery. Messages and users are stored in MongoDB via Mongoose.

Quick start
-----------
Prerequisites
- Node.js v18+ (or latest LTS)
- npm or yarn
- MongoDB (Atlas or local)
- Cloudinary account (for image uploads)

Local run (recommended dev ports shown)

Backend

```bash
cd backend
npm install
# create .env (see .env.example below)
npm run dev        # runs nodemon src/index.js
```

Frontend

```bash
cd frontend
npm install
npm run dev        # starts Vite (http://localhost:5173)
```

Notes
- The frontend axios base URL is `http://localhost:5005/api/` by default; the backend is expected to run on port `5005` in development (see `frontend/src/lib/axios.js`).
- The backend reads `PORT` from environment; set it to `5005` to match the frontend default or change the frontend `axiosInstance`.

Environment variables (.env.example)
----------------------------------
Create `backend/.env` with values similar to the example below.

```env
# Server
PORT=5005
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/chatapp?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_jwt_secret_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Data models (backend)
---------------------
User (Mongoose schema: `backend/src/models/user.model.js`)
- `_id` (ObjectId)
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (hashed, required)
- `profilePic`: String (url, optional)
- `createdAt` / `updatedAt`

Message (Mongoose schema: `backend/src/models/message.model.js`)
- `_id` (ObjectId)
- `senderId`: ObjectId -> `User` (required)
- `receiverId`: ObjectId -> `User` (required)
- `text`: String (optional)
- `image`: String (Cloudinary URL, optional)
- `createdAt` / `updatedAt`

Authentication flow
-------------------
- Signup (`POST /api/auth/signup`) — creates user, hashes password, saves user, generates JWT and sets it as HTTP-only cookie `jwt` (7d expiry).
- Login (`POST /api/auth/login`) — verifies credentials, sets `jwt` cookie.
- Protected routes use `protectRoute` middleware (`backend/src/middleware/auth.middleware.js`) which:
  - reads `jwt` cookie, verifies token using `JWT_SECRET`, fetches user (without password) and attaches it to `req.user`, or returns 401/404 as appropriate.
- Logout (`POST /api/auth/logout`) — clears cookie.

API reference (examples)
------------------------
Base path: `/api`

Auth
- `POST /api/auth/signup`
  - Body: `{ name, email, password }`
  - Success: 201 + user object (token set in cookie)

Example curl:

```bash
curl -i -X POST http://localhost:5005/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'
```

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Success: 200 + user object (cookie `jwt` set)

- `POST /api/auth/logout`
  - Clears `jwt` cookie.

- `PUT /api/auth/update-profile` (protected)
  - Body: `{ profilePic }` where `profilePic` is an image (base64 or data URL) — backend uploads to Cloudinary and updates the user record.

- `GET /api/auth/check` (protected)
  - Returns authenticated user data (no password).

Messages
- `GET /api/messages/users` (protected)
  - Returns all users except the logged-in user for the sidebar.

- `GET /api/messages/:id` (protected)
  - Returns all messages between logged-in user and `:id`.

- `POST /api/messages/send/:id` (protected)
  - Body: `{ text, image }` (image optional; if present uploaded to Cloudinary)
  - Creates message record and emits realtime event to receiver (if online) via Socket.IO.

Realtime / Socket.IO contract
----------------------------
Server (backend) behavior (`backend/src/lib/socket.js`):
- Creates `io` with CORS allowing `http://localhost:5173`.
- Maintains an in-memory `userSocketMap` mapping `userId -> socketId`.
- On client connection, server reads `socket.handshake.query.userId` and stores mapping.
- Emits `getOnlineUsers` (array of online userIds) to all clients whenever connections change.
- When a message is saved, server resolves receiver socket id via `getReceiverSocketId(receiverId)` and emits `newMessage` to that socket (payload = message object).

Client (frontend) usage (`frontend/src/store/useAuthStore.js` and `frontend/src/store/useChatStore.js`):
- The client connects after successful auth check / login / signup.
- Connection example (used in code):

```js
import { io } from 'socket.io-client';
const socket = io.connect('http://localhost:5005', {
  query: { userId: authUser._id }
});

socket.on('getOnlineUsers', (usersIds) => { /* update UI */ });
socket.on('newMessage', (message) => { /* append to chat if relevant */ });
```

- The frontend emits no custom events in the current codebase; instead the backend emits `newMessage` to the specific recipient, and the client listens to it.

Frontend integration notes
-------------------------
- Axios instance: `frontend/src/lib/axios.js` sets `baseURL` to `http://localhost:5005/api/` and `withCredentials: true` so cookies are sent with requests.
- Auth & socket lifecycle: `frontend/src/store/useAuthStore.js`
  - `checkAuth()` calls `/auth/check` and then `connectSocket()` on success.
  - `connectSocket()` opens the socket with `query.userId = authUser._id` and listens for `getOnlineUsers`.
  - `disconnectSocket()` disconnects the socket on logout.
- Chat store: `frontend/src/store/useChatStore.js`
  - `getUsers()` -> GET `/messages/users`
  - `getChats(userId)` -> GET `/messages/:id`
  - `sendMessage({ text, image })` -> POST `/messages/send/:id`
  - `subscribeToMessages()` listens to `newMessage` from the socket and appends to the chats array.

Security & considerations
-------------------------
- JWT in HTTP-only cookie reduces XSS risk, but ensure CSRF protections as needed. Currently `sameSite: 'strict'` is set when token created.
- The `userSocketMap` is in-memory; for a multi-instance production deployment, use a shared store (Redis) and the Socket.IO adapter.
- Images are uploaded to Cloudinary; validate and size-check images on the client before upload to reduce cost.
- Passwords are hashed using `bcryptjs` in `auth.controllers.js`.

Deployment & production recommendations
--------------------------------------
- Use a process manager (pm2) or containers for the backend.
- Use `NODE_ENV=production` and set `secure` cookie flag appropriately.
- Consider serving the frontend from the same domain as the API (or configure CORS and cookie domains) to simplify cookies and CSRF considerations.
- For scaling sockets: use `socket.io-redis` adapter and a Redis instance to synchronize socket state across nodes.

Project structure (high level)
----------------------------
- backend/
  - `package.json` — scripts (dev uses `nodemon`)
  - `src/index.js` — server entry, middleware, CORS
  - `src/controllers/` — `auth.controllers.js`, `message.controllers.js`
  - `src/routes/` — `auth.route.js`, `message.route.js`
  - `src/lib/` — `db.js` (connect), `socket.js`, `cloudinary.js`, `utils.js`
  - `src/models/` — `user.model.js`, `message.model.js`

- frontend/
  - `package.json` — Vite, scripts
  - `src/main.jsx` — app entry
  - `src/lib/axios.js` — API client config
  - `src/store/` — Zustand stores for auth, chat, theme
  - `src/components/` — UI components (ChatContainer, MessageInput, Sidebar, etc.)

Next steps I can do for you
--------------------------
- Add `backend/.env.example` file with placeholders.
- Add a production `start` script in `backend/package.json` (e.g., `start: node src/index.js`).
- Create a short developer guide for adding new socket events and scaling sockets with Redis.

---

If you want any of the next steps, tell me which one and I'll add it now (I can create the `.env.example` and/or update `package.json`).
