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




# StorySpace Backend — Complete Presentation Explanation

## 1. Introduction / Project Overview

StorySpace is a modern publishing and social storytelling backend platform. The main purpose of this application is to allow users to create and publish stories while also providing social networking capabilities such as following other users, viewing followers-only content, liking stories, commenting on stories, and interacting with authors. The backend is designed using Node.js, Express.js, TypeScript, TypeORM, and PostgreSQL hosted on Neon. It also includes JWT-based authentication, Joi-based validation, role-based access control, administrative moderation, and object storage for images. The backend is structured in a scalable way so that authentication, business logic, database operations, storage operations, and HTTP handling remain separated from each other.

---

# 2. Technology Stack

### Node.js

Node.js is used as the runtime environment for the backend. It allows us to execute JavaScript and TypeScript code on the server side and is well suited for building API-driven applications. In StorySpace, Node.js is responsible for running the Express application, handling incoming HTTP requests, executing business logic, communicating with the database, and interacting with external storage services.

### Express.js

Express.js is the web framework used to build the REST APIs. It provides the routing and middleware mechanism required to process requests. For example, when a client sends a request to create a story, Express identifies the appropriate route, executes authentication and validation middleware, and then passes the validated request to the controller responsible for handling the operation.

### TypeScript

TypeScript is used instead of plain JavaScript to provide static typing and better development-time safety. It helps define the structure of users, stories, comments, requests, responses, services, repositories, and other application components. This makes the code easier to maintain and reduces the possibility of common type-related errors.

### TypeORM

TypeORM is used as the Object-Relational Mapper between the application and PostgreSQL. Instead of writing raw SQL for every database operation, we can work with entities and repositories. Entities represent database tables, while repositories provide methods for creating, finding, updating, and deleting records.

### PostgreSQL and Neon

PostgreSQL is the primary relational database used by StorySpace. The database is hosted through Neon, which provides a managed PostgreSQL environment. User accounts, stories, comments, likes, follower relationships, and other persistent application data are stored in PostgreSQL.

### JWT Authentication

JSON Web Tokens are used for stateless authentication. After successful login, the backend generates a signed JWT token. The client sends this token with subsequent authenticated requests, allowing the backend to identify the logged-in user without maintaining a traditional server-side session.

### bcryptjs

bcryptjs is used to securely hash user passwords. Passwords are never stored as plain text. During registration, the password is hashed before being saved to the database, and during login the supplied password is compared against the stored hash.

### Joi Validation

Joi is used for request validation. It validates incoming data such as usernames, passwords, story titles, story content, and slugs before the request reaches the business logic. Custom validation messages are used so that clients receive understandable error responses.

---

# 3. System Architecture

StorySpace follows a layered architecture based on separation of concerns. The HTTP client or frontend first sends a request to the Express router. The router identifies the appropriate endpoint and passes the request through middleware. Middleware is responsible for common concerns such as authentication, request validation, and file upload handling. After validation, the request reaches the controller. Controllers are responsible for handling the HTTP-level operation and calling the appropriate service. Services contain the main business logic of the application. When the service needs database information, it communicates through repositories. If the operation involves an image, the service can communicate with the storage service. Finally, repositories communicate with PostgreSQL hosted on Neon. This separation means that each layer has a clear responsibility and can be modified independently.

### Request Flow

A typical request follows this flow:

**Client → Router → Middleware → Controller → Service → Repository → PostgreSQL**

For example, when a user creates a story, the frontend sends the request to the story creation endpoint. The router identifies the endpoint, authentication middleware verifies the JWT, validation middleware verifies the request data, the controller receives the validated request, the service applies the story business rules, and the repository finally stores the story in PostgreSQL.

---

# 4. User Roles and Access Control

StorySpace has different access levels based on the type of user and their relationship with the content. The main categories are unauthenticated guests, authenticated users, story authors, and administrators.

A guest can browse public published stories but cannot access protected functionality such as creating stories, following users, liking stories, or commenting. An authenticated user gets access to social features and can create and manage their own stories. A story author has additional permissions over their own stories and comments. Administrators have platform-wide access and can moderate stories, manage users, delete content, and access administrative statistics.

### Followers-Only Access

Followers-only stories are not publicly available. If a story is configured with `followers_only` visibility, the system checks whether the current user follows the author. The author themselves and administrators can also access the content.

### Draft Access

Unpublished drafts are private. A normal user cannot access another user's draft. The author and administrator can access unpublished content according to the defined permissions.

### Administrative Access

Administrative endpoints are protected separately. A normal authenticated user receives a forbidden response when attempting to access administrative functionality, while an administrator is allowed to perform moderation and management operations.

---

# 5. Authentication and User Identity

Authentication begins with registration. When a user registers through `POST /api/auth/register`, the system creates a new account using a unique email address and username. The password is hashed using bcrypt before it is stored in the database. This ensures that the actual password is never stored directly.

