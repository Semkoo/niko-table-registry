import { useEffect, useRef, useState } from "react"
import {
  ExternalLinkIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"

type Tab = "preview" | "code"
type Viewport = "desktop" | "tablet" | "mobile"

/**
 * Toolbar for a block page. It only flips `data-state` (preview | code) and
 * `data-viewport` on the surrounding `[data-block-preview]`; the iframe and the
 * SSR'd code are siblings styled by those attributes in block-page.astro.
 */
export function BlockToolbar({ viewHref }: { viewHref: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<Tab>("preview")
  const [viewport, setViewport] = useState<Viewport>("desktop")

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
