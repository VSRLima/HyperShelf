# HypeShelf

HypeShelf is a Next.js app for sharing recommendations, with Clerk authentication and a Convex backend.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Clerk for auth
- Convex for functions and data
- CSS Modules + global styles

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Add `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
CLERK_WEBHOOK_SECRET=whsec_...
```

3. Start Convex dev in one terminal:

```bash
npx convex dev
```

4. Start Next.js in another terminal:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Scripts

- `npm run dev` - run Next.js locally
- `npm run build` - production build
- `npm start` - start production server
- `npm run lint` - ESLint checks
- `npm test` - Node test suite (`tests/` + `tests/functions/`)

## Documentation

All project docs (except this root `README.md`) are in [`docs/`](./docs):

- [`docs/START_HERE.md`](./docs/START_HERE.md)
- [`docs/SETUP.md`](./docs/SETUP.md)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/FUNCTIONS.md`](./docs/FUNCTIONS.md)
- [`docs/DOCUMENTATION_INDEX.md`](./docs/DOCUMENTATION_INDEX.md)
- [`docs/WELCOME.txt`](./docs/WELCOME.txt)
