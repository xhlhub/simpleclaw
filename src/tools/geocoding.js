const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";

const FEATURE_CODE_PRIORITY = {
  PPLC: 100,  // 国家首都
  PPLA: 80,   // 省/州首府
  PPLA2: 60,  // 地级市
  PPLA3: 40,
  PPL: 20,
};

function scoreLocation(loc) {
  const featureScore = FEATURE_CODE_PRIORITY[loc.feature_code] || 0;
  const popScore = Math.log10((loc.population || 0) + 1);
  return featureScore + popScore;
}

async function geocode({ city }) {
  const url = `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=10&language=zh`;
  const res = await fetch(url);
  const data = await res.json();

  const results = data.results || [];
  if (!results.length) {
    return { error: `未找到城市: ${city}` };
  }

  results.sort((a, b) => scoreLocation(b) - scoreLocation(a));

  const best = results[0];
  return {
    name: best.name,
    country: best.country,
    admin1: best.admin1,
    latitude: best.latitude,
    longitude: best.longitude,
    timezone: best.timezone,
    population: best.population,
  };
}

export const geocodingTool = {
  definition: {
    type: "function",
    function: {
      name: "geocode",
      description:
        "将城市名称转换为经纬度坐标。重要：请使用城市的英文名或拼音进行搜索（如 Beijing、Shanghai、Tokyo、Paris），这样匹配更准确。",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description:
              "城市的英文名或拼音，如 'Beijing'、'Shanghai'、'Tokyo'、'New York'",
          },
        },
        required: ["city"],
      },
    },
  },
  handler: geocode,
};
