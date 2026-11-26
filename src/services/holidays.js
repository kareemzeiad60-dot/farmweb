// Official public-holiday sync.

function publicHolidayRecord(holiday, location) {
  const name = holiday.localName || holiday.name;
  const countryCode = location.countryCode;
  return {
    id: `official-${countryCode}-${holiday.date}-${encodeURIComponent(holiday.name || name)}`,
    name,
    date: holiday.date,
    source: "Public holiday",
    active: true,
    official: true,
    countryCode,
    regionCode: location.regionCode,
    holidayProvider: "Nager.Date",
  };
}

async function syncOfficialHolidays() {
  const requestedRegion = farmRegion;
  const requestedFarmId = currentFarmId;
  const countryCode = requestedRegion.countryCode;
  const year = new Date().getFullYear();
  holidaySyncState = { status: "loading", error: "" };
  try {
    const years = [year, year + 1];
    const yearlyLists = await Promise.all(years.map(async (holidayYear) => {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${holidayYear}/${countryCode}`);
      if (!response.ok) throw new Error(`Holiday service returned HTTP ${response.status}.`);
      const holidays = await response.json();
      if (!Array.isArray(holidays)) throw new Error("Holiday service returned an invalid response.");
      return holidays.filter((holiday) => (holiday.types || []).includes("Public")
        && (!holiday.counties || holiday.counties.length === 0
          || !requestedRegion.regionCode
          || holiday.counties.includes(requestedRegion.regionCode)))
        .map((holiday) => publicHolidayRecord(holiday, requestedRegion));
    }));
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;

    const fetched = yearlyLists.flat();
    const targetYears = new Set(years.map(String));
    const stale = store.holidays.filter((record) => record.official
      && record.countryCode === countryCode
      && targetYears.has(String(record.date || "").slice(0, 4))
      && !fetched.some((holiday) => holiday.id === record.id));
    const staleIds = new Set(stale.map((record) => record.id));
    const existing = new Map(store.holidays.filter((record) => !staleIds.has(record.id)).map((record) => [record.id, record]));
    const changed = fetched.filter((record) => {
      const saved = existing.get(record.id);
      return !saved || ["name", "date", "source", "active", "official", "countryCode", "regionCode", "holidayProvider"]
        .some((key) => saved[key] !== record[key]);
    });
    for (const record of fetched) existing.set(record.id, record);
    if (changed.length || stale.length) {
      const nextStore = { ...store, holidays: Array.from(existing.values()) };
      const changes = [];
      if (changed.length) changes.push({ type: "upsert", resourceId: "holidays", records: changed });
      for (const record of stale) changes.push({ type: "delete", resourceId: "holidays", recordId: record.id });
      if (!await commit(nextStore, changes)) {
        throw new Error("Could not save official holiday records.");
      }
    }
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;
    holidaySyncState = { status: "ready", error: "" };
  } catch (error) {
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;
    console.error("Could not sync official public holidays.", error);
    holidaySyncState = { status: "error", error: error.message };
  }
  if (getRoute().resource === "holidays") render();
}
