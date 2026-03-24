import "dotenv/config";
import { createInterface } from "readline";
import chalk from "chalk";
import { runAgent } from "./src/core/agent.js";
import { assistant } from "./src/agents/assistant.js";

function printBanner() {
  console.log(chalk.bold.cyan("\n╔══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║     🤖 Node.js Agent Demo           ║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════╝\n"));
  console.log(chalk.dim("试试问我：「今天天气怎么样」「北京天气」「明天去上海出差穿什么」「东京和首尔哪个更冷」\n"));
}

async function main() {
  printBanner();

  if (!process.env.OPENAI_API_KEY) {
    console.log(chalk.red("⚠️  未检测到 OPENAI_API_KEY"));
    console.log(chalk.yellow("请复制 .env.example 为 .env 并填入你的 API Key："));
    console.log(chalk.dim("  cp .env.example .env"));
    console.log(chalk.dim("  # 然后编辑 .env 填入 API Key\n"));
    process.exit(1);
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () =>
    new Promise((resolve) => {
      rl.question(chalk.bold.green("\n你: "), resolve);
    });

  console.log(chalk.cyan(`已启动 [${assistant.name}]，随便问点什么吧！`));
  console.log(chalk.dim('输入 "exit" 退出\n'));

  while (true) {
    const input = await prompt();
    const trimmed = input.trim();

    if (!trimmed) continue;
    if (trimmed === "exit" || trimmed === "quit") {
      console.log(chalk.dim("\n再见！👋\n"));
      rl.close();
      break;
    }

    try {
      console.log(chalk.dim("\n⏳ Agent 正在思考...\n"));
      const reply = await runAgent(assistant, trimmed);
      console.log(chalk.bold("\n🤖 Agent:"));
      console.log(reply);
    } catch (err) {
      console.error(chalk.red(`\n❌ 错误: ${err.message}`));
      if (err.message.includes("API key")) {
        console.log(chalk.yellow("请检查 .env 文件中的 OPENAI_API_KEY 配置"));
      }
    }
  }
}

main().catch(console.error);
