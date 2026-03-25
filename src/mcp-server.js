import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  geocodingTool,
  weatherTool,
  locationTool,
} from "./tools/index.js";

const ALL_TOOLS = [
  geocodingTool,
  weatherTool,
  locationTool,
];

const toolHandlers = Object.fromEntries(
  ALL_TOOLS.map((t) => [t.definition.function.name, t.handler])
);

const mcpToolList = ALL_TOOLS.map((t) => ({
  name: t.definition.function.name,
  description: t.definition.function.description,
  inputSchema: t.definition.function.parameters,
}));

const server = new Server(
  { name: "node-agents-built-in-tools", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: mcpToolList,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = toolHandlers[name];

  if (!handler) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: `未知工具: ${name}` }) }],
      isError: true,
    };
  }

  try {
    const result = await handler(args ?? {});
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: err.message }) }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
