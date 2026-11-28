// Equipment warranty and service tracking, computed from the equipment and service-log records.

const equipmentWarrantySoonDays = 60;
const equipmentServiceSoonDays = 30;

function localIsoDate(date = new Date()) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysBetween(fromIso, toIso) {
  return Math.round((new Date(`${toIso}T00:00:00`) - new Date(`${fromIso}T00:00:00`)) / 86400000);
}

// key: none | active | expiring | expired
function warrantyState(record, today = localIsoDate()) {
  const days = record.warrantyExpiry ? daysBetween(today, record.warrantyExpiry) : NaN;
  if (Number.isNaN(days)) return { key: "none", date: "", days: null };
  const key = days < 0 ? "expired" : days <= equipmentWarrantySoonDays ? "expiring" : "active";
  return { key, date: record.warrantyExpiry, days };
}

// The next service is the earliest of: scheduled services, and the "next due" date of the most
// recent completed service. It is overdue by date, or by hours when the hour meter has reached
// that service's "next service at" reading.
// key: none | scheduled | soon | overdue
function serviceState(record, services, today = localIsoDate()) {
  const none = { key: "none", date: "", days: null, byHours: false };
  if (String(record.status).toLowerCase() === "retired") return none;

  const own = services.filter((service) => service.equipment === record.id && service.serviceDate);
  const scheduledDates = own.filter((service) => service.status === "Scheduled").map((service) => service.serviceDate);
  const latest = own.filter((service) => service.status !== "Scheduled")
    .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))[0];

  const dates = [...scheduledDates];
  if (latest?.nextServiceDate) dates.push(latest.nextServiceDate);
  dates.sort();
  const date = dates[0] || "";
  const days = date ? daysBetween(today, date) : null;

  const hasHours = latest && latest.nextServiceHours !== "" && record.hoursMeter !== "";
  const byHours = Boolean(hasHours) && Number(record.hoursMeter) >= Number(latest.nextServiceHours);

  let key = none.key;
  if (byHours || (days !== null && days < 0)) key = "overdue";
  else if (days !== null && days <= equipmentServiceSoonDays) key = "soon";
  else if (date) key = "scheduled";
  return { key, date, days, byHours };
}

// "attention" when service is overdue / due soon; null leaves the normal status rules in charge.
function equipmentAttentionState(record) {
  const { key } = serviceState(record, store["equipment-services"]);
  return key === "overdue" || key === "soon" ? "attention" : null;
}

function equipmentAttentionCount() {
  return store.equipment.filter((record) => classifyRecordState(record, "equipment") === "attention").length;
}

function pluralDays(days) {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function renderWarrantyCell(record) {
  const warranty = warrantyState(record);
  if (warranty.key === "none") return "—";
  const when = escapeHtml(formatDate(warranty.date));
  if (warranty.key === "expired") return `<span class="status-pill status-red">Expired</span> <small>${when}</small>`;
  if (warranty.key === "expiring") {
    const label = warranty.days === 0 ? "Expires today" : `Expires in ${pluralDays(warranty.days)}`;
    return `<span class="status-pill status-amber">${label}</span> <small>${when}</small>`;
  }
  return `<span class="status-pill status-green">Active</span> <small>until ${when}</small>`;
}

function renderNextServiceCell(record) {
  const service = serviceState(record, store["equipment-services"]);
  const when = service.date ? escapeHtml(formatDate(service.date)) : "";
  if (service.key === "none") return "—";
  if (service.key === "overdue") {
    const label = service.byHours && !(service.days !== null && service.days < 0) ? "Overdue · hours" : "Overdue";
    return `<span class="status-pill status-red">${label}</span>${when ? ` <small>${when}</small>` : ""}`;
  }
  if (service.key === "soon") {
    const label = service.days === 0 ? "Due today" : `Due in ${pluralDays(service.days)}`;
    return `<span class="status-pill status-amber">${label}</span> <small>${when}</small>`;
  }
  return when;
}

// Starting values for new records.
function formDefaults(resource, prefill) {
  if (resource.id === "equipment") return { status: "Active" };
  if (resource.id === "equipment-services") return { status: "Completed", serviceDate: localIsoDate(), equipment: prefill || "" };
  return {};
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { warrantyState, serviceState, localIsoDate, daysBetween };
}
