// Opens the real app in jsdom against a fake Supabase client backed by in-memory tables.
const path = require("node:path");
const { JSDOM, ResourceLoader, VirtualConsole } = require("jsdom");

const root = path.join(__dirname, "..", "..");
const FARM = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Loader extends ResourceLoader {
  fetch(url, options) {
    return url.startsWith("http") ? Promise.resolve(Buffer.from("")) : super.fetch(url, options);
  }
}

// tables: { tableName: rows[] }. missingTables: names that answer like a table that does not exist.
async function openApp({ role = "owner", tables = {}, missingTables = [] } = {}) {
  const calls = [];
  const now = "2026-11-16T19:00:12Z";
  const data = {
    farm_profiles: [{ id: USER, farm_id: FARM, farm_name: "Fake Farm" }],
    farms: [{ id: FARM, name: "Fake Farm", country_code: "EG", country_name: "Egypt", region_code: "EG-GH", region_name: "x", location_name: "x", latitude: 30.7, longitude: 31, created_by: USER, created_at: now }],
    farm_members: [{ role }],
    ...tables,
  };
  const missing = (table) => ({ code: "PGRST205", message: `Could not find the table 'public.${table}' in the schema cache` });

  const client = {
    auth: {
      onAuthStateChange() {},
      getSession: async () => ({ data: { session: { user: { id: USER, email: "me@x.test", user_metadata: {} } } }, error: null }),
      signOut: async () => ({ error: null }),
    },
    rpc: async (name, args) => { calls.push({ op: "rpc", name, args }); return { data: name === "my_pending_invitations" ? [] : null, error: null }; },
    from(table) {
      const query = { filters: {}, mode: "select" };
      const builder = {
        select() { return builder; }, order() { return builder; }, range() { return builder; },
        eq(column, value) { query.filters[column] = value; return builder; },
        maybeSingle() { return Promise.resolve({ data: (data[table] || [])[0] || null, error: null }); },
        single() { return builder.maybeSingle(); },
        upsert(rows, options) {
          calls.push({ op: "upsert", table, rows: [].concat(rows), options });
          return Promise.resolve({ error: missingTables.includes(table) ? missing(table) : null });
        },
        delete() { query.mode = "delete"; return builder; },
        then(resolve, reject) {
          if (missingTables.includes(table)) return Promise.resolve({ data: null, error: missing(table) }).then(resolve, reject);
          if (query.mode === "delete") {
            calls.push({ op: "delete", table, filters: { ...query.filters } });
            return Promise.resolve({ error: null }).then(resolve, reject);
          }
          calls.push({ op: "select", table });
          const rows = (data[table] || []).filter((row) => Object.entries(query.filters).every(([key, value]) => !(key in row) || row[key] === value));
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
        },
      };
      return builder;
    },
  };

  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const dom = await JSDOM.fromFile(path.join(root, "index.html"), {
    runScripts: "dangerously", resources: new Loader(), pretendToBeVisual: true, virtualConsole,
    beforeParse(window) {
      window.supabase = { createClient: () => client };
      window.fetch = () => Promise.reject(new Error("offline"));
      window.scrollTo = () => {};
      window.confirm = () => true;
    },
  });
  await sleep(1200);
  const { window } = dom;
  return {
    window, document: window.document, calls, errors,
    go: async (hash) => { window.location.hash = hash; await sleep(250); },
    text: () => window.document.querySelector("#main-content").textContent.replace(/\s+/g, " "),
    toast: () => window.document.querySelector("#toast").textContent,
    close: () => window.close(),
    sleep,
  };
}

module.exports = { openApp, FARM, USER, sleep };
