import "dotenv/config";
import { createInterface } from "readline";
import chalk from "chalk";
import { runAgent } from "./src/core/agent.js";
import { weatherAgent } from "./src/agents/weather.js";
import { outfitAgent } from "./src/agents/outfit.js";

const agents = {
  weather: weatherAgent,
  outfit: outfitAgent,
};

function printBanner() {
  console.log(chalk.bold.cyan("\n╔══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║     🤖 Node.js Agents Demo          ║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════╝\n"));
}

function printAgentList() {
  console.log(chalk.yellow("可用的 Agent：\n"));
  for (const [key, agent] of Object.entries(agents)) {
    console.log(`  ${chalk.green(key.padEnd(10))} ${agent.description}`);
  }
  console.log(`\n${chalk.dim("用法: node index.js <agent名> 或直接运行进入交互模式")}\n`);
}

async function interactiveMode(agent) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () =>
    new Promise((resolve) => {
      rl.question(chalk.bold.green("\n你: "), resolve);
    });

  console.log(chalk.cyan(`\n已进入 [${agent.name}] 模式`));
  console.log(chalk.dim('输入城市名开始查询，输入 "exit" 退出\n'));

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
      const reply = await runAgent(agent, trimmed);
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

async function selectAgent() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printAgentList();

  return new Promise((resolve) => {
    rl.question(chalk.bold("请选择 Agent (weather/outfit): "), (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
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

  let agentKey = process.argv[2];

  if (!agentKey || !agents[agentKey]) {
    agentKey = await selectAgent();
  }

  const agent = agents[agentKey];
  if (!agent) {
    console.log(chalk.red(`未知的 Agent: ${agentKey}`));
    printAgentList();
    process.exit(1);
  }

  await interactiveMode(agent);
}

main().catch(console.error);
