const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function openAbout(site) {
  const dom = await JSDOM.fromFile(path.join(root, "about.html"), {
    runScripts: "dangerously", resources: "usable",
    beforeParse(window) { if (site) window.__site = site; },
  });
  await sleep(400);
  return dom.window;
}

test("about page has every section and working in-page links", async () => {
  const window = await openAbout();
  const { document } = window;
  for (const id of ["about", "plans", "privacy", "terms", "contact"]) {
    assert.ok(document.getElementById(id), `section #${id}`);
    assert.ok(document.querySelector(`.site-nav a[href="#${id}"]`), `nav link to #${id}`);
  }
  assert.equal(document.querySelector('a[href="index.html"]').textContent.trim(), "Open the app");
  assert.ok(fs.existsSync(path.join(root, "index.html")));
  window.close();
});

test("plans, date and year are filled from src/config/site.js", async () => {
  const window = await openAbout();
  const { document } = window;
  const plans = [...document.querySelectorAll("#plan-grid .plan")];
  assert.equal(plans.length, window.FIELDWISE_SITE.plans.length);
  assert.match(plans[0].textContent, /Free/);
  assert.match(plans[0].textContent, /No payment required/);
  assert.match(plans[1].textContent, /Not available yet/);
  assert.match(document.querySelector('[data-site="lastUpdated"]').textContent, /2026/);
  assert.equal(document.querySelector("#year").textContent, String(new Date().getFullYear()));
  window.close();
});

test("without contact details the page does not show an empty email", async () => {
  const window = await openAbout();
  const { document } = window;
  assert.equal(document.querySelector("[data-contact-email]").hidden, true);
  assert.equal(document.querySelector("[data-no-contact]").hidden, false);
  assert.equal(document.querySelectorAll('[data-site="operatorName"]')[0].textContent, "the operator of this site");
  window.close();
});

test("operator name and contact email show once configured", async () => {
  const html = fs.readFileSync(path.join(root, "about.html"), "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "file:///about.html" });
  const { window } = dom;
  window.FIELDWISE_SITE = { operatorName: "Green Valley Farms", contactEmail: "hello@example.com", lastUpdated: "2026-11-28", plans: [] };
  window.eval(fs.readFileSync(path.join(root, "src", "about.js"), "utf8"));
  const { document } = window;
  assert.equal(document.querySelector('[data-site="operatorName"]').textContent, "Green Valley Farms");
  const link = document.querySelector("#contact-link");
  assert.equal(link.getAttribute("href"), "mailto:hello@example.com");
  assert.equal(document.querySelector("[data-contact-email]").hidden, false);
  window.close();
});

test("privacy policy names every outside service the app really contacts", () => {
  const html = fs.readFileSync(path.join(root, "about.html"), "utf8");
  const sources = fs.readdirSync(path.join(root, "src"), { recursive: true })
    .filter((file) => file.endsWith(".js")).map((file) => fs.readFileSync(path.join(root, "src", file), "utf8")).join("\n")
    + fs.readFileSync(path.join(root, "index.html"), "utf8");
  const hosts = {
    "supabase.co": "Supabase", "open-meteo.com": "Open-Meteo", "date.nager.at": "Nager.Date", "cdn.jsdelivr.net": "jsDelivr",
  };
  for (const [host, name] of Object.entries(hosts)) {
    assert.ok(sources.includes(host), `${host} is used by the app`);
    assert.ok(html.includes(name), `privacy policy mentions ${name}`);
  }
  // Any host the app contacts must be on the list above.
  const found = new Set([...sources.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((match) => match[1].toLowerCase()));
  for (const host of found) {
    assert.ok(Object.keys(hosts).some((known) => host === known || host.endsWith(`.${known}`)), `unlisted external host: ${host}`);
  }
});

test("the app links to the policies", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(index, /href="about\.html#terms"/);
  assert.match(index, /href="about\.html#privacy"/);
  const nav = fs.readFileSync(path.join(root, "src", "ui", "navigation.js"), "utf8");
  assert.match(nav, /href="about\.html"/);
});
