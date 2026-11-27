// Create / edit / delete / import / export records.

async function saveForm(form) {
  if (!canEditRecords()) {
    showToast("Your role is read-only.");
    return;
  }
  const resource = resourceById.get(form.dataset.resource);
  const id = form.dataset.id;
  const formData = new FormData(form);
  const values = {};
  for (const field of resource.fields) {
    values[field.name] = field.type === "checkbox" ? form.elements[field.name].checked : String(formData.get(field.name) || "").trim();
  }

  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    showToast("The end date must be on or after the start date.");
    form.elements.endDate.focus();
    return;
  }

  const current = store[resource.id];
  const now = new Date().toISOString();
  const nextRecord = id
    ? { ...current.find((record) => record.id === id), ...values, updatedAt: now }
    : { id: makeId(), ...values, createdAt: now, updatedAt: now };
  const nextRows = id
    ? current.map((record) => record.id === id ? nextRecord : record)
    : [nextRecord, ...current];
  const cloudChanges = [{ type: "upsert", resourceId: resource.id, records: [nextRecord] }];
  if (!await commit({ ...store, [resource.id]: nextRows }, cloudChanges)) return;
  location.hash = `/${resource.id}`;
  showToast(id ? "Record updated." : "Record added.");
}

async function deleteRecord(resourceId, id) {
  if (!canEditRecords()) {
    showToast("Your role is read-only.");
    return;
  }
  const resource = resourceById.get(resourceId);
  const record = store[resourceId].find((item) => item.id === id);
  if (!resource || !record) {
    showToast("That record is no longer available.");
    return;
  }
  const label = record.name || record.title || record.hiveNumber || resource.singular.toLowerCase();
  if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;
  const cloudChanges = [{ type: "delete", resourceId, recordId: id }];
  if (await commit({ ...store, [resourceId]: store[resourceId].filter((item) => item.id !== id) }, cloudChanges)) {
    render();
    showToast("Record deleted.");
  }
}

function closeToolbarMenus() {
  document.querySelectorAll(".toolbar-menu").forEach((menu) => { menu.hidden = true; });
  document.querySelectorAll('[data-action="toggle-filter-menu"], [data-action="toggle-column-menu"]').forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function exportData(resourceId) {
  const payload = {
    format: "fieldwise-workspace",
    version: 1,
    exportedAt: new Date().toISOString(),
    records: resourceId ? { [resourceId]: store[resourceId] } : store,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = resourceId ? `fieldwise-${resourceId}.json` : "fieldwise-workspace.json";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Workspace export downloaded.");
}

async function importData(file) {
  if (!canEditRecords()) {
    showToast("Your role is read-only.");
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch (error) {
    console.error("The selected file is not valid JSON.", error);
    showToast("Could not read that file as JSON.");
    return;
  }
  if (parsed.format !== "fieldwise-workspace" || parsed.version !== 1 || !parsed.records || typeof parsed.records !== "object") {
    showToast("Unsupported file. Import a Fieldwise workspace JSON export.");
    return;
  }
  const next = { ...store };
  const cloudChanges = [];
  for (const [resourceId, imported] of Object.entries(parsed.records)) {
    if (!resourceById.has(resourceId) || !Array.isArray(imported)) {
      showToast(`The export contains an unsupported section: ${resourceId}.`);
      return;
    }
    const currentById = new Map(next[resourceId].map((record) => [record.id, record]));
    for (const record of imported) {
      if (!record || typeof record !== "object" || typeof record.id !== "string") {
        showToast(`A record in ${resourceById.get(resourceId).nav} is invalid.`);
        return;
      }
      currentById.set(record.id, record);
    }
    next[resourceId] = Array.from(currentById.values());
    if (imported.length) cloudChanges.push({ type: "upsert", resourceId, records: imported });
  }
  if (await commit(next, cloudChanges)) {
    render();
    showToast("Workspace data imported.");
  }
}

async function importLocalData() {
  if (!currentUser) return;
  if (!canEditRecords()) {
    showToast("Your role is read-only.");
    return;
  }
  const localStore = loadStore();
  const localCount = resources.reduce((total, resource) => total + localStore[resource.id].length, 0);
  if (!localCount) {
    showToast("There are no local browser records to import.");
    return;
  }
  if (!window.confirm(`Import ${localCount} local record(s) into ${currentFarmName}? Matching record IDs will be replaced.`)) return;

  const next = { ...store };
  const cloudChanges = [];
  for (const resource of resources) {
    const records = localStore[resource.id];
    if (!records.length) continue;
    const byId = new Map(next[resource.id].map((record) => [record.id, record]));
    for (const record of records) byId.set(record.id, record);
    next[resource.id] = Array.from(byId.values());
    cloudChanges.push({ type: "upsert", resourceId: resource.id, records });
  }
  if (await commit(next, cloudChanges)) {
    render();
    showToast(`${localCount} local record(s) imported to your farm.`);
  }
}
