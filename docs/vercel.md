# Deployment Vercel

## API shape

Vercel calls `api/index.js`, which exports the existing Express app from `app.js`.
`vercel.json` rewrites every request to that serverless function, so these URLs stay unchanged:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/google`
- `/api/houses`
- `/api-docs`

## Environment variables

Set these variables in the Vercel project settings:

```text
JWT_SECRET=...
DATABASE_URL=postgres://...
DATABASE_SCHEMA=public
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DATABASE_POOL_MAX=2
GOOGLE_CLIENT_ID=...
```

Use `GOOGLE_CLIENT_IDS` instead of `GOOGLE_CLIENT_ID` if the mobile app has several Google OAuth client IDs:

```text
GOOGLE_CLIENT_IDS=web-client-id.apps.googleusercontent.com,android-client-id.apps.googleusercontent.com,ios-client-id.apps.googleusercontent.com
```

## Database

Run migrations against the production database after setting `DATABASE_URL` locally or from a deployment workflow:

```bash
npm run migrate
```

The API accepts either:

- `DATABASE_URL`, recommended for Vercel.
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, useful for local development.

## Google login flow

1. The mobile app signs in with Google and receives an `idToken`.
2. The mobile app sends it to `POST /api/auth/google`.
3. The backend verifies the token with Google.
4. The backend creates or links the InventoryHouse user and returns the same JWT shape as email/password login.
