// Default farm profile / region and local-browser persistence helpers.

function emptyStore() {
  return Object.fromEntries(resources.map((resource) => [resource.id, []]));
}

function createDefaultFarmProfile() {
  return {
    farm_name: "My farm",
    slug: "my-farm",
    unit: "Acres",
    farm_size: "",
    address: "",
    location: "",
    country: "Egypt",
    currency: "EGP",
    organic_farm: false,
    default_hours_per_day: 8,
    work_schedule: Object.fromEntries(workDayNames.map((day) => [day, 8])),
    active_modules: { ...defaultActiveModules },
    farm_id: null,
  };
}

function slugifyFarmName(value) {
  const slug = String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "farm";
}

function normalizeFarmProfile(profile = {}) {
  const defaults = createDefaultFarmProfile();
  const schedule = profile.work_schedule && typeof profile.work_schedule === "object"
    ? profile.work_schedule
    : {};
  const modules = profile.active_modules && typeof profile.active_modules === "object"
    ? profile.active_modules
    : {};
  const farmName = String(profile.farm_name || defaults.farm_name);
  return {
    ...defaults,
    ...profile,
    farm_name: farmName,
    slug: String(profile.slug || slugifyFarmName(farmName)),
    farm_size: profile.farm_size == null ? "" : String(profile.farm_size),
    location: String(profile.location || profile.address || ""),
    address: String(profile.address || profile.location || ""),
    default_hours_per_day: Number(profile.default_hours_per_day ?? defaults.default_hours_per_day),
    work_schedule: Object.fromEntries(workDayNames.map((day) => [
      day,
      Number(schedule[day] ?? defaults.work_schedule[day]),
    ])),
    active_modules: Object.fromEntries(Object.keys(defaultActiveModules).map((key) => [
      key,
      modules[key] === undefined ? true : Boolean(modules[key]),
    ])),
    organic_farm: Boolean(profile.organic_farm),
  };
}

function readLocalFarmProfile() {
  try {
    return normalizeFarmProfile(JSON.parse(localStorage.getItem(profileStorageKey) || "null") || {});
  } catch (error) {
    console.error("Could not load the saved farm profile.", error);
    window.setTimeout(() => showToast("The saved farm profile could not be read."), 0);
    return createDefaultFarmProfile();
  }
}

function loadStore() {
  const initial = emptyStore();
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return initial;
    const parsed = JSON.parse(saved);
    for (const resource of resources) {
      if (Array.isArray(parsed[resource.id])) initial[resource.id] = parsed[resource.id];
    }
  } catch (error) {
    console.error("Could not load saved farm data.", error);
    window.setTimeout(() => showToast("Saved data could not be read. The workspace started empty."), 0);
  }
  return initial;
}

function getFarmRegion(regionCode) {
  if (regionCode && typeof regionCode === "object") {
    const latitude = Number(regionCode.latitude);
    const longitude = Number(regionCode.longitude);
    const name = regionCode.location_name || regionCode.region_name || regionCode.name;
    if (Number.isFinite(latitude) && Number.isFinite(longitude) && name) {
      const countryCode = String(regionCode.country_code || regionCode.countryCode || "EG").toUpperCase();
      const regionCodeValue = String(regionCode.region_code || regionCode.regionCode || "");
      return {
        code: `${countryCode}:${latitude.toFixed(4)}:${longitude.toFixed(4)}`,
        name: String(name),
        countryCode,
        countryName: String(regionCode.country_name || regionCode.countryName || (countryCode === "EG" ? "Egypt" : countryCode)),
        regionCode: regionCodeValue,
        latitude,
        longitude,
      };
    }
    regionCode = regionCode.region_code || regionCode.regionCode;
  }
  const region = farmRegions.find((item) => item.code === regionCode) || defaultFarmRegion;
  return {
    ...region,
    countryCode: "EG",
    countryName: "Egypt",
    regionCode: region.code,
  };
}

function loadLocalFarmRegion() {
  try {
    const saved = JSON.parse(localStorage.getItem(regionSettingsKey) || "null");
    if (saved?.location) return getFarmRegion(saved.location);
    if (saved && Number.isFinite(Number(saved.latitude)) && Number.isFinite(Number(saved.longitude))) return getFarmRegion(saved);
    return getFarmRegion(saved?.regionCode);
  } catch (error) {
    console.error("Could not load the saved farm region.", error);
    window.setTimeout(() => showToast("The saved farm region could not be read. Using central Delta."), 0);
    return defaultFarmRegion;
  }
}
