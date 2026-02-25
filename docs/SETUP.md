# Setup and Deployment

## Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
CLERK_WEBHOOK_SECRET=whsec_...
```

## Convex Auth Provider Config

`functions/auth.config.ts` expects `CLERK_JWT_ISSUER_DOMAIN` in Convex environment settings.
Set this in your Convex deployment environment (not just `.env.local`).

## Local Development

1. `npm install`
2. `npx convex dev`
3. `npm run dev`

## Production

### Frontend (Vercel or similar)

- Deploy the Next.js app.
- Set the same app env vars used in `.env.local`.

### Backend (Convex)

- Deploy functions with:

```bash
npx convex deploy
```

- Confirm Convex environment contains `CLERK_JWT_ISSUER_DOMAIN`.
