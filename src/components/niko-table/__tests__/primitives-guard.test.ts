/**
 * Guards the primitives rule. Niko Table imports the shadcn components whose
 * React Aria version has a different shape only through
 * `components/niko-table/primitives/<name>`, so a base swaps those files and
 * nothing else (see registry-aria/README.md). Two ways to break it, both
 * silent in this Radix repo:
 *
 * - a direct `@/components/ui/<name>` import: fine on Radix / Base UI, broken
 *   on React Aria;
 * - a registry item whose files import a primitives file it does not ship:
 *   an unresolved import after `shadcn add` on every base.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import registry from "../../../../registry.json"

const REPO = join(__dirname, "../../../..")

const PRIMITIVES = [
  "button",
  "calendar",
  "checkbox",
  "command",
  "context-menu",
  "dialog",
  "dropdown-menu",
  "popover",
  "select",
  "sheet",
  "slider",
  "tooltip",
]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      return entry === "__tests__" || entry === "primitives"
        ? []
        : sourceFiles(full)
    }
    return /\.tsx?$/.test(entry) ? [full] : []
  })
}

/** Primitive names a source text imports from niko-table/primitives. */
function importedPrimitives(text: string): Set<string> {
  const names = new Set<string>()
  for (const [, name] of text.matchAll(
    /from "@\/components\/niko-table\/primitives\/([a-z-]+)"/g,
  ))
    names.add(name)
  return names
}

describe("niko-table primitives", () => {
  it("every primitive-covered component is imported through primitives/", () => {
    const direct = new RegExp(
      `from "@/components/ui/(${PRIMITIVES.join("|")})"`,
    )
    const offenders = [
      ...sourceFiles(join(REPO, "src/components/niko-table")),
      ...sourceFiles(join(REPO, "src/registry/new-york/blocks")),
    ]
      .filter(path => direct.test(readFileSync(path, "utf8")))
      .map(path => path.slice(REPO.length + 1))
    expect(offenders).toEqual([])
  })

  it("a primitives file exists for every covered component", () => {
    for (const name of PRIMITIVES) {
      const path = join(
        REPO,
        `src/components/niko-table/primitives/${name}.tsx`,
      )
      expect(statSync(path).isFile(), path).toBe(true)
    }
  })

  it.each(registry.items.map(item => [item.name, item] as const))(
    "%s ships exactly the primitives its files import",
    (_name, item) => {
      const listed = new Set<string>()
      const imported = new Set<string>()
      for (const file of item.files) {
        const primitive = /niko-table\/primitives\/([a-z-]+)\.tsx$/.exec(
          file.path,
        )
        if (primitive) {
          listed.add(primitive[1])
          continue
        }
        const text = readFileSync(join(REPO, file.path), "utf8")
        for (const name of importedPrimitives(text)) imported.add(name)
      }
      expect([...listed].sort()).toEqual([...imported].sort())
    },
  )
})
