#!/usr/bin/env node
/**
 * Local install test: installs the locally built registry (public/r) into a
 * real shadcn app, then type-checks and builds that app.
 *
 * Installing a local public/r/<item>.json directly is not enough: its
 * registryDependencies point at https://niko-table.com/r/…, so the CLI would
 * pull the live items and overwrite the local changes. This script copies
 * public/r to a temp dir, rewrites every https://niko-table.com/r/ to a local
 * static server and installs from there. No request to niko-table.com is made
 * (shadcn's own ui components still come from ui.shadcn.com).
 *
 * Usage:
 *   node scripts/test-install-local.mjs --app <dir> [--base radix|base|aria]
 *     [--items data-table,data-table-pagination] [--skip-install] [--skip-build]
 *
 *   --app    target app (or NIKO_TEST_APP). Must already be a shadcn app
 *            (components.json); its style decides Radix / Base UI.
 *   --base   aria: after install, swap in registry-aria/niko-table/primitives.
 *            radix / base only label the run (the app's style decides).
 *   --items  comma-separated item names (default: every item in registry.json).
 *
 * Run `pnpm run registry:build` first so public/r is current.
 *
 * Use a throwaway app: `--overwrite` replaces its components/ui/* files.
 */

import { spawn } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { createServer } from "node:http"
import os from "node:os"
import { dirname, join, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const LIVE = "https://niko-table.com/r/"

const UPSTREAM_FIXES = [
  {
    // aria-nova label.tsx imports React but never uses it (TS6133 under
    // noUnusedLocals, which Vite's template enables).
    file: "src/components/ui/label.tsx",
    find: /^import \* as React from "react"\n(?![\s\S]*\bReact\.)/m,
    why: "unused React import",
  },
]

function parseArgs(argv) {
  const args = { base: "radix" }
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]
    if (key === "--skip-install") args.skipInstall = true
    else if (key === "--skip-build") args.skipBuild = true
    else if (key.startsWith("--")) args[key.slice(2)] = argv[++i]
  }
  args.app ??= process.env.NIKO_TEST_APP
  return args
}

/** Runs a command without blocking the event loop (the local server must answer). */
function run(cmd, cmdArgs, cwd, { capture = false } = {}) {
  return new Promise(resolvePromise => {
    const child = spawn(cmd, cmdArgs, {
      cwd,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      env: { ...process.env, CI: "1" },
    })
    let output = ""
    if (capture) {
      child.stdout.on("data", d => (output += d))
      child.stderr.on("data", d => (output += d))
    }
    child.on("close", code => resolvePromise({ code: code ?? 1, output }))
  })
}

function serve(root) {
  const server = createServer((req, res) => {
    const path = join(
      root,
      decodeURIComponent(new URL(req.url, "http://x").pathname),
    )
    if (
      !path.startsWith(root + sep) ||
      !existsSync(path) ||
      !statSync(path).isFile()
    ) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { "content-type": "application/json" })
    res.end(readFileSync(path))
  })
  return new Promise(resolvePromise =>
    server.listen(0, "127.0.0.1", () => resolvePromise(server)),
  )
}

/** The app's package manager, from its lockfile (npm when none). */
function packageManager(app) {
  if (existsSync(join(app, "pnpm-lock.yaml"))) return "pnpm"
  if (existsSync(join(app, "yarn.lock"))) return "yarn"
  if (existsSync(join(app, "bun.lock")) || existsSync(join(app, "bun.lockb")))
    return "bun"
  return "npm"
}

