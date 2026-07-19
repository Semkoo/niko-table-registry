#!/usr/bin/env node
/**
 * Ensure every Starlight sidebar `slug` in astro.config.mts maps to a docs
 * content file. Catches stale sidebar entries before `astro build` throws
 * AstroUserError mid-dev.
 *
 * Exit 0 if all slugs resolve; 1 otherwise.
 */

import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, "..")
const configPath = join(repoRoot, "astro.config.mts")
const docsRoot = join(repoRoot, "src", "content", "docs")

const config = readFileSync(configPath, "utf8")
const slugs = [...config.matchAll(/slug:\s*["']([^"']+)["']/g)].map(m => m[1])

function candidatesFor(slug) {
  if (slug === "index" || slug === "") {
    return [join(docsRoot, "index.mdx"), join(docsRoot, "index.md")]
  }
  return [
    join(docsRoot, `${slug}.mdx`),
    join(docsRoot, `${slug}.md`),
    join(docsRoot, slug, "index.mdx"),
    join(docsRoot, slug, "index.md"),
  ]
}

const missing = []
for (const slug of slugs) {
  if (!candidatesFor(slug).some(existsSync)) {
    missing.push(slug)
  }
}

if (missing.length) {
  console.error(
    `Sidebar slug check failed: ${missing.length} slug(s) have no docs file:\n` +
      missing.map(s => `  - ${s}`).join("\n") +
      `\n\nAdd src/content/docs/<slug>.mdx (or <slug>/index.mdx), or remove the sidebar entry.`,
  )
  process.exit(1)
}

console.log(`Sidebar slug check passed (${slugs.length} slugs).`)
