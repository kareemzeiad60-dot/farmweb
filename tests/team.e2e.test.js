const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.join(__dirname, "..");
const { JSDOM, ResourceLoader, VirtualConsole } = require("jsdom");
const FARM = "11111111-1111-4111-8111-111111111111";
const FARM2 = "33333333-3333-4333-8333-333333333333";
const USER = "22222222-2222-4222-8222-222222222222";
const W1 = "44444444-4444-4444-8444-444444444441";
const W2 = "44444444-4444-4444-8444-444444444442";
const T1 = "55555555-5555-4555-8555-555555555551";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = "2026-11-16T19:00:12Z";
const farmRow = (id, name) => ({ id, name, country_code: "EG", country_name: "Egypt", region_code: "EG-GH", region_name: "x", location_name: "x", latitude: 30.7, longitude: 31, created_by: USER, created_at: now });

function makeEnv({ role, linkedWorker = false, rpc = {}, extraTables = {} }) {
  const calls = [];
  const tables = {
    farm_profiles: [{ id: USER, farm_id: FARM, farm_name: "Fake Farm" }],
    farms: [farmRow(FARM, "Fake Farm"), farmRow(FARM2, "Joined Farm")],
    farm_members: [{ role }],
    farm_workers: [
      { id: W1, farm_id: FARM, name: "Wally", email: "w@x.test", status: "Active", user_id: linkedWorker ? USER : null, phone: "", job_title: "", extra: {}, created_at: now, updated_at: now },
      { id: W2, farm_id: FARM, name: "Sara", email: "s@x.test", status: "Active", user_id: null, phone: "", job_title: "", extra: {}, created_at: now, updated_at: now },
    ],
    tasks: [{ id: T1, farm_id: FARM, title: "Water the tomatoes", description: "", status: "Not started", priority: "High", assigned_to_id: W1, start_date: null, due_date: "2026-12-01", extra: {}, created_at: now, updated_at: now }],
    farm_invitations: [{ id: "inv-1", email: "new@x.test", role: "viewer", name: "", created_at: now, expires_at: "2026-12-10T00:00:00Z" }],
    crops: [{ id: "66666666-6666-4666-8666-666666666661", farm_id: FARM, name: "Tomatoes", variety: "", type: "Vegetable", status: "Growing", field_id: null, planted_date: "2026-11-01", harvest_date: null, planting_season_id: null, related_record: "", notes: "", extra: {}, created_at: now, updated_at: now }],
    ...extraTables,
  };
  const rpcHandlers = {
    my_pending_invitations: () => ({ data: [], error: null }),
    list_farm_members: () => ({ data: [
      { user_id: USER, email: "owner@x.test", role: "owner", joined_at: now, worker_id: null, worker_name: null, is_self: true },
      { user_id: "77777777-7777-4777-8777-777777777771", email: "mgr@x.test", role: "manager", joined_at: now, worker_id: null, worker_name: null, is_self: false },
      { user_id: "77777777-7777-4777-8777-777777777772", email: "wrk@x.test", role: "worker", joined_at: now, worker_id: W1, worker_name: "Wally", is_self: false },
    ], error: null }),
    invite_member: () => ({ data: { id: "inv-2" }, error: null }),
    update_member_role: () => ({ data: null, error: null }),
    remove_member: () => ({ data: null, error: null }),
    revoke_invitation: () => ({ data: null, error: null }),
    set_worker_account: () => ({ data: null, error: null }),
    accept_invitation: () => ({ data: FARM2, error: null }),
    decline_invitation: () => ({ data: null, error: null }),
    ...rpc,
  };
  const client = {
    auth: {
      onAuthStateChange() {},
      getSession: async () => ({ data: { session: { user: { id: USER, email: "me@x.test", user_metadata: {} } } }, error: null }),
      signOut: async () => ({ error: null }),
    },
    rpc: async (name, args) => { calls.push({ op: "rpc", name, args }); const h = rpcHandlers[name]; return h ? h(args) : { data: null, error: { message: "unknown rpc " + name } }; },
    from(table) {
      const q = { filters: {}, mode: "select" };
      const rowsNow = () => (tables[table] || []).filter((r) => Object.entries(q.filters).every(([k, v]) => !(k in r) || r[k] === v));
      const b = {
        select() { return b; }, order() { return b; }, range() { return b; },
        eq(c, v) { q.filters[c] = v; return b; },
        maybeSingle() { return Promise.resolve({ data: table === "farm_members" ? tables.farm_members[0] : (tables[table] || [])[0] || null, error: null }); },
        single() { return b.maybeSingle(); },
        upsert(rows, opts) { calls.push({ op: "upsert", table, rows: [].concat(rows), opts }); return Promise.resolve({ error: null }); },
        delete() { q.mode = "delete"; return b; },
        then(res, rej) {
          if (q.mode === "delete") { calls.push({ op: "delete", table, filters: q.filters }); return Promise.resolve({ error: null }).then(res, rej); }
          calls.push({ op: "select", table });
          return Promise.resolve({ data: rowsNow(), error: null }).then(res, rej);
        },
      };
      return b;
    },
  };
  return { client, calls };
}
class Loader extends ResourceLoader { fetch(url, o) { return url.startsWith("http") ? Promise.resolve(Buffer.from("")) : super.fetch(url, o); } }

