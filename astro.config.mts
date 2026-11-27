import { defineConfig, envField } from "astro/config"
import starlight from "@astrojs/starlight"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import starlightThemeBlack from "starlight-theme-black"
import { loadEnv } from "vite"

if (process.env.NODE_ENV == null) throw new Error("NODE_ENV is not set.")

const {
  GITHUB_REPO_URL = "https://github.com/Semkoo/niko-table-registry",
  DEPLOY_PRIME_URL = "http://localhost:4321",
  URL = "https://niko-table.com",
} = loadEnv(process.env.NODE_ENV, process.cwd(), "")

const SERVER_URL =
  process.env.NODE_ENV === "production" ? URL : DEPLOY_PRIME_URL

if (SERVER_URL === undefined) throw new Error("SERVER_URL is not set.")

// https://astro.build/config
export default defineConfig({
  site: SERVER_URL,
  // Match `/path` and `/path/` (LinkCards / pasted URLs often omit the slash).
  // `"always"` 404s bare paths in `astro dev` instead of redirecting.
  trailingSlash: "ignore",
  redirects: {
    "/examples/all-features-grid": "/examples/composed-grid/",
  },
  env: {
    schema: {
      GITHUB_REPO_URL: envField.string({
        context: "client",
        access: "public",
        default: "https://github.com/Semkoo/niko-table-registry",
      }),
      DEPLOY_PRIME_URL: envField.string({
        context: "client",
        access: "public",
        default: "http://localhost:4321",
      }),
      URL: envField.string({
        context: "client",
        access: "public",
        default: "https://niko-table.com",
      }),
    },
  },
  integrations: [
    starlight({
      components: {
        Head: "./src/components/overrides/head.astro",
        PageTitle: "./src/components/overrides/page-title.astro",
        SocialIcons: "./src/components/overrides/social-icons.astro",
        Footer: "./src/components/overrides/footer.astro",
      },
      head: [
        // Add ICO favicon fallback for Safari.
        {
          tag: "link",
          attrs: {
            rel: "icon",
            href: "/favicon.ico",
          },
        },
        // Add dark mode favicon.
        {
          tag: "link",
          attrs: {
            rel: "icon",
            href: "/favicon-dark.svg",
            media: "(prefers-color-scheme: dark)",
            type: "image/svg+xml",
          },
        },
        // Add light mode favicon.
        {
          tag: "link",
          attrs: {
            rel: "icon",
            href: "/favicon.svg",
            media: "(prefers-color-scheme: light)",
            type: "image/svg+xml",
          },
        },
        // OG Images
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: `${SERVER_URL}/og.webp`,
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:secure_url",
            content: `${SERVER_URL}/og.webp`,
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:width",
            content: "1200",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:height",
            content: "630",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "twitter:image",
            content: `${SERVER_URL}/og.webp`,
          },
        },
      ],
      title: "Niko Table",
      editLink: {
        baseUrl: `${GITHUB_REPO_URL}/tree/main`,
      },
      logo: {
        dark: "./src/assets/logo/dark.svg",
        light: "./src/assets/logo/light.svg",
        replacesTitle: true,
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: GITHUB_REPO_URL,
        },
      ],
      customCss: ["./src/styles/global.css"],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "getting-started/introduction" },
            { label: "Installation", slug: "getting-started/installation" },
            {
              label: "Manual Installation",
              slug: "getting-started/manual-installation",
            },
            { label: "Components", slug: "getting-started/components" },
            { label: "Skills", slug: "getting-started/skills" },
            { label: "Changelog", slug: "changelog" },
          ],
        },
        {
          label: "Niko Table",
          items: [
            { label: "Introduction", slug: "niko-table/introduction" },
            {
              label: "Components",
              slug: "niko-table/overview/components",
            },
            { label: "Core", slug: "niko-table/overview/core" },
            {
              label: "Filters",
              slug: "niko-table/overview/filters",
            },
            { label: "Hooks", slug: "niko-table/overview/hooks" },
            { label: "Library", slug: "niko-table/overview/lib" },
            { label: "Types", slug: "niko-table/overview/types" },
            { label: "Config", slug: "niko-table/overview/config" },
          ],
        },
        {
          label: "Examples",
          items: [
            { label: "Gallery", slug: "examples" },
            {
              label: "Getting Started",
              collapsed: true,
              items: [
                { label: "Simple Table", slug: "examples/simple-table" },
                { label: "Basic Table", slug: "examples/basic-table" },
                { label: "Search Table", slug: "examples/search-table" },
              ],
            },
            {
              label: "Row & Column Features",
              collapsed: true,
              items: [
                {
                  label: "Row Selection",
                  slug: "examples/row-selection-table",
                },
                {
                  label: "Row Expansion",
                  slug: "examples/row-expansion-table",
                },
                {
                  label: "Row Context Menu",
                  slug: "examples/row-context-menu-table",
                },
                { label: "Inline Edit", slug: "examples/inline-edit-table" },
                {
                  label: "Column Pinning",
                  slug: "examples/column-pinning-table",
                },
                { label: "Grouping", slug: "examples/grouping-table" },
                {
                  label: "Column Resize",
                  slug: "examples/column-resize-table",
                },
                { label: "Tree Table", slug: "examples/tree-table" },
              ],
            },
            {
              label: "Drag & Drop",
              collapsed: true,
              items: [
                { label: "Row DnD", slug: "examples/row-dnd-table" },
                { label: "Column DnD", slug: "examples/column-dnd-table" },
              ],
            },
            {
              label: "Layout & Presentation",
              collapsed: true,
              items: [
                { label: "Aside", slug: "examples/aside-table" },
                {
                  label: "Virtualization",
                  slug: "examples/virtualization-table",
                },
                {
                  label: "Infinite Scroll",
                  slug: "examples/infinite-scroll-table",
                },
                {
                  label: "Infinite Scroll (Virtualized)",
                  slug: "examples/infinite-scroll-virtualized-table",
                },
              ],
            },
            {
              label: "Filtering",
              collapsed: true,
              items: [
                {
                  label: "Faceted Filter",
                  slug: "examples/faceted-filter-table",
                },
                { label: "Advanced Filter", slug: "examples/advanced-table" },
                {
                  label: "Advanced Inline Filter",
                  slug: "examples/advanced-inline-table",
                },
              ],
            },
            {
              label: "Server-Side & URL State",
              collapsed: true,
              items: [
                {
                  label: "Advanced Filter + Nuqs",
                  slug: "examples/advanced-nuqs-table",
                },
                { label: "Server-Side", slug: "examples/server-side-table" },
                {
                  label: "Server-Side + Nuqs",
                  slug: "examples/server-side-nuqs-table",
                },
                { label: "Drizzle ORM", slug: "examples/drizzle-orm" },
                {
                  label: "Drizzle ORM + Nuqs",
                  slug: "examples/drizzle-orm-nuqs",
                },
              ],
            },
          ],
        },
        {
          label: "Data Grid",
          items: [
            { label: "Introduction", slug: "data-grid/introduction" },
            {
              label: "Components",
              slug: "data-grid/overview/components",
            },
            { label: "Core", slug: "data-grid/overview/core" },
            {
              label: "Filters",
              slug: "data-grid/overview/filters",
            },
            { label: "Hooks", slug: "data-grid/overview/hooks" },
            { label: "Library", slug: "data-grid/overview/lib" },
            { label: "Types", slug: "data-grid/overview/types" },
            { label: "Config", slug: "data-grid/overview/config" },
            { label: "API Reference", slug: "data-grid/api" },
          ],
        },
        {
          label: "Data Grid Examples",
          items: [
            { label: "Gallery", slug: "data-grid/examples" },
            {
              label: "Basics",
              collapsed: true,
              items: [
                { label: "Basic Grid", slug: "examples/basic-grid" },
                { label: "Composed Grid", slug: "examples/composed-grid" },
                { label: "Cell Types", slug: "examples/cell-types-grid" },
              ],
            },
            {
              label: "Editing & Validation",
              collapsed: true,
              items: [
                { label: "Validation", slug: "examples/validation-grid" },
                {
                  label: "Dynamic Columns",
                  slug: "examples/dynamic-columns-grid",
                },
              ],
            },
            {
              label: "Saving",
              collapsed: true,
              items: [
                { label: "Persistence", slug: "examples/persistence-grid" },
                { label: "Server Side", slug: "examples/server-side-grid" },
              ],
            },
          ],
        },
        {
          label: "Contributing",
          items: [
            { label: "Introduction", slug: "contributing" },
            {
              label: "Component Request",
              slug: "contributing/component-request",
            },
            {
              label: "Feature Request",
              slug: "contributing/feature-request",
            },
            {
              label: "Contributing Code",
              slug: "contributing/contributing-code",
            },
            {
              label: "Documentation Guidelines",
              slug: "contributing/documentation-guidelines",
            },
          ],
        },
      ],
      plugins: [
        starlightThemeBlack({
          // Render sidebar groups as <details> so nested `collapsed` groups fold.
          sidebar: { useDropdowns: true },
          navLinks: [
            {
              label: "Docs",
              link: "/getting-started/installation/",
            },
            {
              label: "Table Examples",
              link: "/examples/",
            },
            {
              label: "Grid Examples",
              link: "/data-grid/examples/",
            },
            {
              label: "Blocks",
              link: "/blocks/",
            },
            {
              label: "Contributing",
              link: "/contributing/",
            },
          ],
        }),
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Vite 8 (Rolldown) defaults CSS minification to the stricter lightningcss,
    // which rejects some valid-in-browser selectors emitted by dependencies.
    // Keep esbuild (Astro 6 / Vite 7 behavior) to avoid breaking the build.
    build: {
      cssMinify: "esbuild",
    },
    ssr: {
      // FIXME: Once starlight supports Zod 4 we can probably remove this.
      // Zod should normally be imported from astro, but I want my code to use its own zod version to reflect the version used in the shadcn components.
      noExternal: ["zod"],
    },
  },
  output: "static",
})
