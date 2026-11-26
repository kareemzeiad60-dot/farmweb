// Event wiring and app start.

sidebarToggle.addEventListener("click", () => setSidebarOpen(!sidebar.classList.contains("open")));
sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));

profileToggle.addEventListener("click", () => {
  const open = profileMenu.hidden;
  profileMenu.hidden = !open;
  profileToggle.setAttribute("aria-expanded", String(open));
  farmPopover.hidden = true;
  farmSwitcher.setAttribute("aria-expanded", "false");
});

farmSwitcher.addEventListener("click", () => {
  const open = farmPopover.hidden;
  farmPopover.hidden = !open;
  farmSwitcher.setAttribute("aria-expanded", String(open));
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
});

farmPopover.addEventListener("click", (event) => {
  const option = event.target.closest("[data-farm-id]");
  if (!option || option.dataset.farmId === currentFarmId) return;
  const selectedFarm = farms.find((farm) => farm.id === option.dataset.farmId);
  if (!selectedFarm) return;
  farmPopover.hidden = true;
  farmSwitcher.setAttribute("aria-expanded", "false");
  loadFarmRecords(selectedFarm).catch((error) => {
    console.error("Could not switch farm records.", error);
    showToast(`Could not load farm: ${error.message || "Cloud service request failed."}`);
  });
});

nav.addEventListener("click", (event) => {
  const button = event.target.closest(".nav-group-toggle");
  if (!button) return;
  const open = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", (event) => {
  const statusCard = event.target.closest("[data-status-group]");
  if (statusCard) {
    const resourceId = getRoute().resource;
    if (!resourceId) return;
    const state = listState[resourceId] || { query: "", filter: "", sort: "", direction: 1, hiddenColumns: [] };
    const nextGroup = statusCard.dataset.statusGroup === "all" ? "" : statusCard.dataset.statusGroup;
    listState[resourceId] = { ...state, statusGroup: state.statusGroup === nextGroup ? "" : nextGroup };
    render();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (!action) {
    if (!event.target.closest(".toolbar-controls")) closeToolbarMenus();
    return;
  }
  if (action.dataset.action === "toggle-filter-menu" || action.dataset.action === "toggle-column-menu") {
    const menu = document.getElementById(action.getAttribute("aria-controls"));
    const open = menu.hidden;
    closeToolbarMenus();
    menu.hidden = !open;
    action.setAttribute("aria-expanded", String(open));
    return;
  }
  if (action.dataset.action === "refresh-weather") {
    void refreshWeather();
    return;
  }
  if (action.dataset.action === "delete") {
    deleteRecord(action.dataset.resource, action.dataset.id).catch((error) => {
      console.error("Could not delete the farm record.", error);
      showToast(`Could not delete record: ${error.message || "Unexpected error."}`);
    });
  }
  if (action.dataset.action === "export-all") exportData();
  if (action.dataset.action === "export-current") exportData(action.dataset.resource);
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "farm-profile-form") {
    event.preventDefault();
    if (!event.target.reportValidity()) return;
    saveFarmProfile(event.target).catch((error) => {
      console.error("Could not save the farm profile.", error);
      showToast(`Could not save farm profile: ${error.message || "Unexpected error."}`);
    });
    return;
  }
  if (event.target.id === "farm-create-form") {
    event.preventDefault();
    if (!event.target.reportValidity()) return;
    createFarm(event.target.elements.farmName.value).catch((error) => {
      console.error("Could not create a farm.", error);
      showToast(`Could not create farm: ${error.message || "Unexpected error."}`);
    });
    return;
  }
  if (event.target.id !== "record-form") return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  saveForm(event.target).catch((error) => {
    console.error("Could not save the farm record.", error);
    showToast(`Could not save record: ${error.message || "Unexpected error."}`);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeToolbarMenus();
});

document.addEventListener("input", (event) => {
  if (event.target.id === "profile-farm-name") {
    const slug = document.querySelector("#profile-slug");
    if (slug && slug.dataset.userEdited !== "true") slug.value = slugifyFarmName(event.target.value);
    return;
  }
  if (event.target.id === "profile-slug") {
    event.target.dataset.userEdited = String(Boolean(event.target.value.trim()));
    return;
  }
  if (event.target.matches("[data-workday-hours]")) {
    const total = Array.from(document.querySelectorAll("[data-workday-hours]"))
      .reduce((sum, input) => sum + Number(input.value || 0), 0);
    const output = document.querySelector("[data-weekly-total]");
    if (output) output.textContent = String(Number(total.toFixed(2)));
    return;
  }
  if (event.target.id !== "record-search") return;
  const resourceId = getRoute().resource;
  if (!resourceId) return;
  listState[resourceId] = { ...(listState[resourceId] || {}), query: event.target.value };
  const resource = resourceById.get(resourceId);
  const panel = document.querySelector(".resource-panel");
  const focusPosition = event.target.selectionStart;
  const scroll = window.scrollY;
  const next = document.createElement("div");
  next.innerHTML = renderList(resource);
  panel.replaceWith(next.querySelector(".resource-panel"));
  const nextInput = document.querySelector("#record-search");
  nextInput.focus({ preventScroll: true });
  nextInput.setSelectionRange(focusPosition, focusPosition);
  window.scrollTo(0, scroll);
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-column-toggle]")) {
    const resourceId = getRoute().resource;
    if (!resourceId) return;
    const state = listState[resourceId] || { query: "", filter: "", sort: "", direction: 1, hiddenColumns: [] };
    const hiddenColumns = new Set(state.hiddenColumns || []);
    if (event.target.checked) hiddenColumns.delete(event.target.dataset.columnToggle);
    else hiddenColumns.add(event.target.dataset.columnToggle);
    listState[resourceId] = { ...state, hiddenColumns: Array.from(hiddenColumns) };
    document.querySelectorAll("[data-column-key]").forEach((cell) => {
      if (cell.dataset.columnKey === event.target.dataset.columnToggle) cell.hidden = !event.target.checked;
    });
    return;
  }
  if (event.target.matches(".related-record-select")) {
    event.target.classList.toggle("has-selection", Boolean(event.target.value));
    return;
  }
  if (event.target.id !== "record-filter") return;
  const resourceId = getRoute().resource;
  if (!resourceId) return;
  listState[resourceId] = { ...(listState[resourceId] || {}), filter: event.target.value };
  render();
});

