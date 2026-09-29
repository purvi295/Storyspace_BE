
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

The `/api/auth` group handles authentication-related operations such as registration, login, logout, and retrieving the current user.

The `/api/users` group handles user profiles and the social graph, including profile updates with avatar uploads, followers, following, follow and unfollow operations, and follow status.

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

The logout endpoint is:

`POST /api/auth/logout`

This allows authenticated clients to end their session.

The current-user endpoint is:

`GET /api/auth/me`

This retrieves the authenticated user's information.

These endpoints together provide the complete authentication and identity flow of the application. Profile management is handled via `PUT /api/users/profile`.

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
