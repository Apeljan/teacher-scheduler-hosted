// GET /api/schema  -> Airtable base schema (tables + fields)
// Uses the server-side token so it never reaches the browser.
module.exports = async (req, res) => {
  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE  = process.env.AIRTABLE_BASE_ID;
  if (!TOKEN || !BASE) {
    res.status(500).json({ error: "Server is missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID" });
    return;
  }
  try {
    const r = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, {
      headers: { Authorization: "Bearer " + TOKEN }
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Could not reach Airtable: " + String(e) });
  }
};
