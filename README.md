# Eleventy Photo Blog with Authentication

A modern photo blog built with [Eleventy](https://www.11ty.dev/) featuring public and private photo albums with authentication using the [Eleventy Edge plugin](https://www.11ty.dev/docs/plugins/edge/).

## 📚 Demo Project Notice

This is a **demonstration/learning project** that uses **simplified client-side authentication** to show Eleventy concepts without requiring backend infrastructure.

### Important: Demo vs Production

**This demo intentionally uses client-side authentication for simplicity.** While it demonstrates the UI/UX flow of authentication, it is not secure for actual private content because:

- 🔍 Authentication logic runs in the browser (visible in page source)
- 🍪 Authentication cookie can be set manually by anyone
- 📁 Private content exists in static build files
- 🔑 No cryptographic session management

**For production use with real private content**, see the "Authentication → For Production" section below for proper implementation guidance.

### Best Use Cases

This project is ideal for:
- ✅ Learning Eleventy static site generation
- ✅ Understanding authentication UI/UX patterns
- ✅ Starting point for projects with proper auth
- ✅ Educational/demo purposes
- ❌ Production use with actual private content (without proper auth)

**See `SECURITY_VULNERABILITIES.md` for detailed analysis of why the simplified approach isn't production-ready.**

## Features

- 📸 Photo album management with multiple photos per album
- 🔓 Public albums accessible to everyone
- 🔒 Private albums for members only
- 🔐 Simple authentication using Eleventy Edge
- 📱 Responsive design
- 🎨 Clean, modern UI
- ☁️ Ready for Netlify deployment

## Project Structure

```
.
├── src/
│   ├── _layouts/
│   │   ├── base.njk          # Base layout template
│   │   └── album.njk         # Album page layout
│   ├── albums/               # Photo album markdown files
│   │   ├── summer-vacation-2024.md
│   │   ├── family-gathering-2024.md
│   │   └── ...
│   ├── css/
│   │   └── style.css         # Styles
│   ├── index.njk             # Homepage
│   ├── login.njk             # Login page
│   └── logout.njk            # Logout page
├── netlify/
│   └── edge-functions/       # Eleventy Edge functions
│       ├── eleventy-edge.js  # Main edge function
│       └── auth-check.js     # Authentication middleware
├── .eleventy.js              # Eleventy configuration
├── netlify.toml              # Netlify configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd eleventy-photo-blog
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The site will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

The built site will be in the `_site` directory.

## Creating Albums

Albums are created as Markdown files in the `src/albums/` directory. Here's the format:

```markdown
---
title: "Album Title"
date: 2024-11-11
layout: album.njk
private: false  # Set to true for members-only albums
photos:
  - url: "https://example.com/photo1.jpg"
    caption: "Photo caption"
  - url: "https://example.com/photo2.jpg"
    caption: "Another caption"
---

Album description goes here. This will appear at the top of the album page.
```

### Public vs Private Albums

- **Public albums**: Set `private: false` in the frontmatter. These are visible to everyone.
- **Private albums**: Set `private: true` in the frontmatter. These require authentication to view.

## Authentication

The project includes a simple cookie-based authentication system for demonstration purposes.

### Demo Credentials

- **Username**: `member`
- **Password**: `password123`

### How It Works

1. Users click "Login" and enter credentials
2. On successful login, an authentication cookie is set
3. Private albums are only accessible when authenticated
4. Users can logout to clear their session

### For Production

⚠️ **Important**: This demo uses client-side authentication for simplicity. For a production site, you should:

- Implement proper server-side authentication
- Use secure password hashing
- Add database storage for users
- Implement JWT or session-based auth
- Add HTTPS (Netlify provides this automatically)

## Deployment

### Deploy to Netlify

1. Push your code to GitHub, GitLab, or Bitbucket

2. Connect your repository to Netlify:
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Netlify will auto-detect the build settings from `netlify.toml`

3. Click "Deploy site"

The Eleventy Edge functions will automatically work on Netlify.

### Manual Deployment

If you prefer to deploy manually:

```bash
npm run build
```

Then upload the `_site` directory to your hosting provider.

Note: Eleventy Edge features require Netlify or another edge-compatible host.

## Customization

### Styling

Edit `src/css/style.css` to customize the appearance.

### Layouts

- `src/_layouts/base.njk`: Base HTML structure
- `src/_layouts/album.njk`: Album page template

### Adding More Features

The Eleventy configuration in `.eleventy.js` can be extended with:
- Additional collections
- Custom filters
- Shortcodes
- Plugins

## Using Your Own Images

The sample albums use Unsplash images. To use your own:

1. Upload images to a hosting service (Cloudinary, AWS S3, etc.)
2. Update the `photos` array in your album markdown files with your image URLs

Alternatively, you can:
1. Store images in `src/images/`
2. Reference them as `/images/photo.jpg`
3. The `.eleventy.js` config already passes through the images folder

## Technologies Used

- [Eleventy](https://www.11ty.dev/) - Static site generator
- [Eleventy Edge](https://www.11ty.dev/docs/plugins/edge/) - Server-side rendering and authentication
- [Nunjucks](https://mozilla.github.io/nunjucks/) - Templating language
- [Netlify Edge Functions](https://www.netlify.com/products/edge/) - Serverless functions at the edge

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions:
- Check the [Eleventy documentation](https://www.11ty.dev/docs/)
- Review the [Eleventy Edge plugin docs](https://www.11ty.dev/docs/plugins/edge/)
- Open an issue in this repository
