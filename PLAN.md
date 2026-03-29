# Plan: Song Management System (ImageKit + Supabase)

This document outlines the strategy for implementing a song management system using Base64 for uploads, ImageKit for storage, and Supabase for metadata.

## 1. Storage Strategy (ImageKit)
- **Service:** We will use **ImageKit** to store the audio files.
- **Workflow:** 
    1. The API receives the audio file as a **Base64 string** in a JSON payload.
    2. The service decodes the Base64 string into a buffer.
    3. The service uploads the buffer to ImageKit using the `imagekit` Node.js SDK.
    4. ImageKit returns a `url` and `fileId`.

## 2. Database Strategy (Supabase)
- **Database:** We will use **Supabase** (PostgreSQL) to store song metadata.
- **Metadata Schema (Supabase Table: `songs`):**
    - `id`: UUID (Primary Key).
    - `name`: The display name for the song.
    - `url`: The public URL from ImageKit.
    - `imagekit_file_id`: The ID from ImageKit (essential for deletion).
    - `duration`: (Optional) Duration of the audio track.
    - `created_at`: Timestamp.
    - `updated_at`: Timestamp.

## 3. Architecture Layers

### Repository (`src/repositories/song.repository.ts`)
- Responsible for all Supabase interactions:
    - `create(songData)`: Insert metadata.
    - `findAll()`: List all songs.
    - `findById(id)`: Get a specific song.
    - `update(id, songData)`: Update metadata.
    - `delete(id)`: Remove metadata from Supabase.

### Service (`src/services/song.service.ts`)
- Handles business logic:
    - **Upload:** Decodes Base64, uploads to ImageKit, saves to Supabase.
    - **Update:** Updates metadata in Supabase (and optionally replaces the file in ImageKit if a new Base64 is provided).
    - **Delete:** Deletes the file from ImageKit using `imagekit_file_id`, then removes metadata from Supabase.

### Controller (`src/controllers/song.controller.ts`)
- Defines the API endpoints (JSON-based):
    - `POST /api/songs`: Store a new song (expects `{ name, base64 }`).
    - `GET /api/songs`: Get a list of all available songs.
    - `GET /api/songs/:id`: Get details for a specific song.
    - `PATCH /api/songs/:id`: Update song metadata or the file itself.
    - `DELETE /api/songs/:id`: Delete a song from both ImageKit and Supabase.

## 4. Implementation Steps
1. **Dependencies:** 
    - Install `imagekit` (Node SDK).
    - Install `@supabase/supabase-js`.
2. **Setup Configuration:**
    - Create a `.env` file for ImageKit and Supabase credentials.
    - Initialize ImageKit and Supabase clients.
3. **Database Setup:** Create the `songs` table in the Supabase project.
4. **Develop Repository:** Implement the Supabase CRUD operations.
5. **Develop Service:** Implement the logic for Base64 decoding, ImageKit interaction, and metadata storage.
6. **Develop Controller:** Implement the CRUD endpoints and Swagger documentation.
7. **Validation:** Test the full lifecycle (Base64 Upload -> Retrieval -> Update -> Deletion).

## 5. Future Integration
- Songs can be fetched by ID and their URLs used directly in the `VideoController` for FFCreator/FFmpeg processing.
