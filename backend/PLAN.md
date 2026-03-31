# Plan: Movie & Song Management System (ImageKit + Supabase)

This document outlines the strategy for managing movies and their associated songs using ImageKit for media storage and Supabase for metadata.

## 1. Storage Strategy (ImageKit)
- **Service:** ImageKit will store both **movie images** and **audio files**.
- **Workflow:** 
    1. The API receives media (image or audio) as a **Base64 string**.
    2. The service decodes the Base64 string into a buffer.
    3. The service uploads the buffer to ImageKit using the `imagekit` Node.js SDK.
    4. ImageKit returns a `url` and `fileId` (essential for future deletions/updates).

## 2. Database Strategy (Supabase)
We will use **Supabase** (PostgreSQL) with two related tables.

### Table: `movies`
- `id`: UUID (Primary Key).
- `title`: The display name of the movie.
- `description`: (Optional) A brief summary.
- `image_url`: The public URL for the movie cover from ImageKit.
- `imagekit_file_id`: The ID from ImageKit (for deletion/replacement).
- `created_at` / `updated_at`: Timestamps.

### Table: `songs`
- `id`: UUID (Primary Key).
- `movie_id`: UUID (**Foreign Key** referencing `movies.id`).
- `name`: The display name for the song.
- `url`: The public audio URL from ImageKit.
- `duration`: Integer (Total length in seconds).
- `created_at` / `updated_at`: Timestamps.

## 3. Architecture Layers

### Repositories (`src/repositories/`)
- **MovieRepository:** Handles CRUD for movie metadata.
- **SongRepository:** Handles CRUD for song metadata, including `findByMovieId(movieId)`.

### Services (`src/services/`)
- **MovieService:** 
    - **Create:** Uploads base64 image to ImageKit, then saves movie metadata.
    - **Delete:** Deletes image from ImageKit, then removes movie from Supabase (cascading to songs if configured).
- **SongService:** 
    - **Upload:** Decodes base64 audio, uploads to ImageKit, and links it to a `movie_id` in Supabase.
    - **Delete:** Deletes audio from ImageKit, then removes metadata.

### Controllers (`src/controllers/`)
- **MovieController:**
    - `POST /api/movies`: Create a movie (`{ title, description, image_base64 }`).
    - `GET /api/movies`: List all movies.
    - `GET /api/movies/:id`: Get movie details and its associated songs.
    - `DELETE /api/movies/:id`: Remove a movie and its assets.
- **SongController:**
    - `POST /api/songs`: Upload a song for a movie (`{ movie_id, name, base64 }`).
    - `GET /api/songs/movie/:movieId`: Get all songs for a specific movie.
    - `DELETE /api/songs/:id`: Remove a specific song.

## 4. Implementation Steps
1. **Database Setup:** 
    - Create `movies` and `songs` tables in Supabase with the foreign key relationship.
2. **Configuration:** Ensure `.env` has credentials for ImageKit and Supabase.
3. **Movie Implementation:**
    - Build `MovieRepository` -> `MovieService` -> `MovieController`.
4. **Song Implementation:**
    - Update `SongRepository` to include `movie_id`.
    - Update `SongService` to handle movie-linked uploads.
    - Build/Update `SongController` endpoints.
5. **Validation:** Test creating a movie with an image, then uploading multiple songs to that movie.

## 5. Future Integration
- Use the movie `image_url` and song `url` as inputs for the `VideoController` (FFCreator/FFmpeg) to generate the final video content.