document.addEventListener("click", (event) => {
  const sortButton = event.target.closest("[data-sort]");
  if (!sortButton) return;
  const { resource: resourceId, sort } = sortButton.dataset;
  const previous = listState[resourceId] || {};
  listState[resourceId] = { ...previous, sort, direction: previous.sort === sort ? -previous.direction : 1 };
  render();
});

document.querySelector("#import-data").addEventListener("click", () => {
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
  importFile.click();
});
document.querySelector("#export-data").addEventListener("click", () => {
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
  exportData();
});
document.querySelector("#sidebar-export").addEventListener("click", exportData);
document.querySelector("#auth-toggle-link").addEventListener("click", toggleAuthMode);
authForm.addEventListener("submit", (event) => { void handleAuthSubmit(event); });
signOutButton.addEventListener("click", () => { void logoutFarm(); });
importLocalDataButton.addEventListener("click", () => {
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
  importLocalData().catch((error) => {
    console.error("Could not import local browser records.", error);
    showToast(`Could not import local records: ${error.message || "Unexpected error."}`);
  });
});
importFile.addEventListener("change", async () => {
  const [file] = importFile.files || [];
  if (file) await importData(file);
  importFile.value = "";
});

document.addEventListener("click", (event) => {
  if (!profileMenu.hidden && !profileMenu.contains(event.target) && !profileToggle.contains(event.target)) {
    profileMenu.hidden = true;
    profileToggle.setAttribute("aria-expanded", "false");
  }
  if (!farmPopover.hidden && !farmPopover.contains(event.target) && !farmSwitcher.contains(event.target)) {
    farmPopover.hidden = true;
    farmSwitcher.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("hashchange", render);
render();
void initializeSupabase();
