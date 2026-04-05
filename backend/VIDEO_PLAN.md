# Video Generation API Plan

This plan outlines the implementation of a new video generation endpoint in the backend, based on the logic in `video2.js`.

## 1. Overview
The goal is to provide an API that can generate short videos (Instagram/TikTok ready) using an image, an audio file, and overlay text (e.g., from a Quote or Song metadata).

## 2. Proposed Endpoints

### `POST /api/videos/generate`
Starts the video generation process.

**Request Body:**
```json
{
  "image_url": "string",
  "audio_url": "string",
  "text": "string",
  "quote_id": "string (optional)",
  "song_id": "string (optional)"
}
```

**Response:**
- `202 Accepted`: Returns a `job_id` or `video_id` to track status.
- `400 Bad Request`: Validation errors.

### `GET /api/videos/status/:id`
Check the status of a video generation job.

**Response:**
```json
{
  "id": "string",
  "status": "pending | processing | completed | failed",
  "video_url": "string (if completed)",
  "error": "string (if failed)"
}
```

## 3. Implementation Details

### A. New DTOs (`src/dtos/video.dto.ts`)
- `GenerateVideoDto`: Validates input URLs and text.

### B. Service Layer (`src/services/video.service.ts`)
- Integrate `fluent-ffmpeg` to process videos dynamically.
- Handle downloading remote assets (images/audio) to temporary storage.
- Execute FFmpeg with the parameters from `video2.js`:
    - 1080x1920 (9:16 aspect ratio).
    - Centered text overlay with specific styling.
    - Video/Audio encoding optimized for social media.
- Upload the resulting `output.mp4` to a storage provider (e.g., ImageKit/S3).

### C. Controller (`src/controllers/video.controller.ts`)
- Implement the `POST` and `GET` routes.
- Link the video generation status to the source Quote/Song if provided.

### D. Repository (`src/repositories/video.repository.ts`)
- Store metadata about generated videos.
- Update `video_status` in `quotes` table if a `quote_id` is passed.

## 4. Technical Considerations
- **Concurrency**: FFmpeg is CPU-intensive. Initially, we will process one at a time or use a simple queue.
- **Cleanup**: Temporary files (downloaded assets and local `output.mp4`) must be deleted after upload.
- **Paths**: Ensure `fontPath` is configurable or bundled.

## 5. Frontend Integration
- Add a "Generate Video" button to `QuoteList` and `SongList`.
- Show a progress indicator while processing.
- Provide a preview/download link once finished.

## 6. Database Schema (Supabase/PostgreSQL)

### `videos` Table
This table tracks the lifecycle of generated videos and their metadata.

```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT,                           -- Final video URL (ImageKit)
  imagekit_file_id TEXT,              -- File ID for management/deletion
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  error TEXT,                         -- Error message if failed
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL, -- Source quote
  song_id UUID REFERENCES songs(id) ON DELETE SET NULL,   -- Source song
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### Updates to `quotes` Table
Ensure the `quotes` table has the following field for tracking generation status.

```sql
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'pending';
-- Statuses: 'pending' (video not yet created) | 'created' (video successfully generated)
```
