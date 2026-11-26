// Top-level render().

function renderNotFound() {
  return `<section class="panel-card empty-state"><span class="empty-symbol">?</span><h1>Page not found</h1><p>That section is not part of this workspace.</p><a class="button button-green" href="#/">Return to dashboard</a></section>`;
}

function render() {
  const route = getRoute();
  const active = route.resource || route.page;
  renderNavigation(active);
  if (route.page === "dashboard") main.innerHTML = renderDashboard();
  else if (route.page === "list") main.innerHTML = renderList(resourceById.get(route.resource));
  else if (route.page === "form") main.innerHTML = renderForm(resourceById.get(route.resource), route.recordId);
  else if (route.page === "farm-profile") main.innerHTML = renderFarmProfilePage();
  else if (route.page === "help-center") main.innerHTML = renderHelp();
  else main.innerHTML = renderNotFound();
  document.title = route.page === "dashboard" ? "Dashboard | Fieldwise" : `${route.page === "form" ? "Record" : route.page === "help-center" ? "Help center" : route.page === "farm-profile" ? "Farm profile" : resourceById.get(route.resource)?.nav || "Workspace"} | Fieldwise`;
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
  farmPopover.hidden = true;
  farmSwitcher.setAttribute("aria-expanded", "false");
  setSidebarOpen(false);
  if (route.page === "list" && route.resource) {
    const search = document.querySelector("#record-search");
    if (search) search.focus({ preventScroll: true });
  }
}
