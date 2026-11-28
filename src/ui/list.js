// Resource list page.

function classifyRecordState(record, resourceId) {
  if (record.active === false) return "inactive";
  const rawStatus = record.status ?? record.health ?? record.active;
  if (rawStatus == null || rawStatus === "") return "active";
  const status = String(rawStatus).trim().toLowerCase();
  if (["inactive", "archived", "declined", "rejected", "cancelled", "canceled", "retired", "sold"].includes(status)) return "inactive";
  if (resourceId === "equipment" && equipmentAttentionState(record)) return "attention";
  if (/attention|treat|maintenance|out of service|urgent|pending|progress|not started|follow.?up|weak|overdue/.test(status)) return "attention";
  return "active";
}

function getResourceStatusCounts(records, resourceId) {
  return records.reduce((counts, record) => {
    counts[classifyRecordState(record, resourceId)] += 1;
    return counts;
  }, { active: 0, attention: 0, inactive: 0 });
}

function renderListStats(resource, state) {
  const records = store[resource.id];
  const counts = getResourceStatusCounts(records, resource.id);
  const stats = [
    ["all", "Total records", records.length, "Every record in this section", "total"],
    ["active", "Active", counts.active, "Healthy and in progress", "active"],
    ["attention", "Needs attention", counts.attention, "Follow-up recommended", "attention"],
    ["inactive", "Inactive", counts.inactive, "Inactive or archived", "inactive"],
  ];
  const icons = {
    total: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    active: '<path d="m5 12 4 4L19 6"/>',
    attention: '<path d="M12 3 2.8 19h18.4L12 3Z"/><path d="M12 9v4m0 3h.01"/>',
    inactive: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  };
  return `<section class="record-stats-grid" aria-label="${escapeHtml(resource.nav)} status summary">
    ${stats.map(([group, label, value, description, icon]) => {
      const selected = group === "all" ? !state.statusGroup : state.statusGroup === group;
      return `
      <button class="record-stat-card ${icon === "active" ? "is-highlighted" : ""} ${selected ? "is-selected" : ""}" type="button" data-status-group="${group}" aria-pressed="${selected}">
        <span class="record-stat-icon ${icon}" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[icon]}</svg></span>
        <span class="record-stat-copy"><span class="record-stat-label">${label}</span><strong>${value}</strong><span class="record-stat-description">${description}</span></span>
      </button>
    `}).join("")}
  </section>`;
}

function renderHolidayRegionNote() {
  const message = holidaySyncState.status === "loading"
    ? "Loading public dates for this year and next year…"
    : holidaySyncState.status === "error"
      ? "The public holiday feed could not be refreshed. Existing and manually added dates remain available."
      : `${farmRegion.countryName}'s feed lists public holidays for the selected country. Add local notices manually when they apply only to your area.`;
  return `<aside class="holiday-region-note"><div><strong>${escapeHtml(farmRegion.countryName)} public holidays · ${escapeHtml(farmRegion.name)}</strong><p>${message} Dates are supplied by <a href="https://date.nager.at/" target="_blank" rel="noopener noreferrer">Nager.Date</a>; confirm annual announcements with the relevant authorities.</p></div><span>${holidaySyncState.status === "ready" ? "Synced" : holidaySyncState.status === "loading" ? "Updating" : holidaySyncState.status === "error" ? "Offline" : "Ready"}</span></aside>`;
}

function getFilterField(resource) {
  return resource.fields.find((field) => field.name === "status")
    || resource.fields.find((field) => field.name === "health")
    || resource.fields.find((field) => field.name === "type")
    || resource.fields.find((field) => field.type === "select");
}

