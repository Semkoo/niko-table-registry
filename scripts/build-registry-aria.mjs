#!/usr/bin/env node
/**
 * Builds the React Aria variant of every registry item, after `shadcn build`.
 *
 * Reads public/r/<name>.json (the default build, Radix-shaped, untouched) and
 * writes public/r-aria/<name>.json with:
 * - each niko-table/primitives/<x>.tsx file's content replaced by
 *   registry-aria/niko-table/primitives/<x>.tsx;
 * - niko-table registryDependencies pointed at https://niko-table.com/r-aria/;
 * - shadcn registryDependencies matched to what the swapped files import
 *   (e.g. no `command`: the React Aria command primitive uses cmdk directly);
 * - npm dependencies the React Aria primitives import (cmdk,
 *   @internationalized/date, react-aria, react-aria-components).
 *
 * public/_redirects serves it at /r/aria-<style>/<name>.json, so a registry
 * URL of https://niko-table.com/r/{style}/{name}.json picks the right build
 * for every shadcn style. Deterministic: a second run writes the same bytes.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_DIR = join(repo, "public", "r")
const ARIA_DIR = join(repo, "public", "r-aria")
const PRIMITIVES_DIR = join(repo, "registry-aria", "niko-table", "primitives")
const LIVE = "https://niko-table.com/r/"
const LIVE_ARIA = "https://niko-table.com/r-aria/"
const PRIMITIVE_PATH =
  /^src\/components\/niko-table\/primitives\/([a-z-]+\.tsx)$/
// Peers every React app already has.
const PEERS = new Set(["react", "react-dom"])

/** Bare npm packages a source imports at runtime (type-only imports skipped). */
function npmImports(source) {
  const packages = new Set()
  for (const [, spec] of source.matchAll(
    /^import (?!type )[^;]*?from "([^"./@][^"]*|@[^"/]+\/[^"/]+)"/gms,
  )) {
    const pkg = spec.startsWith("@") ? spec : spec.split("/")[0]
    if (!PEERS.has(pkg)) packages.add(pkg)
  }
  return packages
}

/** shadcn ui components a source imports (`@/components/ui/<name>`). */
function uiImports(source) {
  return new Set(
    [...source.matchAll(/from "@\/components\/ui\/([a-z-]+)"/g)].map(m => m[1]),
  )
}

const packageName = dep => dep.replace(/(?!^)@.*$/, "")

function ariaItem(item) {
  const primitives = new Set()
  const files = item.files.map(file => {
    const match = PRIMITIVE_PATH.exec(file.path)
    if (!match) return file
    const source = join(PRIMITIVES_DIR, match[1])
    if (!existsSync(source))
      throw new Error(`${item.name}: no React Aria build of ${file.path}`)
    primitives.add(match[1].replace(/\.tsx$/, ""))
    return { ...file, content: readFileSync(source, "utf8") }
  })

  // ui components the item needs: whatever its files import, but only the
  // swapped primitives may add one (e.g. data-table keeps relying on
  // data-table-ui for table.tsx rather than a bare `table`).
  const imported = new Set(files.flatMap(file => [...uiImports(file.content)]))
  const primitiveImports = new Set(
    files
      .filter(file => PRIMITIVE_PATH.test(file.path))
      .flatMap(file => [...uiImports(file.content)]),
  )
  const registryDependencies = (item.registryDependencies ?? [])
    .map(dep =>
      dep.startsWith(LIVE) ? LIVE_ARIA + dep.slice(LIVE.length) : dep,
    )
    // A primitive-covered component the React Aria files no longer import.
    .filter(dep => !primitives.has(dep) || imported.has(dep))
  for (const name of primitiveImports)
    if (!registryDependencies.includes(name)) registryDependencies.push(name)

  const dependencies = [...(item.dependencies ?? [])]
  const have = new Set(dependencies.map(packageName))
  for (const file of files) {
    if (!PRIMITIVE_PATH.test(file.path)) continue
    for (const pkg of npmImports(file.content))
      if (!have.has(pkg)) {
        have.add(pkg)
        dependencies.push(pkg)
      }
  }

  return {
    ...item,
    ...(dependencies.length ? { dependencies } : {}),
    ...(registryDependencies.length ? { registryDependencies } : {}),
    files,
  }
}

rmSync(ARIA_DIR, { recursive: true, force: true })
mkdirSync(ARIA_DIR, { recursive: true })
let count = 0
for (const name of readdirSync(DEFAULT_DIR).sort()) {
  if (!name.endsWith(".json") || name === "registry.json") continue
  const item = JSON.parse(readFileSync(join(DEFAULT_DIR, name), "utf8"))
  writeFileSync(
    join(ARIA_DIR, name),
    JSON.stringify(ariaItem(item), null, 2) + "\n",
  )
  count++
}
console.log(`✔ Built ${count} React Aria items in public/r-aria.`)
