// Fills about.html from src/config/site.js (operator, contact, date, plans).
(function () {
  const site = window.FIELDWISE_SITE || {};
  const text = (selector, value) => document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });

  if (site.operatorName) text('[data-site="operatorName"]', site.operatorName);

  const parsed = new Date(`${site.lastUpdated}T00:00:00`);
  if (site.lastUpdated && !Number.isNaN(parsed.getTime())) {
    text('[data-site="lastUpdated"]', new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(parsed));
  }

  text("#year", String(new Date().getFullYear()));

  if (site.contactEmail) {
    const link = document.querySelector("#contact-link");
    link.href = `mailto:${site.contactEmail}`;
    link.textContent = site.contactEmail;
    document.querySelector("[data-contact-email]").hidden = false;
    document.querySelector("[data-no-contact]").hidden = true;
  }

  const grid = document.querySelector("#plan-grid");
  for (const plan of site.plans || []) {
    const card = document.createElement("article");
    card.className = "card plan";
    const add = (tag, className, content) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      element.textContent = content;
      card.appendChild(element);
      return element;
    };
    add("span", "badge", plan.status || "");
    add("h3", "", plan.name);
    add("p", "price", plan.price);
    if (plan.note) add("p", "plan-note", plan.note);
    const list = document.createElement("ul");
    for (const feature of plan.features || []) {
      const item = document.createElement("li");
      item.textContent = feature;
      list.appendChild(item);
    }
    card.appendChild(list);
    if (plan.cta) {
      const cta = document.createElement("a");
      cta.className = "button";
      cta.href = plan.cta.href;
      cta.textContent = plan.cta.label;
      card.appendChild(cta);
    }
    grid.appendChild(card);
  }
})();
