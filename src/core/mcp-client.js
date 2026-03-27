import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import chalk from "chalk";

/**
 * MCP 客户端管理器：连接多个 MCP Server，聚合所有工具，
 * 对外提供 OpenAI function calling 格式的工具列表和统一调用入口。
 */
export class McpClientManager {
  constructor() {
    this.servers = new Map();
    this.toolToServer = new Map();
  }

  async loadConfig(configPath) {
    const raw = await readFile(configPath, "utf-8");
    return JSON.parse(raw);
  }

  async connectAll(configPath) {
    const configFile = resolve(configPath || "mcp.config.json");
    this._configDir = dirname(configFile);
    const config = await this.loadConfig(configFile);
    const serverEntries = Object.entries(config.mcpServers || {});

    const results = await Promise.allSettled(
      serverEntries.map(([name, cfg]) => this.connectServer(name, cfg))
    );

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === "rejected") {
        console.error(
          chalk.red(`  ✗ MCP Server [${serverEntries[i][0]}] 连接失败: ${results[i].reason?.message}`)
        );
      }
    }
  }

  async connectServer(name, config) {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...process.env, ...(config.env || {}) },
      cwd: config.cwd,
    });

    const client = new Client(
      { name: `agent-client-${name}`, version: "1.0.0" }
    );

    await client.connect(transport);

    const { tools } = await client.listTools();
    const toolNames = [];

    for (const tool of tools) {
      if (this.toolToServer.has(tool.name)) {
        console.warn(
          chalk.yellow(`  ⚠ 工具 [${tool.name}] 已被 [${this.toolToServer.get(tool.name)}] 注册，跳过 [${name}] 中的同名工具`)
        );
        continue;
      }
      this.toolToServer.set(tool.name, name);
      toolNames.push(tool.name);
    }

    let instructions = "";
    if (config.instructions) {
      try {
        const instrPath = resolve(this._configDir || ".", config.instructions);
        instructions = await readFile(instrPath, "utf-8");
      } catch (err) {
        console.warn(
          chalk.yellow(`  ⚠ MCP Server [${name}] 的 instructions 文件加载失败: ${err.message}`)
        );
      }
    }

    this.servers.set(name, { client, transport, tools, config, instructions });
    console.log(
      chalk.dim(`  ✓ MCP Server [${name}] 已连接，提供 ${toolNames.length} 个工具: ${toolNames.join(", ")}`)
    );
  }

  getOpenAIToolDefinitions() {
    const definitions = [];
    for (const [, { tools }] of this.servers) {
      for (const tool of tools) {
        if (this.toolToServer.get(tool.name) === undefined) continue;
        definitions.push({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.inputSchema || { type: "object", properties: {} },
          },
        });
      }
    }
    return definitions;
  }

  async callTool(name, args) {
    const serverName = this.toolToServer.get(name);
    if (!serverName) {
      throw new Error(`未知工具: ${name}（未在任何 MCP Server 中注册）`);
    }

    const { client } = this.servers.get(serverName);
    const result = await client.callTool({ name, arguments: args });

    const textParts = (result.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text);

    const combined = textParts.join("\n");

    try {
      return JSON.parse(combined);
    } catch {
      return combined;
    }
  }

  getServerInstructions() {
    const parts = [];
    for (const [name, { instructions }] of this.servers) {
      if (instructions) {
        parts.push(instructions.trim());
      }
    }
    return parts.length > 0 ? "\n\n工具使用策略：\n" + parts.join("\n\n") : "";
  }

  async close() {
    const closeOps = [];
    for (const [name, { client }] of this.servers) {
      closeOps.push(
        client.close().catch((err) => {
          console.error(chalk.dim(`  关闭 MCP Server [${name}] 时出错: ${err.message}`));
        })
      );
    }
    await Promise.allSettled(closeOps);
    this.servers.clear();
    this.toolToServer.clear();
  }
}
