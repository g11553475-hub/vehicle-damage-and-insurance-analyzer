const MAX_IMAGE_CHARS = 4_300_000;

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Use POST to analyze a vehicle image." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return send(res, 500, {
      error: "The server is missing OPENAI_API_KEY. Add it in Vercel Project Settings → Environment Variables, then redeploy."
    });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const image = body.image;

    if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) {
      return send(res, 400, { error: "Please upload a JPG, PNG, or WEBP image." });
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return send(res, 413, { error: "Image is too large. Please upload an image under 3 MB." });
    }

    const prompt = `Assess the vehicle using only the uploaded photo. Do not ask for or rely on an accident description. Separate visible facts from uncertain inferences. Never claim the photo proves accident history, hidden structural damage, liability, or insurance coverage. If damage is not visible or the image is unclear, say so. Give a broad illustrative repair range in Indian rupees only when reasonable and explain that in-person inspection is needed. Return ONLY valid JSON with keys: severity (low, moderate, high, uncertain), confidence (number 0 to 1), impactArea (string), damageTypes (array of strings), damageSummary (string), repairRange (string), incident {accidentType (string), impactDirection (string), components (array), severity (string)}, consistency {level (string), explanation (string)}, and nextStep (string). Be conservative and do not invent details.`;

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image, detail: "high" } }
          ]
        }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1200
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("OpenAI API error:", upstream.status, detail);
      if (upstream.status === 401) {
        return send(res, 502, { error: "OpenAI rejected the API key. Check OPENAI_API_KEY in Vercel Environment Variables." });
      }
      if (upstream.status === 429) {
        return send(res, 429, { error: "OpenAI quota or rate limit reached. Check API billing and usage limits." });
      }
      return send(res, 502, { error: "OpenAI could not analyze this image. Check the selected model and the function logs." });
    }

    const result = await upstream.json();
    const raw = result.choices?.[0]?.message?.content;
    if (!raw) return send(res, 502, { error: "The AI returned an empty assessment. Please retry." });

    let assessment;
    try {
      assessment = JSON.parse(raw);
    } catch {
      return send(res, 502, { error: "The AI returned an invalid assessment. Please retry." });
    }

    return send(res, 200, { ...assessment, analysisMode: "OpenAI vision analysis" });
  } catch (error) {
    console.error("Vehicle analysis function error:", error);
    return send(res, 500, { error: "The analysis service encountered an unexpected error. Check Vercel function logs." });
  }
}
