# PebloNote - Setup & Deployment Guide

## Quick Start

### Prerequisites
- Node.js v18+
- pnpm
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/PebloNote.git
cd PebloNote

# Install dependencies
pnpm install

# Setup database
cd packages/db
npx prisma migrate dev --name add-peblo-features
npx prisma generate
cd ../..

# Setup environment variables
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
cp apps/ws-server/.env.example apps/ws-server/.env
cp apps/hocuspocus-server/.env.example apps/hocuspocus-server/.env

# Update .env files with your actual credentials
# - DATABASE_URL in apps/server/.env
# - GEMINI_API_KEY in apps/server/.env
# - API URLs in apps/web/.env
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Or start individual services
cd apps/server && pnpm dev         # API server on :3001
cd apps/web && pnpm dev            # Frontend on :3000
cd apps/ws-server && pnpm dev       # WebSocket on :8080
cd apps/hocuspocus && pnpm dev      # Hocuspocus on :1234
```

## Database Schema

### Key Models

**User**
- Stores user authentication and metadata
- Relations: rooms, chats, memberships, tags, aiOutputs, refreshTokens

**Room** (Note)
- Represents a collaborative note
- Fields: title, content, isArchived, isPublic, shareId
- Relations: admin, members, tags, aiOutputs, document

**Tag**
- User-defined categories
- Unique per user (name_userId constraint)
- Relations: user, notes

**AIOutput**
- Persists all AI operations
- Tracks type, input hash, output, token usage
- Relations: user, room

**RefreshToken**
- Session persistence
- Auto-expires after 7 days

### Relationships
- User → Rooms (one-to-many, admin)
- User → Tags (one-to-many)
- User → AIOutputs (one-to-many)
- Room ← Tags (many-to-many via NoteTag)
- Room ← AIOutputs (one-to-many)

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token (planned)

### Rooms/Notes
- `POST /api/dashboard/room` - Create room
- `GET /api/dashboard/rooms` - Get user's rooms
- `GET /api/dashboard/room/:id` - Get single room
- `POST /api/dashboard/join-room` - Join by secret code

### Tags
- `GET /api/tags` - Get all user tags
- `POST /api/tags/:roomId/set` - Set tags on room

### Advanced Features
- `PATCH /api/room-advanced/:roomId/archive` - Toggle archive
- `PATCH /api/room-advanced/:roomId/share` - Toggle public share
- `GET /api/room-advanced/shared/:shareId` - Get shared room
- `POST /api/room-advanced/:roomId/ai/action-items` - Extract action items
- `POST /api/room-advanced/:roomId/ai/title` - Suggest title
- `GET /api/room-advanced/search/rooms` - Search with filters

### Dashboard
- `GET /api/dashboard/insights` - Get dashboard metrics
- `GET /api/dashboard/room/:roomId/ai-history` - Get AI history

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Access services
# Frontend: http://localhost:3000
# API: http://localhost:3001
# WebSocket: ws://localhost:8080
# Hocuspocus: ws://localhost:1234
```

## Environment Variables

### apps/server/.env
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/pebloNote
JWT_SECRET=your-long-random-secret-key
JWT_REFRESH_SECRET=your-long-random-refresh-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_APP_URL=https://yourdomain.com
```

### apps/web/.env
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
NEXT_PUBLIC_HOCUSPOCUS_URL=wss://hocus.yourdomain.com
```

## Security Considerations

1. **JWT Secrets**: Generate strong random secrets
   ```bash
   openssl rand -base64 32
   ```

2. **Database**: Use strong passwords, restrict network access

3. **CORS**: Update origin in server config for production

4. **Rate Limiting**: Currently set to 10 AI calls/minute per IP

5. **Input Validation**: All DTOs validated server-side

6. **HTTPS**: Ensure HTTPS in production

7. **Refresh Tokens**: Stored in secure, HTTP-only cookies (implement in production)

## Monitoring

### Key Metrics to Monitor
- AI API usage (tokens used, call rate)
- Active users and sessions
- Database query performance
- Error rates on endpoints

### Logging
Configure centralized logging (e.g., Winston, Pino) for production

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -d pebloNote

# Reset migrations
npx prisma migrate reset (⚠️ WARNING: Deletes all data)
```

### API Port Conflicts
```bash
# Find process on port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### CORS Errors
- Check NEXT_APP_URL in server .env
- Verify frontend URL matches CORS origin

## Scaling Considerations

1. **Database**: Consider connection pooling (PgBouncer)
2. **Caching**: Implement Redis for tags and insights
3. **CDN**: Serve static assets via CDN
4. **Load Balancing**: Use load balancer for multiple API instances
5. **Async Jobs**: Use queues (Bull/RabbitMQ) for AI tasks

## Deployment Checklist

- [ ] Database migrated and verified
- [ ] Environment variables set for production
- [ ] JWT secrets generated and stored securely
- [ ] HTTPS configured
- [ ] CORS origin updated
- [ ] Database backups configured
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Analytics configured
- [ ] Email notifications setup
- [ ] Rate limiting verified
- [ ] Load testing completed
- [ ] Security audit completed

## Support & Documentation

- API Docs: See `samples/api-responses.json`
- Schema: See `packages/db/prisma/schema.prisma`
- Features: See `README.md`
