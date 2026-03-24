import OpenAI from "openai";

let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    });
  }
  return client;
}

export function getModelName() {
  return process.env.MODEL_NAME || "gpt-4o-mini";
}

/**
 * 调用 LLM，支持 tool_calls 循环。
 * @param {Array} messages  OpenAI 消息数组
 * @param {Array} tools     OpenAI tools 定义（可选）
 * @returns {Promise<object>} response.choices[0]
 */
export async function chat(messages, tools) {
  const params = {
    model: getModelName(),
    messages,
    temperature: 0.7,
  };
  if (tools?.length) {
    params.tools = tools;
    params.tool_choice = "auto";
  }
  const response = await getClient().chat.completions.create(params);
  return response.choices[0];
}
