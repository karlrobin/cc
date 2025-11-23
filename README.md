# Private Photo Blog with Astro, Supabase & Directus

A beautiful, private photo blog built with Astro, Supabase Auth, and Directus CMS. Features passwordless magic link authentication, membership system, and easy content management.

## Features

- 🔐 **Magic Link Authentication** - Passwordless sign-in via email
- 👥 **Membership System** - Users can request access or receive invitations
- 🎟️ **Invitation System** - Admins can send invitation emails
- ⏰ **Long-lived Sessions** - Stay signed in for up to 1 year
- 📸 **Photo Albums** - Beautiful gallery layouts for photo collections
- 🎨 **CMS Managed** - Directus CMS for easy content management
- 🛡️ **Secure** - Supabase Auth + Row Level Security
- ⚡ **Fast** - Server-rendered Astro with minimal JavaScript
- 📱 **Responsive** - Works beautifully on all devices
- 📰 **RSS Feed** - Per-user authenticated RSS feeds for album updates
- 💌 **Newsletter** - Email newsletter system with Mailgun integration

## Architecture (Hybrid Approach)

**Supabase** handles authentication:
- Magic link emails
- User authentication & sessions
- No database tables needed (auth handled automatically)

**Directus CMS** manages all content:
- Photo albums & photos
- User memberships (pending/approved/rejected)
- Single admin interface for everything

**Astro** ties it together:
- Server-side rendering (SSR)
- Auth checks via Supabase (using `@supabase/ssr` for proper SSR integration)
- Content fetching from Directus
- Minimal client-side JavaScript

This separation gives you:
- ✅ Best-in-class auth (Supabase specialty)
- ✅ Beautiful admin UI (Directus specialty)
- ✅ Single place to manage content AND users
- ✅ Simple, maintainable architecture

## Prerequisites

- Node.js 18+
- A Supabase account (free tier works great)
- A Directus instance (Cloud or self-hosted)
- An SMTP email service (Supabase provides one, or use your own)

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

2. Configure email templates:
   - Go to **Authentication** → **Email Templates**
   - Customize the "Magic Link" template if desired
   - Make sure emails are enabled

3. Get your credentials:
   - Go to **Project Settings** → **API**
   - Copy the `URL` and `anon` key

**Note**: You don't need to run any SQL. Supabase Auth tables are created automatically.

### 3. Set Up Directus CMS

Directus manages your photo albums, photos, AND user memberships. You can use Directus Cloud or self-host.

