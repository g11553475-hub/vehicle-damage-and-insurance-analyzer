# Vehicle Damage & Insurance Analyzer

An academic project that uses an OpenAI vision model to inspect a vehicle photo and produce a preliminary damage assessment. The user only uploads an image; there is **no accident-description field**.

## What it does

- Upload or drag-and-drop a JPG, PNG, or WEBP vehicle photo (up to 3 MB).
- Ask the vision model to describe visible damage, likely affected components, visible severity and uncertainty.
- Produce a broad, illustrative repair-cost range in INR when the image supports an estimate.
- Show likely impact patterns as AI inferences, not established accident facts.
- Print or save the report as PDF.
- Keep the OpenAI API key on the Node.js server, not in browser JavaScript.

## Important hosting limitation

GitHub repositories store source code. **GitHub Pages only hosts static files and cannot run the private Node.js API backend.** Therefore the OpenAI image analysis will not work on the public GitHub Pages URL by itself. To use the complete analyzer without Vercel or another hosted backend, run the backend locally from this GitHub repository or inside GitHub Codespaces. A permanently online public AI analyzer needs a server/backend host; never put a secret OpenAI key in a GitHub Pages JavaScript file.

## Run locally on Windows

1. Install Node.js 18 or newer from https://nodejs.org/.
2. Download or clone this repository from GitHub.
3. Open a terminal in the project folder.
4. Create a file named `.env` in the project root with these lines:

   ```env
   OPENAI_API_KEY=your_real_openai_api_key
   OPENAI_MODEL=gpt-4.1-mini
   PORT=3000
   ```

5. Start the app:

   ```bash
   npm start
   ```

6. Open **http://localhost:3000** in your browser.
7. Upload a clear vehicle photo and press **Analyze Vehicle**. No accident description is needed.

The server prints useful startup and API error messages in the terminal. Keep `.env` private; do not commit it to GitHub or share screenshots that reveal the key.

## API

The local Node.js server exposes `POST /api/analyze`. The browser sends a base64 image data URL. The server forwards the photo to OpenAI and returns structured JSON for the report. The key is read from the server's environment and is never sent to the browser.

## Project structure

```
index.html      Responsive single-page UI (image-only assessment)
styles.css      Red-and-white styling
app.js          Upload, preview, API request, results and print handling
server.js       Local Node.js static server + secure server-side OpenAI call
.env.example   Example environment variables (no secret)
package.json    Start and syntax-check scripts
```

## Troubleshooting

- **OPENAI_API_KEY is missing:** ensure `.env` is in the same folder as `server.js`, and restart `npm start`.
- **401 from OpenAI:** check that the key is valid and active.
- **429 / quota error:** check OpenAI billing and usage limits.
- **Model unavailable:** set `OPENAI_MODEL` to a vision-capable model available to your OpenAI account.
- **GitHub Pages says the analysis endpoint failed:** expected; Pages cannot execute `server.js`. Open the app at `http://localhost:3000` while the server is running.

## Responsible use

This is an AI-assisted educational prototype, not a certified damage detector, professional inspection, exact repair quotation or official insurance decision. A single photo cannot reliably reveal hidden structural damage, prove the accident history, establish liability or determine insurance coverage. Have a qualified repair professional and insurer assess real claims.
