// Hash router and sidebar navigation.

function getRoute() {
  const path = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!path.length) return { page: "dashboard" };
  if (path[0] === "help-center") return { page: "help-center" };
  if (path[0] === "farm-profile") return { page: "farm-profile" };
  if (!resourceById.has(path[0])) return { page: "not-found" };
  if (path[1] === "new") return { page: "form", resource: path[0] };
  if (path[1] === "edit" && path[2]) return { page: "form", resource: path[0], recordId: decodeURIComponent(path[2]) };
  return { page: "list", resource: path[0] };
}

function setSidebarOpen(open) {
  sidebar.classList.toggle("open", open);
  sidebarBackdrop.classList.toggle("visible", open);
  sidebarToggle.setAttribute("aria-expanded", String(open));
  sidebarToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

function renderNavigation(activeId) {
  nav.innerHTML = `
    <a class="nav-link dashboard-link ${activeId === "dashboard" ? "active" : ""}" href="#/" data-route="dashboard" ${activeId === "dashboard" ? 'aria-current="page"' : ""}>
      <span class="nav-icon" aria-hidden="true">▦</span><span>Dashboard</span>
    </a>
  ` + resourceGroups.filter((group) => !group.module || farmProfile.active_modules[group.module]).map((group) => `
    <section class="nav-group">
      <button class="nav-group-toggle" type="button" aria-expanded="true">
        <span>${escapeHtml(group.label)}</span><span class="group-caret" aria-hidden="true">⌄</span>
      </button>
      <div class="nav-group-items tree-items">
        ${group.items.map((id) => {
          if (id === "help-center") {
            return `<a class="nav-link ${activeId === id ? "active" : ""}" href="#/help-center" data-route="help-center" ${activeId === id ? 'aria-current="page"' : ""}>
              <span class="nav-icon">?</span><span>Help center</span>
            </a>`;
          }
          const resource = resourceById.get(id);
          const count = store[id].length;
          return `<a class="nav-link ${activeId === id ? "active" : ""}" href="#/${id}" data-route="${id}" ${activeId === id ? 'aria-current="page"' : ""}>
            <span class="nav-icon" aria-hidden="true">${navigationIcon(id)}</span>
            <span>${escapeHtml(resource.nav)}</span><span class="nav-count">${count}</span>
          </a>`;
        }).join("")}
      </div>
    </section>
  `).join("") + `
    <section class="nav-group">
      <button class="nav-group-toggle" type="button" aria-expanded="true">
        <span>Settings</span><span class="group-caret" aria-hidden="true">⌄</span>
      </button>
      <div class="nav-group-items tree-items">
        <a class="nav-link ${activeId === "farm-profile" ? "active" : ""}" href="#/farm-profile" data-route="farm-profile" ${activeId === "farm-profile" ? 'aria-current="page"' : ""}>
          <span class="nav-icon" aria-hidden="true">⚙</span><span>Farm profile</span>
        </a>
      </div>
    </section>
  `;
}

function navigationIcon(id) {
  const icons = {
    "crop-fields": "⌗", crops: "♧", "planting-seasons": "◷", "bee-hives": "▤",
    "bee-colonies": "♧", "hive-inspections": "⌕", "honey-productions": "◉",
    "bee-hive-types": "▦", "animal-fields": "⌗", animals: "♧",
    "livestock-groups": "♙", "feed-mixtures": "♨", "financial-records": "↗", users: "♙",
    tasks: "☷", "farm-workers": "♙", "worker-leaves": "◷", holidays: "▣",
  };
  return icons[id] || "•";
}
