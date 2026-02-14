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
      title: "Niko Table - Nobody's table, everyone's solution",
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
            // Getting Started
            { label: "Simple Table", slug: "examples/simple-table" },
            { label: "Basic Table", slug: "examples/basic-table" },
            { label: "Search Table", slug: "examples/search-table" },

            // Row & Column Features
            {
              label: "Row Selection Table",
              slug: "examples/row-selection-table",
            },
            {
              label: "Row Expansion Table",
              slug: "examples/row-expansion-table",
            },
            {
              label: "Column Pinning Table",
              slug: "examples/column-pinning-table",
            },
            {
              label: "Tree Table",
              slug: "examples/tree-table",
            },

            // Drag & Drop
            {
              label: "Row DnD Table",
              slug: "examples/row-dnd-table",
            },
            {
              label: "Column DnD Table",
              slug: "examples/column-dnd-table",
            },

            // Layout & Presentation
            { label: "Aside Table", slug: "examples/aside-table" },
            {
              label: "Virtualization Table",
              slug: "examples/virtualization-table",
            },

            // Filtering
            {
              label: "Faceted Filter Table",
              slug: "examples/faceted-filter-table",
            },
            {
              label: "Advanced Filter Table",
              slug: "examples/advanced-table",
            },
            {
              label: "Advanced Inline Filter Table",
              slug: "examples/advanced-inline-table",
            },

            // Server-Side & URL State
            {
              label: "Advanced Nuqs Table",
              slug: "examples/advanced-nuqs-table",
            },
            {
              label: "Server-Side Table",
              slug: "examples/server-side-table",
            },
            {
              label: "Server-Side Nuqs Table",
              slug: "examples/server-side-nuqs-table",
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
          ],
        },
      ],
      plugins: [
        starlightThemeBlack({
          navLinks: [
            {
              label: "Docs",
              link: "/getting-started/installation",
            },
            {
              label: "Table Examples",
              link: "/examples/simple-table",
            },
            {
              label: "Contributing",
              link: "/contributing",
            },
          ],
          footerText: "",
        }),
      ],
    }),
    react(),
  ],
  vite: {
    // @ts-expect-error - Type incompatibility between @tailwindcss/vite and Vite 7
    plugins: [tailwindcss()],
    ssr: {
      // FIXME: Once starlight supports Zod 4 we can probably remove this.
      // Zod should normally be imported from astro, but I want my code to use its own zod version to reflect the version used in the shadcn components.
      noExternal: ["zod"],
    },
  },
  output: "static",
})
