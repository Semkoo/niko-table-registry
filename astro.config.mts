import { defineConfig, envField } from "astro/config"
import starlight from "@astrojs/starlight"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import starlightThemeBlack from "starlight-theme-black"
import { loadEnv } from "vite"

if (process.env.NODE_ENV == null) throw new Error("NODE_ENV is not set.")

const {
  GITHUB_REPO_URL = "https://github.com/Semkoo/niko-table-registry",
  DEPLOY_PRIME_URL = "localhost:4321",
  URL = "http://niko-table.com",
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
      }),
      DEPLOY_PRIME_URL: envField.string({
        context: "client",
        access: "public",
      }),
      URL: envField.string({
        context: "client",
        access: "public",
      }),
    },
  },
  integrations: [
    starlight({
      components: {
        Head: "./src/components/overrides/head.astro",
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
      title: "Niko Tables - Nobody's table, everyone's solution",
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
          label: "Niko Tables",
          items: [
            { label: "Introduction", slug: "niko-tables/introduction" },
            {
              label: "Components",
              slug: "niko-tables/overview/components",
            },
            { label: "Core", slug: "niko-tables/overview/core" },
            {
              label: "Filters",
              slug: "niko-tables/overview/filters",
            },
            { label: "Hooks", slug: "niko-tables/overview/hooks" },
            { label: "Library", slug: "niko-tables/overview/lib" },
            { label: "Types", slug: "niko-tables/overview/types" },
            { label: "Config", slug: "niko-tables/overview/config" },
          ],
        },
        {
          label: "Examples",
          items: [
            { label: "Simple Table", slug: "niko-tables/simple-table" },
            { label: "Basic Table", slug: "niko-tables/basic-table" },
            { label: "Search Table", slug: "niko-tables/search-table" },
            { label: "Aside Table", slug: "niko-tables/aside-table" },
            {
              label: "Row Selection Table",
              slug: "niko-tables/row-selection-table",
            },
            {
              label: "Row Expansion Table",
              slug: "niko-tables/row-expansion-table",
            },
            {
              label: "Column Pinning Table",
              slug: "niko-tables/column-pinning-table",
            },
            {
              label: "Tree Table",
              slug: "niko-tables/tree-table",
            },
            {
              label: "Virtualization Table",
              slug: "niko-tables/virtualization-table",
            },
            {
              label: "Faceted Filter Table",
              slug: "niko-tables/faceted-filter-table",
            },
            {
              label: "Advanced Filter Table",
              slug: "niko-tables/advanced-table",
            },
            {
              label: "Advanced Inline Filter Table",
              slug: "niko-tables/advanced-inline-table",
            },
            {
              label: "Advanced Nuqs Table",
              slug: "niko-tables/advanced-nuqs-table",
            },
            {
              label: "Server-Side Table",
              slug: "niko-tables/server-side-table",
            },
            {
              label: "Server-Side Nuqs Table",
              slug: "niko-tables/server-side-nuqs-table",
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
              link: "/niko-tables/simple-table",
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
