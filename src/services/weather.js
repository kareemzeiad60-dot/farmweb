// Weather cards and farming insight.

function weatherDescription(code) {
  const descriptions = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
    56: "Freezing drizzle", 57: "Heavy freezing drizzle", 61: "Light rain", 63: "Rain",
    65: "Heavy rain", 66: "Freezing rain", 67: "Heavy freezing rain", 71: "Light snow",
    73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Rain showers",
    81: "Heavy showers", 82: "Violent showers", 85: "Snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Heavy thunderstorm with hail",
  };
  return descriptions[code] || "Conditions unavailable";
}

function weatherSymbol(code) {
  if ([0, 1].includes(code)) return "☀";
  if ([2, 3, 45, 48].includes(code)) return "☁";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄";
  if ([95, 96, 99].includes(code)) return "⛈";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "☂";
  return "☀";
}

function formatWeatherValue(value, digits = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "—";
}

function renderWeatherCards() {
  const weather = weatherState.data;
  const current = weather?.current;
  const daily = weather?.daily;
  const currentCode = current?.weather_code;
  const condition = weatherState.status === "loading"
    ? "Loading regional forecast…"
    : weatherState.status === "error"
      ? "Weather data unavailable"
      : weatherDescription(currentCode);
  const days = daily?.time || [];

  return `
    <div class="weather-heading-row">
      <h2 class="weather-heading-title" id="weather-heading">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 16.2a4.5 4.5 0 0 0-3.8-7.1A6 6 0 0 0 4.7 11 3.5 3.5 0 0 0 5.5 18H19a3.5 3.5 0 0 0 1-1.8Z" /></svg>
        <span>Weather Forecast</span>
      </h2>
      <button class="weather-refresh-button${weatherState.status === "loading" ? " is-loading" : ""}" type="button" data-action="refresh-weather" aria-label="Refresh weather forecast">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></svg>
        <span>Refresh</span>
      </button>
    </div>
    <div class="weather-subheader">
      <span>Current Conditions</span>
      <span>${escapeHtml(getWeatherLocationLabel())}</span>
    </div>
    <div class="panel-card weather-card" aria-live="polite">
      <div class="current-weather-card">
        <div class="current-weather-summary">
          <span class="current-weather-icon" aria-hidden="true">${weatherSymbol(currentCode)}</span>
          <div><strong class="current-temperature">${current ? formatWeatherValue(current.temperature_2m, 1) : "—"}<span>°C</span></strong><span class="current-condition">${escapeHtml(condition)}</span></div>
        </div>
        <span class="condition-place">${escapeHtml(farmRegion.name)} · Open-Meteo</span>
      </div>
      <div class="conditions-metrics" aria-label="Current weather details">
        <div><span class="weather-detail-icon" aria-hidden="true">◉</span><span>Humidity</span><strong>${current ? `${formatWeatherValue(current.relative_humidity_2m)}%` : "—"}</strong></div>
        <div><span class="weather-detail-icon" aria-hidden="true">☂</span><span>Rain</span><strong>${current ? `${formatWeatherValue(current.rain, 1)} mm` : "—"}</strong></div>
        <div><span class="weather-detail-icon" aria-hidden="true">≋</span><span>Wind</span><strong>${current ? `${formatWeatherValue(current.wind_speed_10m)} km/h` : "—"}</strong></div>
        <div><span class="weather-detail-icon" aria-hidden="true">${weatherSymbol(currentCode)}</span><span>Condition</span><strong>${escapeHtml(weatherState.status === "ready" ? weatherDescription(currentCode) : condition)}</strong></div>
      </div>
      <h3 class="forecast-heading">3-day forecast</h3>
      <div class="forecast-grid">
        ${days.length ? days.slice(0, 3).map((date, index) => {
          const code = daily.weather_code[index];
          const dayName = index === 0 ? "Today" : index === 1 ? "Tomorrow" : new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${date}T12:00:00`));
          return `<article class="forecast-day"><strong>${dayName} · ${escapeHtml(date.slice(5))}</strong><span class="forecast-symbol ${weatherSymbol(code) === "☀" ? "mostly-sun" : weatherSymbol(code) === "☂" ? "sun-cloud" : "cloud"}" aria-hidden="true">${weatherSymbol(code)}</span><span class="forecast-condition">${escapeHtml(weatherDescription(code))}</span><div class="forecast-temperatures"><strong>${formatWeatherValue(daily.temperature_2m_max[index])}°</strong><span>${formatWeatherValue(daily.temperature_2m_min[index])}°</span></div><span class="forecast-wind"><span aria-hidden="true">≋</span> ${formatWeatherValue(daily.wind_speed_10m_max[index])} km/h wind</span></article>`;
        }).join("") : `<article class="forecast-day forecast-placeholder"><strong>${weatherState.status === "error" ? "Forecast unavailable" : "Forecast loading"}</strong><span class="forecast-condition">${weatherState.status === "error" ? "Check your connection and try again." : "Fetching the local forecast…"}</span></article>`}
      </div>
      <aside class="farming-insight">
        <span class="insight-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18h6m-5 3h4m-5.8-6.2A7 7 0 1 1 15.8 15c-.8.6-1.3 1.4-1.5 2h-4.6c-.2-.6-.7-1.4-1.5-2Z" /><path d="M12 4v1m6.3 1.7-.7.7M5.7 6.7l.7.7" /></svg></span>
        <div><h3>Farming Insight</h3><p>${escapeHtml(getFarmingInsight(weather))}</p></div>
      </aside>
    </div>
  `;
}

function getWeatherLocationLabel() {
  const location = String(farmProfile.location || "").trim() || defaultWeatherLocation;
  const countryCode = farmRegion.countryCode || getCountryCode(farmProfile.country) || "EG";
  const suffix = [countryCode, farmProfile.country]
    .filter(Boolean)
    .find((value) => location.toLowerCase().endsWith(`, ${value}`.toLowerCase()));
  const locationName = suffix ? location.slice(0, -(suffix.length + 2)).trim() : location;
  return `${locationName} · ${countryCode}`;
}

function getFarmingInsight(weather) {
  if (!weather) return weatherState.status === "error"
    ? "A local insight will appear when the regional forecast is available."
    : "Loading a field-work insight for your selected region.";
  const rain = Number(weather.daily.precipitation_sum?.[0] || 0);
  const high = Number(weather.daily.temperature_2m_max?.[0]);
  const wind = Number(weather.daily.wind_speed_10m_max?.[0]);
  if (rain >= 5) return `${formatWeatherValue(rain, 1)} mm of rain is forecast today. Review soil moisture before scheduling irrigation.`;
  if (wind >= 35) return `Winds may reach ${formatWeatherValue(wind)} km/h today. Review conditions before spraying or other wind-sensitive field work.`;
  if (high >= 35) return `A high of ${formatWeatherValue(high)}°C is forecast today. Consider heat exposure when planning field work.`;
  return `Forecast for ${farmRegion.name} is ready. Check soil moisture before your next irrigation.`;
}

async function refreshWeather() {
  const requestedRegion = farmRegion;
  const requestedFarmId = currentFarmId;
  weatherState = { status: "loading", data: null, error: "" };
  if (getRoute().page === "dashboard") render();

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(requestedRegion.latitude),
    longitude: String(requestedRegion.longitude),
    current: "temperature_2m,relative_humidity_2m,rain,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum",
    forecast_days: "3",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    timezone: "auto",
  }).toString();

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}.`);
    const data = await response.json();
    if (!data.current || !data.daily) throw new Error("Open-Meteo returned an incomplete forecast.");
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;
    weatherState = { status: "ready", data, error: "" };
  } catch (error) {
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;
    console.error("Could not load the regional weather forecast.", error);
    weatherState = { status: "error", data: null, error: error.message };
  }
  if (getRoute().page === "dashboard") render();
}
