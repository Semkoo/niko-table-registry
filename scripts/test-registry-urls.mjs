#!/usr/bin/env node
/**
 * Registry URL smoke test.
 * Fetches each registry item URL (public/r/*.json except registry.json),
 * checks HTTP 200, valid JSON, and optional shape (name, files).
 * Exit 0 if all pass, 1 if any fail.
 * Base URL: REGISTRY_BASE_URL (default: https://niko-table.com).
 */

import { readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, "..")
const publicR = join(repoRoot, "public", "r")

const baseUrl = (
  process.env.REGISTRY_BASE_URL || "https://niko-table.com"
).replace(/\/$/, "")

function getItemFiles() {
  const files = readdirSync(publicR).filter(
    f => f.endsWith(".json") && f !== "registry.json",
  )
  return files.sort()
}

function validateItemShape(obj) {
  if (typeof obj?.name !== "string") return "missing or invalid 'name'"
  if (!Array.isArray(obj?.files)) return "missing or invalid 'files'"
  return null
}

async function testUrl(filename) {
  const url = `${baseUrl}/r/${filename}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` }
    }
    let data
    try {
      data = await res.json()
    } catch (e) {
      return { ok: false, error: `Invalid JSON: ${e.message}` }
    }
    const shapeError = validateItemShape(data)
    if (shapeError) {
      return { ok: false, error: shapeError }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

async function main() {
  const files = getItemFiles()
  if (files.length === 0) {
    console.error("No registry item files found in public/r/")
    process.exit(1)
  }

  console.log(`Testing ${files.length} registry URLs (base: ${baseUrl})\n`)

  let failed = 0
  for (const file of files) {
    const result = await testUrl(file)
    const status = result.ok ? "PASS" : "FAIL"
    const detail = result.ok ? "" : ` — ${result.error}`
    console.log(`${status}  /r/${file}${detail}`)
    if (!result.ok) failed++
  }

  console.log("")
  if (failed > 0) {
    console.error(`${failed} URL(s) failed.`)
    process.exit(1)
  }
  console.log("All registry URLs passed.")
  process.exit(0)
}

main()
