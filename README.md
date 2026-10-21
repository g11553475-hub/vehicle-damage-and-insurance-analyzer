# Vehicle Damage & Insurance Analyzer

A student project using an OpenAI vision model to inspect a vehicle photo and prepare a preliminary damage report. No accident-description field is required.

## Features
- Responsive red-and-white frontend with drag-and-drop image upload and preview.
- JPG, PNG and WEBP image validation (maximum 3 MB).
- OpenAI vision analysis through a private Node.js backend.
- Visible damage, severity, affected components, uncertainty, illustrative INR repair range and next steps.
- Print / Save as PDF.
- Local Node.js server and Vercel serverless API endpoints.
- Health check and GitHub Actions validation.

## Recommended live deployment: Vercel + GitHub

GitHub remains the source-code repository. Vercel builds and hosts the frontend and the secure serverless API from the same repository. The API key must be stored only as a Vercel environment variable.

1. Import `https://github.com/g11553475-hub/vehicle-damage-and-insurance-analyzer` into Vercel and select the `main` branch.
2. Keep the project root directory as `./`. The repository contains `api/analyze.js` and `api/health.js`, which Vercel deploys as Node.js functions.
3. In Vercel → Project → Settings → Environment Variables, add:
   - `OPENAI_API_KEY` = your private OpenAI API key
   - `OPENAI_MODEL` = `gpt-4.1-mini`
4. Add the variables to Production (and Preview if needed), save them, and redeploy the latest deployment so the functions receive them.
5. Open the deployed URL followed by `/api/health`. Confirm the JSON shows `"status":"ok"` and `"apiKeyConfigured":true`.
6. Upload a clear vehicle photo on the deployed website and select **Analyze Vehicle**. Confirm an assessment is returned.

Because the frontend and API are served from the same Vercel project, leave the `backend-api-url` meta tag empty. The browser will call the same-origin `/api/analyze` endpoint. Do not add a trailing URL or API key to that tag.

## Local development on Windows

1. Install Node.js 22: https://nodejs.org/
2. Download and extract this repository.
3. Open PowerShell in the project folder.
4. Create a private environment file: `Copy-Item .env.example .env`.
5. Edit `.env` and add your real key:
   ```env
   OPENAI_API_KEY=your_real_private_key
   OPENAI_MODEL=gpt-4.1-mini
   PORT=3000
   FRONTEND_ORIGIN=
   ```
6. Run `npm run check`, then `npm test`.
7. Run `npm start` and open http://localhost:3000.
8. Check http://localhost:3000/api/health. The `apiKeyConfigured` value should be `true`.

## GitHub Pages limitation

GitHub Pages serves static files only; it cannot run the Node.js API. The GitHub Pages URL will therefore show a backend-configuration message until a separate backend URL is configured. For the simplest online setup, use the Vercel deployment URL for both the website and API. GitHub Actions validates code but is not a persistent API server.

## Security
- Never commit `.env` or put an API key in `index.html`, `app.js`, or any other browser file.
- If an API key was exposed publicly, revoke it and create a replacement.
- Keep API billing and usage limits enabled.

## Endpoints
- `GET /api/health`: returns backend status, model name and whether a key is configured. It never returns the key.
- `POST /api/analyze`: accepts JSON with an image data URL and returns the AI assessment.

## Troubleshooting
- `apiKeyConfigured: false`: add `OPENAI_API_KEY` in Vercel Project Settings → Environment Variables and redeploy.
- HTTP 401 from OpenAI: the key is invalid or revoked.
- HTTP 429: check OpenAI billing, quota and rate limits.
- HTTP 502: check model access and Vercel runtime logs.
- `The secure AI backend URL has not been configured` on GitHub Pages: use the Vercel-hosted site or configure a separately hosted backend URL.
- The npm `cache-dir` warning is usually an environment/configuration warning and is not itself an application build failure. Remove an unsupported `cache-dir` setting from the build environment or npm configuration if you control it.

## Limitations

This is an educational prototype, not a certified damage detector, exact quotation, professional inspection or official insurance decision. One photo cannot establish hidden structural damage, actual accident history, liability or insurance coverage. Repair estimates are illustrative only.
