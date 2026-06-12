// POST /api/offer   body: { channel, message }   (channel = channel name or id)
// Resolves the teacher's channel NAME to a channel ID within the configured
// Discord server, then posts the message. Bot token stays server-side.
let CHANNEL_CACHE = { at: 0, list: null };

function norm(s){ return String(s||"").replace(/^#/,"").trim().toLowerCase().replace(/[\s_]+/g,"-").replace(/-+/g,"-"); }

async function guildChannels(token, guildId){
  if (CHANNEL_CACHE.list && (Date.now() - CHANNEL_CACHE.at) < 60000) return CHANNEL_CACHE.list;
  const r = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: "Bot " + token }
  });
  if (!r.ok) { const d = await r.json().catch(()=>({})); throw new Error((d && d.message) || ("Discord " + r.status + " listing channels")); }
  const list = await r.json();
  CHANNEL_CACHE = { at: Date.now(), list };
  return list;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Use POST" }); return; }
  const TOKEN = process.env.DISCORD_BOT_TOKEN;
  const GUILD = process.env.DISCORD_GUILD_ID;
  if (!TOKEN) { res.status(500).json({ error: "Server is missing DISCORD_BOT_TOKEN" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const channel = body && (body.channel || body.channelId);
  const message = body && body.message;
  if (!channel || !message) { res.status(400).json({ error: "Missing channel or message" }); return; }

  res.setHeader("Cache-Control", "no-store");
  try {
    // Resolve to a channel ID: if it's already all digits, use it; else look up by name.
    let channelId = String(channel).trim();
    if (!/^\d{10,}$/.test(channelId)) {
      if (!GUILD) { res.status(500).json({ error: "Server is missing DISCORD_GUILD_ID (needed to look up channels by name)" }); return; }
      const list = await guildChannels(TOKEN, GUILD);
      const want = norm(channel);
      const match = list.find(c => norm(c.name) === want) || list.find(c => norm(c.name).includes(want));
      if (!match) { res.status(404).json({ error: 'No Discord channel matching "' + channel + '"' }); return; }
      channelId = match.id;
    }

    const r = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: "Bot " + TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ content: String(message).slice(0, 1900) })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { res.status(r.status).json({ error: (data && data.message) || ("Discord " + r.status) }); return; }
    res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
