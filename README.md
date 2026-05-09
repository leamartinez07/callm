# callm

Real-time chat application built with Next.js 15, TypeScript, MongoDB, Pusher, and WebRTC.

## Features

- Real-time messaging via Pusher WebSockets
- Chat rooms and direct messages (DMs)
- Friends system with invite links
- Audio and video calls via WebRTC
- JWT authentication with email verification
- Google OAuth (Sign in with Google)
- File and image uploads
- English / Spanish internationalization (i18n)
- Fully responsive design

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | MongoDB |
| Real-time | Pusher Channels |
| Calls | WebRTC |
| Auth | JWT + Google OAuth 2.0 |
| Styling | Tailwind CSS |
| Email | Nodemailer |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI
- Pusher account
- Google Cloud project with OAuth 2.0 credentials

### Installation

```bash
git clone https://github.com/leamartinez07/callm.git
cd callm
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster

NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster

NEXT_PUBLIC_APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    (auth)/         # Login and register pages
    api/            # Auth, rooms, messages, calls, DMs, friends
    chat/           # Main chat interface
  components/       # Sidebar, ChatRoom, MessageList, CallModal, etc.
  hooks/            # useAuth, useChat, useCall, useLocale
  lib/              # Pusher client, email, i18n utilities
  models/           # Mongoose models (User, Room, Message)
  types/            # TypeScript type definitions
  middleware.ts     # JWT route protection
```

## API Routes

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/auth/google` | Initiate Google OAuth flow |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/auth/verify-email` | Verify email address |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms` | List rooms (search + pagination) |
| POST | `/api/rooms` | Create a room |
| GET | `/api/rooms/:id/messages` | Get messages (cursor pagination) |
| POST | `/api/rooms/:id/messages` | Send a message |

### Direct Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dms` | List DM conversations |
| GET | `/api/dms/:userId` | Get messages with a user |
| POST | `/api/dms/:userId` | Send a direct message |

### Friends
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/friends` | List friends |
| POST | `/api/friends/invite` | Generate invite link |
| POST | `/api/friends/accept` | Accept friend request |

## License

MIT
