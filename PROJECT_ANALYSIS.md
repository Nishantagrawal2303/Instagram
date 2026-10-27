# 📸 Instagram Clone — Complete Project Analysis

> **Stack**: NestJS · TypeScript · PostgreSQL · TypeORM · React · Vite · RTK Query · Socket.IO · Cloudinary · Docker

---

## 🧩 1. Project Summary
test
A full-stack Instagram clone implementing core social media features:
- Email OTP-based registration & JWT authentication
- Image posts with Cloudinary storage
- Like, Comment, Follow/Unfollow
- Real-time one-on-one chat (Socket.IO) with email fallback for offline users
- Dockerized deployment (frontend + backend + PostgreSQL)

| Layer | Technology |
|---|---|
| Backend | NestJS (Node.js), TypeScript |
| Database | PostgreSQL + TypeORM |
| Frontend | React + Vite + TypeScript |
| State Management | Redux Toolkit + RTK Query |
| Real-time | Socket.IO (WebSocket Gateway) |
| Media Storage | Cloudinary |
| Auth | JWT (Access + Refresh tokens) + OTP Email |
| Email | Nodemailer (Gmail SMTP) |
| Containerization | Docker + Docker Compose |

---

## 🏗️ 2. How the Code Works

### Backend Module Structure

```
src/
├── app.module.ts        ← Root module, TypeORM DB config
├── auth/                ← Register, Login, JWT Guards, OTP verify
├── user/                ← UserEntity + profile management
├── post/                ← CRUD posts + Cloudinary image upload
├── like/                ← Like/Unlike posts
├── comment/             ← Comments on posts
├── follow/              ← Follow/Unfollow users
├── chat/                ← Conversations + WebSocket messaging
├── cloudinary/          ← Image upload/delete service
├── mail/                ← OTP emails + offline chat notifications
└── otp/                 ← OTP generation, storage, expiry, verification
```

### Auth Flow

```
REGISTER → POST /auth/register
  → Hash password (bcrypt, saltRounds=10)
  → Save user with isVerified: false
  → Generate 6-digit OTP (5 min expiry)
  → Send OTP via Nodemailer (Gmail)

VERIFY   → POST /auth/verify-otp
  → Find OTP record (not expired, not used)
  → Mark user isVerified: true
  → Mark OTP isUsed: true

LOGIN    → POST /auth/login
  → Find user by email
  → bcrypt.compare(password, hashedPassword)
  → generateAccessToken() → JWT (6d expiry, signed with JWT_ACCESS_SECRET)
  → generateRefreshToken() → JWT (7d expiry, signed with JWT_REFRESH_SECRET)
  → Hash refreshToken → store in user.refreshToken column
  → Set refreshToken as httpOnly cookie (7d)
  → Return accessToken + user data in JSON

REFRESH  → POST /auth/refresh
  → Read refreshToken from httpOnly cookie
  → jwtService.verifyAsync() with JWT_REFRESH_SECRET
  → Find user by payload.id
  → bcrypt.compare(cookie token vs stored hash)
  → Issue new accessToken

LOGOUT   → POST /auth/logout (JWT Guard required)
  → Set user.refreshToken = null in DB
  → res.clearCookie('refreshToken')
```

### Post Flow

```
CREATE → POST /post (multipart/form-data)
  → For each file: cloudinaryService.uploadImage(file)
      → upload_stream(file.buffer) → {secure_url, public_id}
  → Save PostEntity { caption, images: [{url, publicId}], user }

GET FEED → GET /post
  → QueryBuilder with correlated subqueries:
      SELECT post.*, user.*,
        (SELECT COUNT(*) FROM likes WHERE post_id = post.id) AS likeCount,
        (SELECT COUNT(*) FROM comments WHERE post_id = post.id) AS commentCount,
        (SELECT COUNT(*) FROM follows WHERE follower_id = currentUserId AND following_id = user.id) AS isFollowing
  → Map: isOwner = (post.user_id === currentUserId)

DELETE → DELETE /post/:id
  → Find post with user relation
  → ForbiddenException if post.user.id !== currentUserId
  → Delete each image from Cloudinary by publicId
  → postRepository.remove(post)
```

### Real-Time Chat Flow

```
CONNECT → Client opens socket with { auth: { token: accessToken } }
  → ChatGateway.handleConnection()
  → jwtService.verify(token) → extract userId
  → onlineUsers.get(userId)?.add(client.id)
     (Map<userId, Set<socketId>> — supports multi-tab)

SEND    → Client emits 'send_message' { receiverId, message }
  → ChatGateway.handleMessage()
  → chatService.sendMessage(senderId, dto)
      → createConversation() — idempotent (returns existing if found)
      → Save MessageEntity to DB
      → Update conversation.lastMessage + lastMessageAt

  IF receiver online  → server.to(socketId).emit('receive_message', msg)
  IF receiver offline → mailService.sendMessageNotification(email, senderName)

  → Always: client.emit('receive_message', msg) back to sender

DISCONNECT → Remove socketId from Set; if Set empty, delete userId from Map
```

---

## 🎯 3. Interview Questions & Answers (2 Years Experience)

---

### 🔐 Authentication

---

**Q1. What is the difference between Access Token and Refresh Token? Why did you use both?**

> **Access Token** is a short-lived JWT (6 days here) sent with every API request in the `Authorization` header. It is stateless — the server verifies it without touching the database.
>
> **Refresh Token** is a longer-lived JWT (7 days) stored securely in an httpOnly cookie. It is used only when the access token expires, to issue a new one — the server does verify it against the DB (hashed version).
>
> We use both to balance **security vs. UX**: a short-lived access token limits damage if stolen (XSS), while the refresh token keeps the user logged in without them re-entering credentials every few days.

