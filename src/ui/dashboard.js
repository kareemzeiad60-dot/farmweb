// Dashboard page.

function renderDashboard() {
  const canEdit = canEditRecords();
  const stats = [
    ["animals", "Livestock", "Animals registered", "green", "♧", () => store.animals.length],
    ["crops", "Crop records", "Crops in the workspace", "green", "♧", () => store.crops.length],
    ["crop-fields", "Crop fields", "Areas under cultivation", "blue", "▦", () => store["crop-fields"].length],
    ["bee-hives", "Beehives", "Apiary locations", "green", "▤", () => store["bee-hives"].length],
    ["equipment", "Equipment", equipmentAttentionCount() ? `${equipmentAttentionCount()} need attention` : "Machines and implements", "amber", "⚒", () => store.equipment.length],
    ["tasks", "Open tasks", "Work to follow up", "amber", "☷", () => store.tasks.filter((task) => task.status !== "Complete").length],
    ["financial-records", "Financial records", "Income and expenses", "blue", "↗", () => store["financial-records"].length],
  ];
  const recent = resources.filter((resource) => resource.id !== "users").flatMap((resource) => store[resource.id].map((record) => ({
    resource, record,
  }))).sort((a, b) => String(b.record.updatedAt || b.record.createdAt || "").localeCompare(String(a.record.updatedAt || a.record.createdAt || ""))).slice(0, 5);

  return `
    <div class="page-heading">
      <div><p class="eyebrow">FARM WORKSPACE</p><h1>Dashboard</h1><p class="page-subtitle">A clear view of your fields, animals, and daily work.</p></div>
      ${canEdit ? '<a class="button button-green" href="#/tasks/new">＋ New task</a>' : ""}
    </div>
    <section class="weather-section" aria-labelledby="weather-heading">${renderWeatherCards()}</section>
    <section class="dashboard-section overview-section" aria-labelledby="overview-heading">
      <div class="section-heading-row"><div><p class="eyebrow">FARM SUMMARY</p><h2 class="section-title" id="overview-heading"><span class="overview-chart-icon" aria-hidden="true"><i></i><i></i><i></i></span>Farm Overview</h2></div><span class="overview-period">Live counts</span></div>
      <div class="stats-grid">
        ${stats.map(([id, title, caption, color, icon, count]) => `
          <a class="stat-card stat-card-dashboard" href="#/${id}">
            <div class="stat-top"><span>${escapeHtml(title)}</span><span class="stat-icon ${color}">${icon}</span></div>
            <strong class="stat-value">${count()}</strong>
            <span class="stat-subtitle ${color}-subtitle">${escapeHtml(caption)} <span class="stat-subtitle-icon" aria-hidden="true">${icon}</span></span>
          </a>
        `).join("")}
      </div>
    </section>
    <section class="dashboard-welcome relative isolate mb-8 flex min-h-[220px] items-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#14171a] to-[#0b0d0e] px-6 py-7 shadow-lg shadow-black/20 sm:px-8 sm:py-8">
      <div class="welcome-copy relative z-10 max-w-2xl">
        <span class="welcome-kicker mb-4 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-emerald-300">YOUR FARM, AT A GLANCE</span>
        <h2 class="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">Make today a good day in the field.</h2>
        <p class="mt-2 max-w-lg text-sm leading-6 text-gray-400">Keep important records together, plan the work ahead, and spot what needs attention.</p>
        ${canEdit ? `        <div class="welcome-actions">
          <a class="button button-green bg-emerald-600 text-white shadow-sm shadow-emerald-950/40 transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400" href="#/crop-fields/new">Add a field</a>
          <a class="button button-quiet border border-white/10 bg-white/[0.03] text-gray-200 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white" href="#/animals/new">Register livestock</a>
        </div>` : ""}
      </div>
      <div class="welcome-art" aria-hidden="true"><span class="sun-disc bg-emerald-400/20 shadow-[0_0_70px_rgba(16,185,129,0.2)]"></span><span class="field-line line-one border-emerald-400/20"></span><span class="field-line line-two border-emerald-400/20"></span><span class="field-line line-three border-emerald-400/20"></span><span class="sprout text-emerald-400/60">✳</span></div>
    </section>
    <div class="dashboard-columns">
      <section class="panel-card recent-card">
        <div class="card-heading"><div><p class="eyebrow">LATEST CHANGES</p><h2>Recent records</h2></div><a class="text-link" href="#/tasks">View tasks</a></div>
        ${recent.length ? `<div class="recent-list">${recent.map(({ resource, record }) => `
          <a class="recent-row" href="#/${resource.id}/edit/${encodeURIComponent(record.id)}">
            <span class="recent-icon">${navigationIcon(resource.id)}</span>
            <span class="recent-copy"><strong>${escapeHtml(record.name || record.title || record.description || resource.singular)}</strong><small>${escapeHtml(resource.nav)} · ${escapeHtml(formatDate((record.updatedAt || record.createdAt || "").slice(0, 10)) || "Just now")}</small></span>
            <span class="recent-arrow">›</span>
          </a>`).join("")}</div>` : `<div class="empty-recent"><span class="empty-symbol">✳</span><strong>No records yet</strong><p>Add your first crop, animal, or task to start building your farm log.</p><a class="text-link" href="#/crop-fields/new">Create your first record →</a></div>`}
      </section>
    </div>
    ${canEdit ? `
    <section class="dashboard-section quick-links-section">
      <div class="section-heading-row"><div><p class="eyebrow">SHORTCUTS</p><h2 class="section-title">Common tasks</h2></div></div>
      <div class="quick-links">
        <a href="#/financial-records/new"><span class="quick-icon green">↗</span><span><strong>Log a transaction</strong><small>Record income or spending</small></span><span class="quick-arrow">›</span></a>
        <a href="#/hive-inspections/new"><span class="quick-icon amber">⌕</span><span><strong>Inspect a hive</strong><small>Save a colony check-up</small></span><span class="quick-arrow">›</span></a>
        <a href="#/worker-leaves/new"><span class="quick-icon blue">◷</span><span><strong>Plan leave</strong><small>Manage team availability</small></span><span class="quick-arrow">›</span></a>
      </div>
    </section>
    ` : ""}
  `;
}
