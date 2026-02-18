# Frontend — ChatApp

This document describes the frontend structure, key components, pages, stores, networking, and UX behavior for the ChatApp project.

Tech & tooling
- Framework: React (Vite)
- Styling: TailwindCSS + DaisyUI
- Icons: lucide-react
- State: Zustand (`frontend/src/store/`)

Entry & routing
- Entry: [frontend/src/main.jsx](src/main.jsx#L1-L40) — uses `BrowserRouter`.
- Pages: HomePage, LoginPage, SignupPage, ProfilePage, SettingsPage (see `frontend/src/pages/`).

Pages
- `HomePage` ([frontend/src/pages/HomePage.jsx](src/pages/HomePage.jsx#L1-L40)) — main chat layout; shows `SideBar` and chat area.
- `LoginPage` ([frontend/src/pages/LoginPage.jsx](src/pages/LoginPage.jsx#L1-L200)) — login form; uses `useAuthStore.login()`; shows loading state.
- `SignupPage` ([frontend/src/pages/SignupPage.jsx](src/pages/SignupPage.jsx#L1-L300)) — signup form with client validation (email regex, password min length); uses `useAuthStore.signup()`.
- `ProfilePage` ([frontend/src/pages/ProfilePage.jsx](src/pages/ProfilePage.jsx#L1-L300)) — profile photo upload and account metadata; uses `useAuthStore.updateProfile()`.

Key components
- `SideBar` ([frontend/src/components/SideBar.jsx](src/components/SideBar.jsx#L1-L200)) — contact list, selection, online filter.
- `ChatContainer` ([frontend/src/components/ChatContainer.jsx](src/components/ChatContainer.jsx#L1-L200)) — renders messages, autoscrolls to newest message.
- `ChatHeader` ([frontend/src/components/ChatHeader.jsx](src/components/ChatHeader.jsx#L1-L200)) — selected user header and online indicator.
- `MessageInput` ([frontend/src/components/MessageInput.jsx](src/components/MessageInput.jsx#L1-L200)) — text input, image picker, preview, sends messages via `useChatStore.sendMessage()`.
- `NoChatSelected`, `Navbar`, `AuthImagePattern`, skeleton components — auxiliary UI.

State management (Zustand stores)
- `useAuthStore` ([frontend/src/store/useAuthStore.js](src/store/useAuthStore.js#L1-L200)):
  - State: `authUser`, `socket`, `onlineUsers`, loading flags.
  - Methods: `checkAuth()`, `signup()`, `login()`, `logout()`, `updateProfile()`, `connectSocket()`, `disconnectSocket()`.
  - Socket: connects to `http://localhost:5005` with `query: { userId }` and listens for `getOnlineUsers`.

- `useChatStore` ([frontend/src/store/useChatStore.js](src/store/useChatStore.js#L1-L250)):
  - State: `users`, `chats`, `selectedUser`, loading flags.
  - Methods: `getUsers()`, `getChats(userId)`, `sendMessage(messageData)`, `subscribeToMessages()`, `unsubscribeFromMessages()`, `setSelectedUser()`.
  - Subscriptions: `subscribeToMessages()` listens for `newMessage` events and appends messages.

Networking & API client
- `frontend/src/lib/axios.js` defines `axiosInstance` with:
  - `baseURL`: `http://localhost:5005/api/` (default)
  - `withCredentials: true` (sends HTTP-only `jwt` cookie)
- Recommendation: make baseURL configurable via `VITE_API_URL`.

Socket contract (client)
- Connect: `io.connect(BASE_URL, { query: { userId: authUser._id } })` after auth.
- Listened events:
  - `getOnlineUsers`: array of user IDs currently online.
  - `newMessage`: message object when a recipient receives a message.
- Emitted events: none currently (message sending happens over HTTP and server emits to recipient).

Image handling
- Profile and message images are converted to base64 on the client using `FileReader` and sent in POST/PUT payloads.
- The backend uploads the base64 image to Cloudinary and returns a `secure_url` stored in the DB.

UX notes
- Signup form validates name, email (regex), and minimum password length (6).
- Message sending clears inputs and image preview on success; chat autoscrolls to the newest message.
- Online status is derived from `onlineUsers` populated by `getOnlineUsers` socket event.

Production notes
- Use `VITE_API_URL` (or similar) to configure the API URL during build.
- Consider hosting frontend and backend under the same top-level domain to simplify cookies and CSRF.
- For socket scaling, use a Socket.IO adapter with Redis.

References
- `frontend/src/lib/axios.js`
- `frontend/src/store/useAuthStore.js`
- `frontend/src/store/useChatStore.js`
- `frontend/src/components/` (ChatContainer, SideBar, MessageInput, etc.)

---

If you'd like, I can:
- Update `frontend/src/lib/axios.js` to use `import.meta.env.VITE_API_URL`.
- Add developer notes for adding new socket events.
- Add a short frontend-only README to `frontend/` (this file is already created).