---

**Q2. Why is the refresh token stored as an httpOnly cookie while the access token is sent in JSON?**

> - **Access Token in JSON** → stored in memory (e.g., React state or variable). Accessible by JavaScript intentionally so it can be put in `Authorization: Bearer <token>` headers.
> - **Refresh Token in httpOnly cookie** → JavaScript *cannot* access it at all (`document.cookie` blocked). This protects it from **XSS attacks** — even if an attacker injects JS, they cannot steal the refresh token.
>
> Trade-off: httpOnly cookies are vulnerable to **CSRF**, which is why `sameSite: 'strict'` is set — the browser won't send the cookie on cross-site requests.

---

**Q3. Why did you hash the refresh token before saving it to the database?**

> If the database is compromised (SQL injection, backup leak, etc.), an attacker would get all stored refresh tokens and could impersonate every user.
>
> By storing `bcrypt.hash(refreshToken)`, the raw token is never stored. On refresh requests, we use `bcrypt.compare(cookieToken, storedHash)` — the same way passwords are handled. The cost is one extra bcrypt comparison per refresh, which is acceptable.

---

**Q4. What happens when the access token expires? How does the frontend silently refresh it?**

> When the access token expires, API requests return `401 Unauthorized`. The frontend intercepts this (typically in an RTK Query `baseQuery` wrapper) and automatically calls `POST /auth/refresh`. The browser sends the httpOnly cookie automatically. If the refresh token is still valid, a new access token is returned. The original request is then retried with the new token — all invisible to the user.
>
> In this project, the token rotation logic would be in RTK Query's `baseQueryWithReauth` pattern.

---

**Q5. How does your OTP system prevent replay attacks?**

> Three mechanisms:
> 1. **`isUsed` flag** — Once an OTP is verified, `markOtpUsed()` sets `isUsed: true`. Any subsequent attempt with the same OTP is rejected (`'OTP already used'`).
> 2. **`expiresAt`** — OTP is valid for only 5 minutes (`Date.now() + 5 * 60 * 1000`). Expired OTPs throw `'OTP expired'`.
> 3. **Invalidate old OTPs on re-send** — `saveOtp()` first marks all existing unused OTPs for that email as `isUsed: true` before creating a new one, so old codes cannot be used after a resend.

---

**Q6. What is `isVerified: false` during registration? What edge cases can occur?**

> Users are saved to the DB immediately on register but `isVerified: false`. The login function checks this: if `!user.isVerified`, it throws `'Please verify your email first.'`
>
> Edge cases:
> - User registers, never verifies, tries to login → blocked correctly
> - User registers twice with the same email → `BadRequestException('User with this email already exists')` before even reaching OTP
> - User verifies, then tries to verify again → `BadRequestException('User already verified')`
> - OTP expires, user needs a new one → a resend OTP endpoint would be needed (currently missing)

---

**Q7. What is `@UseGuards(JwtGaurd)` doing in NestJS?**

> `@UseGuards()` is a NestJS decorator that attaches a **Guard** to a route. A Guard's job is to decide whether a request is allowed to proceed.
>
> `JwtGaurd` extends Passport's `AuthGuard('jwt')`, which:
> 1. Extracts the JWT from the `Authorization: Bearer <token>` header
> 2. Verifies its signature using `JWT_ACCESS_SECRET`
> 3. Calls `jwt.strategy.ts`'s `validate()` method, which fetches the user from DB and attaches it to `req.user`
> 4. If any step fails → returns `401 Unauthorized` and the controller never executes
>
> This is NestJS's clean implementation of middleware-based authentication.

---

### ⚡ Real-Time / WebSocket

---

**Q8. How does the `onlineUsers` Map work? What happens when the same user opens multiple tabs?**

> `onlineUsers` is `Map<userId, Set<socketId>>` — a Map where the key is a user's ID and the value is a **Set of all their active socket connection IDs**.
>
> When the same user opens 3 tabs:
> - Tab 1 connects → `onlineUsers.set('user123', new Set(['socket_a']))`
> - Tab 2 connects → `onlineUsers.get('user123').add('socket_b')`
> - Tab 3 connects → `onlineUsers.get('user123').add('socket_c')`
>
> When sending a message, we iterate over all socketIds in the Set and emit to each — so **all open tabs receive the message simultaneously**.
>
> When Tab 2 disconnects → `sockets.delete('socket_b')`. If the Set becomes empty, the userId key is removed (user is now offline).

---

**Q9. Why do you store a `Set<socketId>` per userId instead of a single socketId?**

> If you stored just one socketId per user, opening a second tab would overwrite the first socket. When Tab 1 disconnects, `onlineUsers.delete(userId)` would be called — incorrectly marking the user as offline even though Tab 2 is still connected.
>
> `Set<socketId>` correctly handles multiple simultaneous connections from the same user across tabs, devices, or browser windows.

---

**Q10. What happens if the receiver is offline when a message is sent?**

> In `handleMessage()`, after saving the message to DB:
> ```
> const receiverSockets = onlineUsers.get(dto.receiverId);
> if (receiverSockets) {
>   // emit to all their sockets
> } else {
>   // receiver offline → send email notification
>   const email = await chatService.getUserEmail(dto.receiverId);
>   await mailService.sendMessageNotification(email, senderName);
> }
> ```
> The message is still **persisted to the database**, so when the receiver comes back online, they can fetch the full message history via `GET /chat/messages/:conversationId`.

---

**Q11. How do you authenticate WebSocket connections in your app?**

