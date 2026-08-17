import { Check, ChevronDown, ChevronRight, Copy, Loader2 } from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

type FileEntry = { id: string; path: string }
type FilesByDirectory = Record<string, FileEntry[]>
type LoadedFile = { content: string; html: string }

export function ManualInstallationCodeInternal({
  filesByDirectory,
}: {
  filesByDirectory: FilesByDirectory
}) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [loadedFiles, setLoadedFiles] = useState<Record<string, LoadedFile>>({})
  const [failedFiles, setFailedFiles] = useState<Set<string>>(new Set())
  const [pendingFiles, setPendingFiles] = useState<Set<string>>(new Set())
  const [copiedFile, setCopiedFile] = useState<string | null>(null)

  // Dedupe concurrent requests for the same file (expand + copy can race).
  const inFlight = useRef<Map<string, Promise<LoadedFile>>>(new Map())

  const loadFile = useCallback(
    async (id: string): Promise<LoadedFile | null> => {
      const cached = loadedFiles[id]
      if (cached) return cached

      const existing = inFlight.current.get(id)
      if (existing) return existing

      const request = (async () => {
        const response = await fetch(
          `/manual-install/${id.split("/").map(encodeURIComponent).join("/")}.json`,
        )
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`)
        }
        return (await response.json()) as LoadedFile
      })()

      inFlight.current.set(id, request)
      setPendingFiles(prev => new Set(prev).add(id))

      try {
        const file = await request
        setLoadedFiles(prev => ({ ...prev, [id]: file }))
        setFailedFiles(prev => {
          if (!prev.has(id)) return prev
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        return file
      } catch {
        setFailedFiles(prev => new Set(prev).add(id))
        return null
      } finally {
        inFlight.current.delete(id)
        setPendingFiles(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [loadedFiles],
  )

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

  const toggleFile = (id: string) => {
    const willExpand = !expandedFiles.has(id)

    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

    if (willExpand) {
      void loadFile(id)
    }
  }

  const copyFile = async (id: string) => {
    const file = await loadFile(id)
    if (!file) return

    await navigator.clipboard.writeText(file.content)
    setCopiedFile(id)
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
      <style>{`
        [data-theme="light"] .dark-only { display: none; }
        [data-theme="dark"] .light-only { display: none; }
        :root:not([data-theme]) .light-only { display: none; }
      `}</style>

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
                  const isFileExpanded = expandedFiles.has(file.id)
                  const isCopied = copiedFile === file.id
                  const isPending = pendingFiles.has(file.id)
                  const hasFailed = failedFiles.has(file.id)
                  const loaded = loadedFiles[file.id]
                  const fileName = file.path.split("/").pop()

                  return (
                    <div key={file.id} className="border-b last:border-b-0">
                      <div className="flex items-center gap-2 bg-muted/30 px-4 py-2">
                        <button
                          onClick={() => toggleFile(file.id)}
                          className="flex flex-1 items-center gap-2 text-left transition-colors hover:text-foreground"
                          aria-expanded={isFileExpanded}
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
                          onClick={() => copyFile(file.id)}
                          disabled={isPending}
                          aria-label={`Copy ${fileName}`}
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
                          {loaded ? (
                            <div
                              className="max-h-[600px] overflow-auto"
                              dangerouslySetInnerHTML={{ __html: loaded.html }}
                            />
                          ) : hasFailed ? (
                            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                              <span>Could not load this file.</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void loadFile(file.id)}
                              >
                                Retry
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" />
                              Loading {fileName}…
                            </div>
                          )}
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
