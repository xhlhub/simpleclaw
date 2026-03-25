# Simple OpenClaw 

> 一个极简 AI Agent 框架 —— 下载即用，无需复杂配置，让每个人都能拥有自己的 AI 助手。

**Simple OpenClaw** 是一个面向非技术人员的开源 AI Agent 项目。不需要懂代码，不需要配 Docker，只需三步就能在你的电脑上跑起一个能管文件、刷网页的智能助手。

---

## 它能做什么？

| 能力 | 说明 | 示例 |
|------|------|------|
| 📁 **文件管理** | 浏览、重命名、搜索、读写本地文件 | "把照片文件名的空格替换成下划线" |
| 🌐 **浏览器操作** | 打开网页、点击、截图、提取内容 | "打开 GitHub 截个图" |

所有能力通过自然语言驱动 —— 你只管说人话，Agent 自己决定调什么工具。

---

## 架构概览

```
你说人话  →  AI Agent（大模型）  →  自动选工具  →  返回结果
                    ↕
              MCP 工具层（插件化）
           ┌────────┼────────┐
        内置工具   文件系统   浏览器
        (天气/定位) (读写/重命名) (Playwright)
```

核心设计：**MCP（Model Context Protocol）插件架构**。每个工具都是独立的 MCP Server，即插即用，想加新能力只需在配置文件里多写一行。

---

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org) >= 18（推荐 20+）

### 三步启动

```bash
# 1. 克隆项目 & 安装依赖
git clone <your-repo-url>
cd agents
npm install

# 2. 配置 API Key（只需要一个）
cp .env.example .env
# 用任意文本编辑器打开 .env，把 sk-your-api-key-here 替换成你的 API Key
```

打开 `.env` 文件，填入你的 Key：

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4o-mini
```

> **没有 OpenAI Key？** 支持任何兼容 OpenAI 格式的服务商（DeepSeek、Moonshot、智谱等），只需改 `OPENAI_BASE_URL` 和 `MODEL_NAME` 即可。

```bash
# 3. 启动！
npm start
```

看到下面的界面就成功了：

```
╔══════════════════════════════════════╗
║     🤖 Node.js Agent (MCP)          ║
╚══════════════════════════════════════╝

🔌 正在连接 MCP Server...
✅ 共加载 N 个工具

已启动 [生活助手]，随便问点什么吧！
输入 "exit" 退出 | "reset" 重置对话

你:
```

直接打字提问，比如输入 `北京明天天气`，Agent 就会自动查询并回复。

---

## 使用示例

```
你: 今天天气怎么样
🤖 Agent: 根据您当前位置（北京），今天天气晴，气温 12°C ~ 22°C，建议穿...

你: 帮我把 ~/Downloads 里的文件按日期重命名
🤖 Agent: 已扫描目录，共找到 15 个文件，重命名方案如下...确认执行吗？

你: 打开 https://github.com 截个图
🤖 Agent: 已打开页面并截图，截图如下...
```

**操作指令：**
- 输入 `reset` → 清空对话记忆，重新开始
- 输入 `exit` → 退出程序

---

## 项目结构

```
├── index.js                # 入口：交互式命令行界面
├── mcp.config.json         # MCP 工具配置（在这里管理所有插件）
├── .env.example            # 环境变量模板
├── package.json
└── src/
    ├── agents/
    │   └── assistant.js    # Agent 定义（角色 + 系统提示词）
    ├── core/
    │   ├── agent.js        # Agent 运行器（tool-calling 循环）
    │   ├── llm.js          # LLM 客户端（兼容 OpenAI API）
    │   └── mcp-client.js   # MCP 客户端管理器（连接 & 聚合多个 MCP Server）
    ├── mcp-server.js       # 内置工具的 MCP Server
    └── tools/
        ├── index.js        # 工具统一导出
        ├── geocoding.js    # 城市名 → 经纬度（Open-Meteo，免费）
        ├── weather.js      # 天气预报（Open-Meteo，免费）
        └── location.js     # IP 自动定位当前城市
```

---

## 工具插件配置

所有工具通过 `mcp.config.json` 管理，零代码增删：

```json
{
  "mcpServers": {
    "built-in-tools": {
      "command": "node",
      "args": ["src/mcp-server.js"],
      "description": "内置工具（天气、地理编码、位置）"
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you"],
      "description": "文件系统操作（读写、重命名、搜索等）"
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "description": "浏览器自动化（导航、点击、截图等）"
    }
  }
}
```

想接入更多能力？在 [MCP Server 市场](https://github.com/modelcontextprotocol/servers) 找到你想要的工具，把配置粘贴进来就行。

---

## 兼容的 LLM 服务商

只要兼容 OpenAI API 格式，都能用：

| 服务商 | `OPENAI_BASE_URL` | `MODEL_NAME` |
|--------|-------------------|--------------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| Moonshot | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| 智谱 AI | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` |
| 硅基流动 | `https://api.siliconflow.cn/v1` | `Qwen/Qwen2.5-7B-Instruct` |
| 本地 Ollama | `http://localhost:11434/v1` | `qwen2.5` |

---

## 扩展指南

### 添加内置工具

在 `src/tools/` 下新建文件，导出 `{ definition, handler }`：

```javascript
export const myTool = {
  definition: {
    type: "function",
    function: {
      name: "my_tool",
      description: "工具描述",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "参数说明" } },
        required: ["query"],
      },
    },
  },
  handler: async ({ query }) => {
    return { result: "返回值" };
  },
};
```

然后在 `src/tools/index.js` 导出，在 `src/mcp-server.js` 注册即可。

### 修改 Agent 人设

编辑 `src/agents/assistant.js` 中的 `systemPrompt`，改成你想要的角色和行为风格。

---

## 常见问题

**Q: 天气查询需要额外的 API Key 吗？**
A: 不需要。天气和定位数据来自 [Open-Meteo](https://open-meteo.com) 和 [ip-api](http://ip-api.com)，完全免费。

**Q: 文件操作安全吗？**
A: `filesystem` MCP 只允许操作你在配置中指定的目录。修改 `mcp.config.json` 中的路径参数即可控制访问范围。

**Q: 浏览器功能需要安装 Chrome 吗？**
A: 首次运行时 Playwright 会自动下载所需的浏览器，无需手动安装。

**Q: 支持 Windows 吗？**
A: 支持。Node.js 18+ 在 Windows / macOS / Linux 上均可运行。

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 运行时 | Node.js (ESM) |
| LLM 调用 | OpenAI SDK (兼容任意 OpenAI 格式 API) |
| 工具协议 | MCP (Model Context Protocol) |
| 天气数据 | Open-Meteo（免费，无需 Key） |
| 文件操作 | @modelcontextprotocol/server-filesystem |
| 浏览器 | @playwright/mcp |

---

## License

MIT