> Standard HTTP middleware (Guards) does not run on WebSocket connections. Instead, the client passes the JWT in the Socket.IO **handshake auth object**:
> ```ts
> socket = io("http://localhost:3000", { auth: { token: accessToken } });
> ```
> On the server, `handleConnection(client: Socket)` reads `client.handshake.auth.token`, then calls `jwtService.verify(token, { secret: JWT_ACCESS_SECRET })`. If valid, `client.data.userId` is set. If invalid, the error is caught and the client is not added to `onlineUsers`.

---

**Q12. What is the difference between HTTP and WebSocket? When would you use each?**

> | | HTTP | WebSocket |
> |---|---|---|
> | Communication | Request-Response (client initiates) | Full-duplex (both sides can send anytime) |
> | Connection | New connection per request | Persistent single connection |
> | Overhead | Headers on every request | One-time handshake, then low overhead |
> | Use case | REST APIs, CRUD, page loads | Chat, live notifications, real-time feeds |
>
> In this app: REST (HTTP) is used for auth, posts, profile, follows. WebSocket is used only for chat where the server needs to **push** messages to clients without the client polling.

---

### 🗄️ Database / TypeORM

---

**Q13. Explain the `getAllPost()` query. Why did you use QueryBuilder instead of `.find()`?**

> `.find()` can load relations but cannot compute **aggregated subquery values** like `COUNT(likes)` per post in a single SQL call. We'd need N+1 queries (one per post).
>
> `QueryBuilder` lets us write a **single SQL query** with correlated subqueries:
> ```sql
> SELECT post.*, user.*,
>   (SELECT COUNT(*) FROM likes WHERE post_id = post.id) AS likeCount,
>   (SELECT COUNT(*) FROM comments WHERE post_id = post.id) AS commentCount,
>   (SELECT COUNT(*) FROM follows WHERE follower_id = currentUserId AND following_id = user.id) AS isFollowing
> FROM posts post
> LEFT JOIN users user ON user.id = post.userId
> ```
> This returns everything in **one round-trip** to the database, which is significantly more performant.

---

**Q14. What is the relationship between User and FollowEntity? Explain `ManyToOne` here.**

> A `FollowEntity` represents one follow relationship: `follower` (who is following) → `following` (who is being followed).
>
> From the User's perspective:
> - `user.followers` → all FollowEntity records where `following = this user` (people following me)
> - `user.following` → all FollowEntity records where `follower = this user` (people I follow)
>
> `@ManyToOne` on FollowEntity means: many follow records can reference the same user. One user can have thousands of followers (thousands of FollowEntity rows all pointing to them). It is a classic **junction-style** relationship for a social graph.

---

**Q15. What does `synchronize: true` do in TypeORM? Why would you disable it in production?**

> `synchronize: true` tells TypeORM to automatically compare your entity definitions against the actual database schema on every application start and **apply any differences** (create tables, add/remove columns, change types).
>
> In **production**, this is dangerous because:
> - Dropping a column you removed from an entity **permanently deletes that data**
> - Running migrations in parallel during rolling deploys can corrupt the schema
> - A typo in an entity could silently destroy a column
>
> In production, use **TypeORM Migrations** instead: explicitly write SQL migration files, review them, and apply them deliberately with `typeorm migration:run`.

---

**Q16. How did you handle the "conversation already exists" case in the chat module?**

> `createConversation()` is **idempotent** — calling it multiple times with the same two users always returns the same conversation.
>
> It uses a QueryBuilder query to find an existing `DIRECT` conversation that has **both** users as members:
> ```sql
> SELECT conversation FROM conversations
> LEFT JOIN conversation_members ON ...
> WHERE conversation.type = 'DIRECT'
>   AND member.userId IN (senderId, receiverId)
> GROUP BY conversation.id
> HAVING COUNT(DISTINCT member.userId) = 2
> ```
> If found → return it. If not → create a new conversation + two ConversationMember rows.
> This prevents duplicate conversations between the same two people.

---

**Q17. What is `getRawMany()` vs `getMany()` in TypeORM?**

> - **`getMany()`** → Returns hydrated **entity objects** with the TypeORM entity class structure. Works well for simple `select` with relations. Cannot include computed/aliased columns.
>
> - **`getRawMany()`** → Returns **plain JavaScript objects** (raw DB rows) with columns named by their aliases (`post_id`, `likeCount`, etc.). Required when using `addSelect` with subqueries or aggregate functions, because TypeORM does not know how to map custom computed columns to entity properties.
>
> In `getAllPost()`, we use `getRawMany()` because the query includes computed subquery columns (`likeCount`, `commentCount`, `isFollowing`) that are not part of the `PostEntity` class.

---

### ☁️ Cloudinary / File Upload

---

**Q18. How does Multer work in your backend? What is `file.buffer`?**

> **Multer** is an Express middleware for handling `multipart/form-data` (file uploads). In NestJS it is used via `FileInterceptor` or `FilesInterceptor`.
>
> When configured with `memoryStorage()` (no disk writes), Multer loads the entire uploaded file into RAM and exposes it as `file.buffer` — a `Buffer` object containing the raw binary file data.
>
> In the Cloudinary service, we pipe this buffer directly to Cloudinary's `upload_stream()`:
> ```ts
> cloudinary.uploader.upload_stream({folder: "instagram"}, callback).end(file.buffer);
> ```
> This streams the file from memory to Cloudinary without ever writing to disk — faster and cleaner.

---

**Q19. Why do you store `publicId` along with the image URL?**

> The Cloudinary `secure_url` (e.g., `https://res.cloudinary.com/.../photo.jpg`) is what you display in the UI.
>
> The `publicId` (e.g., `instagram/abc123`) is Cloudinary's internal identifier needed to **delete or transform** the image later. Without it, you would have no way to remove images from Cloudinary when a post is deleted — leading to orphaned files and wasted storage costs.
>
> Both are stored in the `images` JSON column: `[{ url, publicId }, ...]`.

