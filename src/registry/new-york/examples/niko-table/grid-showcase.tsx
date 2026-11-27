import { GridAllFeatures } from "./grid-all-features"

/** Home page showcase: the composed grid without the docs-only state card. */
export function GridShowcase() {
  return <GridAllFeatures showStatePanel={false} />
}
