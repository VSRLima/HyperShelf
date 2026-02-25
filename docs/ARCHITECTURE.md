# Architecture

## Runtime Layout

- Frontend: `src/app` (Next.js App Router)
- Backend functions: `functions/` (configured by `convex.json`)
- Shared backend helpers: `functions/lib/**`
- Tests: `tests/` and `tests/functions/`

## Key Routes

- `/` public recommendations feed
- `/dashboard` authenticated recommendations management
- `/dashboard/recommendations/[recId]/edit` edit flow
- `/dashboard/admin` admin user/recommendation overview
- `/api/webhooks/clerk` Clerk `user.created` webhook handler

## Data Model (Convex)

Defined in `functions/schema.ts`.

### `users`

- `id` (Clerk user id)
- `name`
- `user_profile`
- `role` (`"user" | "admin"`)

Indexes:

- `by_user_id`
- `by_role`

### `recommendations`

- `userId` (reference to `users` doc id)
- `title`
- `genre`
- `link` (optional)
- `blurb`
- `isStaffPick`
- `createdAt`

Indexes:

- `by_user`
- `by_genre`
- `by_created`

## Authorization Model

- Unauthenticated users can view public recommendations.
- Authenticated users can create and manage their own recommendations.
- Admins can:
  - mark/unmark staff picks
  - manage users in admin console
  - manage any recommendation

Enforcement occurs in Convex handlers (`functions/lib/**`), not only in UI.

## Function Entry Points

- `functions/recommendations.ts`
  - `getLatestPublic`
  - `getAllRecommendations`
  - `addRecommendation`
  - `getRecommendationById`
  - `updateRecommendation`
  - `deleteRecommendation`
  - `markStaffPick`

- `functions/users.ts`
  - `getUserRole`
  - `createUserIfNotExists`
  - `listUserRoles`
  - `setUserRole`
  - `adminListUsersWithRecommendations`
  - `updateUserConfiguration`
