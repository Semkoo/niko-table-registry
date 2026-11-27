/**
 * The per-style registry: public/r/<name>.json is the default (Radix-shaped)
 * build every non-React Aria style installs, public/r-aria/<name>.json the
 * React Aria build, and public/_redirects routes /r/{style}/<name>.json to the
 * right one. Run `pnpm run registry:build` after changing an item.
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import registry from "../../../registry.json"
import {
  readRewrites,
  resolveRequest,
} from "../../../scripts/test-install-local.mjs"
import { npmImports } from "../../../scripts/build-registry-aria.mjs"

const REPO = join(__dirname, "../../..")
const PRIMITIVE = /^src\/components\/niko-table\/primitives\/([a-z-]+\.tsx)$/

type BuiltItem = {
  registryDependencies?: string[]
  dependencies?: string[]
  files: { path: string; content: string }[]
}

const read = (path: string) => readFileSync(join(REPO, path), "utf8")
const built = (dir: string, name: string): BuiltItem =>
  JSON.parse(read(`public/${dir}/${name}.json`))

describe.each(registry.items.map(item => [item.name] as const))("%s", name => {
  it("has a React Aria build", () => {
    expect(existsSync(join(REPO, `public/r-aria/${name}.json`))).toBe(true)
  })

  it("default build is unchanged: Radix primitives, default URLs", () => {
    const item = built("r", name)
    for (const file of item.files)
      if (PRIMITIVE.test(file.path)) expect(file.content).toBe(read(file.path))
    for (const dep of item.registryDependencies ?? [])
      expect(dep).not.toContain("/r-aria/")
  })

  it("React Aria build swaps only the primitives and points deps at r-aria", () => {
    const item = built("r", name)
    const aria = built("r-aria", name)
    expect(aria.files.map(f => f.path)).toEqual(item.files.map(f => f.path))
    aria.files.forEach((file, i) => {
      const match = PRIMITIVE.exec(file.path)
      if (!match) return expect(file.content).toBe(item.files[i].content)
      expect(file.content).toBe(
        read(`registry-aria/niko-table/primitives/${match[1]}`),
      )
      expect(file.content).not.toBe(read(file.path))
    })
    for (const dep of aria.registryDependencies ?? [])
      expect(dep).not.toMatch(/^https:\/\/niko-table\.com\/r\//)
    // The React Aria command primitive is shadcn's aria command, not cmdk.
    if (aria.files.some(f => f.path.endsWith("/primitives/command.tsx")))
      expect(aria.registryDependencies).toContain("command")
    expect(aria.dependencies ?? []).not.toContain("cmdk")
    const packages = new Set(
      (aria.dependencies ?? []).map(dep => dep.replace(/(?!^)@.*$/, "")),
    )
    for (const file of aria.files)
      if (PRIMITIVE.test(file.path))
        for (const pkg of npmImports(file.content))
          expect(packages, `${file.path} imports ${pkg}`).toContain(pkg)
  })
})

describe("React Aria namespace index", () => {
  it("is served at /r/aria-*/registry.json with the aria dependencies", () => {
    const rewrites = readRewrites(read("public/_redirects"))
    const target = resolveRequest(rewrites, "/r/aria-nova/registry.json")
    expect(target).toBe("/r-aria/registry.json")
    const index: { items: (BuiltItem & { name: string })[] } = JSON.parse(
      read(`public${target}`),
    )
    expect(index.items.map(item => item.name)).toEqual(
      registry.items.map(item => item.name),
    )
    for (const item of index.items) {
      expect(item.registryDependencies ?? []).toEqual(
        built("r-aria", item.name).registryDependencies ?? [],
      )
    }
  })
})

describe("npmImports", () => {
  it("finds runtime imports and re-exports, one statement at a time", () => {
    const source = [
      'import * as React from "react"',
      'import type { VariantProps } from "class-variance-authority"',
      "import {",
      "  fromDate,",
      "  type CalendarDate,",
      '} from "@internationalized/date/extra"',
      'import { cn } from "@/lib/utils"',
      'export { Command } from "cmdk"',
      "export { Button }",
    ].join("\n")
    expect([...npmImports(source)].sort()).toEqual([
      "@internationalized/date",
      "cmdk",
    ])
  })
})

describe("/r/{style}/{name}.json routing (public/_redirects)", () => {
  const rewrites = readRewrites(read("public/_redirects"))
  const ARIA = ["vega", "nova", "maia", "lyra", "mira", "luma", "rhea", "sera"]

  it.each(ARIA.map(s => `aria-${s}`))("%s gets the React Aria build", style => {
    expect(resolveRequest(rewrites, `/r/${style}/data-table.json`)).toBe(
      "/r-aria/data-table.json",
    )
  })

  it.each(["new-york-v4", "new-york", "default", "radix-nova", "base-nova"])(
    "%s gets the default build",
    style => {
      expect(resolveRequest(rewrites, `/r/${style}/data-table.json`)).toBe(
        "/r/data-table.json",
      )
    },
  )

  it("leaves direct file URLs alone", () => {
    expect(resolveRequest(rewrites, "/r/data-table.json")).toBe(
      "/r/data-table.json",
    )
    expect(resolveRequest(rewrites, "/r-aria/data-table.json")).toBe(
      "/r-aria/data-table.json",
    )
  })
})
