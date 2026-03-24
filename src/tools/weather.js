const FORECAST_API = "https://api.open-meteo.com/v1/forecast";

const WEATHER_CODE_MAP = {
  0: "晴",
  1: "大部晴朗",
  2: "多云",
  3: "阴天",
  45: "雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "大毛毛雨",
  56: "冻毛毛雨",
  57: "冻毛毛雨（大）",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨（小）",
  67: "冻雨（大）",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "小阵雨",
  81: "中阵雨",
  82: "大阵雨",
  85: "小阵雪",
  86: "大阵雪",
  95: "雷暴",
  96: "雷暴伴冰雹（小）",
  99: "雷暴伴冰雹（大）",
};

function describeWeatherCode(code) {
  return WEATHER_CODE_MAP[code] || `未知(${code})`;
}

async function getWeeklyForecast({ latitude, longitude }) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "precipitation_sum",
      "windspeed_10m_max",
      "weathercode",
      "uv_index_max",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
  });

  const res = await fetch(`${FORECAST_API}?${params}`);
  const data = await res.json();

  if (data.error) {
    return { error: data.reason || "天气 API 请求失败" };
  }

  const daily = data.daily;
  const forecast = daily.time.map((date, i) => ({
    date,
    weather: describeWeatherCode(daily.weathercode[i]),
    temp_max: daily.temperature_2m_max[i],
    temp_min: daily.temperature_2m_min[i],
    feels_like_max: daily.apparent_temperature_max[i],
    feels_like_min: daily.apparent_temperature_min[i],
    precipitation_mm: daily.precipitation_sum[i],
    wind_max_kmh: daily.windspeed_10m_max[i],
    uv_index: daily.uv_index_max[i],
  }));

  return {
    timezone: data.timezone,
    unit: "°C / mm / km/h",
    forecast,
  };
}

export const weatherTool = {
  definition: {
    type: "function",
    function: {
      name: "get_weekly_forecast",
      description:
        "获取指定经纬度未来 7 天的天气预报，包含气温、体感温度、降水量、风速、UV 指数等。需要先用 geocode 工具获取经纬度。",
      parameters: {
        type: "object",
        properties: {
          latitude: { type: "number", description: "纬度" },
          longitude: { type: "number", description: "经度" },
        },
        required: ["latitude", "longitude"],
      },
    },
  },
  handler: getWeeklyForecast,
};
