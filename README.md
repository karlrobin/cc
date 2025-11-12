# Private Photo Blog with Astro & Supabase

A beautiful, private photo blog built with Astro and Supabase Auth. Features passwordless magic link authentication, membership system, and long-lived sessions.

## Features

- 🔐 **Magic Link Authentication** - Passwordless sign-in via email
- 👥 **Membership System** - Users can request access or receive invitations
- 🎟️ **Invitation System** - Admins can send invitation emails
- ⏰ **Long-lived Sessions** - Stay signed in for up to 1 year
- 📸 **Photo Albums** - Beautiful gallery layouts for photo collections
- 🛡️ **Secure** - Supabase Auth + Row Level Security
- ⚡ **Fast** - Server-rendered Astro with minimal JavaScript
- 📱 **Responsive** - Works beautifully on all devices

## Architecture

- **Framework**: Astro (SSR mode with Node adapter)
- **Authentication**: Supabase Auth (magic links)
- **Database**: Supabase PostgreSQL with RLS
- **Styling**: Vanilla CSS (no framework)
- **Deployment**: Any Node.js host (Netlify, Vercel, Railway, etc.)

## Prerequisites

- Node.js 18+
- A Supabase account (free tier works great)
- An SMTP email service (Supabase provides one, or use your own)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd astro-photo-blog
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)

2. In your Supabase dashboard, go to **SQL Editor** and run the schema from `supabase-schema.sql`

3. Configure email templates:
   - Go to **Authentication** → **Email Templates**
   - Customize the "Magic Link" template if desired
   - Make sure emails are enabled

4. Get your credentials:
   - Go to **Project Settings** → **API**
   - Copy the `URL` and `anon` key

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
PUBLIC_APP_URL=http://localhost:4321
```

### 4. Create Your First Admin

After running the schema, sign in with your email through the app, then run this SQL in Supabase to make yourself an admin:

```sql
insert into public.memberships (user_id, email, status, role, approved_at)
values (
  (select id from auth.users where email = 'your-email@example.com'),
  'your-email@example.com',
  'approved',
  'admin',
  now()
);
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

## How It Works

### Authentication Flow

1. **User Signs In**
   - User enters their email on `/signin`
   - Supabase sends a magic link via email
   - User clicks link, gets authenticated, redirected to homepage

2. **Membership Request**
   - Authenticated user visits `/request-access`
   - Submits request with optional message
   - Request stored in database with `pending` status
   - Admin reviews and approves/rejects

3. **Session Management**
   - Tokens stored in HTTP-only cookies (secure)
   - Sessions last up to 1 year
   - Auto-refresh handled by Supabase

### Authorization

Protected content checks:
```typescript
const { user, membership } = await getSession(Astro.cookies);
const isApproved = membership?.status === 'approved';
```

Only approved members can view albums.

## Project Structure

```
/
├── src/
│   ├── layouts/
│   │   └── Layout.astro         # Base layout with header/footer
│   ├── pages/
│   │   ├── index.astro          # Homepage (album listing)
│   │   ├── signin.astro         # Magic link sign-in
│   │   ├── request-access.astro # Membership request
│   │   ├── albums/
│   │   │   └── [id].astro       # Individual album pages
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signin.ts    # Send magic link
│   │       │   ├── callback.ts  # Handle magic link
│   │       │   └── signout.ts   # Sign out
│   │       └── membership/
│   │           └── request.ts   # Submit membership request
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── auth.ts              # Auth helpers
│   └── styles/
│       └── global.css           # Global styles
├── astro.config.mjs             # Astro configuration
├── supabase-schema.sql          # Database schema
└── package.json
```

## Managing Albums

Currently, albums are hardcoded in the source files for maximum simplicity and performance. To add/edit albums:

### Option 1: Hardcoded (Current)

Edit `src/pages/index.astro` and `src/pages/albums/[id].astro`:

```typescript
const albums = [
  {
    id: 'my-album',
    title: 'My Album',
    date: '2024-11-12',
    description: 'Description here',
    coverImage: 'https://...',
    photoCount: 5
  }
];
```

### Option 2: CMS Integration

Integrate with a headless CMS:
- [Contentful](https://www.contentful.com/)
- [Sanity](https://www.sanity.io/)
- [Strapi](https://strapi.io/)
- Or add albums table to Supabase

### Option 3: Markdown Files

Create album markdown files and use Astro's content collections. See [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/).

## Admin Features

### Reviewing Membership Requests

Build an admin dashboard by:

1. Create `src/pages/admin/index.astro`
2. Query pending memberships:

```typescript
const { data: requests } = await supabase
  .from('memberships')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

3. Provide approve/reject buttons that update the membership status

### Sending Invitations

Create an invitation system:

```typescript
// Generate invitation token
const token = crypto.randomUUID();

await supabase
  .from('invitation_tokens')
  .insert({
    email: inviteeEmail,
    token,
    invited_by: adminUserId,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

// Send invitation email with link: /invite?token=...
```

## Deployment

### Netlify

```bash
npm run build
netlify deploy --prod
```

Add environment variables in Netlify dashboard.

### Vercel

```bash
npm run build
vercel --prod
```

Add environment variables in Vercel dashboard.

### Railway / Render / Fly.io

All support Node.js apps. Set:
- Build command: `npm run build`
- Start command: `node dist/server/entry.mjs`

### Environment Variables

Remember to set in production:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_APP_URL` (your production domain)

## Security Considerations

### ✅ What's Secure

- **Magic links**: No passwords to steal or leak
- **HTTP-only cookies**: Tokens not accessible to JavaScript
- **Row Level Security**: Database enforces access control
- **Server-side rendering**: Auth checks happen on server
- **Long sessions**: Users stay logged in without UX friction

### 🔒 Production Recommendations

1. **Enable HTTPS** (required for secure cookies)
2. **Configure email rate limiting** in Supabase
3. **Review RLS policies** for your use case
4. **Set up monitoring** for suspicious activity
5. **Regular backups** of your Supabase database

## Customization

### Styling

All styles are in `src/styles/global.css`. No build tools or preprocessors needed.

### Email Templates

Customize in Supabase Dashboard → Authentication → Email Templates

### Add More Features

Ideas to extend:
- Comments on albums
- Photo uploads (with Supabase Storage)
- Social sharing
- RSS feed for members
- Photo likes/reactions
- Download albums as ZIP

## Troubleshooting

### Magic links not working

- Check Supabase email settings
- Verify `PUBLIC_APP_URL` matches your domain
- Check spam folder
- Review Supabase logs in dashboard

### "Not authenticated" errors

- Clear cookies and sign in again
- Check environment variables are set
- Verify tokens aren't expired

### Database permission errors

- Confirm RLS policies are created
- Check user has membership record
- Verify membership status is 'approved'

## License

MIT

## Support

For issues or questions:
- Check [Astro docs](https://docs.astro.build)
- Check [Supabase docs](https://supabase.com/docs)
- Review the code - it's well-commented!
- Open an issue in this repository

---

Built with ❤️ using Astro and Supabase
