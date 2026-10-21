import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const MAX_IMAGE_CHARS = 4_300_000;

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !Object.hasOwn(process.env, match[1])) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}
loadLocalEnv();

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > MAX_IMAGE_CHARS + 100_000) {
      const error = new Error("Request is too large. Please upload an image under 3 MB.");
      error.status = 413;
      throw error;
    }
  }
  try { return JSON.parse(body || "{}"); }
  catch { const error = new Error("Invalid JSON request."); error.status = 400; throw error; }
}

async function analyze(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Use POST to analyze an image." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return sendJson(res, 500, { error: "OPENAI_API_KEY is missing. Add it to a local .env file; never put it in frontend JavaScript." });
  }

  try {
    const body = await readJson(req);
    const image = body.image;
    if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) {
      return sendJson(res, 400, { error: "Please upload a JPG, PNG, or WEBP image." });
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return sendJson(res, 413, { error: "Image is too large. Please upload an image under 3 MB." });
    }

    const prompt = `You are assessing a vehicle using only the uploaded photo. Do not ask for or rely on an accident description. Analyze only visible evidence. Clearly separate visible facts from uncertain inferences. Never claim the photo proves the actual accident history, hidden structural damage, liability, or insurance coverage. If damage is not visible or the image is unclear, say so. Estimate a broad illustrative repair range in Indian rupees only when reasonable; state that an in-person inspection is needed. Return ONLY valid JSON with these keys: severity (low, moderate, high, uncertain), confidence (number 0 to 1), impactArea (string), damageTypes (array of strings), damageSummary (string), repairRange (string), incident {accidentType (likely visual pattern or "Cannot determine from image"), impactDirection (string or uncertain), components (array), severity (string)}, consistency {level (string such as "Image-based assessment"), explanation (string explaining evidence and limitations)}, and nextStep (string). Be conservative, do not invent details, and use INR estimates as illustrative only.`;

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [{ role: "user", content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: image, detail: "high" } }
        ] }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1200
      })
    });

    if (!upstream.ok) {
      const details = await upstream.text();
      console.error("OpenAI API error:", upstream.status, details);
      if (upstream.status === 401) return sendJson(res, 502, { error: "OpenAI rejected the API key. Check the key in your local .env file." });
      if (upstream.status === 429) return sendJson(res, 429, { error: "OpenAI quota or rate limit reached. Check API billing and limits." });
      return sendJson(res, 502, { error: "OpenAI could not analyze this image. Check the API model, account access and server terminal." });
    }

    const payload = await upstream.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return sendJson(res, 502, { error: "The AI returned an empty assessment." });
    let assessment;
    try { assessment = JSON.parse(content); }
    catch { return sendJson(res, 502, { error: "The AI returned an invalid assessment. Please retry." }); }
    return sendJson(res, 200, { ...assessment, analysisMode: "OpenAI vision analysis" });
  } catch (error) {
    console.error("Analysis request error:", error);
    return sendJson(res, error.status || 500, { error: error.message || "Analysis failed." });
  }
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (pathname === "/api/analyze") return analyze(req, res);
  if (pathname === "/api/health" && (req.method === "GET" || req.method === "HEAD")) {
    return sendJson(res, 200, {
      status: "ok",
      backend: "node",
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY)
    });
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }
  let relative;
  try { relative = decodeURIComponent(pathname === "/" ? "/index.html" : pathname); }
  catch { return sendJson(res, 400, { error: "Invalid path." }); }
  if (relative.includes("..") || relative.split("/").some(part => part.startsWith("."))) {
    return sendJson(res, 403, { error: "Forbidden." });
  }
  const filePath = path.resolve(ROOT, "." + relative);
  if (!filePath.startsWith(ROOT + path.sep)) return sendJson(res, 403, { error: "Forbidden." });
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache"
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Vehicle Damage Analyzer running at http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) console.log("Add OPENAI_API_KEY to .env before using AI analysis.");
});
