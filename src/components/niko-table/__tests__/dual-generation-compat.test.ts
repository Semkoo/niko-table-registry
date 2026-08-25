/**
 * Guards the promise on the docs landing page: every registry item installs
 * and WORKS under both shadcn generations — Radix (`new-york`) and Base UI
 * (`base-nova`).
 *
 * One source tree serves both. The shadcn CLI codemods a small set of Radix
 * idioms at install time (`asChild` → `render`), but only that set — so any
 * OTHER Radix-only spelling is copied through verbatim into a Base UI project
 * and breaks there. The rest of the suite renders against Radix only, so it
 * cannot see those breaks.
 *
 * These are source-level assertions rather than render tests on purpose: the
 * failure mode is silent (a handler that type-checks, attaches, and never
 * fires), so the only reliable place to catch it is the spelling itself.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = join(__dirname, "..")

/** Every .ts/.tsx file shipped as part of niko-table. */
function sourceFiles(dir: string = ROOT): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      return entry === "__tests__" ? [] : sourceFiles(full)
    }
    return /\.tsx?$/.test(entry) ? [full] : []
  })
}

const FILES = sourceFiles().map(path => ({
  path: path.slice(ROOT.length + 1),
  text: readFileSync(path, "utf8"),
}))

/**
 * The JSX element an attribute sits inside, found by walking back to the
 * nearest opening tag. Good enough for this codebase's formatting, where an
 * element's props each occupy their own line under a `<Tag` line.
 */
function owningTag(lines: string[], index: number): string | null {
  for (let i = index; i >= 0 && i > index - 25; i--) {
    const tags = lines[i]!.match(/<([A-Za-z][A-Za-z0-9_.]*)/g)
    if (tags?.length) return tags[tags.length - 1]!.slice(1)
  }
  return null
}

const MENU_ITEM = /^(DropdownMenu|ContextMenu|Menubar).*(Item)$/

describe("dual-generation (Radix + Base UI) compatibility", () => {
  it("finds the niko-table source", () => {
    expect(FILES.length).toBeGreaterThan(20)
  })

  /**
   * Base UI's `Menu.Item` exposes `onClick` and has NO `onSelect`. Because
   * `onSelect` is a real `<div>` DOM prop in React (the text-selection event),
   * Base UI spreads it onto the element: it type-checks, attaches a listener,
   * and never fires on click. The CLI does not codemod it.
   *
   * `onClick` is the portable spelling — Radix's MenuItem dispatches a real
   * `.click()` on pointer-up and on keyboard SELECTION_KEYS.
   *
   * `onSelect` on Calendar / CommandItem is unrelated and stays: those are
   * react-day-picker and cmdk APIs, identical in both generations.
   */
  it("never puts onSelect on a menu item (Base UI has no such prop)", () => {
    const violations: string[] = []
    for (const { path, text } of FILES) {
      const lines = text.split("\n")
      lines.forEach((line, i) => {
        if (!line.includes("onSelect=")) return
        const tag = owningTag(lines, i)
        if (tag && MENU_ITEM.test(tag)) {
          violations.push(`${path}:${i + 1} <${tag} onSelect=…>  — use onClick`)
        }
      })
    }
    expect(violations).toEqual([])
  })

  /**
   * Radix and Base UI expose positioning through differently-named CSS
   * variables, and the CLI does not rewrite them. A fallback chain satisfies
   * both: Radix defines the first name, Base UI leaves it undefined and the
   * fallback applies.
   */
  it("always pairs a --radix-* variable with its Base UI fallback", () => {
    const violations: string[] = []
    for (const { path, text } of FILES) {
      text.split("\n").forEach((line, i) => {
        for (const match of line.matchAll(
          /var\(\s*(--radix-[a-z-]+)\s*([,)])/g,
        )) {
          if (match[2] === ")") {
            violations.push(
              `${path}:${i + 1} var(${match[1]}) — needs a Base UI fallback`,
            )
          }
        }
        // A bare `--radix-*` outside var() (e.g. Tailwind's `origin-(--x)`
        // shorthand) cannot express a fallback at all.
        for (const match of line.matchAll(
          /(?<!var\(\s*)-\(\s*(--radix-[a-z-]+)\s*\)/g,
        )) {
          violations.push(
            `${path}:${i + 1} ${match[1]} in shorthand — use var(…, var(…))`,
          )
        }
      })
    }
    expect(violations).toEqual([])
  })

  /** niko-table renders through the consumer's shadcn wrappers, never a primitive directly. */
  it("never imports a primitive package directly", () => {
    const violations = FILES.filter(
      f =>
        /from\s+["']@radix-ui\//.test(f.text) ||
        /from\s+["']@base-ui\//.test(f.text),
    ).map(f => f.path)
    expect(violations).toEqual([])
  })
})