---

**Q20. What happens to Cloudinary images when a post is deleted?**

> The `delete()` method in PostService:
> 1. Fetches the post with its `images` array
> 2. Verifies ownership (`ForbiddenException` if not owner)
> 3. Loops through each image and calls `cloudinaryService.deleteImage(image.publicId)` — which calls `cloudinary.uploader.destroy(publicId)`
> 4. Only after all images are removed from Cloudinary does it call `postRepository.remove(post)`
>
> This ensures **no orphaned images** accumulate in Cloudinary storage. A weakness: if Cloudinary delete fails mid-loop, the post is still deleted from DB but some images remain in Cloudinary.

---

### 🏗️ Architecture / NestJS

---

**Q21. What is the difference between a NestJS Module, Service, and Controller?**

> | | Role | Example |
> |---|---|---|
> | **Module** | Groups related code, declares what is provided/exported/imported | `PostModule` |
> | **Controller** | Handles HTTP requests, maps routes to methods, validates input | `PostController` |
> | **Service** | Contains business logic, talks to DB, third-party APIs | `PostService` |
>
> A request hits the Controller → Controller calls the Service → Service uses TypeORM Repository → returns to Controller → Controller sends response. The Module wires them together via NestJS's DI container.

---

**Q22. What is Dependency Injection and how does NestJS handle it?**

