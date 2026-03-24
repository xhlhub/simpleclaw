import { chat } from "./llm.js";
import chalk from "chalk";

const MAX_ITERATIONS = 15;

/**
 * 创建一个 Agent 配置。
 * @param {object} config
 * @param {string} config.name          Agent 名称
 * @param {string} config.description   Agent 描述
 * @param {string} config.systemPrompt  系统提示词
 * @param {Array}  config.tools         工具函数数组 [{ definition, handler }]
 */
export function defineAgent({ name, description, systemPrompt, tools = [] }) {
  const toolDefinitions = tools.map((t) => t.definition);

  const toolHandlers = Object.fromEntries(
    tools.map((t) => [t.definition.function.name, t.handler])
  );

  return { name, description, systemPrompt, toolDefinitions, toolHandlers };
}

/**
 * 运行 Agent：接收用户消息，通过 tool-calling 循环得到最终回复。
 */
export async function runAgent(agent, userMessage) {
  const messages = [
    { role: "system", content: agent.systemPrompt },
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const choice = await chat(messages, agent.toolDefinitions);

    if (choice.finish_reason === "stop" || !choice.message.tool_calls?.length) {
      return choice.message.content;
    }

    messages.push(choice.message);

    for (const toolCall of choice.message.tool_calls) {
      const fnName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(chalk.dim(`  🔧 调用工具: ${fnName}(${JSON.stringify(args)})`));

      const handler = agent.toolHandlers[fnName];
      if (!handler) {
        throw new Error(`未知工具: ${fnName}`);
      }

      let result;
      try {
        result = await handler(args);
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
