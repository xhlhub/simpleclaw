import { defineAgent } from "../core/agent.js";
import { geocodingTool, weatherTool } from "../tools/index.js";

const systemPrompt = `你是一个专业的天气助手。用户会告诉你一个城市名称，你需要：

1. 先用 geocode 工具将城市名转换为经纬度
2. 再用 get_weekly_forecast 工具获取未来 7 天天气
3. 以清晰易读的格式向用户展示天气预报

展示格式要求：
- 先说明查询的城市和时区
- 用表格或列表展示每天的天气：日期、天气状况、最高/最低气温、体感温度、降水量、风速
- 在末尾给出一段简短的整体天气趋势总结
- 如果有极端天气（大雨、高温、寒潮等），特别提醒用户

请用中文回复。`;

export const weatherAgent = defineAgent({
  name: "天气助手",
  description: "查询指定城市未来一周天气预报",
  systemPrompt,
  tools: [geocodingTool, weatherTool],
});
