#!/usr/bin/env node
/**
 * Generate CHANGELOG.md from git history using Conventional Commits.
 * Uses the conventional-changelog package (not the deprecated CLI).
 * Output: src/components/niko-table/CHANGELOG.md
 */

import { createWriteStream } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { ConventionalChangelog } from "conventional-changelog"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, "..")
const changelogPath = join(
  repoRoot,
  "src",
  "components",
  "niko-table",
  "CHANGELOG.md",
)

const generator = new ConventionalChangelog(repoRoot)
  .readPackage()
  .loadPreset("conventionalcommits")
  .options({ releaseCount: 0 })

const writeStream = createWriteStream(changelogPath, { encoding: "utf8" })
generator
  .writeStream()
  .pipe(writeStream)
  .on("finish", () => {
    console.log("Changelog written to", changelogPath)
  })
  .on("error", err => {
    console.error("Changelog generation failed:", err)
    process.exit(1)
  })
