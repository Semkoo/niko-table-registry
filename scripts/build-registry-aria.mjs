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
 *   (a primitive-covered component stays only if a swapped file imports it);
 * - npm dependencies the React Aria primitives import
 *   (@internationalized/date, react-aria, react-aria-components).
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
// shadcn components with a React Aria primitive (one file per name).
const ARIA_PRIMITIVES = new Set(
  readdirSync(PRIMITIVES_DIR)
    .filter(file => file.endsWith(".tsx"))
    .map(file => file.replace(/\.tsx$/, "")),
)

/**
 * Bare npm packages a source imports or re-exports at runtime. One statement
 * per match: multi-line imports end on their `} from "x"` line. Type-only
 * statements are skipped.
 */
export function npmImports(source) {
  const packages = new Set()
  const statements = source.matchAll(
    /^(import|export)\b(?! type )(?:[^\n]*\n(?!import\b|export\b))*?[^\n]*?\bfrom "([^"]+)"|^import "([^"]+)"/gm,
  )
  for (const [, , from, bare] of statements) {
    const spec = from ?? bare
    if (spec.startsWith(".") || spec.startsWith("@/")) continue
    const pkg = spec
      .split("/")
      .slice(0, spec.startsWith("@") ? 2 : 1)
      .join("/")
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
  const files = item.files.map(file => {
    const match = PRIMITIVE_PATH.exec(file.path)
    if (!match) return file
    const source = join(PRIMITIVES_DIR, match[1])
    if (!existsSync(source))
      throw new Error(`${item.name}: no React Aria build of ${file.path}`)
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
    // Drop a primitive-covered component none of the React Aria files import.
    .filter(dep => !ARIA_PRIMITIVES.has(dep) || imported.has(dep))
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

function main() {
  const index = JSON.parse(
    readFileSync(join(DEFAULT_DIR, "registry.json"), "utf8"),
  )
  rmSync(ARIA_DIR, { recursive: true, force: true })
  mkdirSync(ARIA_DIR, { recursive: true })
  // Driven by the index (not the folder), so a stale public/r file is never
  // republished as a React Aria item.
  const items = index.items.map(({ name }) => {
    const path = join(DEFAULT_DIR, `${name}.json`)
    if (!existsSync(path)) throw new Error(`public/r/${name}.json is missing`)
    const aria = ariaItem(JSON.parse(readFileSync(path, "utf8")))
    writeFileSync(
      join(ARIA_DIR, `${name}.json`),
      JSON.stringify(aria, null, 2) + "\n",
    )
    return aria
  })
  // Namespace index for `shadcn search / list / view` on aria-* styles: the
  // same entries, with each item's React Aria dependencies.
  const ariaIndex = {
    ...index,
    items: index.items.map((entry, i) => ({
      ...entry,
      ...(items[i].dependencies ? { dependencies: items[i].dependencies } : {}),
      ...(items[i].registryDependencies
        ? { registryDependencies: items[i].registryDependencies }
        : {}),
    })),
  }
  writeFileSync(
    join(ARIA_DIR, "registry.json"),
    JSON.stringify(ariaIndex, null, 2) + "\n",
  )
  console.log(
    `✔ Built ${items.length} React Aria items and registry.json in public/r-aria.`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
