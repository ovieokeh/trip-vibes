# Mobile Migration: Master Implementation Plan

This is the comprehensive plan for migrating the TripVibes web experience to a native mobile app. We will execute this in phases to ensure stability and reusability.

## User Review Required

> [!IMPORTANT] > **Shared Library**: This plan assumes we will use the existing `packages/shared` workspace. I will move core types (`Vibe`, `Itinerary`, `UserProfile`, etc.) there. This will require a refactor of the **Web App** imports as well.

## Phase 1: Foundation & Shared Code

**Goal**: Establish a single source of truth for types and utilities to prevent drift between Web and Mobile.

### 1. Unified Types

- **Move Types to `@trip-vibes/shared`**:
  - [NEW] `packages/shared/src/types.ts`: Migrate `Vibe`, `Itinerary`, `Activity`, `UserProfile`, `EngineCandidate` from `apps/web/lib/types.ts`.
  - [MODIFY] `packages/shared/src/index.ts`: Export the new types.
- **Update Web**:
  - [MODIFY] `apps/web/lib/types.ts`: Deprecate local types and re-export from `@trip-vibes/shared` (or update imports directly across the app).
- **Update Mobile**:
  - [MODIFY] `apps/mobile/package.json`: Add `@trip-vibes/shared` dependency.
  - [MODIFY] `apps/mobile/tsconfig.json`: Ensure paths are correctly configured (if not handled by Turbo).

### 2. Mobile Architecture Skeletons

- **Core Components**:
  - [NEW] `apps/mobile/components/ui`: Implement base design tokens (Colors, Typography) matching Web.
  - [NEW] `apps/mobile/lib/api.ts`: Setup Axios/Fetch wrapper for backend communication.

## Phase 2: Authentication & Onboarding

**Goal**: Replicate the "Anonymous first, converting later" flow.

### 1. Auth Logic

- **Shared Hook (Optional)**: If logic allows, move `useAuth` state logic to `packages/shared`.
- **Mobile AuthProvider**:
  - [MODIFY] `apps/mobile/components/AuthProvider.tsx`: Ensure it handles:
    - Session restoration.
    - Anonymous sign-in on first launch.

### 2. Auth Screens

- [NEW] `apps/mobile/app/(auth)/login.tsx`: Login Screen.
- [NEW] `apps/mobile/app/(auth)/signup.tsx`: Signup Screen.
- [NEW] `apps/mobile/app/(auth)/forgot-password.tsx`: Reset password flow.
- [NEW] `apps/mobile/components/AuthModal.tsx`: If we want a modal flow similar to web during specific actions (like Clean Up/Save).

## Phase 3: Home & Vibe Selection (The Extraction)

**Goal**: The "Tinder for Travel" interface.

### 1. Home Screen

- [MODIFY] `apps/mobile/app/index.tsx`:
  - Show "Active Itinerary" widget if one exists.
  - "Create New Trip" CTA.

### 2. The Deck

- [NEW] `apps/mobile/components/VibeCard.tsx`: High-quality card with image, title, and "info" button.
- [NEW] `apps/mobile/components/VibeStack.tsx`:
  - Use `react-native-reanimated` and `react-native-gesture-handler`.
  - Handle Left/Right swipes with haptic feedback.
- [NEW] `apps/mobile/store/creation-flow.ts`: Zustand store (or context) to track:
  - `swipedVibes` (liked/disliked).
  - `currentCity`.
  - `dates`.

## Phase 4: Itinerary Generation (The Brain)

**Goal**: Interface with the AI Agent.

### 1. Generation Service

- [NEW] `apps/mobile/lib/vibe-api.ts`: Functions to call the Next.js API (`/api/itinerary/generate`).

### 2. Loading State

- [NEW] `apps/mobile/app/generating.tsx`:
  - Show streaming progress (similar to web's `LoadingSteps`).
  - Animate steps as they complete.

## Phase 5: Itinerary Display (The Verification)

**Goal**: The "Day View" optimized for mobile.

### 1. Itinerary View

- [NEW] `apps/mobile/app/itinerary/[id].tsx`: Main layout.
- [NEW] `apps/mobile/components/Itinerary/Timeline.tsx`: Vertical list of activities.
- [NEW] `apps/mobile/components/Itinerary/ActivityCard.tsx`:
  - Show time, title, duration.
  - "Swap" button logic.

### 2. Map Integration

- [NEW] `apps/mobile/components/ResultMap.tsx`: Interactive map showing the day's route.

## Phase 6: User Profile & Persistence

**Goal**: Saving and syncing.

### 1. Profile Pages

- [NEW] `apps/mobile/app/account/index.tsx`: User details, sign out, delete account.
- [NEW] `apps/mobile/app/saved-trips.tsx`: List of past generated itineraries.

### 2. Sync

- Ensure Supabase Realtime or simple pull-on-refresh keeps mobile in sync with web actions.

## Verification Plan

### Automated

- **Lint/Type Check**: `turbo run lint type-check` across the mono-repo to ensure shared package integration didn't break web.

### Manual

- **Phase 1**: Verify `apps/web` still builds and runs with types imported from `shared`.
- **Phase 2**: Test Anonymous -> Signup conversion on Mobile.
- **Phase 3**: Verify swipe gestures feel native (60fps).
- **Phase 4**: Verify streaming response works on mobile networks.
