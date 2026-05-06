# ChatFlow 💬

Real-time chat application built with **Next.js 14**, **MongoDB Atlas**, **Pusher**, **JWT authentication**, and **Tailwind CSS**.

> Portfolio project by [Leandro Martinez](https://leandromartinez.vercel.app) · [GitHub](https://github.com/leamartinez07)

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | Next.js 14 (App Router)           |
| Language     | TypeScript                        |
| Database     | MongoDB Atlas (Mongoose ODM)      |
| Real-time    | Pusher Channels (presence)        |
| Auth         | JWT via `jose` + `bcryptjs`       |
| Validation   | Zod                               |
| Styling      | Tailwind CSS                      |
| Deploy       | Vercel                            |

---

## Features

- 🔐 **JWT Authentication** — register, login, protected routes via Next.js middleware
- 💬 **Real-time messaging** — instant delivery via Pusher presence channels
- 🏠 **Chat rooms** — create public/private rooms with descriptions
- 👥 **Presence** — see how many members are online in each room
- 📜 **Message history** — cursor-based pagination (load older messages)
- 🔎 **Room discovery** — search and join public rooms
- 🧑‍🤝‍🧑 **Membership** — join / leave rooms; private rooms are invite-only
- 🎨 **Dark UI** — clean, modern interface with animated avatars
- ✅ **Zod validation** — all API inputs validated with descriptive errors

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/leamartinez07/chatflow
cd chatflow
npm install
```

### 2. Set up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) and create a free cluster
2. Create a database user and allow network access (0.0.0.0/0 for development)
3. Copy your connection string

### 3. Set up Pusher

1. Go to [pusher.com](https://pusher.com) → Create a new **Channels** app
2. Choose a cluster (e.g. `us2`)
3. Copy your App ID, Key, Secret, and Cluster

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/chatflow?retryWrites=true&w=majority

JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=us2

NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=us2

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 💡 Generate a secure JWT secret: `openssl rand -base64 32`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

---

## API Reference

### Auth

| Method | Endpoint              | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| POST   | `/api/auth/register`  | ❌   | Register a new user      |
| POST   | `/api/auth/login`     | ❌   | Login, returns JWT token |
| GET    | `/api/auth/me`        | ✅   | Get current user profile |
| PATCH  | `/api/auth/me`        | ✅   | Update name / avatar     |

### Rooms

| Method | Endpoint                        | Auth | Description                      |
|--------|---------------------------------|------|----------------------------------|
| GET    | `/api/rooms`                    | ✅   | List rooms (paginated + search)  |
| POST   | `/api/rooms`                    | ✅   | Create a room                    |
| GET    | `/api/rooms/:id`                | ✅   | Get room details + members       |
| PATCH  | `/api/rooms/:id`                | ✅   | Update room (owner only)         |
| DELETE | `/api/rooms/:id`                | ✅   | Delete room (owner only)         |
| GET    | `/api/rooms/:id/members`        | ✅   | List room members                |
| POST   | `/api/rooms/:id/members`        | ✅   | Join a public room               |
| DELETE | `/api/rooms/:id/members`        | ✅   | Leave a room                     |
| GET    | `/api/rooms/:id/messages`       | ✅   | Get messages (cursor pagination) |
| POST   | `/api/rooms/:id/messages`       | ✅   | Send a message                   |

### Query params for `GET /api/rooms`

```
?search=text
&type=public|private|all
&page=1
&limit=20
```

### Query params for `GET /api/rooms/:id/messages`

```
?before=<message_id>   # cursor (load older messages)
&limit=30
```

---

## How Real-time Works

ChatFlow uses **Pusher Channels** with presence channels:

1. When a user opens a room, the client subscribes to `presence-room-{roomId}`
2. Pusher authenticates the subscription via `/api/pusher/auth` (JWT verified)
3. When a message is sent, the server calls `pusherServer.trigger()` with the `new-message` event
4. All subscribed clients receive the message instantly without polling

Presence channels also track who's online in each room, showing the online count in the room header.

---

## Example API Requests

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Leandro","email":"leandro@example.com","password":"Secure123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"leandro@example.com","password":"Secure123"}'

# Create a room
curl -X POST http://localhost:3000/api/rooms \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"General","description":"General discussion"}'

# Send a message
curl -X POST http://localhost:3000/api/rooms/<room-id>/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello, world!"}'
```

---

## Deploy to Vercel

```bash
npx vercel
```

Add all environment variables (including `NEXT_PUBLIC_*` ones) in the Vercel dashboard under **Settings → Environment Variables**.

> ⚠️ Vercel's free tier doesn't support WebSockets — Pusher handles this via HTTP long-polling as a fallback, so it works perfectly on serverless.

---

## Project Structure

```
chatflow/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # register, login, me
│   │   │   ├── rooms/         # CRUD + nested messages/members
│   │   │   ├── pusher/auth/   # presence channel authentication
│   │   │   └── health/        # status check
│   │   ├── (auth)/
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Register page
│   │   ├── chat/              # Main chat UI
│   │   ├── layout.tsx
│   │   └── page.tsx           # Redirects to /chat
│   ├── components/
│   │   ├── Avatar.tsx         # User avatar with presence indicator
│   │   ├── ChatRoom.tsx       # Chat area with header
│   │   ├── MessageBubble.tsx  # Single message bubble
│   │   ├── MessageInput.tsx   # Message composer
│   │   ├── MessageList.tsx    # Scrollable message list
│   │   ├── RoomCard.tsx       # Room list item
│   │   └── Sidebar.tsx        # Room navigator + create modal
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth state + login/register/logout
│   │   └── useChat.ts         # Pusher subscription + message state
│   ├── lib/
│   │   ├── mongodb.ts         # Mongoose connection (singleton)
│   │   ├── auth.ts            # JWT sign/verify
│   │   ├── pusher.ts          # Pusher server + client configs
│   │   ├── schemas.ts         # Zod schemas
│   │   └── response.ts        # Response helpers
│   ├── models/
│   │   ├── User.ts            # User schema (password hidden in toJSON)
│   │   ├── Room.ts            # Room schema (slug, members, lastMessage)
│   │   └── Message.ts         # Message schema
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts          # JWT route protection
├── .env.example
└── README.md
```

---

## License

MIT — free to use and modify.
