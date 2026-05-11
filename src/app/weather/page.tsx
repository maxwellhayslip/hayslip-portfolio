"use client";

import { useState } from "react";

interface WeatherResult {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  unit: "fahrenheit" | "celsius";
  advice: string;
}

const WMO_EMOJI: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌦️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "❄️", 73: "❄️", 75: "❄️", 77: "❄️",
  80: "🌧️", 81: "🌧️", 82: "🌧️",
  85: "🌨️", 86: "🌨️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

function weatherEmoji(code: number): string {
  return WMO_EMOJI[code] ?? "🌡️";
}

function gradientForCode(code: number): string {
  if (code === 0 || code === 1) return "from-sky-400 to-amber-300";
  if (code === 2 || code === 3) return "from-slate-400 to-sky-300";
  if (code >= 45 && code <= 48) return "from-gray-400 to-slate-300";
  if (code >= 51 && code <= 67) return "from-slate-600 to-sky-500";
  if (code >= 71 && code <= 77) return "from-blue-200 to-slate-100";
  if (code >= 80 && code <= 82) return "from-slate-600 to-blue-400";
  if (code >= 85 && code <= 86) return "from-blue-300 to-slate-200";
  if (code >= 95) return "from-slate-800 to-purple-700";
  return "from-sky-500 to-indigo-400";
}

function parseAdvice(text: string): { outfit: string[]; tip: string } {
  const outfitMatch = text.match(/\*\*Outfit:\*\*\s*([\s\S]*?)(?=\*\*Pro tip:|$)/i);
  const tipMatch = text.match(/\*\*Pro tip:\*\*\s*(.+)/i);

  const outfit = outfitMatch
    ? outfitMatch[1]
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean)
    : [];
  const tip = tipMatch ? tipMatch[1].trim() : "";
  return { outfit, tip };
}

export default function WeatherPage() {
  const [city, setCity] = useState("");
  const [unit, setUnit] = useState<"fahrenheit" | "celsius">("fahrenheit");
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/weather-clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), unit }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data as WeatherResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const unitSymbol = unit === "fahrenheit" ? "°F" : "°C";
  const gradient = result ? gradientForCode(result.weatherCode) : "from-sky-500 to-indigo-400";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} transition-all duration-700`}>
      {/* Header */}
      <header className="px-6 pt-10 pb-6 text-center text-white">
        <h1 className="text-4xl font-bold tracking-tight drop-shadow">
          Weather &amp; What to Wear
        </h1>
        <p className="mt-2 text-white/80 text-sm">
          Enter any city to get the current weather and a personalized outfit recommendation.
        </p>
      </header>

      {/* Search form */}
      <div className="max-w-xl mx-auto px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City name…"
            className="flex-1 bg-white/90 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white text-sm"
          />

          {/* Unit toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/40">
            <button
              type="button"
              onClick={() => setUnit("fahrenheit")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                unit === "fahrenheit"
                  ? "bg-white text-slate-800"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              °F
            </button>
            <button
              type="button"
              onClick={() => setUnit("celsius")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                unit === "celsius"
                  ? "bg-white text-slate-800"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              °C
            </button>
          </div>

          <button
            type="submit"
            disabled={!city.trim() || loading}
            className="bg-white text-slate-800 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? "Loading…" : "Check"}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-xl mx-auto px-4 mt-4">
          <div className="bg-red-500/80 text-white rounded-xl px-4 py-3 text-sm text-center">
            {error}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="max-w-xl mx-auto px-4 mt-6 space-y-4 animate-pulse">
          <div className="bg-white/20 rounded-2xl h-40" />
          <div className="bg-white/20 rounded-2xl h-48" />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="max-w-xl mx-auto px-4 mt-6 pb-12 space-y-4">
          {/* Weather card */}
          <div className="bg-white/25 backdrop-blur-sm rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
                  {result.city}, {result.country}
                </p>
                <div className="flex items-end gap-3 mt-1">
                  <span className="text-7xl font-thin leading-none">
                    {result.temperature}{unitSymbol}
                  </span>
                </div>
                <p className="text-white/80 mt-1 text-sm">
                  Feels like {result.feelsLike}{unitSymbol} · {result.description}
                </p>
              </div>
              <span className="text-6xl" role="img" aria-label={result.description}>
                {weatherEmoji(result.weatherCode)}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-white/20 rounded-xl px-4 py-3">
                <p className="text-white/60 text-xs uppercase tracking-wide">Humidity</p>
                <p className="text-white font-semibold text-lg">{result.humidity}%</p>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-3">
                <p className="text-white/60 text-xs uppercase tracking-wide">Wind</p>
                <p className="text-white font-semibold text-lg">{result.windSpeed} mph</p>
              </div>
            </div>
          </div>

          {/* Clothing advice card */}
          {(() => {
            const { outfit, tip } = parseAdvice(result.advice);
            return (
              <div className="bg-white/25 backdrop-blur-sm rounded-2xl p-6 text-white">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>👕</span> What to Wear
                </h2>

                {outfit.length > 0 ? (
                  <ul className="space-y-2">
                    {outfit.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{result.advice}</p>
                )}

                {tip && (
                  <div className="mt-4 bg-white/20 rounded-xl px-4 py-3 text-sm text-white/90 italic">
                    💡 {tip}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
