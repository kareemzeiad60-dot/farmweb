// Farm profile page and saving it.

function renderFarmProfilePage() {
  const profile = normalizeFarmProfile(farmProfile);
  const countries = ["Egypt", "Saudi Arabia", "United Arab Emirates", "Jordan", "United States", "United Kingdom", "Canada", "Australia", "Other"];
  const currencies = [
    ["EGP", "EGP - Egyptian Pound"],
    ["USD", "USD - US Dollar"],
    ["EUR", "EUR - Euro"],
    ["SAR", "SAR - Saudi Riyal"],
    ["AED", "AED - UAE Dirham"],
    ["GBP", "GBP - British Pound"],
    ["CAD", "CAD - Canadian Dollar"],
    ["AUD", "AUD - Australian Dollar"],
  ];
  if (profile.country && !countries.includes(profile.country)) countries.push(profile.country);
  if (profile.currency && !currencies.some(([code]) => code === profile.currency)) {
    currencies.push([profile.currency, `${profile.currency} - Custom currency`]);
  }
  const weeklyTotal = workDayNames.reduce((total, day) => total + Number(profile.work_schedule[day] || 0), 0);
  const loading = farmProfileStatus === "loading";
  const countryOptions = countries.map((country) => `<option value="${escapeHtml(country)}" ${profile.country === country ? "selected" : ""}>${escapeHtml(country)}</option>`).join("");
  const currencyOptions = currencies.map(([code, label]) => `<option value="${escapeHtml(code)}" ${profile.currency === code ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
  const moduleToggles = activeModuleOptions.map((module) => `
    <label class="module-toggle-card">
      <span class="module-toggle-copy"><strong>${escapeHtml(module.label)}</strong><small>${escapeHtml(module.description)}</small></span>
      <span class="switch-control">
        <input type="checkbox" name="module_${module.key}" data-active-module="${module.key}" ${profile.active_modules[module.key] ? "checked" : ""}>
        <span class="switch-track" aria-hidden="true"></span>
      </span>
    </label>
  `).join("");

  return `
    <div class="page-heading farm-profile-heading">
      <div><p class="eyebrow">SETTINGS</p><h1>Farm profile</h1><p class="page-subtitle">Manage your farm details, working hours, and workspace modules.</p></div>
    </div>
    ${loading ? `<p class="profile-load-note" role="status">Loading your farm profile…</p>` : ""}
    ${farmProfileStatus === "error" ? `<p class="profile-load-note profile-load-error" role="alert">Farm profile could not be loaded. Check your connection and try again.</p>` : ""}
    <form class="farm-profile-form" id="farm-profile-form">
      <fieldset class="profile-fieldset" ${loading ? "disabled" : ""}>
        <section class="panel-card profile-section">
          <div class="profile-section-heading"><div><h2>Farm details</h2><p>Core information shown across your workspace.</p></div></div>
          <div class="profile-form-grid">
            <label class="form-field" for="profile-farm-name"><span class="field-label">Name <span class="required-mark">*</span></span>
              <input id="profile-farm-name" name="farm_name" type="text" maxlength="120" value="${escapeHtml(profile.farm_name)}" autocomplete="organization" required>
            </label>
            <label class="form-field" for="profile-slug"><span class="field-label">Slug <span class="required-mark">*</span></span>
              <input id="profile-slug" name="slug" type="text" maxlength="80" pattern="[a-z0-9]+(-[a-z0-9]+)*" data-user-edited="${profile.slug !== slugifyFarmName(profile.farm_name)}" value="${escapeHtml(profile.slug)}" required>
              <small>This is generated automatically. You can change it if you want eg. farm-name.</small>
            </label>
            <label class="form-field" for="profile-unit"><span class="field-label">Unit <span class="required-mark">*</span></span>
              <select id="profile-unit" name="unit" required>
                ${["Acres", "Qirat", "Hectares", "Square Meters"].map((unit) => `<option value="${unit}" ${profile.unit === unit ? "selected" : ""}>${unit}</option>`).join("")}
              </select>
            </label>
            <label class="form-field" for="profile-size"><span class="field-label">Size</span>
              <input id="profile-size" name="farm_size" type="number" min="0" step="0.01" placeholder="1.00" value="${escapeHtml(profile.farm_size)}">
            </label>
            <label class="form-field" for="profile-location"><span class="field-label">Location <span class="required-mark">*</span></span>
              <input id="profile-location" name="location" type="text" maxlength="200" placeholder="Ashmoun, Menofia, EG" value="${escapeHtml(profile.location)}" required>
              <small>Used to fetch the local weather forecast.</small>
            </label>
            <label class="form-field" for="profile-country"><span class="field-label">Country</span>
              <select id="profile-country" name="country">${countryOptions}</select>
            </label>
            <label class="form-field" for="profile-currency"><span class="field-label">Currency</span>
              <select id="profile-currency" name="currency">${currencyOptions}</select>
            </label>
            <div class="form-field organic-field">
              <span class="field-label">Organic farm</span>
              <label class="organic-toggle-row">
                <span class="switch-control">
                  <input type="checkbox" name="organic_farm" ${profile.organic_farm ? "checked" : ""}>
                  <span class="switch-track" aria-hidden="true"></span>
                </span>
                <span><strong>Certified or managed organically</strong><small>Mark this farm as using organic practices.</small></span>
              </label>
            </div>
          </div>
        </section>

        <details class="panel-card profile-accordion" open>
          <summary><span><strong>Work Schedule</strong><small>Set your standard daily and weekly working hours.</small></span><span class="accordion-chevron" aria-hidden="true">⌄</span></summary>
          <div class="profile-accordion-content">
            <label class="form-field default-hours-field" for="profile-default-hours"><span class="field-label">Default Hours Per Day</span>
              <span class="input-suffix-wrap"><input id="profile-default-hours" name="default_hours_per_day" type="number" min="0" max="24" step="0.25" value="${escapeHtml(profile.default_hours_per_day)}" required><span>hours</span></span>
            </label>
            <div class="work-schedule-grid">
              ${workDayNames.map((day) => `
                <label class="form-field day-hours-field" for="profile-hours-${day}"><span class="field-label">${day}</span>
                  <span class="input-suffix-wrap"><input id="profile-hours-${day}" name="work_schedule_${day}" data-workday-hours type="number" min="0" max="24" step="0.25" value="${escapeHtml(profile.work_schedule[day])}"><span>h</span></span>
                </label>
              `).join("")}
            </div>
            <p class="weekly-total" aria-live="polite">Weekly Total: <strong data-weekly-total>${weeklyTotal}</strong> hours/week</p>
          </div>
        </details>

        <details class="panel-card profile-accordion">
          <summary><span><strong>Active Modules</strong><small>Choose which sections appear in the sidebar. Your data is kept when a module is hidden.</small></span><span class="accordion-chevron" aria-hidden="true">⌄</span></summary>
          <div class="profile-accordion-content">
            <div class="module-toggle-grid">${moduleToggles}</div>
          </div>
        </details>
      </fieldset>
      <div class="profile-save-row">
        <p class="profile-save-hint">Changes apply to your workspace after saving.</p>
        <button class="button button-green" type="submit" ${loading ? "disabled" : ""}>Save changes</button>
      </div>
    </form>
  `;
}

async function saveFarmProfile(form) {
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const workSchedule = Object.fromEntries(workDayNames.map((day) => [
    day,
    Number(formData.get(`work_schedule_${day}`) || 0),
  ]));
  const activeModules = Object.fromEntries(activeModuleOptions.map((module) => [
    module.key,
    formData.get(`module_${module.key}`) === "on",
  ]));
  const nextProfile = normalizeFarmProfile({
    ...farmProfile,
    farm_name: String(formData.get("farm_name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    unit: formData.get("unit"),
    farm_size: formData.get("farm_size") || "",
    location: String(formData.get("location") || "").trim(),
    address: String(formData.get("location") || "").trim(),
    country: formData.get("country"),
    currency: formData.get("currency"),
    organic_farm: formData.get("organic_farm") === "on",
    default_hours_per_day: Number(formData.get("default_hours_per_day") || 0),
    work_schedule: workSchedule,
    active_modules: activeModules,
  });
  const update = {
    farm_name: nextProfile.farm_name,
    slug: nextProfile.slug,
    unit: nextProfile.unit,
    farm_size: nextProfile.farm_size === "" ? null : Number(nextProfile.farm_size),
    address: nextProfile.address,
    location: nextProfile.location,
    country: nextProfile.country,
    currency: nextProfile.currency,
    organic_farm: nextProfile.organic_farm,
    default_hours_per_day: nextProfile.default_hours_per_day,
    work_schedule: nextProfile.work_schedule,
    active_modules: nextProfile.active_modules,
    updated_at: new Date().toISOString(),
  };
  const ownedActiveFarm = isSupabaseMode
    ? farms.find((farm) => farm.id === currentFarmId && farm.created_by === currentUser?.id)
    : null;
  if (ownedActiveFarm) update.farm_id = currentFarmId;
  const resolvedProfileLocation = await resolveFarmProfileLocation(nextProfile.location, nextProfile.country);

  submitButton.disabled = true;
  submitButton.textContent = "Saving…";
  let weatherUpdateError = null;
  try {
    if (isSupabaseMode) {
      if (!sb || !currentUser) throw new Error("Sign in before saving your farm profile.");
      const { data, error } = await sb
        .from("farm_profiles")
        .update(update)
        .eq("id", currentUser.id)
        .select("id, farm_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Farm profile not found. Run the latest database setup script and try again.");
      nextProfile.farm_id = data.farm_id;
    } else {
      try {
        localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      } catch (error) {
        console.error("Could not save the farm profile in this browser.", error);
        throw new Error("The farm profile could not be saved in this browser.");
      }
    }

    farmProfile = nextProfile;
    farmProfileStatus = "ready";
    if (!isSupabaseMode || farmProfile.farm_id === currentFarmId) {
      currentFarmName = farmProfile.farm_name;
      const currentFarm = farms.find((farm) => farm.id === currentFarmId);
      if (currentFarm) currentFarm.name = currentFarmName;
      updateAccountUi();
    }
    try {
      farmRegion = resolvedProfileLocation.location;
      await refreshRegionData();
    } catch (error) {
      weatherUpdateError = error;
    }
    renderNavigation("farm-profile");
    if (weatherUpdateError) {
      console.error("Farm profile saved, but its weather region could not be updated.", weatherUpdateError);
      showToast(`Profile saved, but weather could not be updated: ${weatherUpdateError.message || "Unexpected error."}`);
    } else {
      showToast("Saved successfully", "success");
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Save changes";
  }
}
