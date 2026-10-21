# Vehicle Damage & Insurance Analyzer

An academic project that uses an OpenAI vision model to inspect a vehicle photo and prepare a preliminary damage assessment. The user uploads an image only; there is no accident-description field.

## Features

- Upload or drag-and-drop a JPG, PNG, or WEBP vehicle photo (up to 3 MB).
- Analyze visible damage, likely affected components, severity and uncertainty using an OpenAI vision model.
- Show a broad, illustrative repair-cost range in INR when a reasonable estimate is possible.
- Print or save the assessment report as PDF.
- Keep the OpenAI API key on the Node.js backend, never in browser JavaScript.

## Important: what GitHub Pages can run

GitHub Pages hosts static files only. It cannot run `server.js` or provide a secure private OpenAI API endpoint. Therefore the public GitHub Pages URL can display the website, but it cannot perform real AI image analysis by itself.

To run the complete analyzer without Vercel, run the Node.js backend locally from this repository. For a permanently online public analyzer, a backend service must be running somewhere; GitHub Pages alone cannot provide that. GitHub Actions can check code but is not a persistent web server.

## Run locally on Windows

1. Install Node.js 18 or newer from https://nodejs.org/.
2. Download this repository from GitHub and extract it, or clone it with Git.
3. Open Command Prompt or PowerShell in the project folder.
4. Copy `.env.example` to a new file named `.env`.
5. Edit `.env` and replace the placeholder with your real OpenAI API key:

   ```env
   OPENAI_API_KEY=your_real_openai_api_key
   OPENAI_MODEL=gpt-4.1-mini
   PORT=3000
   ```

   Keep `.env` private. Do not commit it to GitHub or share screenshots that show the key.
6. Start the website and backend:

   ```bash
   npm start
   ```

7. Open http://localhost:3000 in your browser.
8. Check the backend status at http://localhost:3000/api/health. It should return JSON with `"status":"ok"` and `"apiKeyConfigured":true`.
9. Upload a clear vehicle photo and press **Analyze Vehicle**. No accident description is required.

## Where the API is configured

- `.env`: private local environment variables; contains `OPENAI_API_KEY`. This file must never be uploaded.
- `.env.example`: safe template containing only a placeholder.
- `server.js`: reads the key on the server and sends the image to the OpenAI API. The key is never sent to the browser.
- `app.js`: handles image selection, calls `POST /api/analyze`, and displays the returned report.
- `/api/health`: local server status check. It reports whether a key is configured without exposing the key.

## Code checks

Run:

```bash
npm run check
```

GitHub Actions also runs the JavaScript syntax check on pushes and pull requests to the main/master branch. A syntax check does not prove that a real OpenAI request will succeed; the API key must be valid, the account must have API access and billing/quota available, and the model must be available to the account.

## Troubleshooting

- **`apiKeyConfigured: false`**: make sure `.env` is in the same folder as `server.js`, then restart `npm start`.
- **HTTP 401**: the OpenAI API key is invalid or inactive.
- **HTTP 429**: check API billing, quota and rate limits.
- **Model error**: set `OPENAI_MODEL` to a vision-capable model available to your API account.
- **GitHub Pages cannot analyze**: expected until a secure backend is deployed and connected. Do not paste the API key into `app.js`.

## Responsible use

This is an educational prototype, not a certified damage detector, exact repair quotation, professional inspection or official insurance decision. A single photo cannot reliably reveal hidden structural damage, establish liability, prove accident history or determine insurance coverage. A qualified repair professional and insurer should assess real claims.
