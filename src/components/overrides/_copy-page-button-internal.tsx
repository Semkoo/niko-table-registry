import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getPromptUrl(baseURL: string, pageUrl: string) {
  return `${baseURL}?q=${encodeURIComponent(
    `I'm looking at this Niko Table documentation: ${pageUrl}.\nHelp me understand how to use it. Be ready to explain concepts, give examples, or help debug based on it.`,
  )}`
}

function MarkdownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M14.85 3c.63 0 1.15.52 1.14 1.15v7.7c0 .63-.51 1.15-1.15 1.15H1.15C.52 13 0 12.48 0 11.84V4.15C0 3.52.52 3 1.15 3ZM9 11V5H7l-1.5 2.5L4 5H2v6h2V8l1.5 2L7 8v3Zm2.99.5L14.5 8H13V5h-2v3H9.5Z" />
    </svg>
  )
}

function V0Icon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M23.3919 0H32.9188C36.7819 0 39.9136 3.13165 39.9136 6.99475V16.0805H36.0006V6.99475C36.0006 6.90167 35.9969 6.80925 35.9898 6.71766L26.4628 16.079C26.4949 16.08 26.5272 16.0805 26.5595 16.0805H36.0006V19.7762H26.5595C22.6964 19.7762 19.4788 16.6139 19.4788 12.7508V3.68923H23.3919V12.7508C23.3919 12.9253 23.4054 13.0977 23.4316 13.2668L33.1682 3.6995C33.0861 3.6927 33.003 3.68923 32.9188 3.68923H23.3919V0Z"
        fill="currentColor"
      />
      <path
        d="M13.7688 19.0956L0 3.68759H5.53933L13.6231 12.7337V3.68759H17.7535V17.5746C17.7535 19.6705 15.1654 20.6584 13.7688 19.0956Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ChatGPTIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  )
}

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.709 15.955l4.71-2.72-4.71-2.72 2.338-1.35 4.71 2.72-4.71 2.72zm6.582-3.8l4.71-2.72-4.71-2.72 2.338-1.35 7.048 4.07-7.048 4.07z" />
    </svg>
  )
}

function SciraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  )
}

export function CopyPageButtonInternal({
  rawMarkdown,
  pageUrl,
}: {
  rawMarkdown: string
  pageUrl: string
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  return (
    <div className="flex shrink-0 items-center">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-r-none shadow-none"
        onClick={() => copyToClipboard(rawMarkdown)}
      >
        {isCopied ? (
          <CheckIcon className="size-3.5" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
        Copy Page
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-l-none border-l-0 px-2 shadow-none"
          >
            <ChevronDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => copyToClipboard(rawMarkdown)}>
            <MarkdownIcon className="size-4" />
            View as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getPromptUrl("https://v0.dev/chat", pageUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <V0Icon className="size-4" />
              Open in v0
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getPromptUrl("https://chatgpt.com", pageUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ChatGPTIcon className="size-4" />
              Open in ChatGPT
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getPromptUrl("https://claude.ai/new", pageUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ClaudeIcon className="size-4" />
              Open in Claude
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getPromptUrl("https://scira.ai", pageUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SciraIcon className="size-4" />
              Open in Scira
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
