const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

// Loads the browser scripts the data layer needs into one shared context (classic-script semantics).
function createContext(fakeClient) {
  const context = vm.createContext({ console, sb: fakeClient });
  for (const file of [
    "src/data/db-schema.js",
    "src/data/resources/crops.js", "src/data/resources/apiary.js", "src/data/resources/livestock.js",
    "src/data/resources/finance.js", "src/data/resources/hr.js", "src/data/resources/index.js",
    "src/services/records-db.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  }
  vm.runInContext(
    "function emptyStore() { return Object.fromEntries(resources.map((r) => [r.id, []])); }",
    context,
  );
  return context;
}

function fakeSupabase() {
  const calls = [];
  const tables = {};
  const client = {
    calls,
    tables,
    from(table) {
      const query = { table, filters: {}, range: null };
      const builder = {
        select() { return builder; },
        eq(column, value) { query.filters[column] = value; return builder; },
        order() { return builder; },
        range(from, to) { query.range = [from, to]; return builder; },
        upsert(rows, options) { calls.push({ op: "upsert", table, rows, options }); return Promise.resolve({ error: null }); },
        delete() {
          const del = { eq(column, value) { query.filters[column] = value; return Object.keys(query.filters).length > 1 ? finish() : del; } };
          const finish = () => { calls.push({ op: "delete", table, filters: { ...query.filters } }); return Promise.resolve({ error: null }); };
          return del;
        },
        then(resolve) {
          const rows = (tables[table] || []).filter((row) => row.farm_id === query.filters.farm_id);
          const [from, to] = query.range || [0, rows.length];
          calls.push({ op: "select", table, range: query.range });
          return Promise.resolve({ data: rows.slice(from, to + 1), error: null }).then(resolve);
        },
      };
      return builder;
    },
  };
  return client;
}

const FARM = "11111111-1111-4111-8111-111111111111";
const FIELD = "7e97616d-3cf5-487a-bf76-57d01c57f7d8";
const CROP = "5d7492ff-3d07-4d1e-b130-46328f7be173";

test("schema covers every resource and references point at known tables", () => {
  const context = createContext(null);
  const ids = vm.runInContext("resources.map((r) => r.id)", context);
  const schema = vm.runInContext("databaseSchema", context);
  assert.deepEqual([...ids].sort(), Object.keys(schema).sort());
  for (const [resourceId, spec] of Object.entries(schema)) {
    const resource = vm.runInContext(`resourceById.get(${JSON.stringify(resourceId)})`, context);
    for (const field of resource.fields) {
      assert.ok(spec.columns.some((column) => column.field === field.name), `${resourceId}.${field.name} has no column`);
    }
    for (const column of spec.columns.filter((c) => c.ref)) assert.ok(schema[column.ref], `${resourceId}.${column.field} -> ${column.ref}`);
  }
});

test("record -> row -> record round trip keeps values, types and unknown keys", () => {
  const context = createContext(null);
  const record = {
    id: CROP, name: "Test Tomatoes", variety: "", type: "Vegetable", status: "Growing", field: FIELD,
    plantedDate: "2026-11-16", harvestDate: "", plantingSeason: "", relatedRecord: "", notes: "",
    legacyFlag: { a: 1 }, createdAt: "2026-11-16T19:00:12.550Z", updatedAt: "2026-11-16T19:00:12.550Z",
  };
  context.record = record;
  const row = vm.runInContext(`recordToRow("crops", record, ${JSON.stringify(FARM)})`, context);
  assert.equal(row.field_id, FIELD);
  assert.equal(row.planting_season_id, null);
  assert.equal(row.harvest_date, null);
  assert.equal(row.farm_id, FARM);
  assert.deepEqual({ ...row.extra }, { legacyFlag: { a: 1 } });
  assert.ok(!("updated_at" in row) && !("created_by" in row));

  context.row = { ...row, extra: row.extra, created_at: record.createdAt, updated_at: record.updatedAt };
  const back = vm.runInContext(`rowToRecord("crops", row)`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(back)), record);
});

test("numbers, ints and booleans are converted both ways", () => {
  const context = createContext(null);
  context.fieldRecord = { id: FIELD, name: "North", size: "1.2", unit: "Acres", soilType: "", notes: "" };
  const row = vm.runInContext(`recordToRow("crop-fields", fieldRecord, "${FARM}")`, context);
  assert.equal(row.size, 1.2);
  context.row = { ...row, size: 1.2, created_at: "x", updated_at: "y" };
  assert.equal(vm.runInContext(`rowToRecord("crop-fields", row)`, context).size, "1.2");

  context.group = { id: CROP, name: "g", label: "l", tracking: "Group", headCount: "12" };
  assert.equal(vm.runInContext(`recordToRow("livestock-groups", group, "${FARM}")`, context).head_count, 12);

  context.holiday = { id: "official-EG-2026-01-07-Coptic", name: "Christmas", date: "2026-01-07", active: false, official: true, countryCode: "EG" };
  const hrow = vm.runInContext(`recordToRow("holidays", holiday, "${FARM}")`, context);
  assert.equal(hrow.id, "official-EG-2026-01-07-Coptic");
  assert.equal(hrow.active, false);
  assert.equal(hrow.country_code, "EG");
  context.manual = { id: CROP, name: "Custom", date: "2026-02-02" };
  assert.equal(vm.runInContext(`recordToRow("holidays", manual, "${FARM}")`, context).active, true);
});

test("non-UUID ids are rejected for uuid tables", () => {
  const context = createContext(null);
  context.bad = { id: "123-abc", name: "x", size: "1", unit: "Acres" };
  assert.throws(() => vm.runInContext(`recordToRow("crop-fields", bad, "${FARM}")`, context), /not a valid UUID/);
});

test("persistCloudChanges upserts parents before children, then deletes", async () => {
  const client = fakeSupabase();
  const context = createContext(client);
  context.changes = [
    { type: "delete", resourceId: "crops", recordId: CROP },
    { type: "upsert", resourceId: "crops", records: [{ id: CROP, name: "T", type: "Vegetable", status: "Growing", field: FIELD, plantedDate: "2026-11-16" }] },
    { type: "upsert", resourceId: "crop-fields", records: [{ id: FIELD, name: "N", size: "2", unit: "Acres" }] },
  ];
  await vm.runInContext(`persistCloudChanges(changes, "${FARM}")`, context);
  assert.deepEqual(client.calls.map((c) => `${c.op}:${c.table}`), ["upsert:crop_fields", "upsert:crops", "delete:crops"]);
  assert.equal(client.calls[0].options.onConflict, "farm_id,id");
  assert.deepEqual(client.calls[2].filters, { farm_id: FARM, id: CROP });
});

test("loadCloudRecords reads every table for the farm and pages past 1000 rows", async () => {
  const client = fakeSupabase();
  client.tables.crop_fields = Array.from({ length: 1500 }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, farm_id: FARM, name: `F${i}`, size: 1, unit: "Acres",
    soil_type: "", notes: "", extra: {}, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  }));
  client.tables.crop_fields.push({ id: FIELD, farm_id: "other-farm", name: "x", size: 1, unit: "Acres", extra: {} });
  const context = createContext(client);
  const loaded = await vm.runInContext(`loadCloudRecords("${FARM}")`, context);
  assert.equal(loaded["crop-fields"].length, 1500);
  assert.equal(loaded["crop-fields"][0].size, "1");
  assert.equal(loaded.crops.length, 0);
  const tablesRead = new Set(client.calls.filter((c) => c.op === "select").map((c) => c.table));
  assert.equal(tablesRead.size, 18);
});
