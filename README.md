# Vehicle Damage & Insurance Analyzer

A student project using an OpenAI vision model to inspect a vehicle photo and prepare a preliminary damage report. No accident-description field is required.

## Features
- Responsive red-and-white frontend with drag-and-drop image upload and preview.
- JPG, PNG and WEBP image validation (maximum 3 MB).
- OpenAI vision analysis through a private Node.js backend.
- Visible damage, severity, affected components, uncertainty, illustrative INR repair range and next steps.
- Print / Save as PDF.
- Backend health check, request validation, CORS configuration and GitHub Actions code checks.

## Hosting limitation
GitHub Pages hosts static files only. It cannot run this Node.js backend or securely store a private OpenAI API key. GitHub Actions validates code; it is not a persistent public API server.

A permanently online analyzer needs both the GitHub Pages frontend and a running Node.js backend. This project does not use Vercel. If GitHub Pages is the only runtime allowed, real private-key OpenAI analysis is not possible. Running locally is the GitHub-only development option.

## Run locally on Windows
1. Install Node.js 18 or newer: https://nodejs.org/
2. Download and extract this repository.
3. Open PowerShell in the project folder.
4. Create your private environment file: `Copy-Item .env.example .env` (Command Prompt: `copy .env.example .env`).
5. Edit `.env` and replace the placeholder with your real API key:
   ```env
   OPENAI_API_KEY=your_real_private_key
   OPENAI_MODEL=gpt-4.1-mini
   PORT=3000
   FRONTEND_ORIGIN=
   ```
   Keep `.env` private. Never commit it or put the key in browser code.
6. Run syntax checks: `npm run check`
7. Start the server: `npm start`
8. Open http://localhost:3000. Check http://localhost:3000/api/health; `apiKeyConfigured` should be `true`.
9. Upload a clear vehicle photo and select **Analyze Vehicle**.

## GitHub Pages + backend deployment
1. Publish the frontend with GitHub Pages.
2. Deploy `server.js` to a Node.js backend host. Set these private/runtime environment variables in the backend host:
   - `OPENAI_API_KEY`: private API key
   - `OPENAI_MODEL`: `gpt-4.1-mini` or another vision-capable model enabled for your account
   - `FRONTEND_ORIGIN`: exact origin of the Pages site, e.g. `https://g11553475-hub.github.io` (no path)
   - `PORT`: provided by the host, if required
3. In `index.html`, set the `backend-api-url` meta tag content to the backend's public HTTPS base URL. This URL is public configuration, not a secret. Never put the API key there.
4. Commit the frontend URL change and wait for Pages to publish.
5. Visit the backend's `/api/health`. Confirm `status: "ok"` and `apiKeyConfigured: true`.
6. Upload a real image to test end-to-end. A valid key, API billing/quota and model access are required.

## Key safety
- The key is read only by `server.js` from a local `.env` file or backend environment variables.
- `.env` is ignored by Git.
- Never put the key in `app.js`, `index.html`, a committed file, or screenshots. If exposed, revoke it and create a replacement.

## Endpoints
- `GET /api/health`: backend status and key-configured boolean; never returns the key.
- `POST /api/analyze`: accepts JSON with an `image` data URL.
- `OPTIONS /api/*`: CORS preflight for separate frontend hosting.

## Troubleshooting
- `apiKeyConfigured: false`: check private environment variables and restart the backend.
- HTTP 401: invalid/revoked API key.
- HTTP 429: quota, billing or rate limit.
- HTTP 502: provider/model issue or invalid response; check backend logs.
- Browser CORS error: make `FRONTEND_ORIGIN` match the browser origin exactly (scheme + host, no path).
- GitHub Pages cannot analyze: deploy the backend and configure `backend-api-url`.

## Limitations
This is an educational prototype, not a certified damage detector, exact quotation, professional inspection or official insurance decision. One photo cannot establish hidden structural damage, actual accident history, liability or insurance coverage. Repair estimates are illustrative only.
