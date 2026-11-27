# Gruuve

Workout timer: build interval workouts on the web, run them on your phone, computer or Roku TV.

Hosted on Cloudflare Pages at https://gruuveworkout.com. The React client lives in `client/`, the API runs as Pages Functions (`functions/` → `server/`) on a D1 database (`migrations/`), and the Roku channel is in `roku/`.

## Local development

1. Create `.dev.vars` with the Google OAuth client:

   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

   Add `http://localhost:8788/authorize` as an authorized redirect URI on the OAuth client.

2. Install and run:

   ```bash
   npm install && npm --prefix client install
   npm run dev
   ```

   This builds the client, applies migrations to a local D1 database and serves everything at http://localhost:8788. For hot reload, also run `npm --prefix client run dev` and use the Vite URL; it proxies the API to port 8788.

## Deploying

Pushes to `main` deploy through GitHub Actions, which needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. To deploy by hand: `npm run deploy`.

Production secrets are set on the Pages project:

```bash
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name=gruuve
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name=gruuve
```
