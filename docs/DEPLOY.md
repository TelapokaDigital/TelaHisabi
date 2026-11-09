# Deploy TELAPOKA to Vercel + attach your domain

Total time: ~15 minutes. End result: **TELAPOKA** running at `https://telapoka.com`
(or whatever TELAPOKA domain you register), installable on your phone as an app.

---

## 1. Put the code on GitHub

```bash
# from the unzipped telapoka folder
git init
git add .
git commit -m "TELAPOKA — shared payment tracker"
git branch -M main
# create an empty repo named e.g. "telapoka" on github.com first, then:
git remote add origin https://github.com/<your-username>/telapoka.git
git push -u origin main
```

Do **not** commit `db/custom.db`, `node_modules`, `.next`, `dev.log` (a `.gitignore`
is included). Your data stays out of Git.

## 2. Create the database (Neon — free tier works)

The app uses Prisma. SQLite only works locally — production needs Postgres.

1. Sign up at **neon.tech** (or use Vercel Postgres / Supabase).
2. Create a project → copy the **connection string**, it looks like:
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
3. Keep it for step 3 (`DATABASE_URL`).

## 3. Import the project into Vercel

1. Go to **vercel.com → Add New → Project** → pick your `telapoka` repo.
2. Framework is auto-detected (**Next.js**). Leave build settings as-is.
3. Before deploying, open **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | your Neon connection string from step 2 |

4. **Switch Prisma to Postgres**: the repo ships `prisma/schema.postgres.prisma`.
   On your machine:

   ```bash
   cp prisma/schema.postgres.prisma prisma/schema.prisma
   git add prisma/schema.prisma
   git commit -m "Use PostgreSQL for production"
   git push
   ```

   Then create the tables once (from your machine, pointing at Neon):

   ```bash
   DATABASE_URL="<your-neon-url>" npx prisma db push
   ```

5. Click **Deploy**. First build takes ~2 minutes.

## 4. Verify the app

Open the deployment URL Vercel gives you (e.g. `telapoka.vercel.app`):

- Add a tracker → add a person → mark paid → check the dashboard ring.
- Reports → Export CSV / Export PDF.
- Install: browser menu → **Add to Home Screen**.

## 5. Attach the TELAPOKA domain

1. Buy the domain from any registrar (Namecheap, Porkbun, GoDaddy, Cloudflare):
   e.g. `telapoka.com`, `telapoka.com.bd`, `telapoka.app`.
2. In Vercel: **Project → Settings → Domains → Add** → enter `telapoka.com`.
3. Vercel shows you DNS records. At your registrar add:
   - **A record**: `@` → `76.76.21.21`
   - **CNAME record**: `www` → `cname.vercel-dns.com`
   (or change nameservers to Vercel's — the setup wizard offers this and is easiest)
4. Wait for DNS propagation (usually minutes, up to 48h). Vercel provisions HTTPS automatically.

## 6. Install on your phone

1. Open `https://telapoka.com` in Chrome (Android) or Safari (iOS).
2. Android: menu ⋮ → **Add to Home screen** / **Install app**.
   iOS: Share → **Add to Home Screen**.
3. TELAPOKA now opens full-screen with your wordmark icon — no browser UI.

## Notes & honest limits

- **Reminders**: web apps can't schedule OS-level alarms. You get an in-app banner +
  a browser notification when you open the app after the reminder day (permission
  asked in Settings → Reminders). The WhatsApp/SMS nudge buttons do the real chasing.
- **Offline**: with a cloud DB, the app shell opens offline (service worker) and shows
  an offline banner; live data needs connectivity. Full offline storage would require
  dropping the cloud DB — trade-off inherent to your "data survives device changes" choice.
- **Single-user by design**: there is no login. Anyone with the URL can see the data —
  so do not share the link. If you want protection later, ask for a PIN lock (easy to add).
- **Costs**: Vercel Hobby $0, Neon free tier $0, domain ~$10–30/year.

## Updating

Every `git push` to `main` redeploys automatically. Data lives in Neon, so updates
never touch your records. Use **Settings → Backup data** occasionally for peace of mind.
