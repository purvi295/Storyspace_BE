# Bug Fix: Slug NULL Constraint Error

## Problem
The application was throwing a database error when creating stories:
```
error: null value in column "slug" of relation "stories" violates not-null constraint
```

### Root Cause
1. The `slug` column has a `NOT NULL` constraint in the database
2. The validation schema (`story.validation.ts`) did not include `slug` as a field
3. Clients were not sending `slug` in the request body
4. TypeORM was trying to insert `DEFAULT` for `slug`, but no default value existed
5. The DTO required `slug` but it was undefined in the request

## Solution Implemented

### 1. Made `slug` Optional in DTO
**File:** `src/dtos/story.dto.ts`
- Changed `slug: string` to `slug?: string` (optional)
- Added comment explaining auto-generation

### 2. Updated Validation Schema
**File:** `src/middlewares/story.validation.ts`
- Added `slug` field to the validation schema as optional
- Increased `summary` max length from 100 to 500 (to match entity definition)
- Added proper validation messages for slug

### 3. Created Slugify Utility
**File:** `src/utils/slugify.ts` (new file)
- `slugify()`: Converts text to URL-friendly slug (e.g., "My Story" → "my-story")
- `generateUniqueSlug()`: Creates unique slugs with random suffix for collision avoidance

### 4. Updated Story Service
**File:** `src/services/story.service.ts`
- Auto-generates slug from title if not provided
- Validates that slug is not empty after generation
- Throws clear error if unable to generate slug

### 5. Updated Entity
**File:** `src/entities/story.entity.ts`
- Added `default: ""` to slug column as additional safeguard

### 6. Created Migration
**File:** `src/database/migrations/1800000002000-AddSlugDefaultToStories.ts` (new file)
- Adds default empty string to `slug` column in database
- Provides rollback capability

## How It Works Now

### Scenario 1: Client provides slug
```javascript
POST /api/stories/create
{
  "title": "My First Story",
  "slug": "my-custom-slug",
  "content": "...",
  "summary": "..."
}
```
→ Uses provided slug: `"my-custom-slug"`

### Scenario 2: Client doesn't provide slug (most common)
```javascript
POST /api/stories/create
{
  "title": "My First Story",
  "content": "...",
  "summary": "..."
}
```
→ Auto-generates slug from title: `"my-first-story"`

### Slug Generation Examples
| Title | Generated Slug |
|-------|---------------|
| "My First Story" | `my-first-story` |
| "Hello World!" | `hello-world` |
| "Special@#$%Chars" | `specialchars` |
| "Under_scores_here" | `under-scores-here` |

## Files Modified
1. `src/dtos/story.dto.ts` - Made slug optional
2. `src/middlewares/story.validation.ts` - Added slug validation
3. `src/services/story.service.ts` - Added auto-generation logic
4. `src/entities/story.entity.ts` - Added default value
5. `src/utils/slugify.ts` - **NEW** - Slug generation utilities
6. `src/database/migrations/1800000002000-AddSlugDefaultToStories.ts` - **NEW** - Database migration

## Testing
- ✅ TypeScript compilation successful (`npm run build`)
- ✅ Slugify utility tested with 6 test cases - all passed
- ✅ Unique slug generation tested - passed

## Next Steps
To apply the database migration, run:
```bash
npm run migration:run
```

This will add the default value to the `slug` column, preventing the error even if the application layer fails to provide a slug.