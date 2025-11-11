import { useState } from "react"
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type FilesByDirectory = Record<string, Array<{ path: string; content: string }>>

export function ManualInstallationCodeInternal({
  filesByDirectory,
  highlightedCode,
}: {
  filesByDirectory: FilesByDirectory
  highlightedCode: Record<string, string>
}) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [copiedFile, setCopiedFile] = useState<string | null>(null)

  const toggleDirectory = (dir: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dir)) {
        next.delete(dir)
      } else {
        next.add(dir)
      }
      return next
    })
  }

  const toggleFile = (filePath: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(filePath)) {
        next.delete(filePath)
      } else {
        next.add(filePath)
      }
      return next
    })
  }

  const copyFile = async (filePath: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedFile(filePath)
    setTimeout(() => setCopiedFile(null), 2000)
  }

  const sortedDirs = Object.keys(filesByDirectory).sort((a, b) => {
    // Sort lib first, then data-table directories
    if (a.startsWith("lib")) return -1
    if (b.startsWith("lib")) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="not-content space-y-4">
      {sortedDirs.map(dir => {
        const files = filesByDirectory[dir]
        const isExpanded = expandedDirs.has(dir)

        return (
          <div key={dir} className="rounded-lg border">
            <button
              onClick={() => toggleDirectory(dir)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left font-medium transition-colors hover:bg-muted/50"
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              <span className="font-mono text-sm">{dir}/</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {files.length} {files.length === 1 ? "file" : "files"}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t">
                {files.map(file => {
                  const isFileExpanded = expandedFiles.has(file.path)
                  const isCopied = copiedFile === file.path
                  const fileName = file.path.split("/").pop()

                  return (
                    <div key={file.path} className="border-b last:border-b-0">
                      <div className="flex items-center gap-2 bg-muted/30 px-4 py-2">
                        <button
                          onClick={() => toggleFile(file.path)}
                          className="flex flex-1 items-center gap-2 text-left transition-colors hover:text-foreground"
                        >
                          {isFileExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                          <span className="font-mono text-sm">{fileName}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyFile(file.path, file.content)}
                          className="size-8 p-0"
                        >
                          {isCopied ? (
                            <Check className="size-4 text-green-500" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>

                      {isFileExpanded && (
                        <>
                          <style>{`
                            [data-theme="light"] .dark-only { display: none; }
                            [data-theme="dark"] .light-only { display: none; }
                            :root:not([data-theme]) .light-only { display: none; }
                          `}</style>
                          <div
                            className="max-h-[600px] overflow-auto"
                            dangerouslySetInnerHTML={{
                              __html: highlightedCode[file.path] || "",
                            }}
                          />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
