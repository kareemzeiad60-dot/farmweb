// Toast, account menu and farm switcher.

function showToast(message, type = "") {
  toast.textContent = message;
  toast.classList.toggle("toast-success", type === "success");
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible", "toast-success");
  }, 3200);
}

function updateAccountUi() {
  const accountName = currentUser?.email || (isSupabaseMode ? "Farm account" : "Local workspace");
  const accountRole = currentUser ? (currentRole ? `Signed in · ${roleLabel(currentRole)}` : "Signed in") : "Saved in this browser";
  const initial = accountName.charAt(0).toUpperCase() || "F";
  document.querySelector("#account-name").textContent = accountName;
  document.querySelector("#sidebar-account-name").textContent = accountName;
  document.querySelector("#account-role").textContent = accountRole;
  document.querySelector("#sidebar-account-role").textContent = accountRole;
  document.querySelector("#profile-avatar").textContent = initial;
  document.querySelector("#profile-menu-avatar").textContent = initial;
  document.querySelector("#sidebar-avatar").textContent = initial;
  document.querySelectorAll(".farm-name-display").forEach((element) => { element.textContent = currentFarmName; });
  renderFarmPopover();
  document.querySelector("#topbar-context").innerHTML = `<span class="context-dot"></span>${isSupabaseMode ? "Synced" : " Local preview · not synced"}`;
  document.querySelector("#topbar-context .context-dot").classList.toggle("context-dot-local", !isSupabaseMode);
  signOutButton.hidden = !currentUser;
  importLocalDataButton.hidden = !currentUser;
}

function renderFarmPopover() {
  const farmOptions = farms.length
    ? farms.map((farm) => `
      <button class="farm-option ${farm.id === currentFarmId ? "is-current" : ""}" type="button" data-farm-id="${escapeHtml(farm.id)}">
        <span class="farm-avatar">${escapeHtml((farm.name || "F").charAt(0).toUpperCase())}</span>
        <span class="farm-option-copy"><strong>${escapeHtml(farm.name)}</strong><small>${farm.id === currentFarmId ? "Current farm" : "Open farm records"}</small></span>
        ${farm.id === currentFarmId ? '<span class="checkmark" aria-label="Current farm">✓</span>' : ""}
      </button>
    `).join("")
    : `<div class="farm-option farm-option-static"><span class="farm-avatar">${escapeHtml(currentFarmName.charAt(0).toUpperCase())}</span><span class="farm-option-copy"><strong>${escapeHtml(currentFarmName)}</strong><small>Current workspace</small></span></div>`;
  const createForm = isSupabaseMode && currentUser
    ? `<form class="farm-create-form" id="farm-create-form"><label for="new-farm-name">Add a farm</label><div><input id="new-farm-name" name="farmName" maxlength="120" placeholder="Farm name" required /><button class="button button-green" type="submit">Create</button></div></form>`
    : "";
  farmPopover.innerHTML = `${farmOptions}${createForm}`;
}
