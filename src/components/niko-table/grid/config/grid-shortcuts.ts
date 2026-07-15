"use client"

/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */

/**
 * niko-table grid — keyboard shortcut METADATA (a discoverable reference).
 *
 * The grid's actual keyboard is a raw scoped `keydown` state machine (the right
 * tool for an input surface — nav, type-to-edit, etc. aren't "hotkeys"). This
 * list is the human-readable mirror of it, for a help dialog or a consumer's own
 * shortcut UI. Keep it in sync with `<DataGrid>`'s handler when shortcuts change.
 */

import * as React from "react"

export interface GridShortcut {
  /** Key tokens. "Mod" renders as ⌘ on macOS, Ctrl elsewhere. */
  keys: string[]
  description: string
}

export interface GridShortcutGroup {
  category: string
  shortcuts: GridShortcut[]
}

export const GRID_SHORTCUTS: GridShortcutGroup[] = [
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["↑", "↓", "←", "→"], description: "Move between cells" },
      { keys: ["Tab"], description: "Next cell (appends a row off the end)" },
      { keys: ["Shift", "Tab"], description: "Previous cell" },
      { keys: ["Mod", "↑↓←→"], description: "Jump to the edge of the data" },
      { keys: ["Home"], description: "First column (⌘/Ctrl: first cell)" },
      { keys: ["End"], description: "Last column (⌘/Ctrl: last cell)" },
      { keys: ["PageUp"], description: "Up one page" },
      { keys: ["PageDown"], description: "Down one page" },
    ],
  },
  {
    category: "Editing",
    shortcuts: [
      {
        keys: ["Enter"],
        description: "Edit the cell, or commit and move down",
      },
      { keys: ["Type"], description: "Overwrite the cell" },
      { keys: ["Delete"], description: "Clear the selected cells" },
      {
        keys: ["Drag ⤡"],
        description: "Fill handle — drag to fill down/across",
      },
      { keys: ["Double-click ⤡"], description: "Fill handle — auto-fill down" },
      { keys: ["Esc"], description: "Cancel edit / clear copy marker" },
    ],
  },
  {
    category: "Selection",
    shortcuts: [
      { keys: ["Drag"], description: "Select a range" },
      {
        keys: ["Drag border"],
        description: "Move the selection (hold ⌘/Ctrl to copy)",
      },
      { keys: ["Shift", "Click"], description: "Extend selection to a cell" },
      { keys: ["Shift", "↑↓←→"], description: "Extend selection" },
      {
        keys: ["Mod", "Shift", "↑↓←→"],
        description: "Extend to the data edge",
      },
      { keys: ["Mod", "A"], description: "Select all cells" },
    ],
  },
  {
    category: "Clipboard",
    shortcuts: [
      { keys: ["Mod", "C"], description: "Copy" },
      { keys: ["Mod", "X"], description: "Cut" },
      { keys: ["Mod", "V"], description: "Paste" },
    ],
  },
  {
    category: "History",
    shortcuts: [
      { keys: ["Mod", "Z"], description: "Undo" },
      { keys: ["Mod", "Shift", "Z"], description: "Redo" },
    ],
  },
]

const subscribeToNothing = () => () => {}

function readIsMac(): boolean {
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string }
  }
  const platform = nav.userAgentData?.platform ?? nav.platform ?? nav.userAgent
  return /Mac|iPhone|iPad|iPod/i.test(platform)
}

/**
 * True on macOS (⌘) vs Ctrl platforms. Hydration-safe: the server snapshot is
 * `false` and the client value resolves right after hydration, so SSR'd "Ctrl"
 * markup never mismatches a "⌘" client render.
 */
export function useIsMac(): boolean {
  return React.useSyncExternalStore(subscribeToNothing, readIsMac, () => false)
}

/** Render a key token to its display label for the current platform. */
export function formatShortcutKey(token: string, isMac: boolean): string {
  switch (token) {
    case "Mod":
      return isMac ? "⌘" : "Ctrl"
    case "Shift":
      return isMac ? "⇧" : "Shift"
    case "Enter":
      return isMac ? "⏎" : "Enter"
    case "Esc":
      return "Esc"
    default:
      return token
  }
}
