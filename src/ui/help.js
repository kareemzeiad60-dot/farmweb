// Help center page.

function renderHelp() {
  const storageHelp = isSupabaseMode
    ? "Your records sync securely to your account. Export a JSON snapshot for backup or import this browser's saved records from the account menu."
    : "This workspace currently saves records in this browser. Connect cloud storage in the app configuration to enable secure accounts.";
  return `
    <div class="page-heading"><div><p class="eyebrow">SUPPORT</p><h1>Help center</h1><p class="page-subtitle">Simple guidance for keeping your farm workspace useful.</p></div></div>
    <div class="help-grid">
      <article class="panel-card help-card"><span class="help-icon green">01</span><h2>Start with your farm layout</h2><p>Add fields first, then connect crops, livestock, and apiary records to the places where they belong.</p><a href="#/crop-fields" class="text-link">Browse farm areas →</a></article>
      <article class="panel-card help-card"><span class="help-icon blue">02</span><h2>Keep records current</h2><p>Use notes, dates, and status values to make routine reviews easier for everyone on the team.</p><a href="#/tasks" class="text-link">Review tasks →</a></article>
      <article class="panel-card help-card"><span class="help-icon amber">03</span><h2>Back up your workspace</h2><p>Export a JSON snapshot from the account menu before clearing browser storage or moving devices.</p><button class="text-link button-as-link" type="button" data-action="export-all">Export workspace →</button></article>
    </div>
    <section class="panel-card help-note"><strong>${isSupabaseMode ? "Cloud workspace" : "Local preview"}</strong><p>${storageHelp}</p></section>
  `;
}