function findPrimitivesDir(app) {
  for (const dir of ["src/components", "components", "app/components"]) {
    const candidate = join(app, dir, "niko-table", "primitives")
    if (existsSync(candidate)) return candidate
  }
  return null
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.app) {
    console.error("Missing --app <dir> (or NIKO_TEST_APP).")
    process.exit(2)
  }
  const app = resolve(args.app)
  if (!existsSync(join(app, "components.json"))) {
    console.error(`${app} is not a shadcn app (no components.json).`)
    process.exit(2)
  }
  const style = JSON.parse(
    readFileSync(join(app, "components.json"), "utf8"),
  ).style
  if (!["radix", "base", "aria"].includes(args.base)) {
    console.error(`Unknown --base ${args.base} (radix | base | aria).`)
    process.exit(2)
  }
  if (args.base === "aria" && !String(style).startsWith("aria-")) {
    console.error(`--base aria needs an aria-* app; ${app} is ${style}.`)
    process.exit(2)
  }
  const registry = JSON.parse(readFileSync(join(repo, "registry.json"), "utf8"))
  const items = args.items
    ? args.items.split(",").map(s => s.trim())
    : registry.items.map(item => item.name)

  const results = []
  const tmp = mkdtempSync(join(os.tmpdir(), "niko-table-local-r-"))
  const server = await serve(tmp)
  const local = `http://127.0.0.1:${server.address().port}/r/`

  try {
    if (!args.skipInstall) {
      cpSync(join(repo, "public", "r"), join(tmp, "r"), { recursive: true })
      for (const file of readdirSync(join(tmp, "r"))) {
        if (!file.endsWith(".json")) continue
        const path = join(tmp, "r", file)
        writeFileSync(path, readFileSync(path, "utf8").replaceAll(LIVE, local))
      }
      console.log(
        `Installing ${items.length} item(s) from ${local} into ${app} (${style})`,
      )
      const { code } = await run(
        "npx",
        [
          "shadcn",
          "add",
          ...items.map(name => `${local}${name}.json`),
          "--yes",
          "--overwrite",
        ],
        app,
      )
      results.push(["install", code === 0])
      if (code !== 0) throw new Error("shadcn add failed")
    }

    // shadcn's own files that fail a strict app before any Niko Table code is
    // involved. Patched (and logged) so the typecheck measures Niko Table.
    // shortcut: drop an entry once the upstream registry ships the fix.
    for (const fix of UPSTREAM_FIXES) {
      const path = join(app, fix.file)
      if (!existsSync(path)) continue
      const before = readFileSync(path, "utf8")
      const after = before.replace(fix.find, "")
      if (after !== before) {
        writeFileSync(path, after)
        console.log(`Patched upstream shadcn issue: ${fix.file} (${fix.why})`)
        results.push([`patched upstream ${fix.file} (${fix.why})`, true])
      }
    }

    if (args.base === "aria") {
      const target = findPrimitivesDir(app)
      const source = join(repo, "registry-aria", "niko-table", "primitives")
      if (!target) throw new Error("No niko-table/primitives folder in the app")
      // Only swap the primitives the installed items brought in (à la carte).
      const swapped = readdirSync(source).filter(f =>
        existsSync(join(target, f)),
      )
      for (const file of swapped) cpSync(join(source, file), join(target, file))
      console.log(`Swapped React Aria primitives: ${swapped.join(", ")}`)

      // npm packages the swapped files import that the app lacks (e.g. cmdk).
      const missing = new Set()
      for (const file of swapped) {
        const source = readFileSync(join(target, file), "utf8")
        for (const [, spec] of source.matchAll(
          /from "([^"./@][^"]*|@[^"/]+\/[^"/]+)/g,
        )) {
          const pkg = spec.startsWith("@") ? spec : spec.split("/")[0]
          if (!existsSync(join(app, "node_modules", pkg))) missing.add(pkg)
        }
      }
      if (missing.size) {
        console.log(`Installing ${[...missing].join(", ")}`)
        const pm = packageManager(app)
        const { code } = await run(
          pm,
          [pm === "npm" ? "install" : "add", ...missing],
          app,
        )
        results.push(["install primitive deps", code === 0])
      }
    }

    const tsconfig = existsSync(join(app, "tsconfig.app.json"))
      ? "tsconfig.app.json"
      : "tsconfig.json"
    const tsc = await run("npx", ["tsc", "--noEmit", "-p", tsconfig], app, {
      capture: true,
    })
    const errors = (tsc.output.match(/error TS\d+/g) ?? []).length
    if (errors) console.log(tsc.output)
    results.push([`typecheck (${errors} errors)`, tsc.code === 0])

    if (!args.skipBuild) {
      const build = await run(packageManager(app), ["run", "build"], app)
      results.push(["build", build.code === 0])
    }
  } catch (error) {
    console.error(String(error))
    results.push(["run", false])
  } finally {
    server.close()
    rmSync(tmp, { recursive: true, force: true })
  }

  console.log(`\nLocal install test (${args.base}, ${style}) in ${app}`)
  for (const [name, ok] of results)
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`)
  const failed = results.some(([, ok]) => !ok)
  console.log(failed ? "\nFAILED" : "\nPASSED")
  process.exit(failed ? 1 : 0)
}

main()