After registration, the user can log in using `POST /api/auth/login`. The backend verifies the supplied credentials and generates a signed JWT token that remains valid for seven days. The client can then use this token for authenticated requests.

The system also provides profile management functionality. Through the profile APIs, users can update information such as their display name, username, biography, and profile avatar.

One important security rule is that password hashes are removed from user objects before those objects are returned through APIs. This prevents sensitive password information from accidentally appearing in API responses.

---

# 6. Social Graph — Following and Followers

StorySpace provides a social graph through the following system. Users can follow other users using their username or UUID. When a user follows another user, a relationship is created between them in the database.

The system also prevents users from following themselves. This is handled as a business validation rule and results in a bad-request response.

Users can unfollow someone using the corresponding DELETE endpoint. The follow and unfollow operations are designed to behave safely even when the same operation is repeated.

The application also provides endpoints to retrieve followers, retrieve the users a person is following, and determine whether the currently authenticated user is following a particular user. This information can be used by the frontend to build profile pages, follow buttons, follower lists, and personalized social experiences.

---

# 7. Story Engine

The story engine is the central part of the StorySpace platform. Every story has two important properties: its **status** and its **visibility**.

The status controls the publishing lifecycle, while visibility controls who is allowed to read the story.

## Story Status

A story starts in the draft state. The author can work on the story without making it publicly available. Once the author is ready, the story can be submitted for administrative review.

The administrator can then approve or reject the submitted story. If the story is rejected, a rejection reason can be stored so that the author understands why the story was not approved.

After approval, the story can become published and available to readers.

The overall lifecycle is:

**Draft → Submitted → Approved → Published**

There is also a rejection path from submitted content:

**Submitted → Rejected**

This lifecycle provides a controlled publishing workflow where authors can create content while administrators retain moderation control.

---

# 8. Story Visibility

Story visibility defines who can read a published story.

A **public** story can be discovered and read by anyone. Authentication is not required for public content.

A **followers-only** story has restricted access. Only confirmed followers of the author, the author themselves, or system administrators can access it.

This access control is not limited to the frontend. The backend also performs the permission check when somebody accesses a story directly using its slug. This is important because a user should not be able to bypass frontend restrictions simply by manually entering a story URL.

---

# 9. Likes

StorySpace provides a complete like system for stories.

A user can like a story using the like endpoint and remove the like using the unlike endpoint. There is also a toggle endpoint that makes it easier for frontend applications to implement a single like button.

The system also provides an endpoint to check whether the current user has already liked a story. This allows the frontend to display the correct state of the like button.

Another endpoint provides the users who have liked a particular story. The like functionality also follows the story visibility rules, meaning that a user should only interact with content that they are authorized to access.

---

# 10. Comments

Comments allow authenticated users to participate in discussions around stories.

An authenticated user can create a comment on an accessible story. Users can also retrieve the comments associated with a story.

A user can edit their own comment, but they cannot arbitrarily edit somebody else's comment.

Comment deletion has three possible authorization paths. The comment author can delete their own comment, the author of the story can delete comments from their story, and an administrator can delete comments globally.

This provides a flexible moderation model while still protecting user-generated content from unauthorized modification.

---

# 11. Media and Object Storage

StorySpace supports image uploads for stories and user avatars.

The upload API accepts image files using the `image` field. Supported formats include JPEG, PNG, WEBP, and GIF.

The backend applies a maximum file size of 5 MB. This prevents unnecessarily large files from being uploaded to the storage system.

Uploaded images are stored using Neon S3-compatible object storage. The system organizes uploaded files into appropriate folders such as `stories` and `avatars`.

This approach keeps binary files outside the PostgreSQL database while storing the required references or URLs within the application data.

---

# 12. Admin Moderation

The administrator module provides centralized control over the platform.

Administrators can access platform statistics such as the total number of users, story counts by status, total comments, and total likes.

The administrator can also access a user directory where users can be searched and managed.

Most importantly, administrators can moderate stories by changing their status. This includes actions such as approving, rejecting, publishing, or reverting stories depending on the supported workflow.

Administrators can also delete stories and comments across the platform, providing a global moderation mechanism.

---

# 13. Complete API Structure

The API is organized into logical modules rather than putting all endpoints into one large controller.

The `/api/auth` group handles authentication-related operations such as registration, login, retrieving the current user, and editing the profile.

The `/api/users` group handles user profiles and the social graph, including followers, following, follow and unfollow operations, and follow status.

The `/api/stories` group contains the main story functionality. It supports public stories, user-specific stories, individual story retrieval, personalized feeds, story creation, current-user stories, story statistics, updates, and deletion.

The social interaction endpoints handle likes and comments.

