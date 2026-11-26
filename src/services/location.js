// Region data and farm location / weather geocoding.

async function refreshRegionData() {
  await Promise.all([refreshWeather(), syncOfficialHolidays()]);
}

function getCountryCode(countryName) {
  const codes = {
    Egypt: "EG",
    "Saudi Arabia": "SA",
    "United Arab Emirates": "AE",
    Jordan: "JO",
    "United States": "US",
    "United Kingdom": "GB",
    Canada: "CA",
    Australia: "AU",
  };
  return codes[countryName] || "";
}

function toWeatherLocation(place, countryHint = "") {
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  const countryCode = String(place.country_code || place.countrycode || "").toUpperCase();
  const countryName = countryHint && countryHint !== "Other" && getCountryCode(countryHint) === countryCode
    ? countryHint
    : String(place.country || countryHint || "");
  const placeName = String(place.name || place.city || place.locality || "");
  const regionName = String(place.admin1 || place.state || "");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    || !/^[A-Z]{2}$/.test(countryCode) || !placeName) {
    throw new Error("The location service returned invalid coordinates.");
  }
  const location = getFarmRegion({
    name: [placeName, regionName, countryName].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join("، "),
    country_code: countryCode,
    country_name: countryName,
    region_code: String(place.region_code || ""),
    latitude,
    longitude,
  });
  return {
    location,
    address: [placeName, regionName].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(", "),
    country: countryName,
  };
}

function matchesProfileCountry(place, country, countryCode) {
  if (!country || country === "Other") return true;
  if (countryCode) return String(place.country_code || place.countrycode || "").toUpperCase() === countryCode;
  return String(place.country || "").trim().toLowerCase() === country.trim().toLowerCase();
}

function findDeltaRegion(address) {
  const normalizedAddress = String(address || "").toLowerCase().replace(/[\u064b-\u065f]/g, "");
  const match = farmRegionAliases.find((region) => region.names.some((name) => {
    const normalizedName = name.toLowerCase().replace(/[\u064b-\u065f]/g, "");
    return normalizedAddress.includes(normalizedName);
  }));
  return match ? farmRegions.find((region) => region.code === match.code) : null;
}

async function resolveFarmProfileLocation(address, country) {
  const searchText = String(address || "").trim();
  if (!searchText) throw new Error("Enter a farm address in Farm profile before saving.");
  const countryCode = getCountryCode(country);
  const queries = [searchText];
  const geocodingErrors = [];

  for (const query of queries) {
    try {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.search = new URLSearchParams({ name: query, count: "10", language: "en", format: "json" }).toString();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Open-Meteo geocoding returned HTTP ${response.status}.`);
      const data = await response.json();
      const candidates = Array.isArray(data.results) ? data.results : [];
      const match = candidates.find((place) => matchesProfileCountry(place, country, countryCode));
      if (match) return toWeatherLocation(match, country);
    } catch (error) {
      geocodingErrors.push(error.message || "Open-Meteo geocoding failed.");
    }
  }

  const deltaRegion = findDeltaRegion(searchText);
  if (deltaRegion && (!countryCode || countryCode === "EG")) {
    return toWeatherLocation({
      name: searchText.replace(/,\s*(?:EG|Egypt)$/i, ""),
      country: "Egypt",
      country_code: "EG",
      admin1: "",
      region_code: deltaRegion.code,
      latitude: deltaRegion.latitude,
      longitude: deltaRegion.longitude,
    }, country || "Egypt");
  }

  if (geocodingErrors.length) {
    throw new Error(`Could not look up the profile location. ${geocodingErrors.join(" ")}`);
  }
  throw new Error(`No matching location was found${country && country !== "Other" ? ` in ${country}` : ""}. Check the address in Farm profile.`);
}

async function refreshWeatherFromFarmProfile(userId = currentUser?.id) {
  const savedLocation = String(farmProfile.location || "").trim();
  const location = savedLocation || defaultWeatherLocation;
  const country = savedLocation ? farmProfile.country || "Egypt" : "Egypt";
  const resolved = await resolveFarmProfileLocation(location, country);
  if (currentUser?.id !== userId) return;
  farmRegion = resolved.location;
  if (isSupabaseMode && !currentFarmId) {
    await refreshWeather();
    return;
  }
  await refreshRegionData();
}

function reportFarmWeatherLocationError(error) {
  console.error("Could not load weather from the farm profile location.", error);
  weatherState = { status: "error", data: null, error: error.message || "Could not resolve the farm location." };
  if (getRoute().page === "dashboard") render();
  showToast(`Could not load weather for the farm location: ${error.message || "Unexpected error."}`);
}
