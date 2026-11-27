import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { CheckIcon, ClipboardIcon, TerminalIcon, XIcon } from "lucide-react"
import { useState } from "react"

export function CliCommandCodeInternal({
  commands,
}: {
  commands: {
    label: string
    code: string
  }[]
}) {
  const [selectedTab, setSelectedTab] = useLocalStorage(
    "cli-method",
    commands[0].label,
  )
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  )

  function handleCopy() {
    const command = commands.find(cmd => cmd.label === selectedTab)
    if (command) {
      navigator.clipboard
        .writeText(command.code)
        .then(() => setCopyState("copied"))
        .catch(() => setCopyState("error"))
        .finally(() => setTimeout(() => setCopyState("idle"), 2000))
    }
  }

  return (
    <Card className="not-content bg-code p-0">
      <CardContent className="p-0">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="gap-0"
        >
          <div className="flex items-center border-b border-input px-3 py-1">
            <div className="mr-2 flex size-4 items-center justify-center bg-foreground/70">
              <TerminalIcon className="size-3 text-code" />
            </div>
            <TabsList className="font-mono">
              {commands.map((command, index) => (
                <TabsTrigger
                  key={index}
                  value={command.label}
                  className="data-[state=active]:border-input data-[state=active]:bg-muted/50"
                >
                  {command.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <Tooltip open={copyState !== "idle"}>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  className="ml-auto size-8 text-muted-foreground"
                >
                  {copyState === "idle" ? (
                    <ClipboardIcon />
                  ) : copyState === "copied" ? (
                    <CheckIcon />
                  ) : (
                    <XIcon className="text-destructive" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {copyState === "error" ? "Error!" : "Copied"}
              </TooltipContent>
            </Tooltip>
          </div>
          <div>
            {commands.map(command => (
              <TabsContent
                key={command.label}
                value={command.label}
                className="py-3.5 text-muted-foreground"
              >
                {/* Long multi-item commands wrap at spaces instead of running off
                    the edge; copy still copies the one-line command. */}
                <pre className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                  <code className="block px-4">
                    {command.code.split(" ").map((part, i) => (
                      // Each argument is one chunk, so lines break between
                      // items, never inside a name like @niko-table/data-table.
                      <span key={i}>
                        {i > 0 ? " " : null}
                        <span className="inline-block max-w-full">{part}</span>
                      </span>
                    ))}
                  </code>
                </pre>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
