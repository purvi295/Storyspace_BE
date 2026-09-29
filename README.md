# 📖 Storyspace Backend (Storyspace-BE)

A production-ready, scalable RESTful API for **Storyspace** — a modern storytelling and blogging platform (Medium / Dev.to style). Built with **Node.js**, **TypeScript**, **Express**, **TypeORM**, **PostgreSQL (Neon)**, and **Neon S3 Object Storage**.

---

## 🚀 Features

- **🔐 Authentication & Security**:
  - Secure registration & login with password hashing via `bcryptjs`.
  - Stateless JWT authentication with customizable expiry (`1d`).
  - Safe user logout (`POST /api/auth/logout`).
  - Role-based authorization (`admin`, `user`).

- **👤 Profiles & Social Graph**:
  - Public author profiles with real-time follower/following counts.
  - Profile customization (full name, username, bio) with direct avatar image upload to Neon S3.
  - Follow / Unfollow system with follow status checks.

- **📚 Story Management**:
  - Self-publishing workflow: **`draft`** & **`published`** statuses.
  - Privacy controls: **`public`** & **`followers_only`** visibility.
  - Auto-generated unique slugs from story titles.
  - Story cover image upload directly to Neon S3 (`multipart/form-data`).
  - Protected drafts (visible only to the author).
  - Private follower-only stories (visible only to confirmed followers and author).
  - Public story feeds, author-specific stories, and author story stats.

- **💬 Social Engagement**:
  - Story Likes / Claps (toggle like, check status, paginated liked stories).
  - Story Comments (create, update, delete with permissions for author/admin).

- **🛡️ Admin Dashboard & Moderation**:
  - Platform metrics (user counts, published/draft story totals, engagement statistics).
  - User directory with search and pagination.
  - Platform-wide content moderation (delete violating stories or comments).

- **☁️ Cloud Object Storage**:
  - Direct image buffer upload to **Neon S3 Object Storage** using `@aws-sdk/client-s3`.
  - Automatic organization by subfolders (`/stories`, `/avatars`).

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Language & Runtime** | TypeScript, Node.js |
| **Web Framework** | Express.js |
| **Database** | PostgreSQL (Neon Cloud Database) |
| **ORM** | TypeORM |
| **Object Storage** | Neon Object Storage (AWS S3-compatible SDK) |
| **Authentication** | JSON Web Tokens (JWT) & Bcrypt |
| **Validation** | Joi |
| **File Handling** | Multer (Memory Storage) |

---

## 📂 Project Structure

```
Storyspace-BE/
├── postman/                      # Postman collection
│   └── Task-API.postman_collection.json
├── src/
│   ├── config/                   # Centralized configuration & constants
│   │   ├── constants.ts          # ROLES, STORY_STATUS, STORY_VISIBILITY
│   │   └── env.config.ts         # Environment variables configuration
│   ├── controllers/              # HTTP request handlers
│   │   ├── admin.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── like.controller.ts
│   │   ├── story.controller.ts
│   │   ├── upload.controller.ts
│   │   └── user.controller.ts
│   ├── database/                 # TypeORM Data Source & Migrations
│   │   ├── data-source.ts
│   │   └── migrations/
│   ├── dtos/                     # Data Transfer Objects & Interfaces
│   ├── entities/                 # TypeORM Database Entities (Models)
│   │   ├── comment.entity.ts
│   │   ├── follow.entity.ts
│   │   ├── like.entity.ts
│   │   ├── story.entity.ts
│   │   └── user.entity.ts
│   ├── middlewares/              # Express Middlewares (Auth, Validation, Upload, Error)
│   ├── repositories/             # Database Query Abstractions
│   ├── routes/                   # API Route definitions
│   ├── services/                 # Core Business Logic & S3 Service
│   ├── utils/                    # Error handling, API responses, slugify
│   ├── app.ts                    # Express app configuration
│   └── server.ts                 # Server startup & DB connection
├── USER_MANUAL.md                # Detailed user manual & architecture guide
├── workflow_medium.md            # Product workflow specification
├── package.json
└── tsconfig.json
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database (or [Neon Postgres](https://neon.tech))
- Neon Object Storage / S3-compatible credentials

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd Storyspace-BE
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Local or Neon)
DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"

# JWT Configuration
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRES_IN=1d

# Admin Default Credentials
ADMIN_NAME="System Admin"
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password

# Neon Object Storage / AWS S3
AWS_ACCESS_KEY_ID=your-s3-access-key-id
AWS_SECRET_ACCESS_KEY=your-s3-secret-access-key
AWS_ENDPOINT_URL_S3=https://<your-bucket-endpoint>
AWS_REGION=ap-southeast-1
NEON_STORAGE_BUCKET=story
```

