/**
 * Share images: one per docs page at /og/<slug>.webp (src/pages/og/), plus the
 * site image at /og.webp for the home page and pages without their own.
 */

const sections: Record<string, string> = {
  "niko-table": "Niko Table",
  "data-grid": "Niko Grid",
  examples: "Examples",
  blocks: "Blocks",
  "getting-started": "Getting Started",
  contributing: "Contributing",
}

/** "/examples/basic-table/" -> "examples/basic-table" */
export function ogSlug(pathname: string) {
  return pathname.replace(/^\/+|\/+$/g, "")
}

/** The short line under the title: the section the page belongs to. */
export function ogSection(slug: string) {
  return sections[slug.split("/")[0]] ?? "Niko Table"
}

/** Path of a page's share image. Home and 404 use the site image. */
export function ogImagePath(pathname: string) {
  const slug = ogSlug(pathname)
  return slug === "" || slug === "index" || slug === "404"
    ? "/og.webp"
    : `/og/${slug}.webp`
}
