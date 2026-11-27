#!/usr/bin/env node
/**
 * Local install test: installs the locally built registry into a real shadcn
 * app the way a user does, then type-checks, builds and (if the app has a
 * `test` script) runs its tests.
 *
 * It copies public/r and public/r-aria to a temp dir, rewrites every
 * https://niko-table.com/ URL in them to a local static server, and serves
 * them with the 200 rewrites from public/_redirects (the same routing Cloudflare
 * Pages applies; `astro dev` does not run _redirects). The app's
 * components.json gets `"@niko-table": "<server>/r/{style}/{name}.json"` for
 * the run, and the items are installed with `shadcn add @niko-table/<name>`,
 * so the CLI's own {style} substitution picks the build (aria-* styles get
 * public/r-aria, every other style public/r). No request goes to
 * niko-table.com (shadcn's own ui components still come from ui.shadcn.com).
 *
 * Usage:
 *   node scripts/test-install-local.mjs --app <dir> [--base radix|base|aria]
 *     [--items data-table,data-table-pagination] [--skip-install]
 *     [--skip-build] [--skip-tests]
 *
 *   --app    target app (or NIKO_TEST_APP). Must already be a shadcn app
 *            (components.json); its style decides which build it gets.
 *   --base   what the run is meant to test; checked against the app's style.
 *   --items  comma-separated item names (default: every item in registry.json).
 *
 * Run `pnpm run registry:build` first so public/r and public/r-aria are current.
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
const LIVE = "https://niko-table.com/"
const BUILDS = ["r", "r-aria"]

const UPSTREAM_FIXES = [
  {
    // aria-nova label.tsx imports React but never uses it (TS6133 under
    // noUnusedLocals, which Vite's template enables).
    file: "src/components/ui/label.tsx",
    find: /^import \* as React from "react"\n(?![\s\S]*\bReact\.)/m,
    why: "unused React import",
  },
]

const STYLE_PREFIX = { radix: null, base: "base-", aria: "aria-" }

function parseArgs(argv) {
  const args = { base: "radix" }
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]
    if (key === "--skip-install") args.skipInstall = true
    else if (key === "--skip-build") args.skipBuild = true
    else if (key === "--skip-tests") args.skipTests = true
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

/**
 * The `from to 200` rewrites in public/_redirects, as matchers. Supports the
 * forms used there: literal segments and `:placeholder` segments.
 */
export function readRewrites(text) {
  return text
    .split("\n")
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length === 3 && parts[2] === "200")
    .map(([from, to]) => {
      const names = []
      const pattern = from
        .split("/")
        .map(segment => {
          if (!segment.startsWith(":"))
            return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          names.push(segment.slice(1))
          return "([^/]+)"
        })
        .join("/")
      const regex = new RegExp(`^${pattern}$`)
      return path => {
        const match = regex.exec(path)
        if (!match) return null
        return names.reduce(
          (target, name, i) => target.replace(`:${name}`, match[i + 1]),
          to,
        )
      }
    })
}

/** Resolves a request path the way Pages does: first matching rewrite, else the file. */
export function resolveRequest(rewrites, path) {
  for (const rewrite of rewrites) {
    const target = rewrite(path)
    if (target) return target
  }
  return path
}

function serve(root, rewrites) {
  const server = createServer((req, res) => {
    const pathname = resolveRequest(
      rewrites,
      decodeURIComponent(new URL(req.url, "http://x").pathname),
    )
    const path = join(root, pathname)
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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.app) {
    console.error("Missing --app <dir> (or NIKO_TEST_APP).")
    process.exit(2)
  }
  const app = resolve(args.app)
  const configPath = join(app, "components.json")
  if (!existsSync(configPath)) {
    console.error(`${app} is not a shadcn app (no components.json).`)
    process.exit(2)
  }
  const configText = readFileSync(configPath, "utf8")
  const style = String(JSON.parse(configText).style)
  if (!(args.base in STYLE_PREFIX)) {
    console.error(`Unknown --base ${args.base} (radix | base | aria).`)
    process.exit(2)
  }
  const prefix = STYLE_PREFIX[args.base]
  const isOtherBase = Object.values(STYLE_PREFIX).some(
    p => p && style.startsWith(p),
  )
  if (prefix ? !style.startsWith(prefix) : isOtherBase) {
    console.error(`--base ${args.base} does not match ${app} (${style}).`)
    process.exit(2)
  }
  const registry = JSON.parse(readFileSync(join(repo, "registry.json"), "utf8"))
  const items = args.items
    ? args.items.split(",").map(s => s.trim())
    : registry.items.map(item => item.name)

  const results = []
  const tmp = mkdtempSync(join(os.tmpdir(), "niko-table-local-r-"))
  const rewrites = readRewrites(
    readFileSync(join(repo, "public", "_redirects"), "utf8"),
  )
  const server = await serve(tmp, rewrites)
  const local = `http://127.0.0.1:${server.address().port}/`
  const pm = packageManager(app)

  try {
    if (!args.skipInstall) {
      for (const build of BUILDS) {
        cpSync(join(repo, "public", build), join(tmp, build), {
          recursive: true,
        })
        for (const file of readdirSync(join(tmp, build))) {
          if (!file.endsWith(".json")) continue
          const path = join(tmp, build, file)
          writeFileSync(
            path,
            readFileSync(path, "utf8").replaceAll(LIVE, local),
          )
        }
      }
      // The registries line a user adds, pointed at the local server.
      const config = JSON.parse(configText)
      config.registries = {
        ...config.registries,
        "@niko-table": `${local}r/{style}/{name}.json`,
      }
      writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
      console.log(
        `Installing ${items.length} item(s) via ${local}r/{style}/{name}.json into ${app} (${style})`,
      )
      try {
        const { code } = await run(
          "npx",
          [
            "shadcn",
            "add",
            ...items.map(name => `@niko-table/${name}`),
            "--yes",
            "--overwrite",
          ],
          app,
        )
        results.push(["install", code === 0])
        if (code !== 0) throw new Error("shadcn add failed")
        // `shadcn search` reads the namespace index (registry.json) through
        // the same {style} URL.
        const search = await run(
          "npx",
          ["shadcn", "search", "@niko-table", "--query", "data-table-core"],
          app,
          { capture: true },
        )
        results.push([
          "shadcn search @niko-table",
          search.code === 0 && search.output.includes("data-table-core"),
        ])
      } finally {
        writeFileSync(configPath, configText)
      }
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
      const build = await run(pm, ["run", "build"], app)
      results.push(["build", build.code === 0])
    }

    const scripts = JSON.parse(
      readFileSync(join(app, "package.json"), "utf8"),
    ).scripts
    if (!args.skipTests && scripts?.test) {
      const tests = await run(pm, ["run", "test"], app)
      results.push(["app tests", tests.code === 0])
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

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
