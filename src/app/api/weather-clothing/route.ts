import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Heavy rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

function wmoDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? "Unknown conditions";
}

export async function POST(request: NextRequest) {
  try {
    const { city, unit = "fahrenheit" } = (await request.json()) as {
      city: string;
      unit?: "fahrenheit" | "celsius";
    };

    if (!city?.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    // Step 1: Geocode the city
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
    }
    const geoData = (await geoRes.json()) as {
      results?: { name: string; country: string; latitude: number; longitude: number }[];
    };

    if (!geoData.results?.length) {
      return NextResponse.json({ error: `City "${city}" not found` }, { status: 404 });
    }

    const { name, country, latitude, longitude } = geoData.results[0];

    // Step 2: Fetch current weather from Open-Meteo
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&temperature_unit=${unit}` +
      `&wind_speed_unit=mph` +
      `&forecast_days=1`;

    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) {
      return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 });
    }
    const weatherData = (await weatherRes.json()) as {
      current: {
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        weather_code: number;
      };
    };

    const current = weatherData.current;
    const description = wmoDescription(current.weather_code);
    const unitSymbol = unit === "fahrenheit" ? "°F" : "°C";

    // Step 3: Ask Claude for clothing advice
    const prompt = `Current weather in ${name}, ${country}:
- Temperature: ${Math.round(current.temperature_2m)}${unitSymbol} (feels like ${Math.round(current.apparent_temperature)}${unitSymbol})
- Conditions: ${description}
- Humidity: ${current.relative_humidity_2m}%
- Wind: ${Math.round(current.wind_speed_10m)} mph

Suggest specific clothing items to wear. Be concise and practical. Format your response as:

**Outfit:**
- [item 1]
- [item 2]
- [item 3]
(3–5 items)

**Pro tip:** [one short sentence]`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const adviceText =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      city: name,
      country,
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      weatherCode: current.weather_code,
      description,
      unit,
      advice: adviceText,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
