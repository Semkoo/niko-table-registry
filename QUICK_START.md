# Quick Start Guide

## 🚀 Push to GitHub (Do This First!)

### 1. Create GitHub Repository

Go to: https://github.com/new

- **Repository name**: `niko-data-table-registry`
- **Visibility**: Public (recommended) or Private
- **❌ Do NOT** check "Initialize this repository with a README"

### 2. Push Your Local Code

```bash
# Check your changes
git status

# Stage all changes
git add .

# Commit
git commit -m "Initial setup: Transform into Advanced React Table Registry

- Updated all repository references and URLs
- Added proper attribution to original WDS Shadcn Registry
- Configured for pnpm development
- Fixed Vite module resolution
- Updated branding and documentation"

# Push to GitHub
git push -u origin main
```

## 🛠️ Development Commands

```bash
# Start development server
pnpm dev
# → http://localhost:4321

# Build the registry
pnpm registry:build

# Format code
pnpm format

# Lint code
pnpm lint

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📁 Key Directories

```plaintext
src/
├── registry/new-york/
│   ├── items/          # Component implementations (what users install)
│   └── examples/       # Component examples (shown in docs)
├── content/docs/
│   ├── components/     # Component documentation pages
│   ├── getting-started/
│   └── contributing/
└── components/         # Documentation site components
```

## ➕ Adding a New Component

### 1. Create the Component

Create: `src/registry/new-york/items/my-component/components/my-component.tsx`

### 2. Create Examples

Create: `src/registry/new-york/examples/my-component/basic.tsx`

### 3. Create Documentation

Create: `src/content/docs/components/my-component.mdx`

### 4. Build Registry

```bash
pnpm registry:build
```

This generates `public/r/my-component.json`

### 5. Test Installation

In a separate project:

```bash
npx shadcn@latest add http://localhost:4321/r/my-component.json
```

## 🌐 URLs to Update Later

When you deploy your site, update these:

**In `.env`:**

```bash
URL=https://your-actual-deployment-url.com
```

**In `.env.example`:**

```bash
URL=https://your-actual-deployment-url.com
```

## 📝 Next Steps

1. ✅ Push to GitHub (instructions above)
2. 🎨 Update branding (see TODO.md)
3. 🗑️ Remove example components you don't need
4. ✨ Add your advanced React table components
5. 🚀 Deploy to Netlify/Vercel
6. 📢 Share with the community!

## ⚡ Quick Tips

- Dev server auto-reloads on file changes
- Registry builds to `public/r/` directory
- All components must be in `registry/new-york/items/`
- Examples are shown in documentation
- Use `.env` for local URLs, production URLs come from deployment

## 🆘 Having Issues?

1. **Module not found errors**:

   ```bash
   pnpm install
   ```

2. **Dev server won't start**:

   ```bash
   rm -rf .astro node_modules pnpm-lock.yaml
   pnpm install
   pnpm dev
   ```

3. **Registry build fails**:

   ```bash
   pnpm registry:build
   ```

   Check the error message and verify your component structure

4. **Port already in use**:
   ```bash
   # Kill process on port 4321
   lsof -ti:4321 | xargs kill -9
   pnpm dev
   ```

## 📚 Learn More

- [Shadcn UI Docs](https://ui.shadcn.com)
- [Astro Docs](https://docs.astro.build)
- [Original WDS Registry](https://github.com/WebDevSimplified/wds-shadcn-registry)

---

**Ready to start building? Go push to GitHub! 🚀**
