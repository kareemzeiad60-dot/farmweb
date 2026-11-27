const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.join(__dirname, "..");
const { JSDOM, ResourceLoader, VirtualConsole } = require("jsdom");
const FARM = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";
const FIELD = "7e97616d-3cf5-487a-bf76-57d01c57f7d8";
const CROP = "5d7492ff-3d07-4d1e-b130-46328f7be173";

const tables = {
  farm_members: [{ role: "owner" }],
  farm_profiles: [{ id: USER, farm_id: FARM, farm_name: "Fake Farm" }],
  farms: [{ id: FARM, name: "Fake Farm", country_code: "EG", country_name: "Egypt", region_code: "EG-GH", region_name: "x", location_name: "x", latitude: 30.7, longitude: 31, created_by: USER, created_at: "2026-01-01T00:00:00Z" }],
  crop_fields: [{ id: FIELD, farm_id: FARM, name: "Test North Field", size: 1.2, unit: "Acres", soil_type: "", notes: "", extra: {}, created_at: "2026-11-16T19:00:12Z", updated_at: "2026-11-16T19:00:12Z" }],
  crops: [{ id: CROP, farm_id: FARM, name: "Test Tomatoes", variety: "", type: "Vegetable", status: "Growing", field_id: FIELD, planted_date: "2026-11-16", harvest_date: null, planting_season_id: null, related_record: "", notes: "", extra: {}, created_at: "2026-11-16T19:00:12Z", updated_at: "2026-11-16T19:00:12Z" }],
};
const calls = [];
function fakeClient() {
  return {
    auth: {
      onAuthStateChange() {},
      getSession: async () => ({ data: { session: { user: { id: USER, email: "a@b.c", user_metadata: {} } } }, error: null }),
      signOut: async () => ({ error: null }),
    },
    rpc: async () => ({ data: null, error: null }),
    from(table) {
      const q = { filters: {}, range: null, mode: "select" };
      const b = {
        select() { return b; }, order() { return b; }, range(f, t) { q.range = [f, t]; return b; },
        eq(c, v) { q.filters[c] = v; return b; },
        maybeSingle() { return Promise.resolve({ data: (tables[table] || [])[0] || null, error: null }); },
        single() { return Promise.resolve({ data: (tables[table] || [])[0] || null, error: null }); },
        upsert(rows, opts) { calls.push({ op: "upsert", table, rows: [].concat(rows), opts }); return Promise.resolve({ error: null, data: null, select: () => ({ single: async () => ({ data: [].concat(rows)[0], error: null }) }) }); },
        delete() { q.mode = "delete"; return b; },
        then(res, rej) {
          if (q.mode === "delete") { calls.push({ op: "delete", table, filters: q.filters }); return Promise.resolve({ error: null }).then(res, rej); }
          let rows = (tables[table] || []).filter((r) => Object.entries(q.filters).every(([k, v]) => r[k] === v));
          if (q.range) rows = rows.slice(q.range[0], q.range[1] + 1);
          calls.push({ op: "select", table });
          return Promise.resolve({ data: rows, error: null }).then(res, rej);
        },
      };
      return b;
    },
  };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class Loader extends ResourceLoader { fetch(url, o) { return url.startsWith("http") ? Promise.resolve(Buffer.from("")) : super.fetch(url, o); } }

test('app reads and writes the per-resource tables (jsdom, fake Supabase)', { timeout: 120000 }, async () => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  vc.on("error", (e) => errors.push(String(e)));
  const dom = await JSDOM.fromFile(path.join(root, "index.html"), {
    runScripts: "dangerously", resources: new Loader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.supabase = { createClient: () => fakeClient() }; w.fetch = () => Promise.reject(new Error("offline")); w.scrollTo = () => {}; w.confirm = () => true; },
  });
  const w = dom.window, d = w.document;
  await sleep(1200);
  let failed = 0;
  const check = (n, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n} ${extra}`); if (!ok) failed++; };

  check("cloud mode: signed in, app shell visible", d.querySelector("#app-shell").hidden === false && d.querySelector("#auth-screen").hidden === true);
  const readTables = new Set(calls.filter((c) => c.op === "select").map((c) => c.table));
  check("loaded all 18 domain tables for the farm", [...readTables].filter((t) => !["farm_profiles", "farms"].includes(t)).length === 18, `(${readTables.size - 2})`);
  check("no legacy farm_records query", !readTables.has("farm_records"));

  w.location.hash = "#/crops"; await sleep(200);
  const list = d.querySelector("#main-content").textContent;
  check("crops list shows record from crops table", list.includes("Test Tomatoes"));
  check("relation resolved to field name", list.includes("Test North Field"));
  w.location.hash = "#/crop-fields"; await sleep(200);
  check("field row shows area + computed crop count", d.querySelector("#main-content").textContent.includes("1.2"));

  // create a crop through the real form
  w.location.hash = "#/crops/new"; await sleep(200);
  const form = d.querySelector("form[data-resource='crops']");
  check("form rendered", !!form);
  const set = (n, v) => { const el = form.elements[n]; el.value = v; };
  set("name", "Wheat"); set("type", "Cereal"); set("status", "Planned"); set("field", FIELD); set("plantedDate", "2026-12-01"); set("notes", "n");
  form.requestSubmit(); await sleep(300);
  const up = calls.find((c) => c.op === "upsert" && c.table === "crops");
  check("upsert went to the crops table", !!up);
  if (up) {
    const row = up.rows[0];
    check("upsert onConflict farm_id,id", up.opts.onConflict === "farm_id,id");
    check("row has farm_id, uuid id, snake_case columns", row.farm_id === FARM && /^[0-9a-f-]{36}$/.test(row.id) && row.field_id === FIELD && row.planted_date === "2026-12-01" && row.harvest_date === null && row.planting_season_id === null, JSON.stringify(row));
    check("row has no user_id/record_type/data (legacy shape gone)", !("user_id" in row) && !("record_type" in row) && !("data" in row));
  }
  check("redirected to list, new crop visible", w.location.hash === "#/crops" && d.querySelector("#main-content").textContent.includes("Wheat"));

  // delete
  const delBtn = d.querySelector(`[data-action="delete"][data-id="${CROP}"]`) || d.querySelector('[data-action="delete"]');
  if (delBtn) { delBtn.click(); await sleep(300); }
  const del = calls.find((c) => c.op === "delete" && c.table === "crops");
  check("delete targets crops table with farm_id + id", !!del && del.filters.farm_id === FARM && typeof del.filters.id === "string", JSON.stringify(del && del.filters));

  // import the sample workspace (FK ordering: crops before crop-fields in file)
  calls.length = 0;
  const sample = JSON.parse(require("fs").readFileSync(path.join(root, "samples", "fieldwise-workspace.json"), "utf8"));
  const file = { text: async () => JSON.stringify(sample) };
  await w.eval("importData").call(w, file);
  await sleep(300);
  const order = calls.filter((c) => c.op === "upsert").map((c) => c.table);
  check("import upserts parents before children", order.join() === "crop_fields,crops", order.join());

  console.log("page errors:", errors.length, errors.slice(0, 3));
  console.log(failed ? `${failed} FAILED` : "E2E OK");
  w.close();
  assert.equal(failed, 0, `${failed} check(s) failed`);
});
