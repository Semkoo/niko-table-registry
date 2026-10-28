import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Check, CodeIcon, Copy, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { TypeScriptIcon } from "./icons/typescript-icon"
import { CSSIcon } from "./icons/css-icon"

type LoadedFile = { content: string; html: string }

// Code is fetched from /manual-install/<fileId>.json on first expand. Inlining
// every file's highlighted source made the installation page ~10 MB of HTML.
export function ManualInstallCodeCard({
  filePath,
  fileId,
}: {
  filePath: string
  fileId: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [file, setFile] = useState<LoadedFile | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "failed">("idle")
  const [copied, setCopied] = useState(false)

  const load = async (): Promise<LoadedFile | null> => {
    if (file) return file
    setStatus("loading")
    try {
      const response = await fetch(
        `/manual-install/${fileId.split("/").map(encodeURIComponent).join("/")}.json`,
      )
      if (!response.ok)
        throw new Error(`Request failed with ${response.status}`)
      const loaded = (await response.json()) as LoadedFile
      setFile(loaded)
      setStatus("idle")
      return loaded
    } catch {
      setStatus("failed")
      return null
    }
  }

  const copy = async () => {
    const loaded = await load()
    if (!loaded) return
    await navigator.clipboard.writeText(loaded.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggle = () => {
    if (!isExpanded && status !== "loading") void load()
    setIsExpanded(e => !e)
  }

  return (
    <Card className="not-content overflow-hidden bg-code p-0">
      <CardContent className="p-0">
        <div className="flex items-center border-b border-input px-3 py-1">
          <Icon
            filePath={filePath}
            className="mr-2 size-4 text-muted-foreground"
          />
          <div className="font-mono text-muted-foreground">{filePath}</div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto size-8 p-0 text-muted-foreground"
            onClick={() => void copy()}
            disabled={status === "loading"}
            aria-label={`Copy ${filePath}`}
          >
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={toggle}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
        {isExpanded &&
          (file != null ? (
            <div
              className="max-h-[600px] overflow-auto"
              dangerouslySetInnerHTML={{ __html: file.html }}
            />
          ) : status === "failed" ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <span>Could not load this file.</span>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ))}
      </CardContent>
    </Card>
  )
}

type IconProps = React.ComponentProps<"svg"> & { filePath: string }
function Icon({ filePath, ...props }: IconProps) {
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
    return <TypeScriptIcon {...props} />
  }

  if (filePath.endsWith(".css")) {
    return <CSSIcon {...props} />
  }

  return <CodeIcon {...props} />
}

export default Icon
