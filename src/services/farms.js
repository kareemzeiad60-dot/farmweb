// Farm profile settings, farm records loading and farm creation.

async function loadFarmProfileSettings(userId) {
  if (!sb || currentUser?.id !== userId) return;
  const columns = "id, farm_id, farm_name, slug, unit, farm_size, address, location, country, currency, organic_farm, default_hours_per_day, work_schedule, active_modules";
  let { data, error } = await sb
    .from("farm_profiles")
    .select(columns)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    const defaults = normalizeFarmProfile({
      farm_name: currentUser.user_metadata?.farm_name || currentFarmName,
    });
    const { data: createdProfile, error: createError } = await sb
      .from("farm_profiles")
      .upsert({
        id: userId,
        farm_id: farms.find((farm) => farm.id === currentFarmId)?.created_by === userId ? currentFarmId : null,
        farm_name: defaults.farm_name,
        slug: defaults.slug,
        unit: defaults.unit,
        farm_size: null,
        address: defaults.address,
        location: defaults.location,
        country: defaults.country,
        currency: defaults.currency,
        organic_farm: defaults.organic_farm,
        default_hours_per_day: defaults.default_hours_per_day,
        work_schedule: defaults.work_schedule,
        active_modules: defaults.active_modules,
      }, { onConflict: "id" })
      .select(columns)
      .single();
    if (createError) throw createError;
    data = createdProfile;
  }
  if (currentUser?.id !== userId) return;

  farmProfile = normalizeFarmProfile(data);
  farmProfileStatus = "ready";
  if (farmProfile.farm_id === currentFarmId) currentFarmName = farmProfile.farm_name;
  updateAccountUi();
  render();
  try {
    await refreshWeatherFromFarmProfile(userId);
  } catch (error) {
    reportFarmWeatherLocationError(error);
  }
}

const farmSelectColumns = "id, name, country_code, country_name, region_code, region_name, location_name, latitude, longitude, created_by, created_at";

async function fetchFarms() {
  const { data, error } = await sb.from("farms").select(farmSelectColumns).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function loadFarmProfileAndRecords(userId) {
  const data = await fetchFarms();
  if (currentUser?.id !== userId) return;

  let availableFarms = data || [];
  if (!availableFarms.length) {
    const farmName = currentUser?.user_metadata?.farm_name || "My farm";
    const { data: createdFarm, error: createError } = await sb.rpc("create_farm", { p_name: farmName });
    if (createError) throw createError;
    const farm = Array.isArray(createdFarm) ? createdFarm[0] : createdFarm;
    if (!farm?.id) throw new Error("Supabase did not return the new farm.");
    availableFarms = [farm];
  }
  farms = availableFarms;

  let savedFarmId = "";
  try {
    savedFarmId = localStorage.getItem(`fieldwise-active-farm-v1:${userId}`) || "";
  } catch (storageError) {
    console.warn("Could not read the saved farm selection.", storageError);
  }
  const selectedFarm = availableFarms.find((farm) => farm.id === savedFarmId) || availableFarms[0];
  await loadFarmRecords(selectedFarm, userId);
  await loadPendingInvitations(userId);
}

async function loadFarmRecords(farm, userId = currentUser?.id) {
  if (!farm?.id || !userId || currentUser?.id !== userId) return;

  currentFarmId = farm.id;
  currentFarmName = farm.name || "My farm";
  farmRegion = getFarmRegion(farm);
  holidaySyncState = { status: "idle", error: "" };
  store = emptyStore();
  currentRole = null;
  teamState = { farmId: null, status: "idle", members: [], invitations: [], error: "" };
  updateAccountUi();
  render();
  try {
    localStorage.setItem(`fieldwise-active-farm-v1:${userId}`, farm.id);
  } catch (storageError) {
    console.warn("Could not save the selected farm on this device.", storageError);
  }

  const [nextStore, membership] = await Promise.all([
    loadCloudRecords(farm.id),
    sb.from("farm_members").select("role").eq("farm_id", farm.id).eq("user_id", userId).maybeSingle(),
  ]);
  if (membership.error) throw membership.error;
  if (currentUser?.id !== userId || currentFarmId !== farm.id) return;

  store = nextStore;
  currentRole = membership.data?.role || null;
  updateAccountUi();
  render();
  if (farmProfileStatus === "ready") {
    void refreshWeatherFromFarmProfile(userId).catch(reportFarmWeatherLocationError);
  }
}

async function createFarm(name) {
  const farmName = name.trim();
  if (!currentUser || !sb || !farmName) return;
  const userId = currentUser.id;
  try {
    const { data, error } = await sb.rpc("create_farm", { p_name: farmName });
    if (error) throw error;
    const createdFarm = Array.isArray(data) ? data[0] : data;
    if (!createdFarm?.id) throw new Error("Supabase did not return the new farm.");
    if (currentUser?.id !== userId) return;
    farms = [...farms.filter((farm) => farm.id !== createdFarm.id), createdFarm];
    updateAccountUi();
    await loadFarmRecords(createdFarm, userId);
    farmPopover.hidden = true;
    farmSwitcher.setAttribute("aria-expanded", "false");
    showToast(`Farm “${farmName}” created.`);
  } catch (error) {
    console.error("Could not create a farm.", error);
    showToast(`Could not create farm: ${error.message || "Cloud service request failed."}`);
  }
}