> **Dependency Injection (DI)** is a design pattern where a class declares its dependencies in its constructor, and the framework creates and injects those dependencies — rather than the class creating them itself.
>
> NestJS uses a **DI container** powered by TypeScript metadata. When you declare:
> ```ts
> constructor(private readonly postService: PostService) {}
> ```
> NestJS sees that `PostController` needs a `PostService`, finds it (registered in the module's `providers`), instantiates it (once as a singleton), and passes it in. This makes code **testable** (you can inject mocks) and **decoupled** (controller does not care how PostService is built).

---

**Q23. What is a DTO (Data Transfer Object)? Why use it?**

> A **DTO** is a plain TypeScript class that defines the shape of data coming into an API endpoint. Example:
> ```ts
> export class RegisterDto {
>   name: string;
>   username: string;
>   email: string;
>   password: string;
> }
> ```
> Combined with `class-validator` decorators (`@IsEmail()`, `@MinLength(8)`), NestJS's `ValidationPipe` automatically validates incoming request bodies and returns `400 Bad Request` if they do not match — before the service even runs.
>
> Benefits: input validation, type safety, clear API contract, prevents mass-assignment vulnerabilities.

---

**Q24. How did you structure your NestJS application? Why separate modules?**

> Each feature (auth, post, chat, etc.) is its own **NestJS module** with its own Controller, Service, and Entities. This follows the **Single Responsibility Principle**:
> - `AuthModule` knows only about authentication
> - `PostModule` knows only about posts
> - They communicate only through their exported services (e.g., `PostModule` imports `CloudinaryModule` to use `CloudinaryService`)
>
> Benefits: **easy to maintain** (a bug in chat does not touch auth), **easy to test** (mock only what the module needs), **easy to scale** (could split into microservices later).

---

**Q25. What is the difference between `@Body()`, `@Req()`, and `@Param()` decorators?**

> | Decorator | What it extracts |
> |---|---|
> | `@Body()` | The JSON request body (e.g., `{ email, password }`) |
> | `@Param('id')` | A route path parameter (e.g., `/post/:id`) |
> | `@Query('page')` | A query string parameter (e.g., `?page=2`) |
> | `@Req()` | The full Express `Request` object (used for cookies, IP, user after guards) |
> | `@Res()` | The full Express `Response` object (used to set cookies, status codes) |

---

### ⚛️ Frontend / React + Redux

---

**Q26. What is RTK Query? How is it different from using `axios` + `useEffect`?**

> **RTK Query** is a data-fetching and caching tool built into Redux Toolkit. You define API endpoints declaratively, and RTK Query generates React hooks automatically.
>
> | Feature | axios + useEffect | RTK Query |
> |---|---|---|
> | Caching | Manual | Automatic (by tag/key) |
> | Loading/Error state | Manual (`useState`) | Built-in (`isLoading`, `isError`) |
> | Cache invalidation | Manual (re-fetch triggers) | Declarative (`invalidatesTags`) |
> | Deduplication | Manual | Automatic (same query = same cache) |
> | Optimistic updates | Complex | Built-in support |
>
> RTK Query eliminates most of the boilerplate and race conditions that come with manual data fetching.

---

**Q27. What are `tagTypes` in RTK Query? How does cache invalidation work?**

> `tagTypes` are labels you define to group cached data. When a mutation runs, you tell RTK Query which tags to `invalidate` — triggering a re-fetch of all queries that `provide` those tags.
>
> Example from this project:
> ```ts
> tagTypes: ["Posts", "Comments", "Profile", "Follow", "Conversation"]
> ```
> - `getPosts` query → `providesTags: ['Posts']`
> - `createPost` mutation → `invalidatesTags: ['Posts']`
>
> After `createPost` succeeds, RTK Query automatically re-fetches `getPosts` because its `'Posts'` tag was invalidated. This keeps the UI in sync without manually calling re-fetch.

---

**Q28. Why did you use a singleton pattern for the Socket.io connection?**

> In `socket.ts`:
> ```ts
> let socket: Socket | null = null;
> export const connectSocket = (token) => {
>   if (socket) return socket; // reuse existing
>   socket = io(...);
>   return socket;
> };
> ```
> Without this guard, every time a component mounts (or the user navigates), a **new WebSocket connection** would be opened. This would:
> - Create duplicate `onlineUsers` entries on the server
> - Receive duplicate messages
> - Waste server resources
>
> The singleton ensures only **one connection** exists per browser session.

---

**Q29. What is `credentials: "include"` in the fetch base query? Why is it needed?**

> By default, `fetch` (and RTK Query's `fetchBaseQuery`) does **not** send cookies with cross-origin requests. Since the frontend (localhost:5173) and backend (localhost:3000) are on different ports (different origins), without `credentials: "include"`, the httpOnly refresh token cookie would never be sent.
>
> `credentials: "include"` instructs the browser to attach all cookies to every request, even cross-origin — which is essential for the refresh token flow to work.
>
> This must be paired with the backend's CORS configuration allowing the specific origin with `credentials: true`.

---

**Q30. How does the `CreatePostModal` component manage state? What is the flow from image selection to API call?**

> `CreatePostModal` uses two `useState` hooks:
> - `images: File[]` — tracks selected image files
> - `caption: string` — tracks the text caption
>
> Flow:
> 1. **No images** → renders `<ImageUploader setImages={setImages} />` (file input)
> 2. **Images selected** → renders `<ImagePreview images={images} onRemove={...} />` (preview + remove)
> 3. `<CaptionInput>` always visible for the text
> 4. `<CreatePostFooter images={images} caption={caption}>` has the Submit button which calls the RTK Query `createPost` mutation
> 5. Mutation sends `multipart/form-data` with images + caption to `POST /post`
> 6. On success → `invalidatesTags: ['Posts']` → feed re-fetches automatically

---

### 🐳 DevOps

---

**Q31. Explain your Docker Compose setup. What does `depends_on` ensure?**

> The `docker-compose.yml` defines 3 services:
> - **postgres** — PostgreSQL 17 container with a named volume for persistent data
> - **backend** — NestJS app, `depends_on: postgres` → Compose starts postgres first
> - **frontend** — React app built and served by Nginx, `depends_on: backend`
>
> **Important caveat**: `depends_on` only ensures the container **starts** before the dependent one — it does NOT wait for the service inside to be **ready** (e.g., PostgreSQL accepting connections). In production, you would add a health check:
> ```yaml
> healthcheck:
>   test: ["CMD-SHELL", "pg_isready -U postgres"]
> ```
> and use `condition: service_healthy`.

---

**Q32. Why is the frontend served via Nginx in Docker instead of `npm run dev`?**

> `npm run dev` (Vite dev server) is designed for **development**: it serves files with hot module replacement, source maps, and no optimization. It is not suitable for production.
>
> In Docker (production):
> 1. `docker build` runs `npm run build` → Vite compiles React into static HTML/CSS/JS in `dist/`
> 2. Nginx serves those static files — it is extremely fast, handles concurrent connections efficiently, and can be configured with caching headers, gzip, and SSL
> 3. Port `5173:80` maps Docker's internal Nginx port 80 to host port 5173

---

**Q33. What is the `postgres_data` volume for? What happens if you remove it?**

> The `postgres_data` volume is a **named Docker volume** that maps PostgreSQL's data directory (`/var/lib/postgresql/data`) to a persistent location on the host machine.
>
> Without it, all database data lives inside the container's writable layer. When `docker compose down` is run, the container is destroyed and **all data is permanently lost**.
>
> With the volume, data persists across container restarts/rebuilds. Running `docker compose down -v` explicitly removes the volume (and data) — a destructive action you would never do in production.

---

## 📄 4. Resume Bullet Points

### ✅ 4-Bullet Version (Recommended — for tight resume space)

```
### 📸 Instagram Clone — Full-Stack Social Media App
**Tech Stack:** NestJS, TypeScript, PostgreSQL, TypeORM, React, RTK Query, Socket.IO, Cloudinary, Docker

- Architected a modular NestJS REST API using Dependency Injection and Separation of Concerns, implementing authentication, posts, likes, comments, follows, and chat modules.
- Implemented JWT access and refresh token authentication, bcrypt password hashing, httpOnly cookies, and email OTP verification with expiry and replay protection.
- Developed real-time one-to-one chat using Socket.IO and implemented Nodemailer email notifications for offline recipients.
- Built optimized social feed queries using TypeORM QueryBuilder to retrieve posts along with like counts, comment counts, and follow status; integrated Cloudinary image uploads and Docker Compose for full-stack containerization.
```

---

## ⚠️ 5. What's Wrong & How to Improve It

> This section is based on a **line-by-line audit** of the actual source code. Each issue links to the exact file and explains the real impact.

---

### 🐛 Real Bugs Found in the Code

---

#### BUG 1 — `getProfile()` always returns `followers: 0` and `following: 0`

**File**: `user.service.ts` lines 210-211

```ts
// ❌ WRONG — hardcoded zeros, never queries the DB
return {
  followers: 0,
  following: 0,
};
```

**Impact**: The logged-in user's own profile page always shows **0 followers and 0 following**, even if they have hundreds. There are *two* profile methods — `getProfile()` (for own profile) and `getUserProfile()` (for visiting another user). `getUserProfile()` correctly queries the follow counts, but `getProfile()` was never updated. Classic copy-paste omission.

**Fix**:
```ts
// ✅ Query the DB like getUserProfile() does
const followers = await this.followRepository.count({ where: { following: { id: userId } } });
const following = await this.followRepository.count({ where: { follower: { id: userId } } });
return { ...userData, followers, following };
```

---

#### BUG 2 — Unused `OneToMany` import in `follow.entity.ts`

**File**: `follow.entity.ts` line 6

```ts
// ❌ OneToMany is imported but NEVER used in this file
import {
  Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn,
  OneToMany,  // ← dead import
} from 'typeorm';
```

**Impact**: No runtime crash, but it's dead code that indicates `FollowEntity` was originally planned to have children (e.g., follow notifications) but never completed. Misleads future readers into thinking there's a relationship here.

**Fix**: Remove `OneToMany` from the import statement.

---

#### BUG 3 — `auth.module.ts` declares `15m` expiry, but `auth.service.ts` issues **6-day** access tokens

**File 1**: `auth.module.ts` line 34 | **File 2**: `auth.service.ts` line 156

```ts
// auth.module.ts — JwtModule default (says 15 minutes)
signOptions: { expiresIn: '15m' }

// auth.service.ts — per-call override (silently overrides to 6 days!)
{ secret: process.env.JWT_ACCESS_SECRET, expiresIn: '6d' }
```

**Impact**: The module config says 15 minutes but tokens actually live **6 days**. A 6-day access token means if it's stolen via XSS, an attacker has 6 days of unrevokable access. Access tokens should be short-lived (15 min) and rely on the refresh token for silent renewal.

**Fix**: Align both to `'15m'`. Implement the `baseQueryWithReauth` pattern on the frontend so RTK Query auto-refreshes when it gets a 401.

---

#### BUG 4 — `socket.ts` sets `socket = null` on disconnect, but components holding a reference get a dead socket

**File**: `socket.ts` lines 20-22

```ts
socket.on("disconnect", () => {
  socket = null;  // ← singleton is cleared
});
```

**Impact**: If the socket disconnects (network blip, server restart), the singleton becomes `null`. However, if a component stored the socket reference from an earlier `connectSocket()` call, it now holds a **stale dead socket** and messages are silently dropped. Socket.IO's built-in reconnection is not being used.

**Fix**: Rely on Socket.IO's built-in `reconnection: true` (default). Components should always read from the singleton function, not store the reference locally.

---

#### BUG 5 — `profileApi.ts` is a completely empty file

**File**: `profileApi.ts` (0 bytes)

**Impact**: Profile-related API calls are scattered across `authApi.ts` (mixing auth endpoints with profile queries like `getProfile` and `getUserProfile`). This is an unfinished architecture inconsistency — the file was created but never implemented.

**Fix**: Either populate `profileApi.ts` with profile endpoints and move them out of `authApi.ts`, or delete it. Auth endpoints (register, login, logout) and profile endpoints (getProfile, updateProfile) should not live in the same API slice.

---

#### BUG 6 — `deletePost` uses a `DELETE` request with a JSON body

**File**: `post.controller.ts` line 51 | `postApi.ts` lines 18-25

```ts
// Backend — DELETE with @Body() is non-RESTful
@Delete('deletepost')
async deletePost(@Body() body: { postId: string }) { ... }

// Frontend — sending body on a DELETE request
url: `/post/deletepost`, method: "DELETE", body: { postId }
```

**Impact**: `DELETE` requests with a body are technically allowed by HTTP but widely unsupported or ignored by proxies, CDNs (like Cloudflare), and some HTTP clients. This is also non-RESTful design — the resource ID should be in the URL path.

**Fix**:
```ts
// ✅ RESTful — put the ID in the route param
@Delete(':id')
deletePost(@Param('id') postId: string, @Req() req: Request) { ... }

// Frontend
url: `/post/${postId}`, method: "DELETE"  // no body needed
```

---

#### BUG 7 — Duplicate `@UseGuards(JwtGaurd)` on the same route in `chat.controller.ts`

**File**: `chat.controller.ts` lines 17 and 28

```ts
@Controller("chat")
@UseGuards(JwtGaurd)   // ← Applied at class level (covers ALL routes)
export class ChatController {
  ...
  @Post("conversation")
  @UseGuards(JwtGaurd)  // ← Redundant — already covered by the class-level guard
  createConversation(...) { }
}
```

**Impact**: No functional bug, but it's dead/redundant code. It confuses readers into thinking the class-level guard doesn't apply to this route specifically.

**Fix**: Remove the method-level `@UseGuards(JwtGaurd)` from `createConversation`.

---

#### BUG 8 — `jwt.strategy.ts` has 50+ lines of dead commented-out code

**File**: `jwt.strategy.ts` lines 30-78

```ts
// for frontend
// import { Injectable } from "@nestjs/common";
// ... (50+ lines of old strategy versions)
```

**Impact**: No runtime impact, but it's a code quality smell. Dead commented-out code creates noise in code reviews and makes the active logic harder to find. This is what `git log` is for.

**Fix**: Delete all commented-out code below line 27.

---

### 🔐 Security Issues

---

#### SEC 1 — WebSocket CORS is `origin: '*'` (accepts any origin)

**File**: `chat.gateway.ts` lines 17-21

```ts
@WebSocketGateway({
  cors: { origin: '*' }  // ← allows ANY website to connect
})
```

**Impact**: Any website in the world can open a WebSocket connection to your server. If they have a valid JWT (e.g., phishing attack), they can impersonate that user in real-time. In production this must be locked to your frontend domain.

**Fix**:
```ts
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
})
```

---

#### SEC 2 — No `ValidationPipe` applied globally in `main.ts`

**File**: `main.ts`

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({ ... });
  // ← No app.useGlobalPipes(new ValidationPipe())
  await app.listen(3000);
}
```

**Impact**: Even though `LoginDto` has `@IsEmail()` and `@IsNotEmpty()` decorators, **they are never enforced** because `ValidationPipe` is not registered. Anyone can send `email: 12345` or `password: null` and the backend accepts it without complaint.

**Fix**:
```ts
import { ValidationPipe } from '@nestjs/common';
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

---

#### SEC 3 — `RegisterDto` has zero `class-validator` decorators

**File**: `Register.dto.ts`

```ts
export class RegisterDto {
  name!: string;     // ← no @IsString(), no @MinLength()
  email!: string;    // ← no @IsEmail()
  username!: string; // ← no @IsAlphanumeric(), no length check
  password!: string; // ← no @MinLength(8), no strength check
}
```

**Impact**: Even after fixing SEC 2, `RegisterDto` would pass all garbage input without validation. A user can register with `email: "notanemail"`, `password: "a"`, or a numeric `name`.

**Fix**: Add `class-validator` decorators to every field:
```ts
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
export class RegisterDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(3) username!: string;
  @IsString() @MinLength(8) password!: string;
}
```

---

#### SEC 4 — `PATCH /:id` and `DELETE /:id` on `user.controller.ts` have NO `@UseGuards`

**File**: `user.controller.ts` lines 66-74

```ts
@Patch(':id')  // ← NO @UseGuards — anyone can update any user
update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  return this.userService.update(id, updateUserDto);
}

@Delete(':id')  // ← NO @UseGuards — anyone can delete any user
remove(@Param('id') id: string) {
  return this.userService.remove(id);
}
```

**Impact**: 🚨 **Critical vulnerability.** Any unauthenticated HTTP request can update or delete any user account just by knowing their UUID. This effectively gives admin-level privileges to everyone.

**Fix**: Add `@UseGuards(JwtGaurd)` AND verify the authenticated `req.user.id` matches the `:id` param before performing the operation.

---

#### SEC 5 — `findAll()` returns raw `UserEntity` including `password` hash and `refreshToken`

**File**: `user.controller.ts` line 21 → `user.service.ts` line 170

```ts
async findAll() {
  return await this.userRepository.find(); // returns everything including password & refreshToken
}
```

**Impact**: Even with `@UseGuards`, all authenticated users can call `GET /user/getall` and receive every user's bcrypt password hash and hashed refresh token. While bcrypt hashes can't be reversed easily, this is an information disclosure vulnerability.

**Fix**: Select only safe fields:
```ts
return await this.userRepository.find({
  select: ['id', 'name', 'username', 'bio', 'profilePicture', 'createdAt']
});
```

---

### 🏗️ Architecture & Code Quality Issues

---

#### ARCH 1 — `getAllPost()` has no `ORDER BY` — feed order is non-deterministic

**File**: `post.service.ts` line 65 (the `getRawMany()` call, no `.orderBy()`)

```ts
const posts = await this.postRepository
  .createQueryBuilder("post")
  // ... subqueries ...
  .getRawMany();  // ← No ORDER BY — DB returns rows in undefined order
```

**Impact**: The feed is currently returned in roughly insertion order, but SQL makes **no guarantee** about row order without `ORDER BY`. After any DB reindex, VACUUM, or parallel inserts, the order can change arbitrarily. Note that `getUserPosts()` already uses `.orderBy("post.createdAt", "DESC")` correctly.

**Fix**: Add `.orderBy("post.createdAt", "DESC")` to `getAllPost()`.

---

#### ARCH 2 — Post creation has no transaction — partial failure = orphaned Cloudinary images

**File**: `post.service.ts` lines 223-245

```ts
// Upload images one by one (no transaction)
for (const file of files) {
  const uploadedImage = await this.cloudinaryService.uploadImage(file);
  images.push({ url: uploadedImage.secure_url, publicId: uploadedImage.public_id });
}
// If this DB save throws, the Cloudinary images above are orphaned forever
return await this.postRepository.save(post);
```

**Impact**: If 2 of 3 images upload to Cloudinary and then the DB save fails — those 2 images are permanently abandoned in Cloudinary (wasted storage you're billed for). The same partial-failure problem exists in `delete()` — if a Cloudinary delete fails mid-loop, the post is still removed from DB but some images linger in Cloudinary.

**Fix**: Upload all images first. Wrap the DB operation in a `try/catch`. On failure, loop through the successfully uploaded images and call `cloudinaryService.deleteImage()` to roll back Cloudinary.

---

#### ARCH 3 — `sendMessage` fetches the sender from the DB twice per message

**File**: `chat.service.ts` lines 118 and 123

```ts
async sendMessage(senderId, dto) {
  // createConversation() fetches sender at line ~39
  const conversation = await this.createConversation(senderId, dto.receiverId);
  // Then fetches sender AGAIN here
  const sender = await this.userRepository.findOne({ where: { id: senderId } });
```

**Impact**: Every sent message causes 2 redundant DB queries for the same user. In a chat-heavy app this adds unnecessary latency and DB load.

**Fix**: Extract sender lookup before calling `createConversation()` and pass the entity down, or return the sender from `createConversation()`.

---

#### ARCH 4 — `getUserProfile()` makes 5 separate DB queries for one page load

**File**: `user.service.ts` lines 96-165

```ts
const user = await this.userRepository.findOne(...);      // Query 1
const posts = await this.postRepository.count(...);       // Query 2
const followers = await this.followRepository.count(...); // Query 3
const following = await this.followRepository.count(...); // Query 4
const isFollowing = await this.followRepository.findOne(...); // Query 5
```

**Impact**: 5 sequential round-trips to the DB for a single profile view. Should be 1 `QueryBuilder` query with subqueries (same pattern already used successfully in `getAllPost()`).

---

#### ARCH 5 — Frontend `baseUrl` and socket URL are hardcoded to `localhost`

**File**: `api.ts` line 7 | `socket.ts` line 10

```ts
baseUrl: "http://localhost:3000"   // api.ts
socket = io("http://localhost:3000", ...)  // socket.ts
```

**Impact**: Works on your machine. Breaks in every other environment (Docker, staging, production, teammate's laptop) without a code rebuild.

**Fix**: Use Vite environment variables:
```ts
// api.ts
baseUrl: import.meta.env.VITE_API_URL

// socket.ts
socket = io(import.meta.env.VITE_API_URL, ...)
```
Create `.env` and `.env.production` files accordingly.

---

#### ARCH 6 — Docker Compose has no PostgreSQL health check — backend crashes on cold start

**File**: `docker-compose.yml` lines 21-23

```yaml
depends_on:
  - postgres  # waits for container START, not for Postgres to be READY
```

**Impact**: NestJS starts and tries to connect to PostgreSQL while PostgreSQL is still initializing its data directory. This causes `ECONNREFUSED` on the first `docker compose up` and the backend container crashes. You need to `docker compose restart backend` or get lucky with timing.

**Fix**:
```yaml
# postgres service
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
  interval: 5s
  retries: 5

# backend service
depends_on:
  postgres:
    condition: service_healthy
```

---

#### ARCH 7 — `followUser` and `unfollowUser` mutations don't invalidate the `"Profile"` tag

**File**: `followApi.ts` lines 11 and 19

```ts
followUser: builder.mutation({
  invalidatesTags: ["Posts"],  // ← "Profile" missing — follower count stays stale
}),
unfollowUser: builder.mutation({
  invalidatesTags: ["Posts"],  // ← same
}),
```

**Impact**: When you follow or unfollow a user, the follower/following counts on the profile page **never update** until the user manually reloads, because the `"Profile"` RTK Query cache tag is never invalidated.

**Fix**:
```ts
invalidatesTags: ["Posts", "Profile", "Follow"]
```

---

### 📋 Summary Table

| # | Severity | File | Issue | Impact |
|---|---|---|---|---|
| BUG 1 | 🔴 High | `user.service.ts:210` | `followers: 0` hardcoded in `getProfile()` | Own profile always shows 0 followers/following |
| BUG 2 | 🟡 Low | `follow.entity.ts:6` | Unused `OneToMany` import | Dead / misleading code |
| BUG 3 | 🔴 High | `auth.service.ts:156` | Access token lives 6 days | Stolen token usable for 6 days with no revocation |
| BUG 4 | 🟠 Medium | `socket.ts:20` | Socket `null` on disconnect | Stale socket reference = silent message drops |
| BUG 5 | 🟡 Low | `profileApi.ts` | Empty file | Profile APIs in wrong module (authApi) |
| BUG 6 | 🟠 Medium | `post.controller.ts:51` | DELETE request with JSON body | Non-RESTful, breaks with some proxies & CDNs |
| BUG 7 | 🟡 Low | `chat.controller.ts:28` | Duplicate `@UseGuards` decorator | Redundant dead code |
| BUG 8 | 🟡 Low | `jwt.strategy.ts:30` | 50+ lines commented-out code | Code noise, confusing |
| SEC 1 | 🔴 High | `chat.gateway.ts:19` | WebSocket CORS `origin: '*'` | Any site can open authenticated WS connections |
| SEC 2 | 🔴 High | `main.ts` | No global `ValidationPipe` | All DTO validation silently skipped |
| SEC 3 | 🔴 High | `Register.dto.ts` | No class-validator decorators | Garbage input accepted at registration |
| SEC 4 | 🚨 Critical | `user.controller.ts:66` | No auth guard on `PATCH/DELETE :id` | Anyone can update or delete any user account |
| SEC 5 | 🔴 High | `user.controller.ts:21` | `findAll()` returns password hashes | Sensitive data leak to all authenticated users |
| ARCH 1 | 🟠 Medium | `post.service.ts:27` | Feed has no `ORDER BY` | Non-deterministic post order |
| ARCH 2 | 🟠 Medium | `post.service.ts:223` | No transaction on post create | Cloudinary orphan images on DB failure |
| ARCH 3 | 🟡 Low | `chat.service.ts:123` | Sender fetched from DB twice per message | Extra latency + DB load per message |
| ARCH 4 | 🟡 Low | `user.service.ts:96` | 5 separate DB queries for one profile page | Avoidable performance overhead |
| ARCH 5 | 🔴 High | `api.ts:7`, `socket.ts:10` | Hardcoded `localhost` URLs | Breaks in any deployed / non-local environment |
| ARCH 6 | 🟠 Medium | `docker-compose.yml:21` | No PostgreSQL health check | Backend crashes on cold start, requires manual restart |
| ARCH 7 | 🟠 Medium | `followApi.ts:11` | Follow mutations don't invalidate `"Profile"` tag | Follower counts stay stale until manual page reload |

---

## ✅ 6. Strengths to Highlight

- ✅ **Full-stack TypeScript** — consistent types across the entire codebase
- ✅ **Real-time WebSocket** — most junior projects skip this entirely
- ✅ **Dual-token auth with bcrypt-hashed refresh token** — shows security-first thinking
- ✅ **OTP email verification with replay protection** — real-world onboarding pattern
- ✅ **Cloudinary + streaming upload via Multer memory buffer** — external API integration without touching disk
- ✅ **Docker Compose full stack containerization** — deployable environment from day one
- ✅ **RTK Query with tag-based cache invalidation** — modern React data fetching beyond basic `useEffect + axios`
- ✅ **TypeORM QueryBuilder with correlated subqueries** — eliminates N+1 on the feed query
- ✅ **Multi-tab socket support** via `Map<userId, Set<socketId>>` — thoughtful WebSocket architecture
- ✅ **Idempotent `createConversation()`** — prevents duplicate conversations between the same two users
