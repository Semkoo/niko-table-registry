import fs from "node:fs/promises"
import path from "node:path"
import { codeToHtml } from "shiki"

const COMPONENTS_DIR = "./src/components/niko-table"
const DISPLAY_PREFIX = "components/niko-table"
const EXCLUDED_FILES = ["README.md"]

export type ManualInstallationFile = {
  /** Path relative to `src/components/niko-table`, also the JSON endpoint id. */
  id: string
  /** Path as the user should create it in their own project. */
  path: string
  content: string
}

export type ManualInstallationEntry = Omit<ManualInstallationFile, "content">

async function readComponentFiles(
  dir: string,
  baseDir: string,
): Promise<ManualInstallationFile[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: ManualInstallationFile[] = []

  for (const entry of entries) {
    if (EXCLUDED_FILES.includes(entry.name)) {
      continue
    }

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await readComponentFiles(fullPath, baseDir)))
      continue
    }

    if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
    ) {
      const id = path.relative(baseDir, fullPath).replace(/\\/g, "/")
      files.push({
        id,
        path: `${DISPLAY_PREFIX}/${id}`,
        content: await fs.readFile(fullPath, "utf-8"),
      })
    }
  }

  return files
}

export async function getManualInstallationFiles(): Promise<
  ManualInstallationFile[]
> {
  return readComponentFiles(COMPONENTS_DIR, COMPONENTS_DIR)
}

/**
 * Directory tree for the collapsed browser. Deliberately drops `content` — the
 * island receives only this manifest and fetches each file's code on expand,
 * because serializing every file into island props pushed the built page past
 * Cloudflare Pages' 25 MiB per-file limit.
 */
export function groupFilesByDirectory(
  files: ManualInstallationFile[],
): Record<string, ManualInstallationEntry[]> {
  return files.reduce(
    (acc, file) => {
      const dir = path.dirname(file.path)
      acc[dir] ??= []
      acc[dir].push({ id: file.id, path: file.path })
      return acc
    },
    {} as Record<string, ManualInstallationEntry[]>,
  )
}

/** Syntax-highlighted markup with line numbers, in both light and dark themes. */
export async function highlightFile(
  file: Pick<ManualInstallationFile, "path" | "content">,
): Promise<string> {
  const lang = file.path.endsWith(".ts") ? "typescript" : "tsx"
  const lines = file.content.split("\n")

  try {
    const [darkHtml, lightHtml] = await Promise.all([
      codeToHtml(file.content, { lang, theme: "github-dark" }),
      codeToHtml(file.content, { lang, theme: "github-light" }),
    ])

    const extractLines = (html: string) => {
      const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/)
      return match ? match[1].split("\n") : lines
    }

    const darkLines = extractLines(darkHtml)
    const lightLines = extractLines(lightHtml)
    const lnWidth = Math.max(2, String(lines.length).length)

    return `
<div class="expressive-code">
  <figure class="frame not-content" style="--lnWidth: ${lnWidth}ch">
    <pre data-language="tsx"><code>${lines
      .map((line, i) => {
        const lineNum = i + 1
        const darkLine = darkLines[i] || line
        const lightLine = lightLines[i] || line
        return `<div class="ec-line"><div class="gutter"><div class="ln" aria-hidden="true">${lineNum}</div></div><div class="code"><span class="dark-only">${darkLine}</span><span class="light-only">${lightLine}</span></div></div>`
      })
      .join("")}</code></pre>
  </figure>
</div>`
  } catch (error) {
    console.error(`Failed to highlight ${file.path}:`, error)
    return `<pre><code>${file.content}</code></pre>`
  }
}
