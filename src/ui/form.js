// Resource form page.

function renderForm(resource, recordId) {
  if (!canEditRecords()) {
    return `<section class="panel-card empty-state"><span class="empty-symbol">⌕</span><h1>Read-only access</h1><p>Your role (${escapeHtml(roleLabel(currentRole))}) can view records but not change them. Ask the farm owner for a different role.</p><a class="button button-quiet" href="#/${resource.id}">Back to ${escapeHtml(resource.nav)}</a></section>`;
  }
  const record = recordId ? store[resource.id].find((item) => item.id === recordId) : null;
  if (recordId && !record) return `<section class="panel-card empty-state"><h1>Record not found</h1><p>This item may have been removed from the local workspace.</p><a class="button button-quiet" href="#/${resource.id}">Back to ${escapeHtml(resource.nav)}</a></section>`;
  const title = record ? `Edit ${resource.singular.toLowerCase()}` : `New ${resource.singular.toLowerCase()}`;
  return `
    <div class="page-heading">
      <div><p class="eyebrow"><a href="#/${resource.id}" class="breadcrumb-link">${escapeHtml(resource.nav)}</a> / ${record ? "EDIT" : "NEW"}</p><h1>${escapeHtml(title)}</h1><p class="page-subtitle">Add clear, useful details to your farm records.</p></div>
    </div>
    <form class="record-form panel-card" id="record-form" data-resource="${resource.id}" data-id="${escapeHtml(recordId || "")}">
      <div class="form-grid">
        ${resource.fields.filter((field) => field.type !== "related-record").map((field) => renderField(resource, field, record ? record[field.name] : "")).join("")}
      </div>
      ${renderRelatedRecordAccordion(resource, record)}
      <div class="form-actions">
        <a class="button button-quiet" href="#/${resource.id}">Cancel</a>
        <button class="button button-green" type="submit">${record ? "Save changes" : `Create ${escapeHtml(resource.singular.toLowerCase())}`}</button>
      </div>
    </form>
  `;
}

function renderField(resource, field, value) {
  const type = field.type || "text";
  const wide = type === "textarea";
  const fieldLabel = field.name === "amount" && resource.id === "financial-records"
    ? `Amount (${farmProfile.currency})`
    : field.label;
  const label = `${escapeHtml(fieldLabel)}${field.required ? ' <span class="required-mark">*</span>' : ""}`;
  const common = `name="${escapeHtml(field.name)}" id="field-${escapeHtml(field.name)}" ${field.required ? "required" : ""} ${field.min != null ? `min="${field.min}"` : ""} ${field.step ? `step="${field.step}"` : ""}`;
  let control;
  if (type === "textarea") {
    control = `<textarea ${common} rows="4">${escapeHtml(value)}</textarea>`;
  } else if (type === "checkbox") {
    control = `<span class="checkbox-wrap"><input ${common} type="checkbox" ${value ? "checked" : ""}><span>Yes</span></span>`;
  } else if (type === "select" || type === "relation") {
    const options = type === "relation"
      ? relationOptions(field.relation)
      : field.options.map((option) => [option, option]);
    control = `<select ${common}><option value="">Choose an option</option>${options.map(([optionValue, optionLabel]) => `<option value="${escapeHtml(optionValue)}" ${String(value) === String(optionValue) ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}</select>`;
  } else if (field.name === "amount" && resource.id === "financial-records") {
    control = `<span class="input-group"><span class="currency-prefix">${escapeHtml(farmProfile.currency)}</span><input ${common} type="number" value="${escapeHtml(value)}"></span>`;
  } else {
    const inputType = ["number", "date", "email", "tel"].includes(type) ? type : "text";
    control = `<input ${common} type="${inputType}" value="${escapeHtml(value)}">`;
  }
  const hint = fieldHint(resource, field);
  return `<label class="form-field ${wide ? "field-wide" : ""}" for="field-${escapeHtml(field.name)}"><span class="field-label">${label}</span>${control}<small>${escapeHtml(hint)}</small></label>`;
}

function fieldHint(resource, field) {
  if (field.hint) return field.hint;
  if (field.name === "reference") return "Use the invoice or receipt code to make this transaction easy to trace.";
  if (field.name === "amount") return `Enter the total amount in ${farmProfile.currency}.`;
  if (field.type === "related-record") return "Link this entry to an existing farm record.";
  if (field.type === "relation") return "Choose an existing related record from your workspace.";
  if (field.type === "date") return "Select the date associated with this record.";
  if (field.required) return `Required. Enter ${field.label.toLowerCase()}.`;
  return `Optional. Add ${field.label.toLowerCase()} details when available.`;
}

function renderRelatedRecordAccordion(resource, record) {
  const field = resource.fields.find((item) => item.type === "related-record");
  if (!field) return "";
  const value = String(record?.[field.name] || "");
  const options = relatedRecordSources.map((resourceId) => {
    const relatedResource = resourceById.get(resourceId);
    const items = store[resourceId].map((item) => {
      const itemName = item.name || item.title || item.hiveNumber || item.tag || item.id;
      return `<option value="${escapeHtml(`${resourceId}::${item.id}`)}" ${value === `${resourceId}::${item.id}` ? "selected" : ""}>${escapeHtml(itemName)}</option>`;
    });
    return items.length ? `<optgroup label="${escapeHtml(relatedResource.nav)}">${items.join("")}</optgroup>` : "";
  }).filter(Boolean).join("");
  const hasSavedOption = value && !relatedRecordSources.some((resourceId) => store[resourceId].some((item) => value === `${resourceId}::${item.id}`));
  return `
    <details class="related-record-accordion" ${value ? "open" : ""}>
      <summary><span class="related-record-heading"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13.5a5 5 0 0 0 7.1 0l2.4-2.4a5 5 0 0 0-7.1-7.1l-1.4 1.4"/><path d="M14 10.5a5 5 0 0 0-7.1 0l-2.4 2.4a5 5 0 0 0 7.1 7.1l1.4-1.4"/></svg><span><strong>Related Record</strong><small>Connect this entry to another farm record</small></span></span><span class="accordion-chevron" aria-hidden="true">⌄</span></summary>
      <div class="related-record-content">
        <label class="form-field" for="field-relatedRecord"><span class="field-label">${escapeHtml(field.label)}</span>
          <select class="related-record-select ${value ? "has-selection" : ""}" name="${escapeHtml(field.name)}" id="field-${escapeHtml(field.name)}">
            <option value="" ${value ? "" : "selected"}>No related record</option>
            ${options || ""}
            ${hasSavedOption ? `<option value="${escapeHtml(value)}" selected>Previously saved link</option>` : ""}
          </select>
          <small>Select an animal, field, crop, or livestock group to link this record.</small>
        </label>
      </div>
    </details>
  `;
}

function relationOptions(resourceId) {
  const related = resourceById.get(resourceId);
  if (!related) return [];
  return store[resourceId].map((record) => {
    const label = record.name || record.hiveNumber || record.title || record.id;
    return [record.id, label];
  });
}
