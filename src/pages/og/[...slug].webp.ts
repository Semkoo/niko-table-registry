import type { GetStaticPaths } from "astro"
import { getCollection } from "astro:content"
import { blocks } from "@/data/blocks"
import { generateOpenGraphImage } from "@/lib/generateOpenGraphImage"
import { ogSection } from "@/lib/og-image"

// One share image per docs page and block page; the home page keeps /og.webp.
export const getStaticPaths = (async () => {
  const docs = (await getCollection("docs"))
    .filter(entry => entry.id !== "index")
    .map(entry => ({ slug: entry.id, title: entry.data.title }))
  const pages = [
    ...docs,
    { slug: "blocks", title: "Blocks" },
    ...blocks.map(block => ({
      slug: `blocks/${block.name}`,
      title: block.title,
    })),
  ]
  return pages.map(({ slug, title }) => ({
    params: { slug },
    props: { title },
  }))
}) satisfies GetStaticPaths

export function GET({
  params,
  props,
}: {
  params: { slug: string }
  props: { title: string }
}) {
  return generateOpenGraphImage({
    title: props.title,
    tags: [],
    secondaryText: ogSection(params.slug),
  })
}
