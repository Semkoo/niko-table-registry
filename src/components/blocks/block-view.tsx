import { lazy, Suspense, type ComponentType } from "react"
import { Loader2Icon } from "lucide-react"
import type { BlockName } from "@/data/blocks"

const modules = import.meta.glob<{ default: ComponentType }>(
  "../../registry/new-york/blocks/*/*.tsx",
)

const components = new Map<string, ComponentType>()

function getBlock(name: BlockName) {
  let Component = components.get(name)
  if (!Component) {
    const load = modules[`../../registry/new-york/blocks/${name}/${name}.tsx`]
    if (!load) throw new Error(`No block file for "${name}"`)
    Component = lazy(load)
    components.set(name, Component)
  }
  return Component
}

/** Renders one block by name. Used by the bare /view/<name>/ page. */
export function BlockView({ name }: { name: BlockName }) {
  const Block = getBlock(name)
  return (
    <Suspense
      fallback={
        <div className="flex min-h-96 items-center justify-center">
          <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
        </div>
      }
    >
      {/* eslint-disable-next-line react-hooks/static-components -- cached per name in getBlock */}
      <Block />
    </Suspense>
  )
}