> **Tip**: Generate a secure 256-bit `JWT_SECRET` using:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Database Migrations
Run TypeORM migrations to set up the database schema:

```bash
npm run migration:run
```

### 5. Running the Application

- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  npm start
  ```

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | None | Register a new user account |
| `POST` | `/api/auth/login` | None | Login user & retrieve JWT token |
| `POST` | `/api/auth/logout` | Bearer | Logout user |
| `GET` | `/api/auth/me` | Bearer | Get current authenticated user profile |

### 👤 Users & Social Graph (`/api/users`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/users/list` | None | Paginated directory of users (`?page=1&limit=10&search=...`) |
| `GET` | `/api/users/:username` | None | Public profile with follower and following counts |
| `PUT` | `/api/users/profile` | Bearer | Update profile info & upload avatar to S3 (`multipart/form-data`) |
| `POST` | `/api/users/:target/follow` | Bearer | Follow user by username or UUID |
| `DELETE` | `/api/users/:target/follow` | Bearer | Unfollow user |
| `GET` | `/api/users/:target/followers` | None | Get paginated list of followers |
| `GET` | `/api/users/:target/following` | None | Get paginated list of followed users |
| `GET` | `/api/users/:target/is-following`| Bearer | Check if authenticated user follows target |

### 📚 Stories (`/api/stories`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/stories/create` | Bearer | Create story with optional S3 cover image upload |
| `GET` | `/api/stories/public` | None | Get public published stories feed |
| `GET` | `/api/stories/user/:username`| Optional | Get stories by author (followers-only filtered for non-followers) |
| `GET` | `/api/stories/slug/:slug` | Optional | Get single story by slug (enforces draft/follower privacy) |
| `GET` | `/api/stories/my` | Bearer | Get current authenticated author's stories (drafts & published) |
| `GET` | `/api/stories/stats/my` | Bearer | Get author story metrics (drafts, published, likes count) |
| `GET` | `/api/stories` | Bearer | Explore all stories with filters (`?status=&visibility=&author=`) |
| `PUT` | `/api/stories/:slug` | Bearer | Update story content, status (`draft`/`published`), or cover image |
| `DELETE` | `/api/stories/:slug` | Bearer | Delete own story |

### 👏 Likes & Claps (`/api/stories` & `/api/likes`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/stories/:identifier/like` | Bearer | Toggle like / clap on a story |
| `GET` | `/api/stories/:identifier/like/status` | Bearer | Check if authenticated user liked story |
| `GET` | `/api/likes/user/:username` | None | Get paginated list of stories liked by user |

### 💬 Comments (`/api/stories` & `/api/comments`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/stories/:identifier/comments` | Bearer | Add a comment to a story |
| `GET` | `/api/stories/:identifier/comments` | Optional | Get paginated comments for a story |
| `GET` | `/api/comments/:id` | None | Get a single comment by ID |
| `PUT` | `/api/comments/:id` | Bearer | Update own comment |
| `DELETE` | `/api/comments/:id` | Bearer | Delete comment (Comment author, Story author, or Admin) |

### 🛡️ Admin Moderation (`/api/admin`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/admin/stats` | Admin | Platform metrics (total users, published/draft stories, likes, comments) |
| `GET` | `/api/admin/users` | Admin | Paginated user management directory |
| `DELETE` | `/api/admin/stories/:identifier` | Admin | Delete any violating story across the platform |
| `DELETE` | `/api/admin/comments/:id` | Admin | Delete any violating comment across the platform |

### 🖼️ Direct Media Upload (`/api/upload`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/upload/image` | Bearer | Direct upload to Neon S3 (`?folder=stories` or `?folder=avatars`) |

---

## 📮 Postman Collection

A complete, pre-configured Postman collection is included in:
📁 `postman/Task-API.postman_collection.json`

- Automatically saves and sets authorization tokens (`{{token}}`, `{{adminToken}}`) upon login/register.
- Automatically captures created story slugs and user UUIDs into collection variables.
- Ready to import and run immediately in Postman.

---

## 📄 License
This project is private and licensed for development and learning purposes.