The `/api/admin` group contains administrative operations such as statistics, user management, story moderation, and content deletion.

Finally, `/api/upload` handles image uploads.

---

# 14. Authentication API

The registration endpoint is:

`POST /api/auth/register`

This creates a new user account.

The login endpoint is:

`POST /api/auth/login`

This verifies credentials and returns the JWT authentication token.

The current-user endpoint is:

`GET /api/auth/me`

This retrieves the authenticated user's information.

The profile editing endpoint allows the authenticated user to update profile information.

These endpoints together provide the complete authentication and identity flow of the application.

---

# 15. User API

The user module provides both public and authenticated operations.

The public user list endpoint allows clients to retrieve a paginated directory of users.

A public profile endpoint allows a profile to be retrieved using a username.

Authenticated users can update their own profiles and follow or unfollow other users.

The followers and following endpoints expose the social relationships associated with a user.

The `is-following` endpoint is useful for frontend interfaces because it allows the application to determine whether the current user is already following a target user.

---

# 16. Story API

The story API supports both public browsing and authenticated content management.

The public stories endpoint returns published public stories.

The user-specific story endpoint returns stories belonging to a particular author while applying followers-only visibility rules.

The slug endpoint retrieves a single story and performs the required permission checks.

Authenticated users can access their personalized feed and their own stories.

Story statistics are also available for the logged-in user.

Authors can create, update, and delete their stories through protected endpoints.

---

# 17. Social Interaction API

The social interaction API is divided into likes and comments.

For likes, the backend provides separate like, unlike, toggle, list, and status endpoints.

For comments, users can create and retrieve comments and can retrieve an individual comment by ID.

Authenticated users can update their own comments, while deletion follows the authorization rules involving the comment author, story author, and administrator.

This separation makes the API easy for the frontend to consume because each user interaction has a clearly defined endpoint.

---

# 18. Admin API

The admin API is protected using administrator authorization.

The statistics endpoint provides platform-level metrics.

The user endpoint provides a searchable paginated list of users.

The story moderation endpoint allows administrators to change story statuses such as approved or rejected.

Administrators can also delete stories and comments regardless of their ownership.

This ensures that platform-level moderation is controlled separately from normal user functionality.

---

# 19. Image Upload API

The image upload endpoint is:

`POST /api/upload/image`

It requires authentication and accepts an image file.

The folder can be specified for different types of content, such as stories or avatars.

The backend validates the file type and file size before sending the file to the configured object storage.

This provides a centralized and controlled way of managing uploaded media.

---

# 20. Validation Rules

Input validation is centralized using Joi.

For usernames, the system requires between 3 and 50 characters and allows letters, numbers, underscores, hyphens, and periods.

Passwords must contain at least 8 characters and cannot exceed 128 characters.

Story titles must contain between 3 and 255 characters.

Story content must contain at least 10 characters.

Story slugs must contain between 3 and 300 characters. If a slug is not supplied, the system can generate one automatically from the story title.

The main purpose of these rules is to ensure that invalid data does not reach the business logic or database layer.

---

# 21. Standard API Response

The backend follows a standardized success response structure.

A successful response contains a `success` property, the HTTP `statusCode`, a human-readable `message`, and the actual response `data`.

For example, when a story is successfully retrieved, the response communicates both the operation status and the returned story data.

This consistency makes API consumption easier for frontend developers because they do not need to understand a different response structure for every endpoint.

---

# 22. Pagination

For list-based endpoints, StorySpace uses a standardized pagination structure.

The response contains the current page, the number of records requested per page, the total number of records, the total number of pages, and information about the next and previous pages.

For example, if there are 45 records and the limit is 10, the API can return page 1, total 45, total pages 5, and next page 2.

This structure allows frontend applications to easily build pagination controls, infinite scrolling, or "load more" functionality.

---

# 23. Error Handling

Error responses also follow a standardized structure.

Instead of returning an inconsistent response for every failure, the API provides a `success: false` property, an HTTP status code, and a descriptive error message.

For example, when somebody tries to access a followers-only story without the required relationship, the API can return a 403 response explaining that the story is private and available only to followers.

This makes errors easier to understand and allows the frontend to handle them consistently.

---

# 24. Edge Case — Draft Leakage Prevention

One important security feature is unpublished draft leakage prevention.

Suppose someone knows the URL or slug of another user's unpublished story. The system does not simply expose that story because the person knows the URL.

Instead, unauthorized access to drafts or rejected stories returns a `404 Not Found` response.

Returning 404 instead of exposing information through a 403 response helps prevent strangers from probing whether a private story exists.

---

# 25. Edge Case — Followers-Only Privacy

Followers-only privacy is enforced at the backend level.

It is not enough for the frontend to hide a story from users. A user could manually call the API or access a direct slug URL.

