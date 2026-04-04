# Frontend Implementation Plan: React Movie & Song Manager

This plan outlines the creation of a React-based frontend to interact with the existing backend API.

## Objective
Create a responsive, modern web application that allows users to manage movies and their associated songs.

## Key Features
- **Movie Dashboard:** List all movies with their titles, descriptions, and images.
- **Movie Details:** View a specific movie and its list of songs.
- **Movie Management:** Create, update, and delete movies (including Base64 image upload).
- **Song Management:** Add, update, and delete songs for specific movies (including Base64 audio upload).
- **Responsive Design:** A mobile-friendly UI using Vanilla CSS.

## Tech Stack
- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (CSS Modules)
- **Icons:** Lucide React
- **API Client:** Axios
- **Routing:** React Router DOM

## Project Structure
```text
frontend/
├── public/
├── src/
│   ├── api/             # Axios instance and API calls
│   ├── components/      # Reusable UI components (Button, Card, Modal, etc.)
│   ├── pages/           # Main page views (Home, MovieDetails, EditMovie)
│   ├── types/           # TypeScript interfaces (Movie, Song)
│   ├── utils/           # Helper functions (Base64 converters)
│   ├── App.tsx          # Main application component
│   ├── App.css          # Global styles
│   └── main.tsx         # Entry point
├── .env                 # Environment variables (VITE_API_URL)
└── package.json
```

## Implementation Steps

### Phase 1: Setup & Configuration
1. Initialize Vite project: `npm create vite@latest frontend -- --template react-ts`.
2. Install dependencies: `axios`, `react-router-dom`, `lucide-react`.
3. Set up `.env` file with `VITE_API_URL=http://localhost:3000`.
4. Configure Axios instance with base URL and response interceptors.

### Phase 2: Core Components & Routing
1. Define TypeScript interfaces for `Movie` and `Song`.
2. Set up `BrowserRouter` with routes:
   - `/`: Movie List (Dashboard)
   - `/movie/:id`: Movie Details & Song List
   - `/movie/new`: Create Movie
   - `/movie/edit/:id`: Edit Movie
3. Create a layout wrapper with a Navbar.

### Phase 3: Movie Management
1. **MovieList Page:** Fetch and display movies using a `MovieCard` component.
2. **MovieForm Page:** Create a reusable form for adding/editing movies.
   - Implement Base64 image preview and conversion.
3. **Delete Functionality:** Add delete buttons with confirmation modals.

### Phase 4: Song Management (Nested in Movie Details)
1. **MovieDetails Page:** Display movie info and a list of songs.
2. **SongForm Modal:** Add/Edit songs associated with the current movie.
   - Implement Base64 audio file handling.
3. **Audio Player:** Integrate a simple HTML5 audio player for songs.

### Phase 5: Styling & Polish
1. Apply global styles and variables (colors, spacing, typography).
2. Ensure responsiveness for mobile, tablet, and desktop.
3. Add loading states and error handling notifications.

## Verification & Testing
1. **Functional Testing:** Verify all CRUD operations for movies and songs.
2. **API Integration:** Ensure Base64 uploads are handled correctly by the backend.
3. **Responsiveness:** Check UI layout on various screen sizes.
4. **Performance:** Ensure smooth transitions and fast loading.
