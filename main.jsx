export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `You find summer camp/program info. Return ONLY a JSON array, no markdown, no preamble.
Schema per item: {"name":"","organization":"","description":"","category":"Arts & Music|Sports|STEM|Outdoors|Academic|Other","price":"","registration_deadline":"YYYY-MM-DD or null","start_date":"YYYY-MM-DD or null","end_date":"YYYY-MM-DD or null","dropoff_time":"","pickup_time":"","age_min":null,"age_max":null,"requirements":"","website":"","location":""}
Return 3–5 results max.`,
        messages: [{ role: "user", content: `Find summer camps/programs: ${query}` }],
      }),
    });

    const data = await response.json();
    const text = data.content.map(b => b.type === "text" ? b.text : "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const s = clean.indexOf("["), e = clean.lastIndexOf("]");
    if (s < 0 || e < 0) return res.status(200).json([]);
    const results = JSON.parse(clean.slice(s, e + 1));
    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Search failed" });
  }
}
