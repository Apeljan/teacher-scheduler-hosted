// GET /api/records?table=NAME&fields=A||B||C&offset=...
// Returns one page of records (read-only) for the configured base.
// The Airtable token stays server-side; only data is returned.
module.exports = async (req, res) => {
  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE  = process.env.AIRTABLE_BASE_ID;
  if (!TOKEN || !BASE) {
    res.status(500).json({ error: "Server is missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID" });
    return;
  }
  const { table, fields, offset, bust, filter } = req.query || {};
  if (!table) { res.status(400).json({ error: "Missing 'table' parameter" }); return; }

  let url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}?pageSize=100`;
  if (fields) {
    // fields arrive as "A||B||C" so field names containing commas stay intact
    String(fields).split("||").forEach(f => { if (f) url += "&fields%5B%5D=" + encodeURIComponent(f); });
  }
  if (filter) url += "&filterByFormula=" + encodeURIComponent(filter);
  if (offset) url += "&offset=" + encodeURIComponent(offset);

  try {
    const r = await fetch(url, { headers: { Authorization: "Bearer " + TOKEN } });
    const data = await r.json();
    // Cache successful reads at Vercel's edge so repeat loads don't re-hit Airtable.
    // 'bust' (set by the Refresh button) skips the cache for fresh data.
    if (r.ok && !bust) res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    else res.setHeader("Cache-Control", "no-store");
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Could not reach Airtable: " + String(e) });
  }
};
