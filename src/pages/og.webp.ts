import { generateOpenGraphImage } from "@/lib/generateOpenGraphImage"
import registry from "../../registry.json"

const componentCount = registry.items.length

export function GET() {
  return generateOpenGraphImage({
    title: "Niko Table - Nobody's table, everyone's solution",
    tags: ["Accessible", "Shadcn Native Feel", "Type Safe"],
    secondaryText: `${componentCount} Components`,
  })
}