**Quick Setup (Directus Cloud):**
1. Sign up at [directus.cloud](https://directus.cloud)
2. Create a new project
3. Note your project URL

**Or Self-Host with Docker:**
See `DIRECTUS_SETUP.md` for detailed instructions.

**Create Collections (Important!):**
See the complete guide in `DIRECTUS_SETUP.md` for:
- Creating `albums`, `photos`, and `memberships` collections
- Setting up relationships
- Configuring public access permissions
- Setting up membership workflow
- Adding your first album and admin user

**This is critical**: The `memberships` collection in Directus stores all user access control.

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase (for authentication)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Directus (for content management)
PUBLIC_DIRECTUS_URL=http://localhost:8055
# Or for Directus Cloud:
# PUBLIC_DIRECTUS_URL=https://your-project.directus.app

# Application URL
PUBLIC_APP_URL=http://localhost:4321

# Mailgun (for newsletters, optional)
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@mg.yourdomain.com  # Optional, defaults to noreply@MAILGUN_DOMAIN
```

### 5. Create Your First Admin (in Directus)

To give yourself access to the photo blog:

1. **Sign in once** to your photo blog (this creates your Supabase user)
2. **Get your user ID**:
   - Go to Supabase dashboard → Authentication → Users
   - Find your email and copy the UUID
3. **Create membership in Directus**:
   - Log in to Directus admin
   - Go to **Content** → **Memberships** → **Create Item**
   - Fill in:
     - User ID: (paste the UUID from Supabase)
     - Email: your-email@example.com
     - Status: `approved`
     - Role: `admin`
     - Approved At: (current date/time)
   - Save

Now you can access all albums!

See `DIRECTUS_SETUP.md` for more details on managing memberships.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

**Note**: Make sure both Supabase and Directus are properly configured before running the app. You need at least one published album in Directus to see content.

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
   - Uses `@supabase/ssr` for automatic cookie management

### Authorization

Protected content checks:
```typescript
const { user, membership } = await getSession(Astro.cookies);
const isApproved = membership?.status === 'approved';
```

Only approved members can view albums.

## RSS Feed

Each approved member gets a personal RSS feed with token-based authentication.

### Accessing Your RSS Feed

1. Sign in to the photo blog
2. Go to **Settings** (in navigation)
3. Copy your personal RSS feed URL
4. Add it to your favorite RSS reader

The RSS feed URL includes a unique token:
```
https://your-site.com/rss.xml?token=YOUR-PERSONAL-TOKEN
```

### Security

- **Per-user tokens**: Each member has a unique RSS token
- **Revocable**: Tokens can be regenerated if compromised
- **Authenticated**: Only approved members can access the feed
- **Private**: Keep your RSS URL secure - don't share it publicly

### What's in the Feed

- All published albums
- Album titles, descriptions, and cover images
- Direct links to albums
- Publish dates

## Newsletter

Admins can send email newsletters to subscribed members about new albums.

### For Members

**Managing Subscription:**
1. Go to **Settings**
2. Toggle "Subscribe to newsletter"
3. Save preference

**Unsubscribing:**
- Click "Unsubscribe" link in any newsletter email
- Or disable in Settings

### For Admins

**Setup (Required):**

1. **Add Mailgun credentials** to your `.env`:
   ```env
   MAILGUN_API_KEY=your-mailgun-private-api-key
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_FROM_EMAIL=noreply@mg.yourdomain.com  # Optional
   MAILGUN_REGION=eu  # 'eu' for EU accounts, 'us' for US accounts (default: us)
   ```
   Sign up at [mailgun.com](https://www.mailgun.com) for a free account.

   **Important:** Use your **Private API key** (starts with `key-`), not the domain sending key. For EU accounts, set `MAILGUN_REGION=eu`.

2. **Set up Directus Flow** (see `DIRECTUS_SETUP.md` for detailed instructions):
   - Create a `newsletters` collection in Directus
   - Set up a Directus Flow that triggers when newsletter status = `send_now`
   - Flow calls webhook at `/api/webhooks/newsletter`

**Composing & Sending Newsletters:**

1. **Preview what's new** (recommended first step):
   - Click **Newsletter** link in navigation
   - See which albums have been published since last newsletter
   - View subscriber count and suggested subject line
   - Copy suggested subject for use in Directus

2. **Compose in Directus**:
   - Click **Admin** link in navigation (opens Directus)
   - Go to **Content** → **Newsletters**
   - Click **Create Item**
   - Fill in:
     - **Subject**: Use suggested subject or write your own
     - **Preview Text**: Appears in email client preview (optional)
     - **Status**: Keep as `draft`
   - Save the draft

3. **Send the newsletter**:
   - When ready, change **Status** to `send_now`
   - Save again - this triggers the Directus Flow
   - Newsletter is sent automatically via Mailgun!

**After Sending:**

Check the newsletter record to see:
- **Status**: Automatically changes to `sent`
- **Sent At**: Timestamp of when it was sent
- **Recipient Count**: How many emails were sent
- **Albums Included**: How many albums were included
- **Error Message**: Any errors (if applicable)

**How It Works:**

- Directus Flow watches for status changes
- When status = `send_now`, triggers webhook
- Webhook fetches new albums since last newsletter
- Sends emails to all subscribed members
- Updates newsletter record with results
- Tracks last sent date for next newsletter

**Newsletter Features:**

- ✅ Preview page showing what's new before composing
- ✅ Suggested subject lines based on album titles
- ✅ Compose in Directus (beautiful UI)
- ✅ Automatic sending via Directus Flows
- ✅ Includes all albums published since last send
- ✅ HTML email with album images
- ✅ Plain text fallback
- ✅ One-click unsubscribe (RFC 8058 compliant)
- ✅ Mailgun integration (reliable delivery)
- ✅ Automatic tracking of sent/received counts

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
│   │   ├── directus.ts          # Directus CMS client
│   │   └── auth.ts              # Auth helpers
│   └── styles/
│       └── global.css           # Global styles
├── astro.config.mjs             # Astro configuration
├── supabase-schema.sql          # Database schema (auth/memberships)
├── DIRECTUS_SETUP.md            # Directus CMS setup guide
└── package.json
```

## Managing Albums

Albums are managed through **Directus CMS**, providing a beautiful admin interface for content management.

### Adding a New Album

1. **Log in to Directus**
   - Access your Directus admin panel
   - Default: `http://localhost:8055` or your Directus Cloud URL

2. **Create an Album**
   - Go to **Content** → **Albums**
   - Click **Create Item**
   - Fill in:
     - **Slug**: URL-friendly identifier (e.g., `summer-2024`)
     - **Title**: Display name (e.g., `Summer Adventures 2024`)
     - **Description**: Optional description
     - **Status**: Set to `published` to make it visible
     - **Date Published**: When to show this album
     - **Cover Image**: Optional cover (uses first photo if not set)

3. **Add Photos**
   - Go to **Content** → **Photos**
   - Click **Create Item**
   - Upload image and select the album
   - Add caption and sort order
   - Repeat for all photos

   Or use the relationship field in the album to add photos directly.

4. **Publish**
   - Make sure album status is `published`
   - Photos will automatically be visible when album is published

### Editing Albums

1. Go to **Content** → **Albums** in Directus
2. Click on the album you want to edit
3. Make your changes
4. Save
5. Changes appear immediately on the website (no rebuild needed!)

### Managing Photos

- **Reorder**: Use the `sort` field (lower numbers appear first)
- **Update**: Edit photo details or replace images
- **Delete**: Remove photos from albums
- **Bulk Upload**: Upload multiple photos at once

### Image Management

Directus provides built-in image transformations. Images are served from:
```
{DIRECTUS_URL}/assets/{file-id}
```

You can add transformations:
```
{DIRECTUS_URL}/assets/{file-id}?width=800&quality=80
```

See `DIRECTUS_SETUP.md` for more details on image optimization.

### Content Workflow

- **Draft**: Work on albums before publishing
- **Published**: Visible to approved members
- **Archived**: Hide old albums without deleting

See the complete Directus setup guide in `DIRECTUS_SETUP.md`.

## Admin Features (via Directus)

All admin functions are handled through the beautiful **Directus admin UI**. No custom admin pages needed!

### Managing Memberships

**Log in to Directus** and go to **Content** → **Memberships**

**Review Pending Requests:**
1. Filter by Status: `pending`
2. Click on a request to see user details and their message
3. Change Status to `approved` or `rejected`
4. Save

**Approve Members:**
- Set Status to `approved`
- Optionally set Approved At date
- User can immediately access albums

**Batch Operations:**
- Select multiple requests
- Bulk approve or reject
- Export member lists

**Search & Filter:**
- Filter by status, role, or email
- Search by email
- Sort by request date

See `DIRECTUS_SETUP.md` for detailed membership management instructions.

### Managing Albums

All album and photo management happens in Directus:

**Content** → **Albums**:
- Create/edit/delete albums
- Set status (draft/published/archived)
- Manage photos inline
- Reorder photos
- Bulk operations

**Content** → **Photos**:
- Upload multiple photos
- Add captions
- Set sort order
- Replace images

### Admin Best Practices

1. **Regular Reviews**: Check pending memberships weekly
2. **Communication**: Add notes to membership records
3. **Backups**: Directus has built-in backup options
4. **Audit Trail**: Directus tracks all changes
5. **Access Control**: Limit who has Directus admin access

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
- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `PUBLIC_DIRECTUS_URL` - Your Directus instance URL
- `PUBLIC_APP_URL` - Your production domain (for magic links)

## Security Considerations

### ✅ What's Secure

**Authentication (Supabase):**
- **Magic links**: No passwords to steal or leak
- **HTTP-only cookies**: Auth tokens not accessible to JavaScript
- **Server-side validation**: All auth checks happen server-side
- **Long sessions**: Users stay logged in securely

**Content & Memberships (Directus):**
- **Application-level permissions**: Directus role-based access control
- **Public role filtering**: Only approved members can read membership status
- **Admin-only updates**: Only Directus admins can approve memberships
- **Audit logging**: Directus tracks all changes

**Astro Layer:**
- **Server-side rendering**: No client-side auth bypass possible
- **Double validation**: Checks both Supabase auth AND Directus membership

### 🔒 Production Recommendations

1. **Enable HTTPS** (required for secure cookies)
2. **Secure Directus admin**:
   - Strong password for Directus admin account
   - Enable 2FA if available
   - Limit admin access to trusted IPs
3. **Configure Directus permissions carefully**:
   - Review public role permissions
   - Ensure memberships are read-only for public
   - Only admins can approve/reject
4. **Configure email rate limiting** in Supabase
5. **Set up monitoring** for suspicious activity
6. **Regular backups**:
   - Directus database (includes albums + memberships)
   - Supabase user data (minimal, just auth)
7. **Use object storage** (S3, Spaces, etc.) for Directus files in production
8. **Configure CORS** properly if Directus and Astro are on different domains
9. **Keep secrets safe**:
   - Never commit `.env` files
   - Use environment variables in production
   - Rotate API keys periodically

### 🤔 Hybrid Architecture Security

The hybrid approach (Supabase for auth, Directus for memberships) is secure for most use cases:

**Trade-offs:**
- ✅ Easier admin UX (single interface)
- ✅ Better content management
- ⚠️ Memberships at application layer (not database RLS)
- ⚠️ Requires careful Directus permission setup

**When it's secure enough:**
- Private photo blogs (personal/family)
- Low-to-medium sensitivity content
- Trusted admin team

**When to reconsider:**
- Highly sensitive content
- Strict compliance requirements
- Need database-level guarantees

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

### Newsletter sending fails

**"Mailgun API error: Forbidden" or emails not sending**
- Use your **Private API key** (starts with `key-`), not domain sending key
- Check that `MAILGUN_DOMAIN` is verified in your Mailgun dashboard
- **EU accounts:** Set `MAILGUN_REGION=eu` in your `.env` file
- For sandbox domains, recipient must be authorized in Mailgun
- Verify domain is active and not in test mode

**"No settings record found"**
- Ensure you've created the `settings` collection in Directus
- Add at least one settings record in Directus
- Verify Public role has Read access to settings collection
- Check `DIRECTUS_ADMIN_TOKEN` is set in `.env` file
- Verify the admin token has proper permissions in Directus

**Newsletter webhook not triggering**
- Check Directus Flow is properly configured (see `DIRECTUS_SETUP.md`)
- Verify webhook URL matches your app URL
- Check Directus logs for Flow execution errors
- Ensure Docker container can reach your app (may need `host.docker.internal`)

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
