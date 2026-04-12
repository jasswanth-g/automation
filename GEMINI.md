# Project Overview: Automatiom

**Automatiom** is a full-stack automation platform designed to generate customized video content by combining movie assets, songs, and quotes. The system leverages cloud-based media storage (ImageKit) and metadata management (Supabase) to handle high-volume asset processing and video rendering.

## Architecture & Technologies

### Backend (`/backend`)
- **Framework:** Node.js with [Express](https://expressjs.com/) and [routing-controllers](https://github.com/typestack/routing-controllers) for a decorator-based, structured API.
- **Language:** TypeScript.
- **Dependency Injection:** [TypeDI](https://github.com/typestack/typedi).
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL) for relational metadata storage.
- **Media Storage:** [ImageKit](https://imagekit.io/) for hosting movie covers, audio files, and generated videos.
- **Video Generation:** [FFCreatorLite](https://github.com/tnfe/FFCreator) and [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) for programmatic video assembly.
- **Documentation:** Swagger/OpenAPI available at `/api/docs`.

### Frontend (`/frontend`)
- **Framework:** React 19 (Vite-powered).
- **Language:** TypeScript.
- **Routing:** React Router DOM.
- **Styling:** Vanilla CSS (following a component-driven approach).
- **Icons:** Lucide React.
- **API Client:** Axios with centralized interceptors.

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended).
- Supabase project and ImageKit account.
- FFmpeg installed on the system (for local video generation).

### Installation
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Environment Setup
Create `.env` files in both `backend/` and `frontend/` based on the project requirements (API keys for Supabase/ImageKit, API URLs, etc.).

### Running the Project
#### Backend
```bash
cd backend
npm run dev      # Starts with nodemon and type-checking
npm run build    # Compiles to dist/
npm start        # Runs the compiled production build
```

#### Frontend
```bash
cd frontend
npm run dev      # Starts the Vite development server
npm run build    # Builds the application for production
npm run preview  # Previews the production build locally
```

---

## Development Conventions

### Backend Patterns
- **Controller-Service-Repository:** Logic is strictly separated. Controllers handle requests, Services manage business logic/external integrations, and Repositories interact with the database.
- **Data Transfer Objects (DTOs):** Used for request validation via `class-validator`.
- **Media Handling:** All media uploads are received as Base64 strings from the client, converted to buffers, and uploaded to ImageKit.
- **API Response:** Standardized through `ResponseInterceptor`.

### Frontend Patterns
- **Component-Driven UI:** Components are modular, found in `src/components/`, with accompanying `.css` files.
- **Type Safety:** Interfaces for `Movie`, `Song`, `Quote`, and `Video` are defined in `src/types/index.ts`.
- **API Layer:** All backend interactions are abstracted into `src/api/` modules.
- **State Management:** Uses React hooks (useState, useEffect) and local state for simplicity.

---

## Key Feature Workflows

1.  **Movie & Song Management:** Users upload movie covers and audio tracks which are stored in ImageKit and linked in Supabase.
2.  **Quote Management:** Text-based quotes are stored for overlaying on videos.
3.  **Video Generation:**
    - Triggered via `POST /api/videos/generate`.
    - Combines a quote, a movie image, and a song.
    - Uses FFmpeg to render the final output, which is then uploaded back to ImageKit.
    - Real-time status tracking via `GET /api/videos/status/:id`.
