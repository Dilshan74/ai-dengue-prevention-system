import { env } from "../config/env.js";

/**
 * Weather Service
 * Fetches current weather and rainfall conditions using OpenWeatherMap API
 * with intelligent fallback based on Sri Lanka climatic zones when offline or without API key.
 */

// Approximate coordinates for Sri Lankan districts
const DISTRICT_COORDINATES = {
  colombo: { lat: 6.9271, lng: 79.8612, rainFactor: 1.2 },
  gampaha: { lat: 7.084, lng: 79.9939, rainFactor: 1.15 },
  kalutara: { lat: 6.5854, lng: 79.9607, rainFactor: 1.2 },
  kandy: { lat: 7.2906, lng: 80.6337, rainFactor: 1.1 },
  galle: { lat: 6.0535, lng: 80.221, rainFactor: 1.25 },
  matara: { lat: 5.9549, lng: 80.555, rainFactor: 1.1 },
  ratnapura: { lat: 6.6828, lng: 80.4034, rainFactor: 1.3 },
  kurunegala: { lat: 7.4863, lng: 80.3623, rainFactor: 0.9 },
  batticaloa: { lat: 7.731, lng: 81.6747, rainFactor: 0.8 },
  jaffna: { lat: 9.6615, lng: 80.0255, rainFactor: 0.7 },
  anuradhapura: { lat: 8.3114, lng: 80.4037, rainFactor: 0.75 },
};

export async function getWeatherData({ lat, lng, locationName = "Colombo" }) {
  const apiKey = env.openWeatherApiKey || process.env.OPENWEATHER_API_KEY;

  if (apiKey && (lat || lng)) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data = await response.json();
        const rain1h = data.rain ? (data.rain["1h"] || data.rain["3h"] || 0) : 0;
        const temp = data.main ? data.main.temp : 28;
        const humidity = data.main ? data.main.humidity : 75;
        const condition = data.weather && data.weather[0] ? data.weather[0].main : "Clear";

        return {
          source: "OpenWeatherMap",
          temperature: temp,
          humidity,
          rainfallMm: rain1h,
          condition,
          weatherScore: calculateWeatherScore(rain1h, humidity, temp, condition),
        };
      }
    } catch (err) {
      console.warn("OpenWeatherMap fetch error, falling back to regional estimate:", err.message);
    }
  }

  // Fallback estimation based on district / time
  const districtKey = String(locationName).toLowerCase().split(/[\s,]+/)[0];
  const district = DISTRICT_COORDINATES[districtKey] || DISTRICT_COORDINATES.colombo;
  
  // Seasonal baseline estimate for tropical conditions
  const estimatedRain = Math.round(12 * district.rainFactor);
  const estimatedTemp = 29.5;
  const estimatedHumidity = 80;
  const condition = estimatedRain > 10 ? "Rain" : "Scattered Clouds";

  return {
    source: "Regional Climatological Model (Fallback)",
    temperature: estimatedTemp,
    humidity: estimatedHumidity,
    rainfallMm: estimatedRain,
    condition,
    weatherScore: calculateWeatherScore(estimatedRain, estimatedHumidity, estimatedTemp, condition),
  };
}

/**
 * Calculates a weather risk score (0 to 100) based on rainfall, humidity, and temperature.
 * Aedes mosquitoes thrive in warm temperatures (25-32°C) with high humidity and stagnant water after rain.
 */
export function calculateWeatherScore(rainfallMm, humidity, temperature, condition = "") {
  let score = 20; // baseline

  // Rainfall factor (Up to 50 pts)
  if (rainfallMm >= 25) {
    score += 50;
  } else if (rainfallMm >= 10) {
    score += 35;
  } else if (rainfallMm > 2) {
    score += 20;
  } else if (condition.toLowerCase().includes("rain") || condition.toLowerCase().includes("thunderstorm")) {
    score += 30;
  }

  // Humidity factor (Up to 25 pts)
  if (humidity >= 85) {
    score += 25;
  } else if (humidity >= 70) {
    score += 15;
  } else if (humidity >= 50) {
    score += 10;
  }

  // Temperature factor (Optimal mosquito breeding: 26°C - 32°C, Up to 25 pts)
  if (temperature >= 26 && temperature <= 32) {
    score += 25;
  } else if (temperature >= 22 && temperature <= 35) {
    score += 15;
  } else {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}
