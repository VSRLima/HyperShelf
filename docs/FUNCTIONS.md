# Convex Functions Notes

This project stores Convex functions in `functions/` (see `convex.json`).

## Main Files

- `functions/schema.ts`: database schema and indexes
- `functions/recommendations.ts`: recommendation query/mutation exports
- `functions/users.ts`: user/admin query/mutation exports
- `functions/auth.config.ts`: Clerk JWT issuer domain configuration
- `functions/lib/**`: implementation helpers
- `functions/_generated/**`: generated Convex types and API bindings

## Typical Commands

```bash
npx convex dev
npx convex deploy
```

Run `npx convex dev` during local development so generated bindings stay in sync.
