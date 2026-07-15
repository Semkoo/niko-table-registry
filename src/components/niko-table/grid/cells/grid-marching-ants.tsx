"use client"

/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */
/**
 * The "marching ants" copy outline for the copied cell — a self-contained,
 * animated SVG overlay (no global CSS / keyframes). Pinned to a `relative`
 * parent and non-interactive so it never blocks clicks on the cell beneath.
 */
export function GridMarchingAnts() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[6] size-full overflow-visible text-primary"
    >
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-8"
          dur="0.5s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  )
}
