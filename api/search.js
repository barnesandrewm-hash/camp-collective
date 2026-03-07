export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  }

  try {
    // First call: let Claude search the web
    const r1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: "Find 3-5 summer camps or programs for: " + query + ". Search the web and return what you find." }],
      }),
    });

    if (!r1.ok) {
      const e = await r1.text();
      return res.status(500).json({ error: "Anthropic error on search", status: r1.status, detail: e });
    }

    const d1 = await r1.json();

    // Build the follow-up messages including the tool results
    const messages = [
      { role: "user", content: "Find 3-5 summer camps or programs for: " + query + ". Search the web and return what you find." },
      { role: "assistant", content: d1.content },
    ];

    // If Claude used the search tool, we need to provide tool results and ask for final answer
    const toolUseBlocks = d1.content.filter(b => b.type === "tool_use");
    if (toolUseBlocks.length > 0) {
      // Add tool results (Vercel handles the actual search, Claude just needs a signal to continue)
      messages.push({
        role: "user",
        content: toolUseBlocks.map(b => ({
          type: "tool_result",
          tool_use_id: b.id,
          content: "Search completed. Please now format the results as a JSON array.",
        })),
      });

      const r2 = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: "Return ONLY a JSON array, no markdown, no preamble. Schema per item: {\"name\":\"\",\"organization\":\"\",\"description\":\"\",\"category\":\"Arts & Music|Sports|STEM|Outdoors|Academic|Other\",\"price\":\"\",\"registration_deadline\":\"YYYY-MM-DD or null\",\"start_date\":\"YYYY-MM-DD or null\",\"end_date\":\"YYYY-MM-DD or null\",\"dropoff_time\":\"\",\"pickup_time\":\"\",\"age_min\":null,\"age_max\":null,\"requirements\":\"\",\"website\":\"\",\"location\":\"\"}",
          messages,
        }),
      });

      if (!r2.ok) {
        const e = await r2.text();
        return res.status(500).json({ error: "Anthropic error on format", status: r2.status, detail: e });
      }

      const d2 = await r2.json();
      const text = d2.content.filter(b => b.type === "text").map(b => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const s = clean.indexOf("["), e = clean.lastIndexOf("]");
      if (s < 0 || e < 0) return res.status(200).json([]);
      return res.status(200).json(JSON.parse(clean.slice(s, e + 1)));
    }

    // No tool use — try to parse directly from first response
    const text = d1.content.filter(b => b.type === "text").map(b => b.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const s = clean.indexOf("["), e = clean.lastIndexOf("]");
    if (s < 0 || e < 0) return res.status(200).json([]);
    return res.status(200).json(JSON.parse(clean.slice(s, e + 1)));

  } catch (err) {
    return res.status(500).json({ error: "Unexpected error", detail: err.message });
  }
}
