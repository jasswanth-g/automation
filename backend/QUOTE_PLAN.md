# Plan: Quote Management System (Supabase)

This document outlines the strategy for receiving, storing, and managing quotes from make.com (or other sources) using Supabase for persistence.

## 1. Database Schema (Supabase)

We will create a new table in **Supabase** (PostgreSQL) called `quotes`.

### Table: `quotes`
- `id`: UUID (Primary Key, default: `gen_random_uuid()`).
- `text`: TEXT (The content of the quote, required).
- `author`: VARCHAR(255) (The author of the quote, optional).
- `category`: VARCHAR(100) (Optional, for filtering/categorization).
- `source`: VARCHAR(100) (e.g., 'make.com', 'manual', 'api', default: 'api').
- **`status`**: VARCHAR(20) (Enum: `'created'`, `'posted'`. Default: `'created'`). 
- **`video_status`**: VARCHAR(20) (Enum: `'pending'`, `'created'`. Default: `'pending'`).
- `created_at`: TIMESTAMPTZ (Default: `now()`).
- `updated_at`: TIMESTAMPTZ (Default: `now()`).

## 2. Architecture Layers

### Data Transfer Objects (`src/dtos/quote.dto.ts`)
- `CreateQuoteDto`: 
    - `text`: string (required)
    - `author`: string (optional)
    - `category`: string (optional)
- `UpdateQuoteDto`: 
    - `status`: string (optional, `'created' | 'posted'`)
    - `video_status`: string (optional, `'pending' | 'created'`)

### Repository (`src/repositories/quote.repository.ts`)
- `QuoteRepository`:
    - `create(quote: QuoteMetadata)`: Inserts a new quote into Supabase.
    - `findAll()`: Retrieves all quotes.
    - `findById(id: string)`: Retrieves a specific quote.
    - `findByStatus(status: string)`: Filters quotes by their lifecycle status.
    - `findByVideoStatus(video_status: string)`: Filters quotes by video readiness.
    - `update(id: string, updates: Partial<QuoteMetadata>)`: Updates quote (e.g., changing status to 'posted' or video_status to 'created').
    - `delete(id: string)`: Removes a quote.

### Service (`src/services/quote.service.ts`)
- `QuoteService`:
    - Handles status transitions and validation.
    - Interacts with `QuoteRepository`.

### Controller (`src/controllers/quote.controller.ts`)
- `QuoteController`:
    - `POST /api/quotes`: Receives quotes from external webhooks.
    - `GET /api/quotes`: Lists all quotes.
    - `PATCH /api/quotes/:id`: Update status or video_status.
    - `DELETE /api/quotes/:id`: Deletes a quote.

## 3. Implementation Steps

1. **Supabase Setup:**
    - Execute SQL to create the `quotes` table with `status` (default 'created') and `video_status` (default 'pending').
2. **DTO Development:**
    - Create `src/dtos/quote.dto.ts` with validation.
3. **Repository Development:**
    - Create `src/repositories/quote.repository.ts`.
4. **Service Development:**
    - Create `src/services/quote.service.ts`.
5. **Controller Development:**
    - Create `src/controllers/quote.controller.ts`.
6. **Registration:**
    - Register the new `QuoteController` in `src/index.ts`.
7. **Testing:**
    - Verify that new quotes default to `status: 'created'` and `video_status: 'pending'`.

## 4. Webhook Integration (make.com)

- Set up a **HTTP Request** module in make.com.
- **Method:** `POST`
- **URL:** `https://your-api-url/api/quotes`
- **Body Content:**
  ```json
  {
    "text": "The quote content",
    "author": "Author Name",
    "category": "Inspirational"
  }
  ```
  *(The API will automatically set status and video_status if not provided)*
