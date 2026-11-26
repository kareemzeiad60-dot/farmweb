// Sign in / sign up and applying an auth session.

function showAuthError(message) {
  authError.textContent = message;
  authError.hidden = false;
  authSuccess.hidden = true;
}

function showAuthSuccess(message) {
  authSuccess.textContent = message;
  authSuccess.hidden = false;
  authError.hidden = true;
}

function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  farmNameGroup.hidden = !isSignUpMode;
  authFarmName.required = false;
  document.querySelector("#auth-title").textContent = isSignUpMode ? "Create your farm account" : "Welcome back";
  document.querySelector("#auth-subtitle").textContent = isSignUpMode
    ? "Create a secure cloud workspace for your farm."
    : "Sign in to access your farm records.";
  document.querySelector("#auth-toggle-text").textContent = isSignUpMode ? "Already have an account?" : "New to Fieldwise?";
  document.querySelector("#auth-toggle-link").textContent = isSignUpMode ? "Sign in" : "Create a farm account";
  authSubmitButton.textContent = isSignUpMode ? "Create farm account" : "Sign in";
  authError.hidden = true;
  authSuccess.hidden = true;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!sb) {
    showAuthError("Cloud storage is not connected. Check the app connection settings.");
    return;
  }

  const email = document.querySelector("#auth-email").value.trim();
  const password = document.querySelector("#auth-password").value;
  const farmName = authFarmName.value.trim() || "My farm";
  authError.hidden = true;
  authSuccess.hidden = true;
  authSubmitButton.disabled = true;
  authSubmitButton.textContent = "Please wait...";

  try {
    if (isSignUpMode) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { farm_name: farmName } },
      });
      if (error) throw error;
      if (!data.session) {
        toggleAuthMode();
        showAuthSuccess("Account created. Check your email to confirm it, then sign in.");
      } else {
        showAuthSuccess("Your farm account is ready.");
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (error) {
    showAuthError(error.message || "Authentication failed. Please try again.");
  } finally {
    authSubmitButton.disabled = false;
    authSubmitButton.textContent = isSignUpMode ? "Create farm account" : "Sign in";
  }
}

function applyAuthSession(session) {
  const user = session?.user || null;
  if (!user) {
    currentUser = null;
    currentFarmId = null;
    farms = [];
    currentFarmName = "My farm";
    farmProfile = createDefaultFarmProfile();
    farmProfileStatus = "idle";
    store = emptyStore();
    appShell.hidden = true;
    authScreen.hidden = false;
    updateAccountUi();
    render();
    return;
  }

  const userChanged = currentUser?.id !== user.id;
  currentUser = user;
  appShell.hidden = false;
  authScreen.hidden = true;
  if (userChanged) {
    currentFarmId = null;
    farms = [];
    currentFarmName = user.user_metadata?.farm_name || "My farm";
    farmProfile = normalizeFarmProfile({ farm_name: currentFarmName });
    farmProfileStatus = "loading";
    farmRegion = defaultFarmRegion;
    store = emptyStore();
    render();
    const userId = user.id;
    window.setTimeout(async () => {
      try {
        await loadFarmProfileAndRecords(userId);
      } catch (error) {
        console.error("Could not load farm records from Supabase.", error);
        showToast(`Could not load farm records: ${error.message || "Cloud service request failed."}`);
      }
      if (currentUser?.id !== userId) return;
      try {
        await loadFarmProfileSettings(userId);
      } catch (error) {
        farmProfileStatus = "error";
        weatherState = { status: "error", data: null, error: error.message || "Could not load the farm profile." };
        console.error("Could not load the farm profile from Supabase.", error);
        if (currentUser?.id === userId && error.code === "42703") {
          farmProfile = normalizeFarmProfile({
            ...farmProfile,
            location: defaultWeatherLocation,
            country: "Egypt",
          });
          showToast("Supabase needs the latest setup script. Using Ashmoun as the weather location for now.");
          if (currentUser?.id === userId) {
            render();
            try {
              await refreshWeatherFromFarmProfile(userId);
            } catch (weatherError) {
              reportFarmWeatherLocationError(weatherError);
            }
          }
        } else {
          showToast(`Could not load farm profile: ${error.message || "Cloud service request failed."}`);
          if (currentUser?.id === userId) render();
        }
      }
    }, 0);
  }
  updateAccountUi();
}
