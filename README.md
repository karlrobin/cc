# Private Photo Blog with Astro, Supabase & Directus

A beautiful, private photo blog built with Astro, Supabase Auth, and Directus CMS. Features passwordless magic link authentication, membership system, and easy content management.

## Features

- **Magic Link Authentication** - Passwordless sign-in via email
- **Membership System** - Users can request access or receive invitations
- **Invitation System** - Admins can send invitation emails
- **Long-lived Sessions** - Stay signed in for up to 1 year
- **Photo Albums** - Beautiful gallery layouts for photo collections
- **CMS Managed** - Directus CMS for easy content management
- **Secure** - Supabase Auth + Directus permissions
- **Fast** - Server-rendered Astro with minimal JavaScript
- **Responsive** - Works beautifully on all devices
- **RSS Feed** - Per-user authenticated RSS feeds for album updates
- **Newsletter** - Email newsletter system with Mailgun integration

## Architecture

**Supabase** handles authentication:
- Magic link emails, user sessions
- No database tables needed (auth handled automatically)

**Directus CMS** manages all content:
- Photo albums & photos
- User memberships (pending/approved/rejected)
- Single admin interface for everything

**Astro** ties it together:
- Server-side rendering (SSR) with `@supabase/ssr`
- Auth checks via Supabase, content from Directus
- Minimal client-side JavaScript

## Prerequisites

- Node.js 18+
- A Supabase account (free tier works great)
- A Directus instance (Cloud or self-hosted)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd astro-photo-blog
npm install
```

### 2. Set Up Supabase (Authentication Only)

Supabase is used ONLY for authentication. No database setup needed!

1. Create a new project at [supabase.com](https://supabase.com)
2. Configure email templates: **Authentication** → **Email Templates**
3. Get your credentials: **Project Settings** → **API** → copy `URL` and `anon` key

### 3. Set Up Directus CMS

Directus manages albums, photos, and memberships. Use Directus Cloud or self-host.

1. **Directus Cloud**: Sign up at [directus.cloud](https://directus.cloud) and create a project
2. **Or self-host**: See `DIRECTUS_SETUP.md` for Docker instructions
3. **Create collections**: Follow `DIRECTUS_SETUP.md` to set up `albums`, `photos`, `memberships`, permissions, and your first admin user

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in your Supabase URL/key, Directus URL, and app URL. See `.env.example` for all options including optional Mailgun credentials for newsletters.

### 5. Create Your First Admin

1. Sign in to your photo blog once (creates your Supabase user)
2. Copy your user UUID from Supabase dashboard → **Authentication** → **Users**
3. In Directus, create a membership record with your UUID, email, status `approved`, role `admin`

See `DIRECTUS_SETUP.md` for detailed steps.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321). Make sure both Supabase and Directus are configured and you have at least one published album.

## How It Works

### Authentication Flow

1. User enters email on `/signin` → Supabase sends magic link → user clicks and is authenticated
2. Authenticated users can request membership at `/request-access` (stored as `pending` in Directus)
3. Admin approves/rejects in Directus → approved members can view albums
4. Sessions use HTTP-only cookies, last up to 1 year, with automatic refresh via `@supabase/ssr`

### RSS Feed

Each approved member gets a personal, token-authenticated RSS feed. Access it from the **Settings** page in the app.

### Newsletter

Admins can email newsletters about new albums to subscribed members using Mailgun. Members manage their subscription in **Settings**. Newsletter composition and sending is handled through Directus — see `DIRECTUS_SETUP.md` for setup.

## Project Structure

```
/
├── src/
│   ├── layouts/
│   │   └── Layout.astro              # Base layout with header/footer
│   ├── pages/
│   │   ├── index.astro               # Homepage (album listing)
│   │   ├── signin.astro              # Magic link sign-in
│   │   ├── request-access.astro      # Membership request
│   │   ├── settings.astro            # User settings (RSS, newsletter)
│   │   ├── rss.xml.ts                # Authenticated RSS feed
│   │   ├── unsubscribe-confirm.astro # Newsletter unsubscribe page
│   │   ├── albums/
│   │   │   └── [id].astro            # Individual album pages
│   │   ├── admin/
│   │   │   └── newsletter-preview.astro # Newsletter preview (admin)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signin.ts         # Send magic link
│   │       │   ├── callback.ts       # Handle magic link
│   │       │   └── signout.ts        # Sign out
│   │       ├── membership/
│   │       │   └── request.ts        # Submit membership request
│   │       ├── settings/
│   │       │   └── newsletter.ts     # Newsletter subscription toggle
│   │       ├── newsletter/
│   │       │   └── unsubscribe.ts    # One-click unsubscribe
│   │       └── webhooks/
│   │           └── newsletter.ts     # Directus Flow webhook
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client
│   │   ├── directus.ts               # Directus CMS client
│   │   ├── auth.ts                   # Auth helpers
│   │   └── mailgun.ts               # Mailgun email client
│   └── styles/
│       └── global.css                # Global styles
├── astro.config.mjs                  # Astro configuration
├── DIRECTUS_SETUP.md                 # Directus CMS setup guide
└── package.json
```

## Content Management

Albums, photos, and memberships are managed through the Directus admin UI. See `DIRECTUS_SETUP.md` for complete instructions on creating albums, adding photos, and managing member access.

## Deployment

Build and deploy to any Node.js hosting platform:

```bash
npm run build
node dist/server/entry.mjs
```

**Netlify**: `netlify deploy --prod` | **Vercel**: `vercel --prod` | **Railway / Render / Fly.io**: Set build command `npm run build`, start command `node dist/server/entry.mjs`

Set these environment variables in production:
- `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_DIRECTUS_URL`
- `PUBLIC_APP_URL` (your production domain)
- `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` (if using newsletters)

## Security

- **Magic links**: No passwords to steal or leak
- **HTTP-only cookies**: Auth tokens not accessible to JavaScript
- **Server-side rendering**: All auth checks happen server-side, no client-side bypass
- **Double validation**: Checks both Supabase auth AND Directus membership status
- **Directus permissions**: Role-based access control with audit logging

**Production checklist**: Enable HTTPS, secure Directus admin with strong password/2FA, review Directus public role permissions, configure email rate limiting in Supabase, use object storage for files, and never commit `.env` files.

## Customization

- **Styling**: Edit `src/styles/global.css`
- **Email templates**: Customize in Supabase Dashboard → Authentication → Email Templates
- **Extend**: Add comments, social sharing, photo reactions, or download features

## Troubleshooting

### Magic links not working
- Check Supabase email settings and verify `PUBLIC_APP_URL` matches your domain
- Check spam folder and review Supabase logs

### "Not authenticated" errors
- Clear cookies and sign in again
- Check environment variables are set correctly

### Permission errors
- Check Directus public role permissions (see `DIRECTUS_SETUP.md`)
- Verify user has an approved membership record in Directus

## License

MIT

## Support

- [Astro docs](https://docs.astro.build) | [Supabase docs](https://supabase.com/docs) | [Directus docs](https://docs.directus.io/)
- Open an issue in this repository

---

Built with Astro, Supabase, and Directus