function renderList(resource) {
  const state = listState[resource.id] || { query: "", filter: "", sort: "", direction: 1, hiddenColumns: [] };
  const records = filterAndSort(resource, state);
  const filterField = getFilterField(resource);
  const filterOptions = filterField?.options || [];
  const hiddenColumns = new Set(state.hiddenColumns || []);
  const activeFilters = Number(Boolean(state.filter)) + Number(Boolean(state.statusGroup));
  const noStoredRecords = store[resource.id].length === 0;
  const filterMenu = filterOptions.length
    ? `<label class="select-filter"><span>${escapeHtml(filterField.label)}</span><select id="record-filter"><option value="">All</option>${filterOptions.map((option) => `<option value="${escapeHtml(option)}" ${state.filter === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`
    : `<p class="toolbar-menu-note">No status filters are available for this section.</p>`;
  return `
    <div class="page-heading">
      <div><p class="eyebrow">${escapeHtml(resource.group.toUpperCase())}</p><h1>${escapeHtml(resource.nav)}</h1><p class="page-subtitle">Keep ${escapeHtml(resource.nav.toLowerCase())} organized in one place.</p></div>
      ${canEditRecords() ? `<a class="button button-green" href="#/${resource.id}/new">＋ Add ${escapeHtml(resource.singular.toLowerCase())}</a>` : ""}
    </div>
    ${resource.id === "holidays" ? renderHolidayRegionNote() : ""}
    ${renderListStats(resource, state)}
    ${noStoredRecords ? `
      <section class="panel-card quick-create-card">
        <div><p class="eyebrow">GET STARTED</p><h2>No ${escapeHtml(resource.nav)} Yet</h2><p>Create your first ${escapeHtml(resource.singular.toLowerCase())} to start building this section.</p></div>
        <strong class="quick-create-count" aria-label="0 records">0</strong>
        ${canEditRecords() ? `<a class="quick-create-button" href="#/${resource.id}/new"><span aria-hidden="true">+</span>Create your first ${escapeHtml(resource.singular.toLowerCase())}</a>` : ""}
      </section>
    ` : ""}
    <section class="panel-card resource-panel">
      <div class="resource-toolbar">
        <label class="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><span class="sr-only">Search ${escapeHtml(resource.nav)}</span><input id="record-search" type="search" placeholder="Search ${escapeHtml(resource.nav.toLowerCase())}..." value="${escapeHtml(state.query)}"></label>
        <div class="toolbar-right toolbar-controls">
          <div class="toolbar-actions">
            <button class="toolbar-button" type="button" data-action="toggle-filter-menu" aria-expanded="false" aria-controls="record-filter-menu">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6.5 7.5v5l-3 1.5v-6.5L4 5Z"/></svg><span>Filter</span><span class="filter-count">${activeFilters}</span>
            </button>
            <button class="toolbar-button" type="button" data-action="toggle-column-menu" aria-expanded="false" aria-controls="record-column-menu">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M9 4v16m6-16v16"/></svg><span>Columns</span>
            </button>
            <button class="button button-quiet button-export" type="button" data-action="export-current" data-resource="${resource.id}">Export section</button>
            <span class="record-count">${records.length} ${records.length === 1 ? "record" : "records"}</span>
          </div>
          <div class="toolbar-menu" id="record-filter-menu" hidden>${filterMenu}</div>
          <div class="toolbar-menu column-menu" id="record-column-menu" hidden>
            <strong>Toggle columns</strong>
            ${resource.columns.map(([key, label]) => `<label class="column-option"><input type="checkbox" data-column-toggle="${escapeHtml(key)}" ${hiddenColumns.has(key) ? "" : "checked"}><span>${escapeHtml(label)}</span></label>`).join("")}
          </div>
        </div>
      </div>
      ${records.length ? `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>${resource.columns.map(([key, label]) => `<th scope="col" data-column-key="${escapeHtml(key)}" aria-sort="${state.sort === key ? state.direction === 1 ? "ascending" : "descending" : "none"}" ${hiddenColumns.has(key) ? "hidden" : ""}><button class="sort-button" type="button" data-sort="${escapeHtml(key)}" data-resource="${resource.id}">${escapeHtml(label)}<span class="sort-chevron" aria-hidden="true">${state.sort === key && state.direction === 1 ? "⌃" : "⌄"}</span></button></th>`).join("")}<th scope="col" class="actions-heading">Actions</th></tr></thead>
            <tbody>${records.map((record) => `<tr>
              ${resource.columns.map(([key]) => `<td data-column-key="${escapeHtml(key)}" ${hiddenColumns.has(key) ? "hidden" : ""}>${renderCell(resource, key, record[key], record)}</td>`).join("")}
              <td class="row-actions">${canEditRecords() ? `
                ${resource.id === "equipment" ? `<a class="row-action" href="#/equipment-services/new/${encodeURIComponent(record.id)}">Log service</a>` : ""}
                <a class="row-action" href="#/${resource.id}/edit/${encodeURIComponent(record.id)}">Edit</a>
                <button class="row-action danger-action" type="button" data-action="delete" data-resource="${resource.id}" data-id="${escapeHtml(record.id)}">Delete</button>` : ""}
              </td>
            </tr>`).join("")}</tbody>
          </table>
        </div>
      ` : `
        <div class="table-empty-state" role="status">
          <span class="empty-x-icon" aria-hidden="true">×</span>
          <strong>No Records Found</strong>
          <p>${state.query || state.filter || state.statusGroup ? "Try changing your search or filters to see records." : `Records you add to ${escapeHtml(resource.nav.toLowerCase())} will appear here.`}</p>
        </div>
      `}
    </section>
  `;
}

function renderCell(resource, key, value, record) {
  if (key === "warranty") return renderWarrantyCell(record);
  if (key === "nextService") return renderNextServiceCell(record);
  if (key === "cropCount") value = store.crops.filter((crop) => crop.field === record.id).length;
  if (key === "animalCount") value = store.animals.filter((animal) => animal.field === record.id).length;
  const field = resource.fields.find((item) => item.name === key);
  if (field?.type === "relation") {
    const related = store[field.relation].find((item) => item.id === value);
    value = related ? related.name || related.hiveNumber || related.title : value;
  }
  if (field?.type === "related-record" && value) {
    const [resourceId, recordId] = String(value).split("::");
    const related = store[resourceId]?.find((item) => item.id === recordId);
    value = related ? related.name || related.title || related.hiveNumber || related.tag : value;
  }
  if (key === "date" || key.toLowerCase().includes("date") || key === "established") return escapeHtml(formatDate(value));
  if (["amount", "cost", "purchaseCost"].includes(key)) return value === "" || value == null ? "—" : `${escapeHtml(farmProfile.currency)} ${escapeHtml(Number(value).toFixed(2))}`;
  if (key === "active") return value ? `<span class="status-pill status-green">Active</span>` : `<span class="status-pill">Inactive</span>`;
  if (key === "status") return `<span class="status-pill ${statusClass(value)}">${escapeHtml(value || "—")}</span>`;
  return escapeHtml(value || "—");
}

function statusClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (["active", "healthy", "complete", "completed", "approved", "growing", "income"].includes(normalized)) return "status-green";
  if (["urgent", "needs attention", "under treatment", "declined", "out of service"].includes(normalized)) return "status-red";
  if (["in progress", "pending", "planned", "expense", "scheduled", "under maintenance"].includes(normalized)) return "status-amber";
  return "";
}

function formatDate(value) {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function filterAndSort(resource, state) {
  const query = state.query.trim().toLowerCase();
  const filtered = store[resource.id].filter((record) => {
    const matchesText = !query || Object.values(record).some((value) => String(value ?? "").toLowerCase().includes(query));
    const filterField = getFilterField(resource);
    const matchesStatus = !state.filter || String(record[filterField?.name] || "") === state.filter;
    const matchesGroup = !state.statusGroup || classifyRecordState(record, resource.id) === state.statusGroup;
    return matchesText && matchesStatus && matchesGroup;
  });
  if (state.sort) {
    filtered.sort((a, b) => String(a[state.sort] ?? "").localeCompare(String(b[state.sort] ?? ""), undefined, { numeric: true }) * state.direction);
  }
  return filtered;
}