async function open(opts) {
  const env = makeEnv(opts);
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  vc.on("error", (e) => errors.push(String(e)));
  const dom = await JSDOM.fromFile(path.join(root, "index.html"), {
    runScripts: "dangerously", resources: new Loader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.supabase = { createClient: () => env.client }; w.fetch = () => Promise.reject(new Error("offline")); w.scrollTo = () => {}; w.confirm = () => true; },
  });
  await sleep(1200);
  return { ...env, w: dom.window, d: dom.window.document, errors, go: async (h) => { dom.window.location.hash = h; await sleep(250); } };
}
let failed = 0;
const check = (n, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n} ${extra}`); if (!ok) failed++; };
const text = (s) => s.d.querySelector("#main-content").textContent.replace(/\s+/g, " ");
const rpcs = (s, name) => s.calls.filter((c) => c.op === "rpc" && c.name === name);

test('roles, team page, invitations and My tasks (jsdom, fake Supabase)', { timeout: 120000 }, async () => {
  // ---------- owner: team page
  let s = await open({ role: "owner" });
  check("owner role shown in account menu", s.d.querySelector("#account-role").textContent.includes("Owner"));
  check("owner nav has Team (no count) and My tasks", /Team/.test(s.d.querySelector("#sidebar-nav").textContent) && /My tasks/.test(s.d.querySelector("#sidebar-nav").textContent));
  await s.go("#/users");
  check("team page loaded members via rpc", rpcs(s, "list_farm_members").length === 1 && rpcs(s, "list_farm_members")[0].args.p_farm_id === FARM);
  check("members + pending invitations rendered", /owner@x\.test/.test(text(s)) && /mgr@x\.test/.test(text(s)) && /new@x\.test/.test(text(s)));
  check("owner row has no role select / remove (self)", !s.d.querySelector('[data-member-role][data-user-id="' + USER + '"]'));
  check("manager row has role select with 3 roles", s.d.querySelector('[data-member-role][data-user-id$="771"]').options.length === 3);
  check("worker link select offers unlinked workers + own", [...s.d.querySelector('[data-worker-link][data-user-id$="772"]').options].map((o) => o.textContent).join("|") === "— not linked —|Wally|Sara");
  check("no old generic users list (no Add button)", !s.d.querySelector('a[href="#/users/new"]'));

  const f = s.d.querySelector("#invite-form");
  f.elements.email.value = "New.Worker@X.test"; f.elements.role.value = "worker"; f.elements.name.value = "Nora";
  f.requestSubmit(); await sleep(300);
  const inv = rpcs(s, "invite_member")[0];
  check("invite form calls invite_member with farm, email, role, name", inv && inv.args.p_farm_id === FARM && inv.args.p_email === "New.Worker@X.test" && inv.args.p_role === "worker" && inv.args.p_name === "Nora", JSON.stringify(inv && inv.args));
  check("team reloaded after invite", rpcs(s, "list_farm_members").length >= 2);

  const roleSel = s.d.querySelector('[data-member-role][data-user-id$="771"]');
  roleSel.value = "viewer"; roleSel.dispatchEvent(new s.w.Event("change", { bubbles: true })); await sleep(300);
  const ur = rpcs(s, "update_member_role")[0];
  check("role change calls update_member_role", ur && ur.args.p_role === "viewer" && ur.args.p_user_id.endsWith("771") && ur.args.p_farm_id === FARM);

  s.d.querySelector('[data-action="remove-member"][data-user-id$="772"]').click(); await sleep(300);
  check("remove calls remove_member", rpcs(s, "remove_member").length === 1 && rpcs(s, "remove_member")[0].args.p_user_id.endsWith("772"));
  s.d.querySelector('[data-action="revoke-invitation"]').click(); await sleep(300);
  check("revoke calls revoke_invitation", rpcs(s, "revoke_invitation")[0]?.args.p_invitation_id === "inv-1");

  const linkSel = s.d.querySelector('[data-worker-link][data-user-id$="772"]');
  linkSel.value = W2; linkSel.dispatchEvent(new s.w.Event("change", { bubbles: true })); await sleep(300);
  const sw = rpcs(s, "set_worker_account")[0];
  check("linking calls set_worker_account(worker, user)", sw && sw.args.p_worker_id === W2 && sw.args.p_user_id.endsWith("772"));

  // worker upsert must not send user_id (read-only column)
  await s.go("#/farm-workers");
  await s.go("#/farm-workers/edit/" + W2);
  const wf = s.d.querySelector("#record-form"); wf.elements.name.value = "Sara Renamed"; wf.requestSubmit(); await sleep(300);
  const wu = s.calls.find((c) => c.op === "upsert" && c.table === "farm_workers");
  check("worker upsert never writes user_id", wu && !("user_id" in wu.rows[0]) && wu.rows[0].name === "Sara Renamed", JSON.stringify(wu && Object.keys(wu.rows[0])));
  s.w.close();

  // ---------- manager: cannot invite managers
  s = await open({ role: "manager" });
  await s.go("#/users");
  const roles = [...s.d.querySelector("#invite-role").options].map((o) => o.value).join();
  check("manager can only invite worker/viewer", roles === "worker,viewer", roles);
  check("manager cannot change roles or remove other managers", !s.d.querySelector("[data-member-role]") && !s.d.querySelector('[data-action="remove-member"][data-user-id$="771"]') && !!s.d.querySelector('[data-action="remove-member"][data-user-id$="772"]'));
  check("manager cannot revoke manager invites only (viewer invite revocable)", !!s.d.querySelector('[data-action="revoke-invitation"]'));
  s.w.close();

  // ---------- viewer: read-only
  s = await open({ role: "viewer" });
  check("viewer: no New task on dashboard", !s.d.querySelector('a[href="#/tasks/new"]') && !s.d.querySelector(".quick-links-section"));
  await s.go("#/crops");
  check("viewer: crops list has no Add / Edit / Delete", !s.d.querySelector('a[href="#/crops/new"]') && !s.d.querySelector('[data-action="delete"]') && !/Edit/.test(s.d.querySelector(".data-table tbody").textContent) && /Tomatoes/.test(text(s)));
  await s.go("#/crops/new");
  check("viewer: form route shows read-only notice", /Read-only access/.test(text(s)) && !s.d.querySelector("#record-form"));
  await s.go("#/users");
  check("viewer: team page explains role + leave button, no member rpc", /You are a viewer/.test(text(s)) && !!s.d.querySelector('[data-action="leave-farm"]') && rpcs(s, "list_farm_members").length === 0);
  s.d.querySelector('[data-action="leave-farm"]').click(); await sleep(400);
  check("leave calls remove_member with own id and reloads farms", rpcs(s, "remove_member")[0]?.args.p_user_id === USER && s.calls.filter((c) => c.op === "select" && c.table === "farms").length >= 2);
  s.w.close();

  // ---------- worker: my tasks
  s = await open({ role: "worker", linkedWorker: true });
  await s.go("#/my-tasks");
  check("worker sees assigned task", /Water the tomatoes/.test(text(s)) && /High/.test(text(s)));
  check("my tasks badge counts open tasks", /My tasks\s*1/.test(s.d.querySelector("#sidebar-nav").textContent.replace(/\s+/g, " ")));
  s.d.querySelector('[data-action="complete-task"]').click(); await sleep(300);
  const tu = s.calls.find((c) => c.op === "upsert" && c.table === "tasks");
  check("mark complete upserts task as Complete", tu && tu.rows[0].status === "Complete" && tu.rows[0].id === T1 && tu.rows[0].assigned_to_id === W1);
  check("task shows complete, no more button", /Complete/.test(text(s)) && !s.d.querySelector('[data-action="complete-task"]'));
  await s.go("#/users");
  check("worker cannot manage team", /You are a worker/.test(text(s)));
  s.w.close();
  s = await open({ role: "worker", linkedWorker: false });
  await s.go("#/my-tasks");
  check("unlinked worker gets explanation", /not linked to a worker record/.test(text(s)));
  s.w.close();

  // ---------- invitations banner
  const pending = [{ id: "inv-9", farm_id: FARM2, farm_name: "Joined Farm", role: "worker", invited_by_email: "boss@x.test", created_at: now, expires_at: "2026-12-10T00:00:00Z" }];
  s = await open({ role: "owner", rpc: { my_pending_invitations: () => ({ data: pending.slice(), error: null }) } });
  check("banner shows farm, role and inviter", /Joined Farm/.test(text(s)) && /Worker/.test(text(s)) && /boss@x\.test/.test(text(s)));
  await s.go("#/crops");
  check("banner visible on other pages too", !!s.d.querySelector(".invite-banner"));
  s.d.querySelector('[data-action="accept-invitation"]').click(); await sleep(600);
  check("accept calls accept_invitation", rpcs(s, "accept_invitation")[0]?.args.p_invitation_id === "inv-9");
  check("switched to the joined farm", s.d.querySelector(".farm-name-display").textContent.includes("Joined Farm") && s.w.location.hash === "#/");
  s.w.close();
  s = await open({ role: "owner", rpc: { my_pending_invitations: () => ({ data: pending.slice(), error: null }) } });
  s.d.querySelector('[data-action="decline-invitation"]').click(); await sleep(300);
  check("decline calls decline_invitation and hides banner", rpcs(s, "decline_invitation").length === 1 && !s.d.querySelector(".invite-banner"));
  s.w.close();

  // ---------- migration 004 not run yet
  const missing = { error: { code: "PGRST202", message: "Could not find the function public.my_pending_invitations in the schema cache" }, data: null };
  s = await open({ role: "owner", rpc: { my_pending_invitations: () => missing, list_farm_members: () => missing } });
  check("missing migration: app still loads, no banner", s.d.querySelector("#app-shell").hidden === false && !s.d.querySelector(".invite-banner"));
  await s.go("#/users");
  check("missing migration: team page tells how to fix it", /004_team_invitations\.sql/.test(text(s)));
  s.w.close();

  console.log(failed ? `\n${failed} FAILED` : "\nTEAM E2E OK");
  assert.equal(failed, 0, `${failed} check(s) failed`);
});
