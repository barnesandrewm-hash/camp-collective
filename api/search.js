export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON body" }); }
  }

  const query = body?.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: `You are a helpful assistant that finds summer camp and program information.
Return ONLY a valid JSON array with no markdown, no preamble, no explanation.
Each item must follow this exact schema:
{"name":"","organization":"","description":"","category":"Arts & Music|Sports|STEM|Outdoors|Academic|Other","price":"","registration_deadline":null,"start_date":null,"end_date":null,"dropoff_time":"","pickup_time":"","age_min":null,"age_max":null,"requirements":"","website":"","location":""}
Rules:
- Return 3-5 real, specific camps or programs (not generic placeholders)
- Use null for dates since your info may be outdated — the user will verify on the website
- Include the real website URL so users can check current 2026 dates themselves
- Price should reflect typical range even if not exact (e.g. "$400-600/week")
- Be specific about location (city, region)
- Start your response with [ and end with ]`,
        messages: [{ role: "user", content: "Find summer camps or programs matching: " + query }],
      }),
    });

    if (!response.ok) {
      const e = await response.text();
      return res.status(500).json({ error: "Anthropic error", status: response.status, detail: e });
    }

    const data = await response.json();
    const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const s = clean.indexOf("["), e = clean.lastIndexOf("]");
    if (s < 0 || e < 0) return res.status(200).json([]);
    return res.status(200).json(JSON.parse(clean.slice(s, e + 1)));

  } catch (err) {
    return res.status(500).json({ error: "Unexpected error", detail: err.message });
  }
}
