import { useEffect, useRef } from "react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { NuqsAdapter } from "nuqs/adapters/react"
import {
  ExternalLinkIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"

const TABS = ["preview", "code"] as const
const VIEWPORTS = ["desktop", "tablet", "mobile"] as const
type Tab = (typeof TABS)[number]
type Viewport = (typeof VIEWPORTS)[number]

/**
 * Toolbar for a block page. It only flips `data-state` (preview | code) and
 * `data-viewport` on the surrounding `[data-block-preview]`; the iframe and the
 * SSR'd code are siblings styled by those attributes in block-page.astro.
 */
export function BlockToolbar({ viewHref }: { viewHref: string }) {
  // Each Astro island is its own React root, so it carries its own adapter.
  return (
    <NuqsAdapter>
      <BlockToolbarInner viewHref={viewHref} />
    </NuqsAdapter>
  )
}

// The tab and width live in the URL (?view=code&width=mobile) so a refresh keeps them.
function BlockToolbarInner({ viewHref }: { viewHref: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useQueryState(
    "view",
    parseAsStringLiteral(TABS).withDefault("preview"),
  )
  const [viewport, setViewport] = useQueryState(
    "width",
    parseAsStringLiteral(VIEWPORTS).withDefault("desktop"),
  )

  useEffect(() => {
    const frame = rootRef.current?.closest("[data-block-preview]")
    frame?.setAttribute("data-state", tab)
    frame?.setAttribute("data-viewport", viewport)
  }, [tab, viewport])

  return (
    // Tabs, width toggles and the link all use the default 36px (h-9) height.
    <div ref={rootRef} className="flex flex-wrap items-center gap-2">
      <Tabs value={tab} onValueChange={value => setTab(value as Tab)}>
        <TabsList className="nt-switch">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="ml-auto flex items-center gap-2">
        {tab === "preview" && (
          <ToggleGroup
            type="single"
            variant="outline"
            value={viewport}
            onValueChange={value => value && setViewport(value as Viewport)}
            aria-label="Preview width"
          >
            <ToggleGroupItem value="desktop" aria-label="Desktop width">
              <MonitorIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet width">
              <TabletIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Mobile width">
              <SmartphoneIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        {/* mt-0!: Starlight's article spacing adds margin-top to a following sibling. */}
        <Button variant="outline" className="mt-0!" asChild>
          <a href={viewHref} target="_blank" rel="noreferrer">
            <ExternalLinkIcon aria-hidden="true" />
            Open in new tab
          </a>
        </Button>
      </div>
    </div>
  )
}
