const MAX_IMAGE_CHARS = 4_300_000;

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = (process.env.FRONTEND_ORIGIN || "").split(",").map(v => v.trim()).filter(Boolean);
  if (origin && origin !== req.headers.host && !allowed.includes(origin)) {
    return sendJson(res, 403, { error: "This website origin is not allowed to use the analysis API." });
  }
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 405, { error: "Use POST to analyze an image." });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); }
      catch { return sendJson(res, 400, { error: "Invalid JSON request." }); }
    }
    const image = body?.image;
    if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) {
      return sendJson(res, 400, { error: "Please upload a JPG, PNG, or WEBP image." });
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return sendJson(res, 413, { error: "Image is too large. Please upload an image under 3 MB." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return sendJson(res, 503, { error: "The AI backend is not configured. Add OPENAI_API_KEY in Vercel Project Settings → Environment Variables, then redeploy." });
    }

    const prompt = `You are assessing a vehicle using only the uploaded photo. Do not ask for or rely on an accident description. Analyze only visible evidence. Clearly separate visible facts from uncertain inferences. Never claim the photo proves actual accident history, hidden structural damage, liability, or insurance coverage. If damage is not visible or the image is unclear, say so. Estimate a broad illustrative repair range in Indian rupees only when reasonable; state that an in-person inspection is needed. Return ONLY valid JSON with these keys: severity (low, moderate, high, uncertain), confidence (number 0 to 1), impactArea (string), damageTypes (array of strings), damageSummary (string), repairRange (string), incident {accidentType (likely visual pattern or "Cannot determine from image"), impactDirection (string or uncertain), components (array), severity (string)}, consistency {level (string such as "Image-based assessment"), explanation (string explaining evidence and limitations)}, and nextStep (string). Be conservative, do not invent details, and use INR estimates as illustrative only.`;

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
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
      if (upstream.status === 401) return sendJson(res, 502, { error: "OpenAI rejected the API key. Check the private OPENAI_API_KEY value in Vercel." });
      if (upstream.status === 429) return sendJson(res, 429, { error: "OpenAI quota or rate limit reached. Check API billing and limits." });
      return sendJson(res, 502, { error: "OpenAI could not analyze this image. Check model access and Vercel runtime logs." });
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
