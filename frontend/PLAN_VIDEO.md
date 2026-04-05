# Frontend Implementation Plan: Video Management & Generator (Refined)

This plan outlines the creation of a dedicated "Videos" section and a "What You See Is What You Get" (WYSIWYG) video generation flow with text customization.

## Objective
Provide a seamless and visual experience for users to generate videos from quotes and music, showing a live preview of the final result before generation, including custom text styling.

## Key Features
- **WYSIWYG Video Generator:** 
  - A 9:16 (vertical) preview area showing the static background image.
  - Live overlay of the selected quote text on the preview image.
  - **Text Customization Controls:**
    - **Font Size:** Slider or number input to adjust the text size.
    - **Font Color:** Color picker for the text.
    - **Border/Background Color:** Color picker for the text outline.
    - **Alignment/Positioning:** Controls to move text (Top, Middle, Bottom).
  - Integration with the Quote List to initiate the process.
  - Song selection for the background music.
- **Video List Page:** A dedicated view to browse, play, and manage all generated videos.
- **Navigation:** Updated Sidebar to include a link to the new "Videos" section.

## Implementation Steps

### Phase 1: API & Type Enhancements
1. **Frontend Types:** Update `GenerateVideoRequest` to include styling parameters (fontSize, fontColor, borderColor, position).
2. **Backend DTO:** Update `GenerateVideoDto` to accept styling parameters.
3. **Backend Service:** Modify `VideoService.ts` to pass these styling parameters to the FFmpeg command.

### Phase 2: Video List Page (`frontend/src/pages/VideoList.tsx`) - DONE
1. Create `VideoList.tsx` and `VideoList.css`.
2. Implement grid view for generated videos with status tracking and deletion.

### Phase 3: Routing & Navigation - DONE
1. Update `Sidebar.tsx` and `App.tsx` with `/videos` route.

### Phase 4: Video Generator Refinement (`frontend/src/components/VideoGenerator.tsx`) - IN PROGRESS
1. **Implement Live Preview:** 
   - Add a container with 9:16 aspect ratio.
   - Use the backend's static image as the preview background.
   - Overlay the `quote.text` in the center, mimicking FFmpeg's styling.
2. **Styling Controls:** Add UI elements (inputs/sliders) for Font Size, Color, and Border.
3. **Dynamic Preview:** Ensure the text overlay updates in real-time as the user changes the controls.
4. **Song Selection:** Maintain the music selection dropdown.
5. **Redirection Logic:** Upon successful generation, add a "View in Gallery" button that redirects to `/videos`.

### Phase 5: Styling & Polish
1. Ensure the preview and controls are responsive.
2. Add a toggle or button to "Play Song Preview" if possible.

## Verification & Testing
1. **Visual Accuracy:** Compare the frontend preview with the final generated MP4 to ensure the text layout matches the custom styles.
2. **Functional Flow:** Verify the full cycle from Quote -> Preview -> Custom Styling -> Selection -> Generation -> Gallery.
