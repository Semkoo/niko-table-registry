#!/usr/bin/env node
/**
 * Fails when shadcn publishes a React Aria style (`aria-*` preset) that
 * public/_redirects does not route to the React Aria build. Without a line, the
 * catch-all `/r/:style/:name` silently hands that style the Radix build.
 * Run in CI (registry.yml, also weekly); needs network to ui.shadcn.com.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const repo = join(dirname(fileURLToPath(import.meta.url)), "..")
const url =
  process.env.SHADCN_CONFIG_URL || "https://ui.shadcn.com/r/config.json"

const response = await fetch(url)
if (!response.ok) {
  console.error(`Could not fetch ${url}: ${response.status}`)
  process.exit(1)
}
const { presets } = await response.json()
const published = [
  ...new Set(
    presets.filter(p => p.base === "aria").map(p => `aria-${p.style}`),
  ),
].sort()
const routed = new Set(
  [
    ...readFileSync(join(repo, "public", "_redirects"), "utf8").matchAll(
      /^\/r\/(aria-[a-z0-9-]+)\/:name \/r-aria\/:name 200$/gm,
    ),
  ].map(m => m[1]),
)
const missing = published.filter(style => !routed.has(style))
if (published.length === 0) {
  console.error(`No aria presets found in ${url}; has the format changed?`)
  process.exit(1)
}
if (missing.length) {
  console.error(
    `shadcn styles without a React Aria route in public/_redirects: ${missing.join(", ")}\n` +
      missing.map(s => `  add: /r/${s}/:name /r-aria/:name 200`).join("\n"),
  )
  process.exit(1)
}
console.log(`✔ All ${published.length} shadcn aria-* styles are routed.`)
