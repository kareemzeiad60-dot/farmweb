// Top-level render().

function renderNotFound() {
  return `<section class="panel-card empty-state"><span class="empty-symbol">?</span><h1>Page not found</h1><p>That section is not part of this workspace.</p><a class="button button-green" href="#/">Return to dashboard</a></section>`;
}

function render() {
  const route = getRoute();
  const active = route.resource || route.page;
  if (route.page === "team") void loadTeam(); // sets teamState synchronously, renders again when done
  renderNavigation(active);
  let page;
  if (route.page === "dashboard") page = renderDashboard();
  else if (route.page === "list") page = renderList(resourceById.get(route.resource));
  else if (route.page === "form") page = renderForm(resourceById.get(route.resource), route.recordId, route.prefill);
  else if (route.page === "farm-profile") page = renderFarmProfilePage();
  else if (route.page === "help-center") page = renderHelp();
  else if (route.page === "team") page = renderTeamPage();
  else if (route.page === "my-tasks") page = renderMyTasks();
  else page = renderNotFound();
  main.innerHTML = renderInvitationBanner() + page;
  const pageTitles = { form: "Record", "help-center": "Help center", "farm-profile": "Farm profile", "my-tasks": "My tasks" };
  document.title = route.page === "dashboard" ? "Dashboard | Fieldwise" : `${pageTitles[route.page] || resourceById.get(route.resource)?.nav || "Workspace"} | Fieldwise`;
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