Therefore, the backend verifies whether the requesting user is the author, an administrator, or a confirmed follower before allowing access.

The same principle is applied to interaction APIs so that unauthorized users cannot interact with protected content.

---

# 26. Edge Case — Duplicate Identity

The system handles duplicate identity conflicts explicitly.

For example, if someone attempts to register using an email address that already exists, the system returns a conflict response instead of allowing a duplicate identity.

The same principle applies to usernames.

The documentation specifies a `409 Conflict` response so the client can distinguish duplicate identity problems from other validation or server errors.

---

# 27. Edge Case — Self Actions

Users are prevented from performing invalid actions against themselves.

For example, a user cannot follow themselves or unfollow themselves.

The backend validates the target user against the authenticated user and returns a `400 Bad Request` response when the operation is invalid.

This type of rule belongs in the backend because it must remain enforced regardless of which frontend or client is calling the API.

---

# 28. Edge Case — Idempotency

The system is designed to safely handle repeated actions.

For example, if a user repeatedly attempts to like the same story, the system should not create multiple duplicate like records.

Similarly, repeated follow operations should not create duplicate relationships or result in unnecessary internal server errors.

This makes the APIs safer for real-world frontend applications where duplicate requests can occur because of repeated clicks, retries, network behavior, or UI state issues.

---

# 29. Password Security

Password security is treated as a core backend responsibility.

Passwords are hashed using bcrypt before being stored. The application does not return password hashes in API responses.

Even if a user object is returned through an endpoint, the sensitive password field is removed before the response is sent to the client.

This provides an additional layer of protection against accidental exposure of credential information.

---

# 30. Environment Configuration

The application uses environment variables for configuration instead of hard-coding sensitive or environment-specific values.

The environment configuration contains values such as the application port, database connection URL, JWT secret, JWT expiration duration, administrator information, and object-storage configuration.

This approach allows the same application code to run in different environments such as development, staging, and production without modifying the source code.

Sensitive values such as database credentials, JWT secrets, and administrator passwords should therefore be supplied through the environment rather than committed directly into source control.

---

# 31. Installation

To install the backend, the first step is to install the required Node.js dependencies using:

`npm install`

This reads the project's package configuration and installs the required libraries, including Express, TypeScript, TypeORM, validation libraries, authentication libraries, and other project dependencies.

---

# 32. Database Migration

After dependencies are installed, database migrations need to be executed.

The command is:

`npm run migration:run`

Migrations ensure that the PostgreSQL database structure matches the application's expected schema.

This is important because entities and application logic depend on the required database tables, columns, relationships, and constraints being available.

---

# 33. Database Seeding

The project provides a seed command:

`npm run seed`

The purpose of the seed operation is to create the initial system administrator or other required initial data.

This means that after setting up a new environment, the application can be initialized with the required administrative account instead of manually inserting records into the database.

---

# 34. Starting the Development Server

The development server can be started using:

`npm run dev`

This starts the backend in development mode so developers can test APIs locally.

During development, this server can be used with tools such as Postman or a frontend application to test authentication, stories, comments, likes, followers, administrative operations, and file uploads.

---

# 35. Type Checking

The project can perform TypeScript type checking using:

`npx tsc --noEmit`

The `--noEmit` option means TypeScript checks the code for type errors without generating JavaScript output.

This is useful as a quality check before committing or deploying the application because it can identify type mismatches and other TypeScript problems without modifying the compiled output.

---

# 36. Complete Request Lifecycle Example

To explain the architecture in one practical example, consider creating a new story.

First, the frontend sends a request to the story creation endpoint. The Express router receives the request and identifies the story creation route. Authentication middleware verifies the JWT and identifies the logged-in user. Validation middleware checks whether the story title, content, slug, and other fields satisfy the required validation rules.

After validation succeeds, the controller receives the request and calls the story service. The service applies the business rules, such as assigning the correct author and initial status. The service then uses the repository to save the story into PostgreSQL.

The repository performs the database operation, and the result is returned through the service and controller. Finally, the controller sends the standardized API response back to the frontend.

This example demonstrates why the layered architecture is useful: authentication, validation, HTTP handling, business rules, and database access each remain separated.

---

# 37. Overall Project Summary

In summary, StorySpace is not simply a CRUD API for stories. It provides a complete publishing and social platform backend with authentication, authorization, story lifecycle management, public and followers-only visibility, social relationships, likes, comments, image uploads, administrative moderation, analytics, validation, standardized responses, and security-focused edge-case handling.

The architecture separates routing, middleware, controllers, services, repositories, storage, and database responsibilities. This makes the backend easier to maintain and extend. The API is organized into logical modules, while business rules such as story visibility, publishing status, follow relationships, comment permissions, and administrator access are enforced on the server side.

The result is a backend structure designed to support both the current StorySpace functionality and future expansion of the publishing and social platform.
