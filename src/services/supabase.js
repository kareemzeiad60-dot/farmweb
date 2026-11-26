// Supabase client bootstrap and sign out.

async function initializeSupabase() {
  const config = window.FIELDWISE_SUPABASE_CONFIG;
  const url = String(config?.url || "").trim();
  const anonKey = String(config?.anonKey || "").trim();
  const secureUrl = url.startsWith("https://");
  const localDevelopmentUrl = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(url);
  const configured = (secureUrl || localDevelopmentUrl)
    && anonKey.length > 20
    && !url.includes("YOUR_SUPABASE")
    && !anonKey.includes("YOUR_SUPABASE");

  if (!configured) {
    isSupabaseMode = false;
    farmProfile = readLocalFarmProfile();
    farmProfileStatus = "ready";
    currentFarmName = farmProfile.farm_name;
    appShell.hidden = false;
    authScreen.hidden = true;
    farmRegion = loadLocalFarmRegion();
    updateAccountUi();
    render();
    void refreshWeatherFromFarmProfile().catch(reportFarmWeatherLocationError);
    return;
  }

  isSupabaseMode = true;
  currentFarmName = "My farm";
  store = emptyStore();
  appShell.hidden = true;
  authScreen.hidden = false;
  updateAccountUi();

  if (!window.supabase?.createClient) {
    document.querySelector("#auth-config-note").hidden = false;
    authSubmitButton.disabled = true;
    showAuthError("The cloud service could not be loaded. Check your internet connection and reload.");
    return;
  }

  try {
    sb = window.supabase.createClient(url, anonKey);
    sb.auth.onAuthStateChange((_event, session) => applyAuthSession(session));
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    applyAuthSession(data.session);
  } catch (error) {
    console.error("Could not initialize Supabase.", error);
    showAuthError(error.message || "Could not connect to the cloud service.");
  }
}

async function logoutFarm() {
  if (!sb) return;
  try {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Could not sign out from Supabase.", error);
    showToast(`Could not sign out: ${error.message || "Cloud service request failed."}`);
  }
}
