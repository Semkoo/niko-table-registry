import { useEffect, useRef, useState } from "react"
import {
  CodeIcon,
  ExternalLinkIcon,
  EyeIcon,
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
    <div ref={rootRef} className="flex flex-wrap items-center gap-2">
      <Tabs value={tab} onValueChange={value => setTab(value as Tab)}>
        <TabsList>
          <TabsTrigger value="preview" className="px-3">
            <EyeIcon aria-hidden="true" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" className="px-3">
            <CodeIcon aria-hidden="true" />
            Code
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="ml-auto flex items-center gap-2">
        {tab === "preview" && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
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
        <Button variant="outline" size="sm" asChild>
          <a href={viewHref} target="_blank" rel="noreferrer">
            <ExternalLinkIcon aria-hidden="true" />
            Open in new tab
          </a>
        </Button>
      </div>
    </div>
  )
}
