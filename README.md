# Node.js AI Agents Demo

基于 **Tool-Calling** 模式的 AI Agent 示例，包含两个 Agent：

| Agent | 说明 |
|-------|------|
| `weather` | 天气助手 — 查询指定城市未来 7 天天气预报 |
| `outfit`  | 穿搭建议 — 根据天气规划每日穿搭 |

## 架构

```
├── index.js              # CLI 入口
└── src/
    ├── core/
    │   ├── agent.js       # Agent 运行器（tool-calling 循环）
    │   └── llm.js         # LLM 客户端（兼容 OpenAI API）
    ├── tools/
    │   ├── index.js       # 工具统一导出
    │   ├── geocoding.js   # 城市 → 经纬度（Open-Meteo）
    │   └── weather.js     # 7 天天气预报（Open-Meteo）
    └── agents/
        ├── weather.js     # 天气助手配置
        └── outfit.js      # 穿搭建议配置
```

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 API Key

# 3. 运行
node index.js           # 交互式选择 Agent
node index.js weather   # 直接启动天气助手
node index.js outfit    # 直接启动穿搭建议
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | API 密钥 | — |
| `OPENAI_BASE_URL` | API 地址（可替换为其他兼容服务） | `https://api.openai.com/v1` |
| `MODEL_NAME` | 模型名称 | `gpt-4o-mini` |

> 天气数据来自 [Open-Meteo](https://open-meteo.com)，完全免费，无需额外 API Key。

## 扩展指南

### 添加新工具

在 `src/tools/` 下新建文件，导出 `{ definition, handler }` 格式：

```javascript
export const myTool = {
  definition: {
    type: "function",
    function: {
      name: "my_tool",
      description: "工具描述",
      parameters: { type: "object", properties: { /* ... */ } },
    },
  },
  handler: async (args) => { /* 返回结果 */ },
};
```

### 添加新 Agent

在 `src/agents/` 下新建文件，用 `defineAgent` 组合提示词和工具：

```javascript
import { defineAgent } from "../core/agent.js";
import { myTool } from "../tools/my-tool.js";

export const myAgent = defineAgent({
  name: "我的 Agent",
  description: "描述",
  systemPrompt: "系统提示词...",
  tools: [myTool],
});
```

然后在 `index.js` 注册即可。
