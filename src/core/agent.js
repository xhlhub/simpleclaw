import { chat } from "./llm.js";
import chalk from "chalk";

const MAX_ITERATIONS = 30;

/**
 * 创建一个 Agent 配置（MCP 版本）。
 * tools 不再直接传入，而是通过 McpClientManager 动态获取。
 */
export function defineAgent({ name, description, systemPrompt }) {
  return { name, description, systemPrompt };
}

/**
 * 创建一个带对话记忆的 Agent 会话。
 * mcpManager 负责提供工具列表和执行工具调用。
 * system prompt = agent 自身的通用 prompt + 各 MCP server 的 instructions
 */
export function createSession(agent, mcpManager) {
  const serverInstructions = mcpManager.getServerInstructions();
  const fullSystemPrompt = agent.systemPrompt + serverInstructions;
  const messages = [{ role: "system", content: fullSystemPrompt }];

  function reset() {
    messages.length = 0;
    messages.push({ role: "system", content: fullSystemPrompt });
  }

  async function run(userMessage) {
    messages.push({ role: "user", content: userMessage });

    const toolDefinitions = mcpManager.getOpenAIToolDefinitions();

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const choice = await chat(messages, toolDefinitions);

      if (choice.finish_reason === "stop" || !choice.message.tool_calls?.length) {
        messages.push(choice.message);
        return choice.message.content;
      }

      messages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        console.log(chalk.dim(`  🔧 调用工具: ${fnName}(${JSON.stringify(args)})`));

        let result;
        try {
          result = await mcpManager.callTool(fnName, args);
        } catch (err) {
          result = { error: err.message };
        }

        console.log(chalk.dim(`  ✅ 工具返回: ${JSON.stringify(result).slice(0, 200)}`));

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    return "（已达到最大迭代次数，Agent 停止运行）";
  }

  return { run, reset, messages };
}
