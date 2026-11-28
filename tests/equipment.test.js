const test = require("node:test");
const assert = require("node:assert/strict");
const { warrantyState, serviceState, daysBetween } = require("../src/ui/equipment.js");

const TODAY = "2026-11-28";
const plusDays = (n) => {
  const date = new Date(`${TODAY}T00:00:00`);
  date.setDate(date.getDate() + n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const machine = (extra = {}) => ({ id: "m1", status: "Active", hoursMeter: "", ...extra });
const service = (extra = {}) => ({ equipment: "m1", status: "Completed", serviceDate: "2026-01-01", nextServiceDate: "", nextServiceHours: "", ...extra });

test("daysBetween counts calendar days", () => {
  assert.equal(daysBetween("2026-11-28", "2026-11-29"), 1);
  assert.equal(daysBetween("2026-11-28", "2026-11-27"), -1);
  assert.equal(daysBetween("2026-03-28", "2026-03-30"), 2);
});

test("warranty states", () => {
  assert.equal(warrantyState(machine(), TODAY).key, "none");
  assert.equal(warrantyState(machine({ warrantyExpiry: "" }), TODAY).key, "none");
  assert.equal(warrantyState(machine({ warrantyExpiry: plusDays(-1) }), TODAY).key, "expired");
  assert.deepEqual(warrantyState(machine({ warrantyExpiry: plusDays(0) }), TODAY).key, "expiring");
  assert.equal(warrantyState(machine({ warrantyExpiry: plusDays(60) }), TODAY).key, "expiring");
  assert.equal(warrantyState(machine({ warrantyExpiry: plusDays(61) }), TODAY).key, "active");
  assert.equal(warrantyState(machine({ warrantyExpiry: plusDays(10) }), TODAY).days, 10);
});

test("service: nothing logged, retired, or other machine's records", () => {
  assert.equal(serviceState(machine(), [], TODAY).key, "none");
  assert.equal(serviceState(machine({ status: "Retired" }), [service({ nextServiceDate: plusDays(-5) })], TODAY).key, "none");
  assert.equal(serviceState(machine(), [service({ equipment: "other", nextServiceDate: plusDays(-5) })], TODAY).key, "none");
});

test("service: due dates from the latest completed service", () => {
  assert.equal(serviceState(machine(), [service({ nextServiceDate: plusDays(90) })], TODAY).key, "scheduled");
  assert.equal(serviceState(machine(), [service({ nextServiceDate: plusDays(30) })], TODAY).key, "soon");
  assert.equal(serviceState(machine(), [service({ nextServiceDate: plusDays(0) })], TODAY).key, "soon");
  const overdue = serviceState(machine(), [service({ nextServiceDate: plusDays(-3) })], TODAY);
  assert.equal(overdue.key, "overdue");
  assert.equal(overdue.days, -3);
});

test("service: only the most recent completed service sets the next due date", () => {
  const old = service({ serviceDate: "2025-01-01", nextServiceDate: plusDays(-100) });
  const recent = service({ serviceDate: "2026-10-01", nextServiceDate: plusDays(200) });
  assert.equal(serviceState(machine(), [old, recent], TODAY).key, "scheduled");
  const recentWithoutDue = service({ serviceDate: "2026-10-01" });
  assert.equal(serviceState(machine(), [old, recentWithoutDue], TODAY).key, "none");
});

test("service: scheduled services count and the earliest date wins", () => {
  const completed = service({ nextServiceDate: plusDays(100) });
  const planned = service({ status: "Scheduled", serviceDate: plusDays(5) });
  const result = serviceState(machine(), [completed, planned], TODAY);
  assert.equal(result.key, "soon");
  assert.equal(result.date, plusDays(5));
  assert.equal(serviceState(machine(), [service({ status: "Scheduled", serviceDate: plusDays(-1) })], TODAY).key, "overdue");
});

test("service: overdue by engine hours", () => {
  const log = [service({ nextServiceHours: "1300" })];
  assert.equal(serviceState(machine({ hoursMeter: "1299.9" }), log, TODAY).key, "none");
  const due = serviceState(machine({ hoursMeter: "1300" }), log, TODAY);
  assert.equal(due.key, "overdue");
  assert.equal(due.byHours, true);
  assert.equal(serviceState(machine({ hoursMeter: "" }), log, TODAY).key, "none");
  assert.equal(serviceState(machine({ hoursMeter: "50" }), [service({ nextServiceHours: "" })], TODAY).key, "none");
});
