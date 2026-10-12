# Blog Backend - Authentication Service

A secure, production-ready User Authentication module built with **Express.js**, **MongoDB (Mongoose)**, **JWT**, and **bcryptjs**.

---

## Features Implemented

1. **User Registration & Schema Validation (Zod)**
   - Request payloads validated and sanitized using [Zod](https://zod.dev).
   - Validates required fields, password length (minimum 6 characters), valid email format, and allowed username characters.
   - Hashing with `bcryptjs` using 12 salt rounds via Mongoose pre-save hooks.
   - Hashed password and refresh tokens are excluded by default (`select: false` and custom `toJSON`).

2. **User Login & Session Management**
   - Authenticates via email or username.
   - Compares passwords using `bcrypt.compare`.
   - Issues short-lived JWT Access Tokens (15m) and long-lived Refresh Tokens (7d).
   - Supports multi-device sessions (stores up to 5 active device sessions per user).

3. **JWT Access & Refresh Token Rotation**
   - Refresh tokens are transmitted via **HTTP-only, SameSite cookies** to prevent XSS attacks.
   - Each refresh token contains a unique `jti` (JWT ID) to prevent collisions and replay attacks.
   - Refresh token rotation: Every call to `/api/auth/refresh` invalidates the old refresh token and issues a new pair.

4. **User Logout & Token Invalidation**
   - Revokes the refresh token from the database.
   - Clears the HTTP-only cookie.

5. **Endpoint Rate Limiting**
   - Authentication endpoints (`/register`, `/login`, `/refresh`) are protected against brute-force attacks via `express-rate-limit` (15 requests per 15 minutes per IP).
   - General API endpoints are protected with a 100 requests per 15-minute limiter.

6. **Environment Variables (.env)**
   - All sensitive secrets and configurations are managed via `.env`.
   - Includes `.env.example` template.

7. **Role-Based Access Control (RBAC)**
   - Two distinct roles: **Admin** and **Regular User (`user`)**.
   - **Admins can**:
     - Manage all users (list, view, promote/demote roles, delete accounts).
     - Manage all blog posts (edit or delete any post).
   - **Regular users can**:
     - Create posts.
     - Edit and delete **only their own posts**.
   - Enforced strictly at the API and middleware level via `authorize('admin')` and `checkPostOwnershipOrAdmin`.

8. **Interactive Swagger / OpenAPI Documentation**
   - Modular OpenAPI 3.0 specification served at `/api/docs` and `/api/docs.json`.
   - Built-in Bearer JWT Authorization and cookie auth testing.

9. **Post Management, Slug Generation & Soft Deletes**
   - **Fields**: `title`, `slug`, `content`, `author`, `status`, `isDeleted`, `deletedAt`, timestamps (`createdAt`, `updatedAt`).
   - **URL-Friendly Slugs**: Automatically generated from title on save and update with duplicate collision resolution (e.g. `my-post-title-1`).
   - **Soft Deletes**: Posts are marked with `isDeleted: true` and `deletedAt: timestamp`. Soft-deleted posts are automatically hidden from public feeds and single post endpoints.
   - **Restore**: Easily restored via `PATCH /api/posts/:id/restore`.
   - **Zod Validation**: Request payloads validated for field presence, lengths, and valid types.

---

## API Endpoints

### Authentication & Documentation
| Method | Endpoint | Access | Description | Rate Limited |
|---|---|---|---|---|
| `GET` | `/api/docs` | Public | Interactive Swagger UI Documentation | No |
| `GET` | `/api/docs.json` | Public | Raw OpenAPI 3.0 JSON specification | No |
| `POST` | `/api/auth/register` | Public | Register new user (accepts optional `role` + `adminSecret`) | Yes (15 req / 15 min) |
| `POST` | `/api/auth/login` | Public | Log in with email/username & password | Yes (15 req / 15 min) |
| `POST` | `/api/auth/refresh` | Public | Obtain new access token via refresh token | Yes (15 req / 15 min) |
| `POST` | `/api/auth/logout` | Public | Revoke refresh token & clear cookie | No |
| `GET` | `/api/auth/me` | Protected | Get current authenticated user profile | General API limiter |
| `GET` | `/api/health` | Public | Service health check | General API limiter |

### User Management (Admin RBAC)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | **Admin Only** | List all users with pagination and search |
| `GET` | `/api/users/:id` | **Admin or Self** | Get user profile by ID |
| `PUT` | `/api/users/:id` | **Admin or Self** | Update profile (role changes restricted to Admin) |
| `PUT` | `/api/users/:id/role` | **Admin Only** | Promote or demote user role (`user` / `admin`) |
| `DELETE` | `/api/users/:id` | **Admin Only** | Delete a user account and cascade delete their posts |

### Posts Management (CRUD, Slugs & Soft Deletes)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/posts` | Public | List published posts with pagination, search, author filter |
| `GET` | `/api/posts/:idOrSlug` | Public | View single post by MongoDB ObjectId or URL Slug |
| `POST` | `/api/posts` | **Authenticated User** | Create new blog post (auto slug generation, author assigned) |
| `PUT` | `/api/posts/:id` | **Author or Admin** | Edit post (Regular users: own only; Admins: any post; updates slug) |
| `DELETE` | `/api/posts/:id` | **Author or Admin** | Soft delete post (sets `isDeleted: true` and `deletedAt`) |
| `PATCH` | `/api/posts/:id/restore` | **Author or Admin** | Restore a soft-deleted post |

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and customize as needed:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/blog_db` |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens | *(set in .env)* |
| `JWT_ACCESS_EXPIRES_IN` | Access token duration | `15m` |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | *(set in .env)* |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token duration | `7d` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:3000` |

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Run the Test Suite
An in-memory MongoDB test suite is included:
```bash
npm test
```
