const IP_GEO_API = "http://ip-api.com/json/?lang=zh-CN&fields=status,message,country,regionName,city,lat,lon,timezone,query";

async function getCurrentLocation() {
  const res = await fetch(IP_GEO_API);
  const data = await res.json();

  if (data.status !== "success") {
    return { error: `IP 定位失败: ${data.message || "未知错误"}` };
  }

  return {
    city: data.city,
    region: data.regionName,
    country: data.country,
    latitude: data.lat,
    longitude: data.lon,
    timezone: data.timezone,
    ip: data.query,
  };
}

export const locationTool = {
  definition: {
    type: "function",
    function: {
      name: "get_current_location",
      description:
        "通过 IP 地址自动获取用户当前所在位置（城市、经纬度等）。当用户没有指定城市，直接问「今天天气怎么样」「现在冷不冷」等问题时，先调用此工具获取用户位置。",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  handler: getCurrentLocation,
};
