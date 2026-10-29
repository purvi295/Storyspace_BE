Based on what is actually implemented in the POC:

## Completed

- Async/await and error propagation
- `Promise.all()` for parallel database queries
- Sequential vs parallel execution
- Layered architecture and separation of concerns
- Repository and service patterns
- Custom errors and centralized error handling
- Buffer/binary upload handling (`Multer` memory storage)
- Environment-variable configuration with `process.env`
- Graceful shutdown with `SIGINT` and `SIGTERM`
- CORS configuration
- JWT authentication and role-based authorization
- Input validation with Joi
- Rate limiting (Brute-force protection on login & AI rate limiting)
- Database transactions using TypeORM `QueryRunner`
- Helmet & security HTTP headers
- Explicit TypeORM / node-postgres connection pooling & idle client error resilience
- Refresh Token strategy with token rotation and reuse detection
- Structured logging with Pino & HTTP health-check / readiness endpoints (`/health`, `/health/ready`)

## Partially completed

- Promises: used throughout, but no dedicated promise-chaining example
- Secure secrets/environment configuration: environment variables exist, but JWT has an unsafe fallback secret
- Race conditions/idempotency: database uniqueness constraints help, but no deliberate idempotency strategy exists

## Pending

### 1. Node.js Internals

- Node.js architecture and runtime
- V8 engine and libuv
- Call stack and execution context
- Event loop and phases
- Microtasks vs macrotasks
- `process.nextTick()` vs `setImmediate()` vs `setTimeout()`
- Blocking vs non-blocking operations
- Concurrency vs parallelism

### 2. Async Programming

- Callbacks and callback hell
- Promise chaining
- `Promise.allSettled()`, `Promise.race()`, `Promise.any()`
- Unhandled promise rejections
- `AbortController` and cancellation
- Concurrency limiting

### 3. Modules and Architecture

- CommonJS vs ES Modules comparison
- `require()` vs `import`
- Module caching
- Circular dependencies
- Dependency injection

### 4. Streams and Buffers

- Readable/Writable streams
- Duplex/Transform streams
- Piping and `pipeline()`
- Backpressure
- Streaming large files
- Stream error handling

### 5. Processes and System APIs

- `process.argv`
- OS and filesystem modules
- Child processes: `spawn`, `exec`, `fork`
- Worker threads
- Cluster module / multi-process scaling

### 6. Events and Real-Time Communication

- `EventEmitter`
- Custom events/listeners
- Event-driven architecture
- WebSockets
- Real-time notifications
- Server-Sent Events

### 7. Performance and Memory

- Garbage collection
- Memory leaks and heap snapshots
- CPU profiling
- Benchmarking
- Event-loop lag
- Caching strategies
- Redis caching
- Throttling beyond the existing basic rate limiter

### 8. Security and Production Readiness

- Output sanitization
- Dependency/supply-chain security

### 9. Testing and Reliability

- Node built-in test runner
- Unit tests
- Integration/API tests
- Dependency mocking
- Supertest
- Database test isolation
- Coverage reporting
- Retry and timeout strategies

### 10. Database and Background Processing

- Isolation-level handling
- Robust race-condition/idempotency patterns
- Job queues/workers
- Retries with exponential backoff
- Cron/scheduled jobs
- Message brokers/event-driven workflows
