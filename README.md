# Blogger — MERN Publishing Platform

A full-stack editorial publishing platform built with MongoDB, Express.js, React 19, and Node.js. Features dual-token JWT authentication with atomic rotation, HTTP-only cookie security, Role-Based Access Control (RBAC), an editorial markdown editor, server-side search and pagination, and an administrative dashboard.

---

## 1. Environment Setup

Configure backend environment variables by copying the template:
```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `9001` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/blog_db` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secret keys for JWT signing | *(Defined in .env)* |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token durations | `15m` / `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:3000` |
| `ADMIN_SECRET_KEY` | Secret required for admin registration | `super_secret_admin_key_for_blog_2026` |

---

## 2. Installation & Getting Started

### Prerequisites
- Node.js (v18+ or v20+) & npm
- MongoDB instance (local or MongoDB Atlas)

### Setup & Run
```bash
# 1. Clone repository
git clone https://github.com/Dipronil1998/Tech-Exactly-blog.git && cd Tech-Exactly-blog

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Start Backend API (runs on http://localhost:9001)
cd ../backend && npm run dev

# 4. Start Frontend Client (runs on http://localhost:3000)
cd ../frontend && npm run dev
```

---

## 3. Feature Explanations

- **Authentication & Dual-Token Security**: Short-lived Access Tokens (15m) + long-lived Refresh Tokens (7d) stored in `HttpOnly`, `SameSite=Lax` cookies. Atomic token rotation in MongoDB with a client-side concurrency mutex prevents replay attacks and race conditions.
- **Role-Based Access Control (RBAC)**: Supports `user` and `admin` roles. Users manage their own articles and comments; admins access the `/admin` dashboard with global metrics (`/api/admin/stats`), user role management, and content moderation.
- **Editorial Publishing & Markdown**: Markdown editor (`/write`) with formatting toolbar, real-time preview, read-time calculation, draft saving, and auto-redirect to homepage upon publish.
- **Slugs & Soft Deletes**: Automatic URL-friendly slug generation with collision handling. Soft deletion (`isDeleted`, `deletedAt`) preserves audit trails with a dedicated restore endpoint (`PATCH /api/posts/:id/restore`).
- **Comments System**: Threaded post comments via Mongoose references with virtual populate and author ownership checks.
- **Search, Pagination & Themes**: Server-side debounced search, responsive pagination, and persistent Dark/Light theme switching.

---

## 4. API Documentation Overview

Interactive Swagger UI documentation is available at **`http://localhost:9001/api/docs`** (JSON spec at `/api/docs.json`).

| Category | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Public | Register user (`role: admin` requires `adminSecret`) |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user & issue tokens / cookie |
| **Auth** | `POST` | `/api/auth/refresh` | Public | Rotate refresh token & issue new access token |
| **Auth** | `POST` | `/api/auth/logout` | Public | Revoke refresh token & clear HTTP-only cookie |
| **Auth** | `GET` | `/api/auth/me` | User | Get current authenticated user profile |
| **Posts** | `GET` | `/api/posts` | Public | List published posts with `search`, `page`, and `limit` |
| **Posts** | `GET` | `/api/posts/:idOrSlug` | Public | Get single post by MongoDB ID or slug |
| **Posts** | `POST` | `/api/posts` | User | Create new blog post with auto-slug |
| **Posts** | `PUT` / `DELETE` | `/api/posts/:id` | Author / Admin | Update or soft-delete post |
| **Posts** | `PATCH` | `/api/posts/:id/restore` | Author / Admin | Restore a soft-deleted post |
| **Comments** | `GET` / `POST` | `/api/posts/:postId/comments` | Public / User | View or create comments on a post |
| **Comments** | `PUT` / `DELETE` | `/api/comments/:id` | Author / Admin | Edit or delete a comment |
| **Admin** | `GET` | `/api/admin/stats` | Admin | Real-time platform metrics (users, posts, comments) |
| **Admin** | `GET` / `PUT` | `/api/users`, `/api/users/:id/role` | Admin | List users and promote/demote roles |
| **Admin** | `DELETE` | `/api/users/:id` | Admin | Delete user account and cascade delete posts |

---

## 5. Testing

Run the automated in-memory MongoDB test suite (135+ tests passing):
```bash
cd backend && npm test
