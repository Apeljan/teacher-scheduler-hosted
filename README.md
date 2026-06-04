# Teacher Scheduler (hosted)

A one-link internal tool: open the URL, pick a slot, see which teachers are
available and unassigned. No setup for users — the Airtable token lives on
the server.

## Files
- `index.html` — the app (runs in the browser)
- `api/schema.js` — returns the base schema (server-side token)
- `api/records.js` — returns table records (server-side token)

## Deploy on Vercel (browser only)

1. **Create an Airtable token** at https://airtable.com/create/tokens
   - Scopes: `data.records:read` and `schema.bases:read`
   - Access: add the one base this tool uses
   - Copy the token (starts with `pat...`)
   - Also grab the **Base ID** (the `app...` part of your base URL)

2. **Put these files in a GitHub repo** (keep `api/` as a folder).

3. **Import the repo into Vercel** → vercel.com → Add New → Project.
   - Framework Preset: **Other** (no build settings needed)
   - Add **Environment Variables**:
     - `AIRTABLE_TOKEN` = your `pat...` token
     - `AIRTABLE_BASE_ID` = your `app...` base id
   - Deploy.

4. **Lock it down**: Project → Settings → Deployment Protection →
   enable **Vercel Authentication**, scope **All Deployments**, and add your
   teammates to the Vercel team. Only logged-in team members can open the link.

5. **Share the production URL.** Done.

## Maintenance
- Data is read fresh each load and via the **↻ Refresh** button.
- Fields are auto-detected. To pin a field for everyone, edit the `OVERRIDE`
  block near the top of the `<script>` in `index.html` and commit — Vercel
  redeploys automatically.
