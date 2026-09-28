# 📖 StorySpace Backend - User Manual & Architecture Documentation

Welcome to **StorySpace Backend**, a full-featured, scalable publishing and social storytelling platform built with **Node.js, Express, TypeScript, TypeORM, and PostgreSQL (hosted on Neon)**.

This manual serves as a comprehensive reference to explain the architecture, features, business rules, API endpoints, and security mechanisms to stakeholders, developers, and users.

---

## 📑 Table of Contents

1. [Executive Summary & Tech Stack](#1-executive-summary--tech-stack)
2. [System Architecture](#2-system-architecture)
3. [User Roles & Access Control Matrix](#3-user-roles--access-control-matrix)
4. [Core Features & Business Workflows](#4-core-features--business-workflows)
   - [Authentication & User Identity](#41-authentication--user-identity)
   - [Social Graph: Following & Followers](#42-social-graph-following--followers)
   - [Story Engine: Lifecycle & Visibility Controls](#43-story-engine-lifecycle--visibility-controls)
   - [Social Engagement: Likes & Comments](#44-social-engagement-likes--comments)
   - [Media & Object Storage](#45-media--object-storage)
   - [Admin Moderation & Metrics](#46-admin-moderation--metrics)
5. [Complete API Reference](#5-complete-api-reference)
6. [Validation Rules & Error Handling](#6-validation-rules--error-handling)
7. [Edge Cases Handled](#7-edge-cases-handled)
8. [Setup, Seeding & Execution Guide](#8-setup-seeding--execution-guide)

---

## 1. Executive Summary & Tech Stack

StorySpace is designed to power modern publishing with social networking capabilities (following authors, interactive feeds, follower-only exclusive stories, nested comments, and likes).

### Technology Stack:
- **Runtime**: [Node.js](https://nodejs.org/) (v18+) with [TypeScript](https://www.typescriptlang.org/) (v5+)
- **Web Framework**: [Express.js](https://expressjs.com/) (v5)
- **Database & ORM**: PostgreSQL managed via [TypeORM](https://typeorm.io/) on [Neon Serverless Postgres](https://neon.tech/)
- **Object Storage**: AWS S3 Client targeting Neon S3-compatible Blob Storage
- **Authentication**: Stateless JSON Web Tokens (JWT) & `bcryptjs` password hashing
- **Input Validation**: `Joi` with custom, user-friendly error messages

---

## 2. System Architecture

The project adheres to the **Layered Architectural Pattern (Separation of Concerns)**:

```
                  ┌────────────────────────┐
                  │    HTTP Client / UI    │
                  └───────────┬────────────┘
                              │ HTTP Request
                              ▼
                  ┌────────────────────────┐
                  │      Express Router    │
                  └───────────┬────────────┘
                              │
                  ┌───────────▼────────────┐
                  │ Middlewares (Auth,     │
                  │ Validation, Upload)    │
                  └───────────┬────────────┘
                              │ Validated DTO / Request
                              ▼
                  ┌────────────────────────┐
                  │      Controllers       │
                  └───────────┬────────────┘
                              │ Business calls
                              ▼
                  ┌────────────────────────┐
                  │        Services        │
                  └─────┬────────────┬─────┘
                        │            │
         Data Access    │            │ S3 Uploads
                        ▼            ▼
        ┌──────────────────┐    ┌────────────────────────┐
        │   Repositories   │    │     Storage Service    │
        └───────┬──────────┘    └────────────────────────┘
                │
                ▼
        ┌──────────────────┐
        │  Postgres (Neon) │
        └──────────────────┘
```

---

## 3. User Roles & Access Control Matrix

| Capability / Action | Guest (Unauthenticated) | Authenticated User | Story Author | Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **Browse Public Published Stories** | ✅ | ✅ | ✅ | ✅ |
| **View `followers_only` Story** | ❌ (403) | ✅ (If following author) | ✅ | ✅ |
| **View Unpublished Drafts** | ❌ (404) | ❌ (404) | ✅ | ✅ |
| **Create & Update Own Story** | ❌ | ✅ | ✅ | ✅ |
| **Follow / Unfollow Users** | ❌ | ✅ | ✅ | ✅ |
| **Like / Unlike Stories** | ❌ | ✅ (If story accessible) | ✅ | ✅ |
| **Comment on Stories** | ❌ | ✅ (If story accessible) | ✅ | ✅ |
| **Edit Comment** | ❌ | ❌ | ✅ (Only own comments) | ❌ |
| **Delete Comment** | ❌ | ❌ | ✅ (Comment author OR Story author) | ✅ (Global) |
| **Access Admin Panel (`/api/admin`)** | ❌ (401) | ❌ (403) | ❌ (403) | ✅ |
| **Moderate / Change Story Status** | ❌ | ❌ | ❌ | ✅ |

---

## 4. Core Features & Business Workflows

### 4.1 Authentication & User Identity
- **Registration (`POST /api/auth/register`)**: Creates an account with unique `email` and `username`. Passwords are encrypted using bcrypt with salt rounds of 10.
- **Login (`POST /api/auth/login`)**: Validates credentials and generates a signed JWT token valid for 7 days.
- **Profile Management (`PUT /api/users/profile`)**: Users can customize their display name, bio (up to 500 characters), profile avatar, and username.
- **Security Guarantee**: Password hashes are stripped before any user object is returned across all endpoints.

### 4.2 Social Graph: Following & Followers
- **Follow User (`POST /api/users/:target/follow`)**: Allows following another user by their `user_uuid` or `@username`. Self-following is blocked.
- **Unfollow User (`DELETE /api/users/:target/follow`)**: Removes the follow relationship cleanly and idempotently.
- **Follow Status (`GET /api/users/:target/is-following`)**: Checks whether the logged-in user is currently following the target.

### 4.3 Story Engine: Lifecycle & Visibility Controls
Each story has two critical lifecycle attributes:

#### 1. Story Status:
```
[ DRAFT ] ──► [ SUBMITTED ] ──► [ APPROVED ] ──► [ PUBLISHED ]
                     │
                     └──► [ REJECTED ] (with rejectionReason)
```
- **`draft`**: In-progress story visible only to the author or admin.
- **`submitted`**: Sent for administrative review.
- **`rejected`**: Disapproved by admin with feedback in `rejectionReason`.
- **`published`**: Live on the platform for readers.

#### 2. Story Visibility:
- **`public`**: Discoverable and readable by anyone on the internet.
- **`followers_only`**: Private story accessible only to confirmed followers of the author, the author themselves, or system admins.

### 4.4 Social Engagement: Likes & Comments
- **Likes**:
  - `POST /api/stories/:identifier/like`: Like a story.
  - `DELETE /api/stories/:identifier/like`: Unlike a story.
  - `POST /api/stories/:identifier/like/toggle`: 1-click toggle for UI like buttons.
- **Comments**:
  - `POST /api/stories/:identifier/comments`: Add a comment.
  - `PUT /api/comments/:id`: Edit own comment content.
  - `DELETE /api/comments/:id`: Tripartite deletion permission (Comment Author, Story Author, or Admin).

### 4.5 Media & Object Storage
- **Upload (`POST /api/upload/image`)**:
  - Accepts image files under key `image` (JPEG, PNG, WEBP, GIF).
  - Validates max file size: **5MB**.
  - Automatically uploads to Neon S3 storage organized by subfolders (`/stories` or `/avatars`).

### 4.6 Admin Moderation & Metrics
- **Platform Analytics (`GET /api/admin/stats`)**: Overview of total user count, stories breakdown by status, total comments, and total likes.
- **User Directory (`GET /api/admin/users`)**: Search and manage users with role definitions.
- **Story Status Moderation (`PUT /api/admin/stories/:identifier/status`)**: Allows administrators to approve, reject, publish, or revert stories.

---

## 5. Complete API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | None | Register new user account |
| `POST` | `/api/auth/login` | None | Login user & retrieve JWT token |
| `GET` | `/api/auth/me` | Bearer | Get current user profile |
| `POST` | `/api/auth/edit-profile` | Bearer | Edit profile fields |

### 👤 Users & Social Graph (`/api/users`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/users/list` | None | Get paginated public directory of users |
| `GET` | `/api/users/:username` | None | Get public user profile with follower counts |
| `PUT` | `/api/users/profile` | Bearer | Update own user profile |
| `POST` | `/api/users/:target/follow` | Bearer | Follow user by username or UUID |
| `DELETE` | `/api/users/:target/follow` | Bearer | Unfollow user |
| `GET` | `/api/users/:target/followers` | None | Get list of followers for user |
| `GET` | `/api/users/:target/following` | None | Get list of users followed by target |
| `GET` | `/api/users/:target/is-following`| Bearer | Check follow status |

### 📚 Stories (`/api/stories`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/stories/public` | None | Get all public published stories |
| `GET` | `/api/stories/user/:username`| Optional | Get stories by author (filters followers-only if not followed) |
| `GET` | `/api/stories/slug/:slug` | Optional | Get single story by slug with permission checks |
| `GET` | `/api/stories` | Bearer | Get curated personalized feed |
| `POST` | `/api/stories/create` | Bearer | Create a new story |
| `GET` | `/api/stories/my` | Bearer | Get current user's stories (drafts, published, etc.) |
| `GET` | `/api/stories/stats/my` | Bearer | Get story statistics for logged-in user |
| `PUT` | `/api/stories/:slug` | Bearer | Update existing story |
| `DELETE` | `/api/stories/:slug` | Bearer | Delete existing story |

### 💬 Social Interactions (Likes & Comments)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/stories/:identifier/like` | Bearer | Like a story |
| `DELETE` | `/api/stories/:identifier/like` | Bearer | Unlike a story |
| `POST` | `/api/stories/:identifier/like/toggle` | Bearer | Toggle like state |
| `GET` | `/api/stories/:identifier/likes` | Optional | Get list of users who liked a story |
| `GET` | `/api/stories/:identifier/like/status` | Bearer | Check if current user liked story |
| `POST` | `/api/stories/:identifier/comments` | Bearer | Add a comment to story |
| `GET` | `/api/stories/:identifier/comments` | Optional | Get comments on a story |
| `GET` | `/api/comments/:id` | None | Get a single comment by ID |
| `PUT` | `/api/comments/:id` | Bearer | Update own comment |
| `DELETE` | `/api/comments/:id` | Bearer | Delete comment (Comment Author, Story Author, Admin) |

### 🛡️ Admin Moderation (`/api/admin`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/admin/stats` | Admin | Get platform metrics & statistics |
| `GET` | `/api/admin/users` | Admin | Paginated list of all users with search |
| `PUT` | `/api/admin/stories/:identifier/status` | Admin | Moderate status (`approved`, `rejected`, etc.) |
| `DELETE` | `/api/admin/stories/:identifier` | Admin | Delete any story across the platform |
| `DELETE` | `/api/admin/comments/:id` | Admin | Delete any comment across the platform |

### 🖼️ Media Upload (`/api/upload`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/upload/image` | Bearer | Upload image (`?folder=stories` or `?folder=avatars`) |

---

## 6. Validation Rules & Error Handling

All validation is handled uniformly using `Joi` with custom messages:

- **Username**:
  - Length: `3` to `50` characters.
  - Allowed characters: Letters (`a-z`, `A-Z`), numbers (`0-9`), and `_`, `-`, `.`.
- **Password**: Minimum 8 characters, maximum 128 characters.
- **Story Title**: Minimum 3 characters, maximum 255 characters.
- **Story Content**: Minimum 10 characters.
- **Slug**: Minimum 3, maximum 300 characters (auto-generated from title if omitted).

### Standardized Response Format:

#### Success Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Story fetched successfully",
  "data": { ... }
}
```

#### Paginated Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Public stories fetched successfully",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "nextPage": 2,
    "prevPage": null
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "statusCode": 403,
  "message": "This story is private and only available to followers of this author."
}
```

---

## 7. Edge Cases Handled

1. **Unpublished Draft Leakage Prevention**: Accessing a draft/rejected story by slug returns `404 Not Found` to strangers rather than `403`, ensuring draft titles and URLs cannot be probed.
2. **Followers-Only Privacy**: Direct slug URLs and interaction APIs for `followers_only` stories strictly verify follower status or author ownership.
3. **Duplicate Identity Collisions**: Returns explicit `409 Conflict` distinguishing between duplicate email addresses and duplicate usernames.
4. **Self-Action Prevention**: Users cannot follow or unfollow themselves (`400 Bad Request`).
5. **Idempotency**: Repeated likes or follow actions do not cause duplicate records or internal server errors.
6. **Password Security**: Passwords are automatically omitted from all outgoing JSON payloads.

---

## 8. Setup, Seeding & Execution Guide

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database instance (Neon connection URL)

### Environment Variables (`.env`)
```env
PORT=5000
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d

ADMIN_NAME="System Administrator"
ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@storyspace.com"
ADMIN_PASSWORD="AdminPassword123!"

# Neon Object Storage / S3
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-neon-bucket
AWS_ENDPOINT=https://your-neon-s3-endpoint
```

### Installation & Execution Commands
```bash
# 1. Install dependencies
npm install

# 2. Run Database Migrations
npm run migration:run

# 3. Seed Initial System Administrator
npm run seed

# 4. Start Development Server
npm run dev

# 5. Type-Check Codebase
npx tsc --noEmit
```

---

*StorySpace Backend — Production-Ready API Documentation & Architecture Manual.*
