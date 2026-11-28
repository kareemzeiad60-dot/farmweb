const test = require("node:test");
const assert = require("node:assert/strict");
const { openApp, FARM } = require("./helpers/fake-app.js");
const { localIsoDate } = require("../src/ui/equipment.js");

const now = "2026-11-16T19:00:12Z";
const plusDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
};
const TRACTOR = "aaaaaaaa-0000-4000-8000-000000000001";
const PLOUGH = "aaaaaaaa-0000-4000-8000-000000000002";
const BALER = "aaaaaaaa-0000-4000-8000-000000000003";
const base = { farm_id: FARM, extra: {}, created_at: now, updated_at: now };
const machine = (id, name, extra) => ({ ...base, id, name, category: "Tractor", make: "", model: "", serial_number: "", purchase_date: null, purchase_cost: null, supplier: "", status: "Active", location: "", hours_meter: null, warranty_expiry: null, warranty_notes: "", notes: "", ...extra });
const serviceRow = (id, equipmentId, extra) => ({ ...base, id, equipment_id: equipmentId, service_type: "Routine service", status: "Completed", service_date: "2026-10-01", hours_at_service: null, cost: null, performed_by: "", next_service_date: null, next_service_hours: null, notes: "", ...extra });

function sampleTables() {
  return {
    equipment: [
      machine(TRACTOR, "John Deere 5075E", { make: "John Deere", warranty_expiry: plusDays(20), hours_meter: 1200 }),
      machine(PLOUGH, "Disc plough", { category: "Implement", warranty_expiry: plusDays(400) }),
      machine(BALER, "Old baler", { category: "Machinery", status: "Retired" }),
    ],
    equipment_services: [
      serviceRow("bbbbbbbb-0000-4000-8000-000000000001", TRACTOR, { next_service_date: plusDays(-5), cost: 350 }),
      serviceRow("bbbbbbbb-0000-4000-8000-000000000002", PLOUGH, { next_service_date: plusDays(100) }),
    ],
  };
}

test("equipment: navigation, warranty and service tracking, logging a service", { timeout: 120000 }, async () => {
  const app = await openApp({ tables: sampleTables() });
  const nav = app.document.querySelector("#sidebar-nav").textContent.replace(/\s+/g, " ");
  assert.match(nav, /Equipment/);
  assert.match(nav, /Service Log/);

  await app.go("#/equipment");
  const text = app.text();
  assert.match(text, /John Deere 5075E/);
  assert.match(text, /Disc plough/);
  assert.match(text, /Expires in 20 days/);
  assert.match(text, /Overdue/);
  assert.match(text, /Active\s*until/);

  const cards = [...app.document.querySelectorAll("[data-status-group]")].map((card) => [card.dataset.statusGroup, card.querySelector("strong").textContent]);
  assert.deepEqual(Object.fromEntries(cards), { all: "3", active: "1", attention: "1", inactive: "1" });

  app.document.querySelector('[data-status-group="attention"]').click();
  await app.sleep(200);
  assert.match(app.text(), /John Deere 5075E/);
  assert.doesNotMatch(app.text(), /Disc plough/);

  const logLink = app.document.querySelector(`a[href="#/equipment-services/new/${TRACTOR}"]`);
  assert.ok(logLink, "Log service link on the equipment row");
  await app.go(logLink.getAttribute("href"));
  const form = app.document.querySelector("#record-form");
  assert.equal(form.elements.equipment.value, TRACTOR);
  assert.equal(form.elements.status.value, "Completed");
  assert.equal(form.elements.serviceDate.value, localIsoDate());

  form.elements.serviceType.value = "Oil & filter change";
  form.elements.hoursAtService.value = "1200";
  form.elements.cost.value = "420.5";
  form.elements.nextServiceDate.value = plusDays(180);
  form.requestSubmit();
  await app.sleep(300);
  const upsert = app.calls.find((call) => call.op === "upsert" && call.table === "equipment_services");
  assert.ok(upsert, "service saved to equipment_services");
  const row = upsert.rows[0];
  assert.equal(row.equipment_id, TRACTOR);
  assert.equal(row.farm_id, FARM);
  assert.equal(row.service_type, "Oil & filter change");
  assert.equal(row.hours_at_service, 1200);
  assert.equal(row.cost, 420.5);
  assert.equal(row.next_service_date, plusDays(180));
  assert.equal(row.next_service_hours, null);
  assert.match(row.id, /^[0-9a-f-]{36}$/);

  await app.go("#/equipment");
  const after = [...app.document.querySelectorAll("[data-status-group]")].map((card) => [card.dataset.statusGroup, card.querySelector("strong").textContent]);
  assert.equal(Object.fromEntries(after).attention, "0", "new completed service clears the overdue state");

  await app.go("#/equipment-services");
  assert.match(app.text(), /John Deere 5075E/);
  assert.match(app.text(), /Oil & filter change/);
  app.close();
});

test("equipment: deleting a machine also removes its service log", { timeout: 120000 }, async () => {
  const app = await openApp({ tables: sampleTables() });
  await app.go("#/equipment");
  app.document.querySelector(`[data-action="delete"][data-id="${TRACTOR}"]`).click();
  await app.sleep(300);
  const del = app.calls.find((call) => call.op === "delete" && call.table === "equipment");
  assert.deepEqual(del.filters, { farm_id: FARM, id: TRACTOR });
  await app.go("#/equipment-services");
  assert.doesNotMatch(app.text(), /John Deere/);
  assert.match(app.text(), /Disc plough/);
  app.close();
});

test("equipment: dashboard shows the equipment card with attention count", { timeout: 120000 }, async () => {
  const app = await openApp({ tables: sampleTables() });
  await app.go("#/");
  assert.match(app.text(), /Equipment/);
  assert.match(app.text(), /1 need attention/);
  app.close();
});

test("equipment: viewers can look but not change", { timeout: 120000 }, async () => {
  const app = await openApp({ role: "viewer", tables: sampleTables() });
  await app.go("#/equipment");
  assert.match(app.text(), /John Deere 5075E/);
  assert.equal(app.document.querySelector('a[href="#/equipment/new"]'), null);
  assert.equal(app.document.querySelector('a[href^="#/equipment-services/new"]'), null);
  assert.equal(app.document.querySelector('[data-action="delete"]'), null);
  app.close();
});

test("equipment: app still works before migration 005 and explains what to run", { timeout: 120000 }, async () => {
  const app = await openApp({ tables: { crops: [] }, missingTables: ["equipment", "equipment_services"] });
  assert.equal(app.document.querySelector("#app-shell").hidden, false, "app loads without the equipment tables");
  await app.go("#/equipment");
  assert.match(app.text(), /No Records Found/);
  await app.go("#/equipment/new");
  const form = app.document.querySelector("#record-form");
  assert.equal(form.elements.status.value, "Active");
  form.elements.name.value = "Tractor";
  form.elements.category.value = "Tractor";
  form.requestSubmit();
  await app.sleep(300);
  assert.match(app.toast(), /005_equipment\.sql/);
  app.close();
});
