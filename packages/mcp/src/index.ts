#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

const REGISTRY_URL = "https://niko-table.com/r/registry.json"
const BASE_URL = "https://niko-table.com/r"

const server = new Server(
  {
    name: "niko-table-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

// 1. Define the tools available to Claude / LLM
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_components",
        description:
          "Get a list of all available niko-table components from the live registry. It returns object data with component names, type, and descriptions.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_component",
        description:
          "Get the raw TSX component code from the registry. You must run `list_components` to find the correct component name first.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                "The name of the component (e.g., data-table, infinite-scroll-table).",
            },
          },
          required: ["name"],
        },
      },
    ],
  }
})

// 2. Implement the actual behavior for each tool call
server.setRequestHandler(CallToolRequestSchema, async request => {
  if (request.params.name === "list_components") {
    try {
      const response = await fetch(REGISTRY_URL)
      if (!response.ok) {
        throw new Error(`Registry responded with status ${response.status}`)
      }

      const data = (await response.json()) as {
        items: Array<{ name: string; type: string }>
      }
      const components = data.items.map(item => ({
        name: item.name,
        type: item.type,
      }))

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(components, null, 2),
          },
        ],
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return {
        content: [
          {
            type: "text",
            text: `Error fetching from registry: ${errorMessage}`,
          },
        ],
        isError: true,
      }
    }
  }

  if (request.params.name === "get_component") {
    const args = request.params.arguments as Record<string, unknown>
    const name = args.name as string

    try {
      const response = await fetch(`${BASE_URL}/${name}.json`)
      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Could not find component "${name}" inside the Niko Table registry.`,
            },
          ],
          isError: true,
        }
      }

      const compData = (await response.json()) as unknown

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(compData, null, 2),
          },
        ],
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return {
        content: [
          {
            type: "text",
            text: `Error fetching component ${name}: ${errorMessage}`,
          },
        ],
        isError: true,
      }
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`)
})

// 3. Connect to Stdio Transport so the AI Client can communicate
async function run() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("Niko Table MCP Server running on stdio")
}

run().catch(error => {
  console.error("Fatal error running MCP server:", error)
  process.exit(1)
})
