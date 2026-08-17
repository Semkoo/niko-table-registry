import type { APIRoute } from "astro"

import {
  getManualInstallationFiles,
  highlightFile,
  type ManualInstallationFile,
} from "@/lib/manual-installation-files"

export async function getStaticPaths() {
  const files = await getManualInstallationFiles()

  return files.map(file => ({
    params: { file: file.id },
    props: { file },
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const { file } = props as { file: ManualInstallationFile }

  return new Response(
    JSON.stringify({
      path: file.path,
      content: file.content,
      html: await highlightFile(file),
    }),
    { headers: { "Content-Type": "application/json" } },
  )
}
