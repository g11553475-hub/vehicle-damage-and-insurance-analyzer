export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed." }));
  }
  res.statusCode = 200;
  return res.end(JSON.stringify({
    status: "ok",
    backend: "vercel-node-function",
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY)
  }));
}
