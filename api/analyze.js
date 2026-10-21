const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_IMAGE_CHARS = 4_300_000;

function send(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return send(res, 405, { error: "Use POST to analyze an image." });
  }
  if (!process.env.OPENAI_API_KEY) return send(res, 500, { error: "OPENAI_API_KEY is not configured in Vercel Environment Variables." });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const image = body.image;
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) return send(res, 400, { error: "Please upload a JPG, PNG, or WEBP image." });
    if (image.length > MAX_IMAGE_CHARS) return send(res, 413, { error: "Image is too large. Please upload an image under 3 MB." });
    if (description.length > 3000) return send(res, 400, { error: "Description must be 3,000 characters or fewer." });
    const prompt = "Analyze this vehicle photo for visible damage. Optional accident description: " + (description || "Not provided") + "\n\nReturn ONLY valid JSON with keys severity (low, moderate, high, uncertain), confidence (0 to 1), impactArea, damageTypes (array), damageSummary, repairRange (approximate INR), incident {accidentType, impactDirection, components, severity}, consistency {level, explanation}, and nextStep. Base findings on the image. Do not invent damage. If unclear, say so. Estimates are illustrative, not quotations or official insurance decisions."; 
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
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
      const detail = await upstream.text();
      console.error("OpenAI API error:", upstream.status, detail);
      if (upstream.status === 401) return send(res, 502, { error: "OpenAI rejected the API key. Check OPENAI_API_KEY in Vercel." });
      if (upstream.status === 429) return send(res, 429, { error: "OpenAI quota or rate limit reached. Check your OpenAI billing and limits." });
      return send(res, 502, { error: "OpenAI could not analyze the image. Check Vercel runtime logs." });
    }
    const payload = await upstream.json();
    const content = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
    if (!content) return send(res, 502, { error: "The AI returned an empty assessment." });
    const assessment = JSON.parse(content);
    return send(res, 200, { ...assessment, analysisMode: "OpenAI vision analysis" });
  } catch (error) {
    console.error("Analysis handler error:", error);
    return send(res, 500, { error: "Analysis failed. Check Vercel runtime logs for details." });
  }
}
