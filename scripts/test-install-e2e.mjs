#!/usr/bin/env node
/**
 * Install e2e test: creates a temporary Next + shadcn project, runs the
 * documented install step (shadcn add data-table with the live registry URL),
 * and verifies that the registry JSON is consumable by the CLI (expected files
 * are created). Does not run a full app build (that would require installing
 * many add-on registry items and handling overwrite prompts).
 * Base URL: REGISTRY_BASE_URL (default: https://niko-table.com).
 */

import {
  mkdtempSync,
  rmSync,
  readdirSync,
  cpSync,
  readFileSync,
  existsSync,
} from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"
import os from "os"

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtureDir = join(__dirname, "fixtures")
const nextFixture = join(fixtureDir, "next-shadcn")

const baseUrl = (
  process.env.REGISTRY_BASE_URL || "https://niko-table.com"
).replace(/\/$/, "")
const dataTableUrl = `${baseUrl}/r/data-table.json`

let tempDir

function run(cmd, opts = {}) {
  execSync(cmd, {
    cwd: tempDir,
    stdio: "inherit",
    ...opts,
  })
}

// Key files that must exist after `shadcn add data-table.json`
const REQUIRED_FILES = [
  "src/components/ui/table.tsx",
  "src/components/niko-table/core/data-table.tsx",
  "src/components/niko-table/core/data-table-root.tsx",
  "src/components/niko-table/core/index.tsx",
  "src/components/niko-table/types/index.ts",
]

async function main() {
  console.log("Install E2E: creating temp project...\n")

  tempDir = mkdtempSync(join(os.tmpdir(), "niko-table-install-test-"))

  try {
    for (const name of readdirSync(nextFixture)) {
      cpSync(join(nextFixture, name), join(tempDir, name), { recursive: true })
    }

    console.log("Running pnpm install...")
    run("pnpm install")

    console.log(
      "Adding shadcn base components (skeleton, alert, button, dropdown-menu)...",
    )
    run("pnpm dlx shadcn@latest add skeleton alert button dropdown-menu --yes")

    console.log(`Adding data-table from registry: ${dataTableUrl}`)
    run(`echo y | pnpm dlx shadcn@latest add "${dataTableUrl}" --yes`, {
      shell: true,
    })

    console.log("Verifying expected files were created...")
    const missing = REQUIRED_FILES.filter(f => !existsSync(join(tempDir, f)))
    if (missing.length > 0) {
      throw new Error(
        `Missing expected files:\n${missing.map(f => `  - ${f}`).join("\n")}`,
      )
    }

    console.log("Verifying table.tsx has TableComponent export...")
    const tableContent = readFileSync(
      join(tempDir, "src", "components", "ui", "table.tsx"),
      "utf8",
    )
    if (!tableContent.includes("TableComponent")) {
      throw new Error(
        "table.tsx is missing the TableComponent export — the registry's modified version was not installed correctly.",
      )
    }

    console.log(
      "\nInstall E2E: registry URL is consumable by the CLI; all expected files present.",
    )
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
    console.log("Cleaned up temp dir.")
  }
}

main().catch(err => {
  console.error(err)
  if (tempDir) {
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {
      /* best-effort cleanup */
    }
  }
  process.exit(1)
})
