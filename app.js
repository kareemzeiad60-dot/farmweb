const resourceGroups = [
  { label: "Crops", module: "crops", items: ["crop-fields", "crops", "planting-seasons"] },
  { label: "Apiary", module: "apiary", items: ["bee-hives", "bee-colonies", "hive-inspections", "honey-productions", "bee-hive-types"] },
  { label: "Livestock", module: "livestock", items: ["animal-fields", "animals", "livestock-groups", "feed-mixtures"] },
  { label: "Finance", module: "finance", items: ["financial-records"] },
  { label: "Farm management", module: "humanResources", items: ["users", "tasks", "farm-workers", "worker-leaves", "holidays"] },
  { label: "Support", items: ["help-center"] },
];

const profileStorageKey = "fieldwise-farm-profile-v1";
const workDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const defaultActiveModules = {
  crops: true,
  apiary: true,
  livestock: true,
  finance: true,
  humanResources: true,
};
const activeModuleOptions = [
  { key: "crops", label: "Crops", description: "Fields, crops, and planting seasons" },
  { key: "apiary", label: "Apiary", description: "Hives, colonies, inspections, and honey" },
  { key: "livestock", label: "Livestock", description: "Animals, groups, feed, and livestock fields" },
  { key: "finance", label: "Finance", description: "Income and expense records" },
  { key: "humanResources", label: "Human resources", description: "Users, tasks, workers, leave, and holidays" },
];

const relatedRecordSources = ["animals", "crop-fields", "crops", "feed-mixtures"];
const farmRegions = [
  { code: "EG-GH", name: "الغربية — طنطا (وسط الدلتا)", latitude: 30.7865, longitude: 31.0004 },
  { code: "EG-DK", name: "الدقهلية — المنصورة", latitude: 31.0364, longitude: 31.3807 },
  { code: "EG-BH", name: "البحيرة — دمنهور", latitude: 31.0341, longitude: 30.4682 },
  { code: "EG-KFS", name: "كفر الشيخ", latitude: 31.1107, longitude: 30.9399 },
  { code: "EG-MNF", name: "المنوفية — شبين الكوم", latitude: 30.5526, longitude: 31.0105 },
  { code: "EG-KB", name: "القليوبية — بنها", latitude: 30.4667, longitude: 31.1833 },
  { code: "EG-SHR", name: "الشرقية — الزقازيق", latitude: 30.5877, longitude: 31.5020 },
  { code: "EG-DT", name: "دمياط", latitude: 31.4175, longitude: 31.8144 },
];
const farmRegionAliases = [
  { code: "EG-GH", names: ["Gharbia", "Gharbeya", "Tanta", "الغربية", "طنطا"] },
  { code: "EG-DK", names: ["Dakahlia", "Daqahlia", "Mansoura", "الدقهلية", "المنصورة"] },
  { code: "EG-BH", names: ["Beheira", "Behira", "Damanhur", "البحيرة", "دمنهور"] },
  { code: "EG-KFS", names: ["Kafr El Sheikh", "Kafr El-Sheikh", "كفر الشيخ"] },
  { code: "EG-MNF", names: ["Monufia", "Menoufia", "Ashmoun", "Shebin El Kom", "Shibin El Kom", "المنوفية", "أشمون", "اشمون", "شبين الكوم"] },
  { code: "EG-KB", names: ["Qalyubia", "Benha", "القليوبية", "بنها"] },
  { code: "EG-SHR", names: ["Sharqia", "Zagazig", "الشرقية", "الزقازيق"] },
  { code: "EG-DT", names: ["Damietta", "دمياط"] },
];
const defaultFarmRegion = farmRegions[0];
const defaultWeatherLocation = "Ashmoun, Menofia, EG";
const regionSettingsKey = "fieldwise-region-v1";

const resources = [
  {
    id: "crop-fields", nav: "Crop Fields", singular: "Crop field", group: "Crops",
    columns: [["name", "Field"], ["size", "Area"], ["unit", "Unit"], ["cropCount", "Crop count"], ["soilType", "Soil"], ["notes", "Notes"]],
    fields: [
      { name: "name", label: "Field name", required: true },
      { name: "size", label: "Area", type: "number", required: true, min: 0, step: "0.01" },
      { name: "unit", label: "Area unit", type: "select", required: true, options: ["Acres", "Hectares", "Square meters"] },
      { name: "soilType", label: "Soil type" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "crops", nav: "Crops", singular: "Crop", group: "Crops",
    columns: [["name", "Crop"], ["variety", "Variety"], ["type", "Type"], ["status", "Status"], ["field", "Field"], ["plantedDate", "Planted"], ["harvestDate", "Expected harvest"]],
    fields: [
      { name: "name", label: "Crop name", required: true },
      { name: "variety", label: "Variety" },
      { name: "type", label: "Crop type", type: "select", required: true, options: ["Cereal", "Vegetable", "Fruit", "Legume", "Herb", "Other"] },
      { name: "status", label: "Status", type: "select", required: true, options: ["Planned", "Growing", "Harvested", "Inactive"] },
      { name: "field", label: "Field", type: "relation", relation: "crop-fields" },
      { name: "plantedDate", label: "Planting date", type: "date", required: true },
      { name: "harvestDate", label: "Expected harvest", type: "date" },
      { name: "plantingSeason", label: "Planting season", type: "relation", relation: "planting-seasons" },
      { name: "relatedRecord", label: "Related record", type: "related-record" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "planting-seasons", nav: "Planting Seasons", singular: "Planting season", group: "Crops",
    columns: [["name", "Season"], ["startDate", "Start date"], ["endDate", "End date"]],
    fields: [
      { name: "name", label: "Season name", required: true },
      { name: "startDate", label: "Start date", type: "date", required: true },
      { name: "endDate", label: "End date", type: "date", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "bee-hives", nav: "Beehives", singular: "Beehive", group: "Apiary",
    columns: [["hiveNumber", "Hive number"], ["hiveType", "Hive type"], ["status", "Status"], ["location", "Location"], ["colony", "Colony"]],
    fields: [
      { name: "hiveNumber", label: "Hive number", required: true },
      { name: "hiveType", label: "Hive type", type: "relation", relation: "bee-hive-types" },
      { name: "status", label: "Status", type: "select", required: true, options: ["Active", "Needs attention", "Inactive"] },
      { name: "location", label: "Location" },
      { name: "colony", label: "Current colony", type: "relation", relation: "bee-colonies" },
      { name: "setupDate", label: "Setup date", type: "date" },
      { name: "cost", label: "Setup cost", type: "number", min: 0, step: "0.01" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "bee-colonies", nav: "Bee Colonies", singular: "Bee colony", group: "Apiary",
    columns: [["name", "Colony"], ["beehive", "Beehive"], ["breed", "Breed"], ["queenStatus", "Queen"], ["strength", "Strength"], ["status", "Status"], ["established", "Established"]],
    fields: [
      { name: "name", label: "Colony name", required: true },
      { name: "beehive", label: "Beehive", type: "relation", relation: "bee-hives" },
      { name: "breed", label: "Breed" },
      { name: "queenStatus", label: "Queen status", type: "select", required: true, options: ["Present", "Absent", "Unverified"] },
      { name: "strength", label: "Colony strength", type: "select", required: true, options: ["Strong", "Moderate", "Weak"] },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
      { name: "established", label: "Established date", type: "date" },
      { name: "ended", label: "End date", type: "date" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "hive-inspections", nav: "Hive Inspections", singular: "Hive inspection", group: "Apiary",
    columns: [["targetType", "Target type"], ["target", "Hive / colony"], ["inspectionDate", "Inspection date"], ["inspector", "Inspector"], ["result", "Summary"]],
    fields: [
      { name: "targetType", label: "Inspection target", type: "select", required: true, options: ["Beehive", "Bee colony"] },
      { name: "target", label: "Target name", required: true },
      { name: "inspectionDate", label: "Inspection date", type: "date", required: true },
      { name: "inspector", label: "Inspector", required: true },
      { name: "result", label: "Summary", type: "textarea" },
      { name: "actions", label: "Actions taken", type: "textarea" },
    ],
  },
  {
    id: "honey-productions", nav: "Honey Production", singular: "Honey record", group: "Apiary",
    columns: [["hive", "Hive"], ["colony", "Colony"], ["honeyType", "Honey type"], ["harvestDate", "Harvested"], ["quantity", "Quantity"]],
    fields: [
      { name: "hive", label: "Beehive", type: "relation", relation: "bee-hives" },
      { name: "colony", label: "Bee colony", type: "relation", relation: "bee-colonies" },
      { name: "honeyType", label: "Honey type", required: true },
      { name: "harvestDate", label: "Harvest date", type: "date", required: true },
      { name: "quantity", label: "Quantity", type: "number", required: true, min: 0, step: "0.01" },
      { name: "unit", label: "Unit", type: "select", required: true, options: ["Kilograms", "Grams", "Pounds"] },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "bee-hive-types", nav: "Hive Types", singular: "Hive type", group: "Apiary",
    columns: [["name", "Name"], ["category", "Category"], ["description", "Description"], ["source", "Source"]],
    fields: [
      { name: "name", label: "Type name", required: true },
      { name: "category", label: "Category", type: "select", required: true, options: ["Traditional", "Top-bar", "Langstroth", "Other"] },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "source", label: "Source" },
    ],
  },
  {
    id: "animal-fields", nav: "Livestock Fields", singular: "Livestock field", group: "Livestock",
    columns: [["name", "Field"], ["size", "Area"], ["unit", "Unit"], ["animalCount", "Livestock"], ["notes", "Notes"]],
    fields: [
      { name: "name", label: "Field name", required: true },
      { name: "size", label: "Area", type: "number", required: true, min: 0, step: "0.01" },
      { name: "unit", label: "Area unit", type: "select", required: true, options: ["Acres", "Hectares", "Square meters"] },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "animals", nav: "Livestock", singular: "Animal", group: "Livestock",
    columns: [["name", "Name"], ["tag", "Tag"], ["type", "Type"], ["breed", "Breed"], ["health", "Health"], ["group", "Group"], ["field", "Field"], ["birthDate", "Birth date"]],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "tag", label: "Tag number", required: true },
      { name: "type", label: "Animal type", type: "select", required: true, options: ["Cattle", "Sheep", "Goat", "Poultry", "Other"] },
      { name: "breed", label: "Breed" },
      { name: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Unknown"] },
      { name: "health", label: "Health status", type: "select", required: true, options: ["Healthy", "Needs attention", "Under treatment"] },
      { name: "group", label: "Group", type: "relation", relation: "livestock-groups" },
      { name: "field", label: "Field", type: "relation", relation: "animal-fields" },
      { name: "birthDate", label: "Birth date", type: "date" },
      { name: "relatedRecord", label: "Related record", type: "related-record" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "livestock-groups", nav: "Livestock Groups", singular: "Livestock group", group: "Livestock",
    columns: [["name", "Name"], ["label", "Label"], ["types", "Types"], ["breed", "Breed"], ["tracking", "Tracking"], ["headCount", "Animals"], ["status", "Status"]],
    fields: [
      { name: "name", label: "Group name", required: true },
      { name: "label", label: "Group label", required: true },
      { name: "types", label: "Animal types", type: "text", hint: "Separate multiple types with commas." },
      { name: "breed", label: "Breed" },
      { name: "tracking", label: "Tracking mode", type: "select", required: true, options: ["Individual", "Group"] },
      { name: "headCount", label: "Head count", type: "number", min: 0 },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
      { name: "purpose", label: "Purpose", type: "textarea" },
      { name: "location", label: "Location" },
    ],
  },
  {
    id: "feed-mixtures", nav: "Feed Mixtures", singular: "Feed mixture", group: "Livestock",
    columns: [["name", "Feed mix"], ["target", "For animals"], ["ingredients", "Ingredients"], ["notes", "Notes"]],
    fields: [
      { name: "name", label: "Feed mix name", required: true },
      { name: "target", label: "For animals", type: "select", required: true, options: ["Cattle", "Sheep", "Goat", "Poultry", "Mixed"] },
      { name: "ingredients", label: "Ingredients and proportions", type: "textarea", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "financial-records", nav: "Income & Expenses", singular: "Financial record", group: "Finance",
    columns: [["date", "Date"], ["type", "Type"], ["category", "Category"], ["description", "Description"], ["amount", "Amount"], ["reference", "Reference"]],
    fields: [
      { name: "type", label: "Record type", type: "select", required: true, options: ["Income", "Expense"] },
      { name: "category", label: "Category", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "amount", label: "Amount (EGP)", type: "number", required: true, min: 0, step: "0.01" },
      { name: "reference", label: "Reference code" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "relatedRecord", label: "Related record", type: "related-record" },
    ],
  },
  {
    id: "users", nav: "System Users", singular: "User", group: "Farm management",
    columns: [["name", "Name"], ["email", "Email"], ["role", "Role"], ["createdAt", "Added"]],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "role", label: "Role", type: "select", required: true, options: ["Owner", "Manager", "Worker", "Viewer"] },
    ],
  },
  {
    id: "tasks", nav: "Tasks", singular: "Task", group: "Farm management",
    columns: [["title", "Title"], ["status", "Status"], ["priority", "Priority"], ["assignedTo", "Assigned to"], ["dueDate", "Due date"]],
    fields: [
      { name: "title", label: "Task title", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", required: true, options: ["Not started", "In progress", "Complete"] },
      { name: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Urgent"] },
      { name: "assignedTo", label: "Assigned to", type: "relation", relation: "farm-workers" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "dueDate", label: "Due date", type: "date" },
    ],
  },
  {
    id: "farm-workers", nav: "Farm Workers", singular: "Farm worker", group: "Farm management",
    columns: [["name", "Name"], ["jobTitle", "Job title"], ["phone", "Phone"], ["email", "Email"], ["status", "Status"]],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "jobTitle", label: "Job title" },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  },
  {
    id: "worker-leaves", nav: "Leave Requests", singular: "Leave request", group: "Farm management",
    columns: [["worker", "Worker"], ["leaveType", "Leave type"], ["startDate", "Start"], ["endDate", "End"], ["days", "Duration"], ["status", "Status"]],
    fields: [
      { name: "worker", label: "Worker", type: "relation", relation: "farm-workers" },
      { name: "leaveType", label: "Leave type", type: "select", options: ["Annual", "Sick", "Personal", "Unpaid"] },
      { name: "startDate", label: "Start date", type: "date", required: true },
      { name: "endDate", label: "End date", type: "date", required: true },
      { name: "hours", label: "Hours", type: "number", min: 0 },
      { name: "reason", label: "Reason", type: "textarea" },
      { name: "status", label: "Status", type: "select", required: true, options: ["Pending", "Approved", "Declined"] },
    ],
  },
  {
    id: "holidays", nav: "Holidays", singular: "Holiday", group: "Farm management",
    columns: [["name", "Holiday"], ["date", "Date"], ["source", "Source"], ["active", "Active"]],
    fields: [
      { name: "name", label: "Holiday name", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "source", label: "Source", type: "select", options: ["Farm calendar", "Public holiday", "Custom"] },
      { name: "active", label: "Include in leave calculations", type: "checkbox" },
    ],
  },
];

const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
const storageKey = "fieldwise-data-v1";
const main = document.querySelector("#main-content");
const appShell = document.querySelector("#app-shell");
const nav = document.querySelector("#sidebar-nav");
const toast = document.querySelector("#toast");
const profileMenu = document.querySelector("#profile-menu");
const profileToggle = document.querySelector("#profile-toggle");
const farmPopover = document.querySelector("#farm-popover");
const farmSwitcher = document.querySelector("#farm-switcher");
const sidebar = document.querySelector("#sidebar");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");
const importFile = document.querySelector("#import-file");
const authScreen = document.querySelector("#auth-screen");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSuccess = document.querySelector("#auth-success");
const authSubmitButton = document.querySelector("#auth-submit-btn");
const farmNameGroup = document.querySelector("#farm-name-group");
const authFarmName = document.querySelector("#auth-farm-name");
const signOutButton = document.querySelector("#sign-out");
const importLocalDataButton = document.querySelector("#import-local-data");
let toastTimer;
let listState = {};
let isSupabaseMode = false;
let isSignUpMode = false;
let sb = null;
let currentUser = null;
let currentFarmName = "Green Valley Farm";
let currentFarmId = null;
let farms = [];
let farmProfile = createDefaultFarmProfile();
let farmProfileStatus = "idle";
let farmRegion = loadLocalFarmRegion();
let weatherState = { status: "loading", data: null, error: "" };
let holidaySyncState = { status: "idle", error: "" };

function emptyStore() {
  return Object.fromEntries(resources.map((resource) => [resource.id, []]));
}

function createDefaultFarmProfile() {
  return {
    farm_name: "My farm",
    slug: "my-farm",
    unit: "Acres",
    farm_size: "",
    address: "",
    location: "",
    country: "Egypt",
    currency: "EGP",
    organic_farm: false,
    default_hours_per_day: 8,
    work_schedule: Object.fromEntries(workDayNames.map((day) => [day, 8])),
    active_modules: { ...defaultActiveModules },
    farm_id: null,
  };
}

function slugifyFarmName(value) {
  const slug = String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "farm";
}

function normalizeFarmProfile(profile = {}) {
  const defaults = createDefaultFarmProfile();
  const schedule = profile.work_schedule && typeof profile.work_schedule === "object"
    ? profile.work_schedule
    : {};
  const modules = profile.active_modules && typeof profile.active_modules === "object"
    ? profile.active_modules
    : {};
  const farmName = String(profile.farm_name || defaults.farm_name);
  return {
    ...defaults,
    ...profile,
    farm_name: farmName,
    slug: String(profile.slug || slugifyFarmName(farmName)),
    farm_size: profile.farm_size == null ? "" : String(profile.farm_size),
    location: String(profile.location || profile.address || ""),
    address: String(profile.address || profile.location || ""),
    default_hours_per_day: Number(profile.default_hours_per_day ?? defaults.default_hours_per_day),
    work_schedule: Object.fromEntries(workDayNames.map((day) => [
      day,
      Number(schedule[day] ?? defaults.work_schedule[day]),
    ])),
    active_modules: Object.fromEntries(Object.keys(defaultActiveModules).map((key) => [
      key,
      modules[key] === undefined ? true : Boolean(modules[key]),
    ])),
    organic_farm: Boolean(profile.organic_farm),
  };
}

function readLocalFarmProfile() {
  try {
    return normalizeFarmProfile(JSON.parse(localStorage.getItem(profileStorageKey) || "null") || {});
  } catch (error) {
    console.error("Could not load the saved farm profile.", error);
    window.setTimeout(() => showToast("The saved farm profile could not be read."), 0);
    return createDefaultFarmProfile();
  }
}

function loadStore() {
  const initial = emptyStore();
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return initial;
    const parsed = JSON.parse(saved);
    for (const resource of resources) {
      if (Array.isArray(parsed[resource.id])) initial[resource.id] = parsed[resource.id];
    }
  } catch (error) {
    console.error("Could not load saved farm data.", error);
    window.setTimeout(() => showToast("Saved data could not be read. The workspace started empty."), 0);
  }
  return initial;
}

function getFarmRegion(regionCode) {
  if (regionCode && typeof regionCode === "object") {
    const latitude = Number(regionCode.latitude);
    const longitude = Number(regionCode.longitude);
    const name = regionCode.location_name || regionCode.region_name || regionCode.name;
    if (Number.isFinite(latitude) && Number.isFinite(longitude) && name) {
      const countryCode = String(regionCode.country_code || regionCode.countryCode || "EG").toUpperCase();
      const regionCodeValue = String(regionCode.region_code || regionCode.regionCode || "");
      return {
        code: `${countryCode}:${latitude.toFixed(4)}:${longitude.toFixed(4)}`,
        name: String(name),
        countryCode,
        countryName: String(regionCode.country_name || regionCode.countryName || (countryCode === "EG" ? "Egypt" : countryCode)),
        regionCode: regionCodeValue,
        latitude,
        longitude,
      };
    }
    regionCode = regionCode.region_code || regionCode.regionCode;
  }
  const region = farmRegions.find((item) => item.code === regionCode) || defaultFarmRegion;
  return {
    ...region,
    countryCode: "EG",
    countryName: "Egypt",
    regionCode: region.code,
  };
}

function loadLocalFarmRegion() {
  try {
    const saved = JSON.parse(localStorage.getItem(regionSettingsKey) || "null");
    if (saved?.location) return getFarmRegion(saved.location);
    if (saved && Number.isFinite(Number(saved.latitude)) && Number.isFinite(Number(saved.longitude))) return getFarmRegion(saved);
    return getFarmRegion(saved?.regionCode);
  } catch (error) {
    console.error("Could not load the saved farm region.", error);
    window.setTimeout(() => showToast("The saved farm region could not be read. Using central Delta."), 0);
    return defaultFarmRegion;
  }
}

let store = loadStore();

function showToast(message, type = "") {
  toast.textContent = message;
  toast.classList.toggle("toast-success", type === "success");
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible", "toast-success");
  }, 3200);
}

function updateAccountUi() {
  const accountName = currentUser?.email || (isSupabaseMode ? "Farm account" : "Local workspace");
  const accountRole = currentUser ? "Signed in" : "Saved in this browser";
  const initial = accountName.charAt(0).toUpperCase() || "F";
  document.querySelector("#account-name").textContent = accountName;
  document.querySelector("#sidebar-account-name").textContent = accountName;
  document.querySelector("#account-role").textContent = accountRole;
  document.querySelector("#sidebar-account-role").textContent = accountRole;
  document.querySelector("#profile-avatar").textContent = initial;
  document.querySelector("#profile-menu-avatar").textContent = initial;
  document.querySelector("#sidebar-avatar").textContent = initial;
  document.querySelectorAll(".farm-name-display").forEach((element) => { element.textContent = currentFarmName; });
  renderFarmPopover();
  document.querySelector("#topbar-context").innerHTML = `<span class="context-dot"></span>${isSupabaseMode ? "Synced" : " Local preview · not synced"}`;
  document.querySelector("#topbar-context .context-dot").classList.toggle("context-dot-local", !isSupabaseMode);
  signOutButton.hidden = !currentUser;
  importLocalDataButton.hidden = !currentUser;
}

function renderFarmPopover() {
  const farmOptions = farms.length
    ? farms.map((farm) => `
      <button class="farm-option ${farm.id === currentFarmId ? "is-current" : ""}" type="button" data-farm-id="${escapeHtml(farm.id)}">
        <span class="farm-avatar">${escapeHtml((farm.name || "F").charAt(0).toUpperCase())}</span>
        <span class="farm-option-copy"><strong>${escapeHtml(farm.name)}</strong><small>${farm.id === currentFarmId ? "Current farm" : "Open farm records"}</small></span>
        ${farm.id === currentFarmId ? '<span class="checkmark" aria-label="Current farm">✓</span>' : ""}
      </button>
    `).join("")
    : `<div class="farm-option farm-option-static"><span class="farm-avatar">${escapeHtml(currentFarmName.charAt(0).toUpperCase())}</span><span class="farm-option-copy"><strong>${escapeHtml(currentFarmName)}</strong><small>Current workspace</small></span></div>`;
  const createForm = isSupabaseMode && currentUser
    ? `<form class="farm-create-form" id="farm-create-form"><label for="new-farm-name">Add a farm</label><div><input id="new-farm-name" name="farmName" maxlength="120" placeholder="Farm name" required /><button class="button button-green" type="submit">Create</button></div></form>`
    : "";
  farmPopover.innerHTML = `${farmOptions}${createForm}`;
}

function toCloudRecord(resourceId, record, farmId, userId) {
  const resource = resourceById.get(resourceId);
  const titleField = resource.fields.find((field) => ["name", "title", "hiveNumber", "category", "type"].includes(field.name));
  const title = titleField ? record[titleField.name] : "";
  const status = record.status || record.health || (record.active === false ? "inactive" : "active");
  const now = new Date().toISOString();
  return {
    farm_id: farmId,
    user_id: userId,
    record_type: resourceId,
    record_id: String(record.id),
    title: String(title || resource.singular),
    status: String(status),
    data: record,
    related_record_id: record.relatedRecord || null,
    created_at: record.createdAt || now,
    updated_at: record.updatedAt || now,
  };
}

async function persistCloudChanges(changes, farmId, userId) {
  for (const change of changes) {
    if (change.type === "upsert") {
      if (!change.records.length) continue;
      const { error } = await sb
        .from("farm_records")
        .upsert(change.records.map((record) => toCloudRecord(change.resourceId, record, farmId, userId)), {
          onConflict: "farm_id,record_type,record_id",
        });
      if (error) throw error;
      continue;
    }

    if (change.type === "delete") {
      const { error } = await sb
        .from("farm_records")
        .delete()
        .eq("farm_id", farmId)
        .eq("record_type", change.resourceId)
        .eq("record_id", String(change.recordId));
      if (error) throw error;
    }
  }
}

async function commit(nextStore, cloudChanges = []) {
  if (isSupabaseMode) {
    if (!sb || !currentUser || !currentFarmId) {
      showToast("Choose a farm before changing cloud records.");
      return false;
    }
    const targetFarmId = currentFarmId;
    const targetUserId = currentUser.id;
    try {
      await persistCloudChanges(cloudChanges, targetFarmId, targetUserId);
    } catch (error) {
      console.error("Could not sync farm data with Supabase.", error);
      showToast(`Changes were not synced: ${error.message || "Cloud service request failed."}`);
      return false;
    }
    if (currentFarmId === targetFarmId && currentUser?.id === targetUserId) store = nextStore;
    return true;
  }

  const previous = store;
  store = nextStore;
  try {
    localStorage.setItem(storageKey, JSON.stringify(store));
  } catch (error) {
    store = previous;
    console.error("Could not save farm data.", error);
    showToast("Changes were not saved. Check this browser's storage settings.");
    return false;
  }
  return true;
}

function showAuthError(message) {
  authError.textContent = message;
  authError.hidden = false;
  authSuccess.hidden = true;
}

function showAuthSuccess(message) {
  authSuccess.textContent = message;
  authSuccess.hidden = false;
  authError.hidden = true;
}

function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  farmNameGroup.hidden = !isSignUpMode;
  authFarmName.required = false;
  document.querySelector("#auth-title").textContent = isSignUpMode ? "Create your farm account" : "Welcome back";
  document.querySelector("#auth-subtitle").textContent = isSignUpMode
    ? "Create a secure cloud workspace for your farm."
    : "Sign in to access your farm records.";
  document.querySelector("#auth-toggle-text").textContent = isSignUpMode ? "Already have an account?" : "New to Fieldwise?";
  document.querySelector("#auth-toggle-link").textContent = isSignUpMode ? "Sign in" : "Create a farm account";
  authSubmitButton.textContent = isSignUpMode ? "Create farm account" : "Sign in";
  authError.hidden = true;
  authSuccess.hidden = true;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!sb) {
    showAuthError("Cloud storage is not connected. Check the app connection settings.");
    return;
  }

  const email = document.querySelector("#auth-email").value.trim();
  const password = document.querySelector("#auth-password").value;
  const farmName = authFarmName.value.trim() || "My farm";
  authError.hidden = true;
  authSuccess.hidden = true;
  authSubmitButton.disabled = true;
  authSubmitButton.textContent = "Please wait...";

  try {
    if (isSignUpMode) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { farm_name: farmName } },
      });
      if (error) throw error;
      if (!data.session) {
        toggleAuthMode();
        showAuthSuccess("Account created. Check your email to confirm it, then sign in.");
      } else {
        showAuthSuccess("Your farm account is ready.");
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (error) {
    showAuthError(error.message || "Authentication failed. Please try again.");
  } finally {
    authSubmitButton.disabled = false;
    authSubmitButton.textContent = isSignUpMode ? "Create farm account" : "Sign in";
  }
}

function applyAuthSession(session) {
  const user = session?.user || null;
  if (!user) {
    currentUser = null;
    currentFarmId = null;
    farms = [];
    currentFarmName = "My farm";
    farmProfile = createDefaultFarmProfile();
    farmProfileStatus = "idle";
    store = emptyStore();
    appShell.hidden = true;
    authScreen.hidden = false;
    updateAccountUi();
    render();
    return;
  }

  const userChanged = currentUser?.id !== user.id;
  currentUser = user;
  appShell.hidden = false;
  authScreen.hidden = true;
  if (userChanged) {
    currentFarmId = null;
    farms = [];
    currentFarmName = user.user_metadata?.farm_name || "My farm";
    farmProfile = normalizeFarmProfile({ farm_name: currentFarmName });
    farmProfileStatus = "loading";
    farmRegion = defaultFarmRegion;
    store = emptyStore();
    render();
    const userId = user.id;
    window.setTimeout(async () => {
      try {
        await loadFarmProfileAndRecords(userId);
      } catch (error) {
        console.error("Could not load farm records from Supabase.", error);
        showToast(`Could not load farm records: ${error.message || "Cloud service request failed."}`);
      }
      if (currentUser?.id !== userId) return;
      try {
        await loadFarmProfileSettings(userId);
      } catch (error) {
        farmProfileStatus = "error";
        weatherState = { status: "error", data: null, error: error.message || "Could not load the farm profile." };
        console.error("Could not load the farm profile from Supabase.", error);
        if (currentUser?.id === userId && error.code === "42703") {
          farmProfile = normalizeFarmProfile({
            ...farmProfile,
            location: defaultWeatherLocation,
            country: "Egypt",
          });
          showToast("Supabase needs the latest setup script. Using Ashmoun as the weather location for now.");
          if (currentUser?.id === userId) {
            render();
            try {
              await refreshWeatherFromFarmProfile(userId);
            } catch (weatherError) {
              reportFarmWeatherLocationError(weatherError);
            }
          }
        } else {
          showToast(`Could not load farm profile: ${error.message || "Cloud service request failed."}`);
          if (currentUser?.id === userId) render();
        }
      }
    }, 0);
  }
  updateAccountUi();
}

async function loadFarmProfileSettings(userId) {
  if (!sb || currentUser?.id !== userId) return;
  const columns = "id, farm_id, farm_name, slug, unit, farm_size, address, location, country, currency, organic_farm, default_hours_per_day, work_schedule, active_modules";
  let { data, error } = await sb
    .from("farm_profiles")
    .select(columns)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    const defaults = normalizeFarmProfile({
      farm_name: currentUser.user_metadata?.farm_name || currentFarmName,
    });
    const { data: createdProfile, error: createError } = await sb
      .from("farm_profiles")
      .upsert({
        id: userId,
        farm_id: farms.find((farm) => farm.id === currentFarmId)?.created_by === userId ? currentFarmId : null,
        farm_name: defaults.farm_name,
        slug: defaults.slug,
        unit: defaults.unit,
        farm_size: null,
        address: defaults.address,
        location: defaults.location,
        country: defaults.country,
        currency: defaults.currency,
        organic_farm: defaults.organic_farm,
        default_hours_per_day: defaults.default_hours_per_day,
        work_schedule: defaults.work_schedule,
        active_modules: defaults.active_modules,
      }, { onConflict: "id" })
      .select(columns)
      .single();
    if (createError) throw createError;
    data = createdProfile;
  }
  if (currentUser?.id !== userId) return;

  farmProfile = normalizeFarmProfile(data);
  farmProfileStatus = "ready";
  if (farmProfile.farm_id === currentFarmId) currentFarmName = farmProfile.farm_name;
  updateAccountUi();
  render();
  try {
    await refreshWeatherFromFarmProfile(userId);
  } catch (error) {
    reportFarmWeatherLocationError(error);
  }
}

async function loadFarmProfileAndRecords(userId) {
  const { data, error } = await sb
    .from("farms")
    .select("id, name, country_code, country_name, region_code, region_name, location_name, latitude, longitude, created_by, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (currentUser?.id !== userId) return;

  let availableFarms = data || [];
  if (!availableFarms.length) {
    const farmName = currentUser?.user_metadata?.farm_name || "My farm";
    const { data: createdFarm, error: createError } = await sb.rpc("create_farm", { p_name: farmName });
    if (createError) throw createError;
    const farm = Array.isArray(createdFarm) ? createdFarm[0] : createdFarm;
    if (!farm?.id) throw new Error("Supabase did not return the new farm.");
    availableFarms = [farm];
  }
  farms = availableFarms;

  let savedFarmId = "";
  try {
    savedFarmId = localStorage.getItem(`fieldwise-active-farm-v1:${userId}`) || "";
  } catch (storageError) {
    console.warn("Could not read the saved farm selection.", storageError);
  }
  const selectedFarm = availableFarms.find((farm) => farm.id === savedFarmId) || availableFarms[0];
  await loadFarmRecords(selectedFarm, userId);
}

async function loadFarmRecords(farm, userId = currentUser?.id) {
  if (!farm?.id || !userId || currentUser?.id !== userId) return;

  currentFarmId = farm.id;
  currentFarmName = farm.name || "My farm";
  farmRegion = getFarmRegion(farm);
  holidaySyncState = { status: "idle", error: "" };
  store = emptyStore();
  updateAccountUi();
  render();
  try {
    localStorage.setItem(`fieldwise-active-farm-v1:${userId}`, farm.id);
  } catch (storageError) {
    console.warn("Could not save the selected farm on this device.", storageError);
  }

  const { data: rows, error } = await sb
    .from("farm_records")
    .select("record_type, record_id, data, related_record_id, created_at, updated_at")
    .eq("farm_id", farm.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (currentUser?.id !== userId || currentFarmId !== farm.id) return;

  const nextStore = emptyStore();
  let skipped = 0;
  for (const row of rows || []) {
    if (!resourceById.has(row.record_type)) {
      skipped += 1;
      continue;
    }
    const data = row.data && typeof row.data === "object" ? row.data : {};
    nextStore[row.record_type].push({
      ...data,
      id: row.record_id || data.id,
      ...(row.related_record_id ? { relatedRecord: row.related_record_id } : {}),
      createdAt: data.createdAt || row.created_at,
      updatedAt: data.updatedAt || row.updated_at,
    });
  }

  store = nextStore;
  updateAccountUi();
  render();
  if (farmProfileStatus === "ready") {
    void refreshWeatherFromFarmProfile(userId).catch(reportFarmWeatherLocationError);
  }
  if (skipped) console.warn(`Skipped ${skipped} cloud record(s) with unknown resource types.`);
}

async function createFarm(name) {
  const farmName = name.trim();
  if (!currentUser || !sb || !farmName) return;
  const userId = currentUser.id;
  try {
    const { data, error } = await sb.rpc("create_farm", { p_name: farmName });
    if (error) throw error;
    const createdFarm = Array.isArray(data) ? data[0] : data;
    if (!createdFarm?.id) throw new Error("Supabase did not return the new farm.");
    if (currentUser?.id !== userId) return;
    farms = [...farms.filter((farm) => farm.id !== createdFarm.id), createdFarm];
    updateAccountUi();
    await loadFarmRecords(createdFarm, userId);
    farmPopover.hidden = true;
    farmSwitcher.setAttribute("aria-expanded", "false");
    showToast(`Farm “${farmName}” created.`);
  } catch (error) {
    console.error("Could not create a farm.", error);
    showToast(`Could not create farm: ${error.message || "Cloud service request failed."}`);
  }
}

function weatherDescription(code) {
  const descriptions = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
    56: "Freezing drizzle", 57: "Heavy freezing drizzle", 61: "Light rain", 63: "Rain",
    65: "Heavy rain", 66: "Freezing rain", 67: "Heavy freezing rain", 71: "Light snow",
    73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Rain showers",
    81: "Heavy showers", 82: "Violent showers", 85: "Snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Heavy thunderstorm with hail",
  };
  return descriptions[code] || "Conditions unavailable";
}

function weatherSymbol(code) {
  if ([0, 1].includes(code)) return "☀";
  if ([2, 3, 45, 48].includes(code)) return "☁";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄";
  if ([95, 96, 99].includes(code)) return "⛈";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "☂";
  return "☀";
}

function formatWeatherValue(value, digits = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "—";
}

function renderWeatherCards() {
  const weather = weatherState.data;
  const current = weather?.current;
  const daily = weather?.daily;
  const currentCode = current?.weather_code;
  const condition = weatherState.status === "loading"
    ? "Loading regional forecast…"
    : weatherState.status === "error"
      ? "Weather data unavailable"
      : weatherDescription(currentCode);
  const days = daily?.time || [];

  return `
    <div class="weather-heading-row">
      <h2 class="weather-heading-title" id="weather-heading">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 16.2a4.5 4.5 0 0 0-3.8-7.1A6 6 0 0 0 4.7 11 3.5 3.5 0 0 0 5.5 18H19a3.5 3.5 0 0 0 1-1.8Z" /></svg>
        <span>Weather Forecast</span>
      </h2>
      <button class="weather-refresh-button${weatherState.status === "loading" ? " is-loading" : ""}" type="button" data-action="refresh-weather" aria-label="Refresh weather forecast">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></svg>
        <span>Refresh</span>
      </button>
    </div>
    <div class="weather-subheader">
      <span>Current Conditions</span>
      <span>${escapeHtml(getWeatherLocationLabel())}</span>
    </div>
    <div class="panel-card weather-card" aria-live="polite">
      <div class="current-weather-card">
        <div class="current-weather-summary">
          <span class="current-weather-icon" aria-hidden="true">${weatherSymbol(currentCode)}</span>
          <div><strong class="current-temperature">${current ? formatWeatherValue(current.temperature_2m, 1) : "—"}<span>°C</span></strong><span class="current-condition">${escapeHtml(condition)}</span></div>
        </div>
        <span class="condition-place">${escapeHtml(farmRegion.name)} · Open-Meteo</span>
      </div>
      <div class="conditions-metrics" aria-label="Current weather details">
        <div><span class="weather-detail-icon" aria-hidden="true">◉</span><span>Humidity</span><strong>${current ? `${formatWeatherValue(current.relative_humidity_2m)}%` : "—"}</strong></div>
        <div><span class="weather-detail-icon" aria-hidden="true">☂</span><span>Rain</span><strong>${current ? `${formatWeatherValue(current.rain, 1)} mm` : "—"}</strong></div>
        <div><span class="weather-detail-icon" aria-hidden="true">≋</span><span>Wind</span><strong>${current ? `${formatWeatherValue(current.wind_speed_10m)} km/h` : "—"}</strong></div>
        <div><span class="weather-detail-icon" aria-hidden="true">${weatherSymbol(currentCode)}</span><span>Condition</span><strong>${escapeHtml(weatherState.status === "ready" ? weatherDescription(currentCode) : condition)}</strong></div>
      </div>
      <h3 class="forecast-heading">3-day forecast</h3>
      <div class="forecast-grid">
        ${days.length ? days.slice(0, 3).map((date, index) => {
          const code = daily.weather_code[index];
          const dayName = index === 0 ? "Today" : index === 1 ? "Tomorrow" : new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${date}T12:00:00`));
          return `<article class="forecast-day"><strong>${dayName} · ${escapeHtml(date.slice(5))}</strong><span class="forecast-symbol ${weatherSymbol(code) === "☀" ? "mostly-sun" : weatherSymbol(code) === "☂" ? "sun-cloud" : "cloud"}" aria-hidden="true">${weatherSymbol(code)}</span><span class="forecast-condition">${escapeHtml(weatherDescription(code))}</span><div class="forecast-temperatures"><strong>${formatWeatherValue(daily.temperature_2m_max[index])}°</strong><span>${formatWeatherValue(daily.temperature_2m_min[index])}°</span></div><span class="forecast-wind"><span aria-hidden="true">≋</span> ${formatWeatherValue(daily.wind_speed_10m_max[index])} km/h wind</span></article>`;
        }).join("") : `<article class="forecast-day forecast-placeholder"><strong>${weatherState.status === "error" ? "Forecast unavailable" : "Forecast loading"}</strong><span class="forecast-condition">${weatherState.status === "error" ? "Check your connection and try again." : "Fetching the local forecast…"}</span></article>`}
      </div>
      <aside class="farming-insight">
        <span class="insight-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18h6m-5 3h4m-5.8-6.2A7 7 0 1 1 15.8 15c-.8.6-1.3 1.4-1.5 2h-4.6c-.2-.6-.7-1.4-1.5-2Z" /><path d="M12 4v1m6.3 1.7-.7.7M5.7 6.7l.7.7" /></svg></span>
        <div><h3>Farming Insight</h3><p>${escapeHtml(getFarmingInsight(weather))}</p></div>
      </aside>
    </div>
  `;
}

function getWeatherLocationLabel() {
  const location = String(farmProfile.location || "").trim() || defaultWeatherLocation;
  const countryCode = farmRegion.countryCode || getCountryCode(farmProfile.country) || "EG";
  const suffix = [countryCode, farmProfile.country]
    .filter(Boolean)
    .find((value) => location.toLowerCase().endsWith(`, ${value}`.toLowerCase()));
  const locationName = suffix ? location.slice(0, -(suffix.length + 2)).trim() : location;
  return `${locationName} · ${countryCode}`;
}

function getFarmingInsight(weather) {
  if (!weather) return weatherState.status === "error"
    ? "A local insight will appear when the regional forecast is available."
    : "Loading a field-work insight for your selected region.";
  const rain = Number(weather.daily.precipitation_sum?.[0] || 0);
  const high = Number(weather.daily.temperature_2m_max?.[0]);
  const wind = Number(weather.daily.wind_speed_10m_max?.[0]);
  if (rain >= 5) return `${formatWeatherValue(rain, 1)} mm of rain is forecast today. Review soil moisture before scheduling irrigation.`;
  if (wind >= 35) return `Winds may reach ${formatWeatherValue(wind)} km/h today. Review conditions before spraying or other wind-sensitive field work.`;
  if (high >= 35) return `A high of ${formatWeatherValue(high)}°C is forecast today. Consider heat exposure when planning field work.`;
  return `Forecast for ${farmRegion.name} is ready. Check soil moisture before your next irrigation.`;
}

async function refreshWeather() {
  const requestedRegion = farmRegion;
  const requestedFarmId = currentFarmId;
  weatherState = { status: "loading", data: null, error: "" };
  if (getRoute().page === "dashboard") render();

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(requestedRegion.latitude),
    longitude: String(requestedRegion.longitude),
    current: "temperature_2m,relative_humidity_2m,rain,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum",
    forecast_days: "3",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    timezone: "auto",
  }).toString();

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}.`);
    const data = await response.json();
    if (!data.current || !data.daily) throw new Error("Open-Meteo returned an incomplete forecast.");
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;
    weatherState = { status: "ready", data, error: "" };
  } catch (error) {
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;
    console.error("Could not load the regional weather forecast.", error);
    weatherState = { status: "error", data: null, error: error.message };
  }
  if (getRoute().page === "dashboard") render();
}

function publicHolidayRecord(holiday, location) {
  const name = holiday.localName || holiday.name;
  const countryCode = location.countryCode;
  return {
    id: `official-${countryCode}-${holiday.date}-${encodeURIComponent(holiday.name || name)}`,
    name,
    date: holiday.date,
    source: "Public holiday",
    active: true,
    official: true,
    countryCode,
    regionCode: location.regionCode,
    holidayProvider: "Nager.Date",
  };
}

async function syncOfficialHolidays() {
  const requestedRegion = farmRegion;
  const requestedFarmId = currentFarmId;
  const countryCode = requestedRegion.countryCode;
  const year = new Date().getFullYear();
  holidaySyncState = { status: "loading", error: "" };
  try {
    const years = [year, year + 1];
    const yearlyLists = await Promise.all(years.map(async (holidayYear) => {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${holidayYear}/${countryCode}`);
      if (!response.ok) throw new Error(`Holiday service returned HTTP ${response.status}.`);
      const holidays = await response.json();
      if (!Array.isArray(holidays)) throw new Error("Holiday service returned an invalid response.");
      return holidays.filter((holiday) => (holiday.types || []).includes("Public")
        && (!holiday.counties || holiday.counties.length === 0
          || !requestedRegion.regionCode
          || holiday.counties.includes(requestedRegion.regionCode)))
        .map((holiday) => publicHolidayRecord(holiday, requestedRegion));
    }));
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;

    const fetched = yearlyLists.flat();
    const targetYears = new Set(years.map(String));
    const stale = store.holidays.filter((record) => record.official
      && record.countryCode === countryCode
      && targetYears.has(String(record.date || "").slice(0, 4))
      && !fetched.some((holiday) => holiday.id === record.id));
    const staleIds = new Set(stale.map((record) => record.id));
    const existing = new Map(store.holidays.filter((record) => !staleIds.has(record.id)).map((record) => [record.id, record]));
    const changed = fetched.filter((record) => {
      const saved = existing.get(record.id);
      return !saved || ["name", "date", "source", "active", "official", "countryCode", "regionCode", "holidayProvider"]
        .some((key) => saved[key] !== record[key]);
    });
    for (const record of fetched) existing.set(record.id, record);
    if (changed.length || stale.length) {
      const nextStore = { ...store, holidays: Array.from(existing.values()) };
      const changes = [];
      if (changed.length) changes.push({ type: "upsert", resourceId: "holidays", records: changed });
      for (const record of stale) changes.push({ type: "delete", resourceId: "holidays", recordId: record.id });
      if (!await commit(nextStore, changes)) {
        throw new Error("Could not save official holiday records.");
      }
    }
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;
    holidaySyncState = { status: "ready", error: "" };
  } catch (error) {
    if (farmRegion.code !== requestedRegion.code || currentFarmId !== requestedFarmId) return;
    console.error("Could not sync official public holidays.", error);
    holidaySyncState = { status: "error", error: error.message };
  }
  if (getRoute().resource === "holidays") render();
}

async function refreshRegionData() {
  await Promise.all([refreshWeather(), syncOfficialHolidays()]);
}

function getCountryCode(countryName) {
  const codes = {
    Egypt: "EG",
    "Saudi Arabia": "SA",
    "United Arab Emirates": "AE",
    Jordan: "JO",
    "United States": "US",
    "United Kingdom": "GB",
    Canada: "CA",
    Australia: "AU",
  };
  return codes[countryName] || "";
}

function toWeatherLocation(place, countryHint = "") {
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  const countryCode = String(place.country_code || place.countrycode || "").toUpperCase();
  const countryName = countryHint && countryHint !== "Other" && getCountryCode(countryHint) === countryCode
    ? countryHint
    : String(place.country || countryHint || "");
  const placeName = String(place.name || place.city || place.locality || "");
  const regionName = String(place.admin1 || place.state || "");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    || !/^[A-Z]{2}$/.test(countryCode) || !placeName) {
    throw new Error("The location service returned invalid coordinates.");
  }
  const location = getFarmRegion({
    name: [placeName, regionName, countryName].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join("، "),
    country_code: countryCode,
    country_name: countryName,
    region_code: String(place.region_code || ""),
    latitude,
    longitude,
  });
  return {
    location,
    address: [placeName, regionName].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(", "),
    country: countryName,
  };
}

function matchesProfileCountry(place, country, countryCode) {
  if (!country || country === "Other") return true;
  if (countryCode) return String(place.country_code || place.countrycode || "").toUpperCase() === countryCode;
  return String(place.country || "").trim().toLowerCase() === country.trim().toLowerCase();
}

function findDeltaRegion(address) {
  const normalizedAddress = String(address || "").toLowerCase().replace(/[\u064b-\u065f]/g, "");
  const match = farmRegionAliases.find((region) => region.names.some((name) => {
    const normalizedName = name.toLowerCase().replace(/[\u064b-\u065f]/g, "");
    return normalizedAddress.includes(normalizedName);
  }));
  return match ? farmRegions.find((region) => region.code === match.code) : null;
}

async function resolveFarmProfileLocation(address, country) {
  const searchText = String(address || "").trim();
  if (!searchText) throw new Error("Enter a farm address in Farm profile before saving.");
  const countryCode = getCountryCode(country);
  const queries = [searchText];
  const geocodingErrors = [];

  for (const query of queries) {
    try {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.search = new URLSearchParams({ name: query, count: "10", language: "en", format: "json" }).toString();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Open-Meteo geocoding returned HTTP ${response.status}.`);
      const data = await response.json();
      const candidates = Array.isArray(data.results) ? data.results : [];
      const match = candidates.find((place) => matchesProfileCountry(place, country, countryCode));
      if (match) return toWeatherLocation(match, country);
    } catch (error) {
      geocodingErrors.push(error.message || "Open-Meteo geocoding failed.");
    }
  }

  const deltaRegion = findDeltaRegion(searchText);
  if (deltaRegion && (!countryCode || countryCode === "EG")) {
    return toWeatherLocation({
      name: searchText.replace(/,\s*(?:EG|Egypt)$/i, ""),
      country: "Egypt",
      country_code: "EG",
      admin1: "",
      region_code: deltaRegion.code,
      latitude: deltaRegion.latitude,
      longitude: deltaRegion.longitude,
    }, country || "Egypt");
  }

  if (geocodingErrors.length) {
    throw new Error(`Could not look up the profile location. ${geocodingErrors.join(" ")}`);
  }
  throw new Error(`No matching location was found${country && country !== "Other" ? ` in ${country}` : ""}. Check the address in Farm profile.`);
}

async function refreshWeatherFromFarmProfile(userId = currentUser?.id) {
  const savedLocation = String(farmProfile.location || "").trim();
  const location = savedLocation || defaultWeatherLocation;
  const country = savedLocation ? farmProfile.country || "Egypt" : "Egypt";
  const resolved = await resolveFarmProfileLocation(location, country);
  if (currentUser?.id !== userId) return;
  farmRegion = resolved.location;
  if (isSupabaseMode && !currentFarmId) {
    await refreshWeather();
    return;
  }
  await refreshRegionData();
}

function reportFarmWeatherLocationError(error) {
  console.error("Could not load weather from the farm profile location.", error);
  weatherState = { status: "error", data: null, error: error.message || "Could not resolve the farm location." };
  if (getRoute().page === "dashboard") render();
  showToast(`Could not load weather for the farm location: ${error.message || "Unexpected error."}`);
}

async function initializeSupabase() {
  const config = window.FIELDWISE_SUPABASE_CONFIG;
  const url = String(config?.url || "").trim();
  const anonKey = String(config?.anonKey || "").trim();
  const secureUrl = url.startsWith("https://");
  const localDevelopmentUrl = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(url);
  const configured = (secureUrl || localDevelopmentUrl)
    && anonKey.length > 20
    && !url.includes("YOUR_SUPABASE")
    && !anonKey.includes("YOUR_SUPABASE");

  if (!configured) {
    isSupabaseMode = false;
    farmProfile = readLocalFarmProfile();
    farmProfileStatus = "ready";
    currentFarmName = farmProfile.farm_name;
    appShell.hidden = false;
    authScreen.hidden = true;
    farmRegion = loadLocalFarmRegion();
    updateAccountUi();
    render();
    void refreshWeatherFromFarmProfile().catch(reportFarmWeatherLocationError);
    return;
  }

  isSupabaseMode = true;
  currentFarmName = "My farm";
  store = emptyStore();
  appShell.hidden = true;
  authScreen.hidden = false;
  updateAccountUi();

  if (!window.supabase?.createClient) {
    document.querySelector("#auth-config-note").hidden = false;
    authSubmitButton.disabled = true;
    showAuthError("The cloud service could not be loaded. Check your internet connection and reload.");
    return;
  }

  try {
    sb = window.supabase.createClient(url, anonKey);
    sb.auth.onAuthStateChange((_event, session) => applyAuthSession(session));
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    applyAuthSession(data.session);
  } catch (error) {
    console.error("Could not initialize Supabase.", error);
    showAuthError(error.message || "Could not connect to the cloud service.");
  }
}

async function logoutFarm() {
  if (!sb) return;
  try {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Could not sign out from Supabase.", error);
    showToast(`Could not sign out: ${error.message || "Cloud service request failed."}`);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function makeId() {
  return window.crypto && typeof window.crypto.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getRoute() {
  const path = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!path.length) return { page: "dashboard" };
  if (path[0] === "help-center") return { page: "help-center" };
  if (path[0] === "farm-profile") return { page: "farm-profile" };
  if (!resourceById.has(path[0])) return { page: "not-found" };
  if (path[1] === "new") return { page: "form", resource: path[0] };
  if (path[1] === "edit" && path[2]) return { page: "form", resource: path[0], recordId: decodeURIComponent(path[2]) };
  return { page: "list", resource: path[0] };
}

function setSidebarOpen(open) {
  sidebar.classList.toggle("open", open);
  sidebarBackdrop.classList.toggle("visible", open);
  sidebarToggle.setAttribute("aria-expanded", String(open));
  sidebarToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

function renderNavigation(activeId) {
  nav.innerHTML = `
    <a class="nav-link dashboard-link ${activeId === "dashboard" ? "active" : ""}" href="#/" data-route="dashboard" ${activeId === "dashboard" ? 'aria-current="page"' : ""}>
      <span class="nav-icon" aria-hidden="true">▦</span><span>Dashboard</span>
    </a>
  ` + resourceGroups.filter((group) => !group.module || farmProfile.active_modules[group.module]).map((group) => `
    <section class="nav-group">
      <button class="nav-group-toggle" type="button" aria-expanded="true">
        <span>${escapeHtml(group.label)}</span><span class="group-caret" aria-hidden="true">⌄</span>
      </button>
      <div class="nav-group-items tree-items">
        ${group.items.map((id) => {
          if (id === "help-center") {
            return `<a class="nav-link ${activeId === id ? "active" : ""}" href="#/help-center" data-route="help-center" ${activeId === id ? 'aria-current="page"' : ""}>
              <span class="nav-icon">?</span><span>Help center</span>
            </a>`;
          }
          const resource = resourceById.get(id);
          const count = store[id].length;
          return `<a class="nav-link ${activeId === id ? "active" : ""}" href="#/${id}" data-route="${id}" ${activeId === id ? 'aria-current="page"' : ""}>
            <span class="nav-icon" aria-hidden="true">${navigationIcon(id)}</span>
            <span>${escapeHtml(resource.nav)}</span><span class="nav-count">${count}</span>
          </a>`;
        }).join("")}
      </div>
    </section>
  `).join("") + `
    <section class="nav-group">
      <button class="nav-group-toggle" type="button" aria-expanded="true">
        <span>Settings</span><span class="group-caret" aria-hidden="true">⌄</span>
      </button>
      <div class="nav-group-items tree-items">
        <a class="nav-link ${activeId === "farm-profile" ? "active" : ""}" href="#/farm-profile" data-route="farm-profile" ${activeId === "farm-profile" ? 'aria-current="page"' : ""}>
          <span class="nav-icon" aria-hidden="true">⚙</span><span>Farm profile</span>
        </a>
      </div>
    </section>
  `;
}

function navigationIcon(id) {
  const icons = {
    "crop-fields": "⌗", crops: "♧", "planting-seasons": "◷", "bee-hives": "▤",
    "bee-colonies": "♧", "hive-inspections": "⌕", "honey-productions": "◉",
    "bee-hive-types": "▦", "animal-fields": "⌗", animals: "♧",
    "livestock-groups": "♙", "feed-mixtures": "♨", "financial-records": "↗", users: "♙",
    tasks: "☷", "farm-workers": "♙", "worker-leaves": "◷", holidays: "▣",
  };
  return icons[id] || "•";
}

function renderDashboard() {
  const stats = [
    ["animals", "Livestock", "Animals registered", "green", "♧", () => store.animals.length],
    ["crops", "Crop records", "Crops in the workspace", "green", "♧", () => store.crops.length],
    ["crop-fields", "Crop fields", "Areas under cultivation", "blue", "▦", () => store["crop-fields"].length],
    ["bee-hives", "Beehives", "Apiary locations", "green", "▤", () => store["bee-hives"].length],
    ["tasks", "Open tasks", "Work to follow up", "amber", "☷", () => store.tasks.filter((task) => task.status !== "Complete").length],
    ["financial-records", "Financial records", "Income and expenses", "blue", "↗", () => store["financial-records"].length],
  ];
  const recent = resources.flatMap((resource) => store[resource.id].map((record) => ({
    resource, record,
  }))).sort((a, b) => String(b.record.updatedAt || b.record.createdAt || "").localeCompare(String(a.record.updatedAt || a.record.createdAt || ""))).slice(0, 5);

  return `
    <div class="page-heading">
      <div><p class="eyebrow">FARM WORKSPACE</p><h1>Dashboard</h1><p class="page-subtitle">A clear view of your fields, animals, and daily work.</p></div>
      <a class="button button-green" href="#/tasks/new">＋ New task</a>
    </div>
    <section class="weather-section" aria-labelledby="weather-heading">${renderWeatherCards()}</section>
    <section class="dashboard-section overview-section" aria-labelledby="overview-heading">
      <div class="section-heading-row"><div><p class="eyebrow">FARM SUMMARY</p><h2 class="section-title" id="overview-heading"><span class="overview-chart-icon" aria-hidden="true"><i></i><i></i><i></i></span>Farm Overview</h2></div><span class="overview-period">Live counts</span></div>
      <div class="stats-grid">
        ${stats.map(([id, title, caption, color, icon, count]) => `
          <a class="stat-card stat-card-dashboard" href="#/${id}">
            <div class="stat-top"><span>${escapeHtml(title)}</span><span class="stat-icon ${color}">${icon}</span></div>
            <strong class="stat-value">${count()}</strong>
            <span class="stat-subtitle ${color}-subtitle">${escapeHtml(caption)} <span class="stat-subtitle-icon" aria-hidden="true">${icon}</span></span>
          </a>
        `).join("")}
      </div>
    </section>
    <section class="dashboard-welcome relative isolate mb-8 flex min-h-[220px] items-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#14171a] to-[#0b0d0e] px-6 py-7 shadow-lg shadow-black/20 sm:px-8 sm:py-8">
      <div class="welcome-copy relative z-10 max-w-2xl">
        <span class="welcome-kicker mb-4 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-emerald-300">YOUR FARM, AT A GLANCE</span>
        <h2 class="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">Make today a good day in the field.</h2>
        <p class="mt-2 max-w-lg text-sm leading-6 text-gray-400">Keep important records together, plan the work ahead, and spot what needs attention.</p>
        <div class="welcome-actions">
          <a class="button button-green bg-emerald-600 text-white shadow-sm shadow-emerald-950/40 transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400" href="#/crop-fields/new">Add a field</a>
          <a class="button button-quiet border border-white/10 bg-white/[0.03] text-gray-200 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white" href="#/animals/new">Register livestock</a>
        </div>
      </div>
      <div class="welcome-art" aria-hidden="true"><span class="sun-disc bg-emerald-400/20 shadow-[0_0_70px_rgba(16,185,129,0.2)]"></span><span class="field-line line-one border-emerald-400/20"></span><span class="field-line line-two border-emerald-400/20"></span><span class="field-line line-three border-emerald-400/20"></span><span class="sprout text-emerald-400/60">✳</span></div>
    </section>
    <div class="dashboard-columns">
      <section class="panel-card recent-card">
        <div class="card-heading"><div><p class="eyebrow">LATEST CHANGES</p><h2>Recent records</h2></div><a class="text-link" href="#/tasks">View tasks</a></div>
        ${recent.length ? `<div class="recent-list">${recent.map(({ resource, record }) => `
          <a class="recent-row" href="#/${resource.id}/edit/${encodeURIComponent(record.id)}">
            <span class="recent-icon">${navigationIcon(resource.id)}</span>
            <span class="recent-copy"><strong>${escapeHtml(record.name || record.title || record.description || resource.singular)}</strong><small>${escapeHtml(resource.nav)} · ${escapeHtml(formatDate((record.updatedAt || record.createdAt || "").slice(0, 10)) || "Just now")}</small></span>
            <span class="recent-arrow">›</span>
          </a>`).join("")}</div>` : `<div class="empty-recent"><span class="empty-symbol">✳</span><strong>No records yet</strong><p>Add your first crop, animal, or task to start building your farm log.</p><a class="text-link" href="#/crop-fields/new">Create your first record →</a></div>`}
      </section>
    </div>
    <section class="dashboard-section quick-links-section">
      <div class="section-heading-row"><div><p class="eyebrow">SHORTCUTS</p><h2 class="section-title">Common tasks</h2></div></div>
      <div class="quick-links">
        <a href="#/financial-records/new"><span class="quick-icon green">↗</span><span><strong>Log a transaction</strong><small>Record income or spending</small></span><span class="quick-arrow">›</span></a>
        <a href="#/hive-inspections/new"><span class="quick-icon amber">⌕</span><span><strong>Inspect a hive</strong><small>Save a colony check-up</small></span><span class="quick-arrow">›</span></a>
        <a href="#/worker-leaves/new"><span class="quick-icon blue">◷</span><span><strong>Plan leave</strong><small>Manage team availability</small></span><span class="quick-arrow">›</span></a>
      </div>
    </section>
  `;
}

function classifyRecordState(record) {
  if (record.active === false) return "inactive";
  const rawStatus = record.status ?? record.health ?? record.active;
  if (rawStatus == null || rawStatus === "") return "active";
  const status = String(rawStatus).trim().toLowerCase();
  if (["inactive", "archived", "declined", "rejected", "cancelled", "canceled"].includes(status)) return "inactive";
  if (/attention|treat|maintenance|urgent|pending|progress|not started|follow.?up|weak|overdue/.test(status)) return "attention";
  return "active";
}

function getResourceStatusCounts(records) {
  return records.reduce((counts, record) => {
    counts[classifyRecordState(record)] += 1;
    return counts;
  }, { active: 0, attention: 0, inactive: 0 });
}

function renderListStats(resource, state) {
  const records = store[resource.id];
  const counts = getResourceStatusCounts(records);
  const stats = [
    ["all", "Total records", records.length, "Every record in this section", "total"],
    ["active", "Active", counts.active, "Healthy and in progress", "active"],
    ["attention", "Needs attention", counts.attention, "Follow-up recommended", "attention"],
    ["inactive", "Inactive", counts.inactive, "Inactive or archived", "inactive"],
  ];
  const icons = {
    total: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    active: '<path d="m5 12 4 4L19 6"/>',
    attention: '<path d="M12 3 2.8 19h18.4L12 3Z"/><path d="M12 9v4m0 3h.01"/>',
    inactive: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  };
  return `<section class="record-stats-grid" aria-label="${escapeHtml(resource.nav)} status summary">
    ${stats.map(([group, label, value, description, icon]) => {
      const selected = group === "all" ? !state.statusGroup : state.statusGroup === group;
      return `
      <button class="record-stat-card ${icon === "active" ? "is-highlighted" : ""} ${selected ? "is-selected" : ""}" type="button" data-status-group="${group}" aria-pressed="${selected}">
        <span class="record-stat-icon ${icon}" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[icon]}</svg></span>
        <span class="record-stat-copy"><span class="record-stat-label">${label}</span><strong>${value}</strong><span class="record-stat-description">${description}</span></span>
      </button>
    `}).join("")}
  </section>`;
}

function renderHolidayRegionNote() {
  const message = holidaySyncState.status === "loading"
    ? "Loading public dates for this year and next year…"
    : holidaySyncState.status === "error"
      ? "The public holiday feed could not be refreshed. Existing and manually added dates remain available."
      : `${farmRegion.countryName}'s feed lists public holidays for the selected country. Add local notices manually when they apply only to your area.`;
  return `<aside class="holiday-region-note"><div><strong>${escapeHtml(farmRegion.countryName)} public holidays · ${escapeHtml(farmRegion.name)}</strong><p>${message} Dates are supplied by <a href="https://date.nager.at/" target="_blank" rel="noopener noreferrer">Nager.Date</a>; confirm annual announcements with the relevant authorities.</p></div><span>${holidaySyncState.status === "ready" ? "Synced" : holidaySyncState.status === "loading" ? "Updating" : holidaySyncState.status === "error" ? "Offline" : "Ready"}</span></aside>`;
}

function getFilterField(resource) {
  return resource.fields.find((field) => field.name === "status")
    || resource.fields.find((field) => field.name === "health")
    || resource.fields.find((field) => field.name === "type")
    || resource.fields.find((field) => field.type === "select");
}

function renderList(resource) {
  const state = listState[resource.id] || { query: "", filter: "", sort: "", direction: 1, hiddenColumns: [] };
  const records = filterAndSort(resource, state);
  const filterField = getFilterField(resource);
  const filterOptions = filterField?.options || [];
  const hiddenColumns = new Set(state.hiddenColumns || []);
  const activeFilters = Number(Boolean(state.filter)) + Number(Boolean(state.statusGroup));
  const noStoredRecords = store[resource.id].length === 0;
  const filterMenu = filterOptions.length
    ? `<label class="select-filter"><span>${escapeHtml(filterField.label)}</span><select id="record-filter"><option value="">All</option>${filterOptions.map((option) => `<option value="${escapeHtml(option)}" ${state.filter === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`
    : `<p class="toolbar-menu-note">No status filters are available for this section.</p>`;
  return `
    <div class="page-heading">
      <div><p class="eyebrow">${escapeHtml(resource.group.toUpperCase())}</p><h1>${escapeHtml(resource.nav)}</h1><p class="page-subtitle">Keep ${escapeHtml(resource.nav.toLowerCase())} organized in one place.</p></div>
      <a class="button button-green" href="#/${resource.id}/new">＋ Add ${escapeHtml(resource.singular.toLowerCase())}</a>
    </div>
    ${resource.id === "holidays" ? renderHolidayRegionNote() : ""}
    ${renderListStats(resource, state)}
    ${noStoredRecords ? `
      <section class="panel-card quick-create-card">
        <div><p class="eyebrow">GET STARTED</p><h2>No ${escapeHtml(resource.nav)} Yet</h2><p>Create your first ${escapeHtml(resource.singular.toLowerCase())} to start building this section.</p></div>
        <strong class="quick-create-count" aria-label="0 records">0</strong>
        <a class="quick-create-button" href="#/${resource.id}/new"><span aria-hidden="true">+</span>Create your first ${escapeHtml(resource.singular.toLowerCase())}</a>
      </section>
    ` : ""}
    <section class="panel-card resource-panel">
      <div class="resource-toolbar">
        <label class="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><span class="sr-only">Search ${escapeHtml(resource.nav)}</span><input id="record-search" type="search" placeholder="Search ${escapeHtml(resource.nav.toLowerCase())}..." value="${escapeHtml(state.query)}"></label>
        <div class="toolbar-right toolbar-controls">
          <div class="toolbar-actions">
            <button class="toolbar-button" type="button" data-action="toggle-filter-menu" aria-expanded="false" aria-controls="record-filter-menu">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6.5 7.5v5l-3 1.5v-6.5L4 5Z"/></svg><span>Filter</span><span class="filter-count">${activeFilters}</span>
            </button>
            <button class="toolbar-button" type="button" data-action="toggle-column-menu" aria-expanded="false" aria-controls="record-column-menu">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M9 4v16m6-16v16"/></svg><span>Columns</span>
            </button>
            <button class="button button-quiet button-export" type="button" data-action="export-current" data-resource="${resource.id}">Export section</button>
            <span class="record-count">${records.length} ${records.length === 1 ? "record" : "records"}</span>
          </div>
          <div class="toolbar-menu" id="record-filter-menu" hidden>${filterMenu}</div>
          <div class="toolbar-menu column-menu" id="record-column-menu" hidden>
            <strong>Toggle columns</strong>
            ${resource.columns.map(([key, label]) => `<label class="column-option"><input type="checkbox" data-column-toggle="${escapeHtml(key)}" ${hiddenColumns.has(key) ? "" : "checked"}><span>${escapeHtml(label)}</span></label>`).join("")}
          </div>
        </div>
      </div>
      ${records.length ? `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>${resource.columns.map(([key, label]) => `<th scope="col" data-column-key="${escapeHtml(key)}" aria-sort="${state.sort === key ? state.direction === 1 ? "ascending" : "descending" : "none"}" ${hiddenColumns.has(key) ? "hidden" : ""}><button class="sort-button" type="button" data-sort="${escapeHtml(key)}" data-resource="${resource.id}">${escapeHtml(label)}<span class="sort-chevron" aria-hidden="true">${state.sort === key && state.direction === 1 ? "⌃" : "⌄"}</span></button></th>`).join("")}<th scope="col" class="actions-heading">Actions</th></tr></thead>
            <tbody>${records.map((record) => `<tr>
              ${resource.columns.map(([key]) => `<td data-column-key="${escapeHtml(key)}" ${hiddenColumns.has(key) ? "hidden" : ""}>${renderCell(resource, key, record[key], record)}</td>`).join("")}
              <td class="row-actions">
                <a class="row-action" href="#/${resource.id}/edit/${encodeURIComponent(record.id)}">Edit</a>
                <button class="row-action danger-action" type="button" data-action="delete" data-resource="${resource.id}" data-id="${escapeHtml(record.id)}">Delete</button>
              </td>
            </tr>`).join("")}</tbody>
          </table>
        </div>
      ` : `
        <div class="table-empty-state" role="status">
          <span class="empty-x-icon" aria-hidden="true">×</span>
          <strong>No Records Found</strong>
          <p>${state.query || state.filter || state.statusGroup ? "Try changing your search or filters to see records." : `Records you add to ${escapeHtml(resource.nav.toLowerCase())} will appear here.`}</p>
        </div>
      `}
    </section>
  `;
}

function renderCell(resource, key, value, record) {
  if (key === "cropCount") value = store.crops.filter((crop) => crop.field === record.id).length;
  if (key === "animalCount") value = store.animals.filter((animal) => animal.field === record.id).length;
  const field = resource.fields.find((item) => item.name === key);
  if (field?.type === "relation") {
    const related = store[field.relation].find((item) => item.id === value);
    value = related ? related.name || related.hiveNumber || related.title : value;
  }
  if (field?.type === "related-record" && value) {
    const [resourceId, recordId] = String(value).split("::");
    const related = store[resourceId]?.find((item) => item.id === recordId);
    value = related ? related.name || related.title || related.hiveNumber || related.tag : value;
  }
  if (key === "date" || key.toLowerCase().includes("date") || key === "established") return escapeHtml(formatDate(value));
  if (key === "amount") return value === "" || value == null ? "—" : `${escapeHtml(farmProfile.currency)} ${escapeHtml(Number(value).toFixed(2))}`;
  if (key === "active") return value ? `<span class="status-pill status-green">Active</span>` : `<span class="status-pill">Inactive</span>`;
  if (key === "status") return `<span class="status-pill ${statusClass(value)}">${escapeHtml(value || "—")}</span>`;
  return escapeHtml(value || "—");
}

function statusClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (["active", "healthy", "complete", "approved", "growing", "income"].includes(normalized)) return "status-green";
  if (["urgent", "needs attention", "under treatment", "declined"].includes(normalized)) return "status-red";
  if (["in progress", "pending", "planned", "expense"].includes(normalized)) return "status-amber";
  return "";
}

function formatDate(value) {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function filterAndSort(resource, state) {
  const query = state.query.trim().toLowerCase();
  const filtered = store[resource.id].filter((record) => {
    const matchesText = !query || Object.values(record).some((value) => String(value ?? "").toLowerCase().includes(query));
    const filterField = getFilterField(resource);
    const matchesStatus = !state.filter || String(record[filterField?.name] || "") === state.filter;
    const matchesGroup = !state.statusGroup || classifyRecordState(record) === state.statusGroup;
    return matchesText && matchesStatus && matchesGroup;
  });
  if (state.sort) {
    filtered.sort((a, b) => String(a[state.sort] ?? "").localeCompare(String(b[state.sort] ?? ""), undefined, { numeric: true }) * state.direction);
  }
  return filtered;
}

function renderForm(resource, recordId) {
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

function renderHelp() {
  const storageHelp = isSupabaseMode
    ? "Your records sync securely to your account. Export a JSON snapshot for backup or import this browser's saved records from the account menu."
    : "This workspace currently saves records in this browser. Connect cloud storage in the app configuration to enable secure accounts.";
  return `
    <div class="page-heading"><div><p class="eyebrow">SUPPORT</p><h1>Help center</h1><p class="page-subtitle">Simple guidance for keeping your farm workspace useful.</p></div></div>
    <div class="help-grid">
      <article class="panel-card help-card"><span class="help-icon green">01</span><h2>Start with your farm layout</h2><p>Add fields first, then connect crops, livestock, and apiary records to the places where they belong.</p><a href="#/crop-fields" class="text-link">Browse farm areas →</a></article>
      <article class="panel-card help-card"><span class="help-icon blue">02</span><h2>Keep records current</h2><p>Use notes, dates, and status values to make routine reviews easier for everyone on the team.</p><a href="#/tasks" class="text-link">Review tasks →</a></article>
      <article class="panel-card help-card"><span class="help-icon amber">03</span><h2>Back up your workspace</h2><p>Export a JSON snapshot from the account menu before clearing browser storage or moving devices.</p><button class="text-link button-as-link" type="button" data-action="export-all">Export workspace →</button></article>
    </div>
    <section class="panel-card help-note"><strong>${isSupabaseMode ? "Cloud workspace" : "Local preview"}</strong><p>${storageHelp}</p></section>
  `;
}

function renderFarmProfilePage() {
  const profile = normalizeFarmProfile(farmProfile);
  const countries = ["Egypt", "Saudi Arabia", "United Arab Emirates", "Jordan", "United States", "United Kingdom", "Canada", "Australia", "Other"];
  const currencies = [
    ["EGP", "EGP - Egyptian Pound"],
    ["USD", "USD - US Dollar"],
    ["EUR", "EUR - Euro"],
    ["SAR", "SAR - Saudi Riyal"],
    ["AED", "AED - UAE Dirham"],
    ["GBP", "GBP - British Pound"],
    ["CAD", "CAD - Canadian Dollar"],
    ["AUD", "AUD - Australian Dollar"],
  ];
  if (profile.country && !countries.includes(profile.country)) countries.push(profile.country);
  if (profile.currency && !currencies.some(([code]) => code === profile.currency)) {
    currencies.push([profile.currency, `${profile.currency} - Custom currency`]);
  }
  const weeklyTotal = workDayNames.reduce((total, day) => total + Number(profile.work_schedule[day] || 0), 0);
  const loading = farmProfileStatus === "loading";
  const countryOptions = countries.map((country) => `<option value="${escapeHtml(country)}" ${profile.country === country ? "selected" : ""}>${escapeHtml(country)}</option>`).join("");
  const currencyOptions = currencies.map(([code, label]) => `<option value="${escapeHtml(code)}" ${profile.currency === code ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
  const moduleToggles = activeModuleOptions.map((module) => `
    <label class="module-toggle-card">
      <span class="module-toggle-copy"><strong>${escapeHtml(module.label)}</strong><small>${escapeHtml(module.description)}</small></span>
      <span class="switch-control">
        <input type="checkbox" name="module_${module.key}" data-active-module="${module.key}" ${profile.active_modules[module.key] ? "checked" : ""}>
        <span class="switch-track" aria-hidden="true"></span>
      </span>
    </label>
  `).join("");

  return `
    <div class="page-heading farm-profile-heading">
      <div><p class="eyebrow">SETTINGS</p><h1>Farm profile</h1><p class="page-subtitle">Manage your farm details, working hours, and workspace modules.</p></div>
    </div>
    ${loading ? `<p class="profile-load-note" role="status">Loading your farm profile…</p>` : ""}
    ${farmProfileStatus === "error" ? `<p class="profile-load-note profile-load-error" role="alert">Farm profile could not be loaded. Check your connection and try again.</p>` : ""}
    <form class="farm-profile-form" id="farm-profile-form">
      <fieldset class="profile-fieldset" ${loading ? "disabled" : ""}>
        <section class="panel-card profile-section">
          <div class="profile-section-heading"><div><h2>Farm details</h2><p>Core information shown across your workspace.</p></div></div>
          <div class="profile-form-grid">
            <label class="form-field" for="profile-farm-name"><span class="field-label">Name <span class="required-mark">*</span></span>
              <input id="profile-farm-name" name="farm_name" type="text" maxlength="120" value="${escapeHtml(profile.farm_name)}" autocomplete="organization" required>
            </label>
            <label class="form-field" for="profile-slug"><span class="field-label">Slug <span class="required-mark">*</span></span>
              <input id="profile-slug" name="slug" type="text" maxlength="80" pattern="[a-z0-9]+(-[a-z0-9]+)*" data-user-edited="${profile.slug !== slugifyFarmName(profile.farm_name)}" value="${escapeHtml(profile.slug)}" required>
              <small>This is generated automatically. You can change it if you want eg. farm-name.</small>
            </label>
            <label class="form-field" for="profile-unit"><span class="field-label">Unit <span class="required-mark">*</span></span>
              <select id="profile-unit" name="unit" required>
                ${["Acres", "Qirat", "Hectares", "Square Meters"].map((unit) => `<option value="${unit}" ${profile.unit === unit ? "selected" : ""}>${unit}</option>`).join("")}
              </select>
            </label>
            <label class="form-field" for="profile-size"><span class="field-label">Size</span>
              <input id="profile-size" name="farm_size" type="number" min="0" step="0.01" placeholder="1.00" value="${escapeHtml(profile.farm_size)}">
            </label>
            <label class="form-field" for="profile-location"><span class="field-label">Location <span class="required-mark">*</span></span>
              <input id="profile-location" name="location" type="text" maxlength="200" placeholder="Ashmoun, Menofia, EG" value="${escapeHtml(profile.location)}" required>
              <small>Used to fetch the local weather forecast.</small>
            </label>
            <label class="form-field" for="profile-country"><span class="field-label">Country</span>
              <select id="profile-country" name="country">${countryOptions}</select>
            </label>
            <label class="form-field" for="profile-currency"><span class="field-label">Currency</span>
              <select id="profile-currency" name="currency">${currencyOptions}</select>
            </label>
            <div class="form-field organic-field">
              <span class="field-label">Organic farm</span>
              <label class="organic-toggle-row">
                <span class="switch-control">
                  <input type="checkbox" name="organic_farm" ${profile.organic_farm ? "checked" : ""}>
                  <span class="switch-track" aria-hidden="true"></span>
                </span>
                <span><strong>Certified or managed organically</strong><small>Mark this farm as using organic practices.</small></span>
              </label>
            </div>
          </div>
        </section>

        <details class="panel-card profile-accordion" open>
          <summary><span><strong>Work Schedule</strong><small>Set your standard daily and weekly working hours.</small></span><span class="accordion-chevron" aria-hidden="true">⌄</span></summary>
          <div class="profile-accordion-content">
            <label class="form-field default-hours-field" for="profile-default-hours"><span class="field-label">Default Hours Per Day</span>
              <span class="input-suffix-wrap"><input id="profile-default-hours" name="default_hours_per_day" type="number" min="0" max="24" step="0.25" value="${escapeHtml(profile.default_hours_per_day)}" required><span>hours</span></span>
            </label>
            <div class="work-schedule-grid">
              ${workDayNames.map((day) => `
                <label class="form-field day-hours-field" for="profile-hours-${day}"><span class="field-label">${day}</span>
                  <span class="input-suffix-wrap"><input id="profile-hours-${day}" name="work_schedule_${day}" data-workday-hours type="number" min="0" max="24" step="0.25" value="${escapeHtml(profile.work_schedule[day])}"><span>h</span></span>
                </label>
              `).join("")}
            </div>
            <p class="weekly-total" aria-live="polite">Weekly Total: <strong data-weekly-total>${weeklyTotal}</strong> hours/week</p>
          </div>
        </details>

        <details class="panel-card profile-accordion">
          <summary><span><strong>Active Modules</strong><small>Choose which sections appear in the sidebar. Your data is kept when a module is hidden.</small></span><span class="accordion-chevron" aria-hidden="true">⌄</span></summary>
          <div class="profile-accordion-content">
            <div class="module-toggle-grid">${moduleToggles}</div>
          </div>
        </details>
      </fieldset>
      <div class="profile-save-row">
        <p class="profile-save-hint">Changes apply to your workspace after saving.</p>
        <button class="button button-green" type="submit" ${loading ? "disabled" : ""}>Save changes</button>
      </div>
    </form>
  `;
}

function renderNotFound() {
  return `<section class="panel-card empty-state"><span class="empty-symbol">?</span><h1>Page not found</h1><p>That section is not part of this workspace.</p><a class="button button-green" href="#/">Return to dashboard</a></section>`;
}

function render() {
  const route = getRoute();
  const active = route.resource || route.page;
  renderNavigation(active);
  if (route.page === "dashboard") main.innerHTML = renderDashboard();
  else if (route.page === "list") main.innerHTML = renderList(resourceById.get(route.resource));
  else if (route.page === "form") main.innerHTML = renderForm(resourceById.get(route.resource), route.recordId);
  else if (route.page === "farm-profile") main.innerHTML = renderFarmProfilePage();
  else if (route.page === "help-center") main.innerHTML = renderHelp();
  else main.innerHTML = renderNotFound();
  document.title = route.page === "dashboard" ? "Dashboard | Fieldwise" : `${route.page === "form" ? "Record" : route.page === "help-center" ? "Help center" : route.page === "farm-profile" ? "Farm profile" : resourceById.get(route.resource)?.nav || "Workspace"} | Fieldwise`;
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
  farmPopover.hidden = true;
  farmSwitcher.setAttribute("aria-expanded", "false");
  setSidebarOpen(false);
  if (route.page === "list" && route.resource) {
    const search = document.querySelector("#record-search");
    if (search) search.focus({ preventScroll: true });
  }
}

async function saveFarmProfile(form) {
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const workSchedule = Object.fromEntries(workDayNames.map((day) => [
    day,
    Number(formData.get(`work_schedule_${day}`) || 0),
  ]));
  const activeModules = Object.fromEntries(activeModuleOptions.map((module) => [
    module.key,
    formData.get(`module_${module.key}`) === "on",
  ]));
  const nextProfile = normalizeFarmProfile({
    ...farmProfile,
    farm_name: String(formData.get("farm_name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    unit: formData.get("unit"),
    farm_size: formData.get("farm_size") || "",
    location: String(formData.get("location") || "").trim(),
    address: String(formData.get("location") || "").trim(),
    country: formData.get("country"),
    currency: formData.get("currency"),
    organic_farm: formData.get("organic_farm") === "on",
    default_hours_per_day: Number(formData.get("default_hours_per_day") || 0),
    work_schedule: workSchedule,
    active_modules: activeModules,
  });
  const update = {
    farm_name: nextProfile.farm_name,
    slug: nextProfile.slug,
    unit: nextProfile.unit,
    farm_size: nextProfile.farm_size === "" ? null : Number(nextProfile.farm_size),
    address: nextProfile.address,
    location: nextProfile.location,
    country: nextProfile.country,
    currency: nextProfile.currency,
    organic_farm: nextProfile.organic_farm,
    default_hours_per_day: nextProfile.default_hours_per_day,
    work_schedule: nextProfile.work_schedule,
    active_modules: nextProfile.active_modules,
    updated_at: new Date().toISOString(),
  };
  const ownedActiveFarm = isSupabaseMode
    ? farms.find((farm) => farm.id === currentFarmId && farm.created_by === currentUser?.id)
    : null;
  if (ownedActiveFarm) update.farm_id = currentFarmId;
  const resolvedProfileLocation = await resolveFarmProfileLocation(nextProfile.location, nextProfile.country);

  submitButton.disabled = true;
  submitButton.textContent = "Saving…";
  let weatherUpdateError = null;
  try {
    if (isSupabaseMode) {
      if (!sb || !currentUser) throw new Error("Sign in before saving your farm profile.");
      const { data, error } = await sb
        .from("farm_profiles")
        .update(update)
        .eq("id", currentUser.id)
        .select("id, farm_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Farm profile not found. Run the latest database setup script and try again.");
      nextProfile.farm_id = data.farm_id;
    } else {
      try {
        localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      } catch (error) {
        console.error("Could not save the farm profile in this browser.", error);
        throw new Error("The farm profile could not be saved in this browser.");
      }
    }

    farmProfile = nextProfile;
    farmProfileStatus = "ready";
    if (!isSupabaseMode || farmProfile.farm_id === currentFarmId) {
      currentFarmName = farmProfile.farm_name;
      const currentFarm = farms.find((farm) => farm.id === currentFarmId);
      if (currentFarm) currentFarm.name = currentFarmName;
      updateAccountUi();
    }
    try {
      farmRegion = resolvedProfileLocation.location;
      await refreshRegionData();
    } catch (error) {
      weatherUpdateError = error;
    }
    renderNavigation("farm-profile");
    if (weatherUpdateError) {
      console.error("Farm profile saved, but its weather region could not be updated.", weatherUpdateError);
      showToast(`Profile saved, but weather could not be updated: ${weatherUpdateError.message || "Unexpected error."}`);
    } else {
      showToast("Saved successfully", "success");
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Save changes";
  }
}

async function saveForm(form) {
  const resource = resourceById.get(form.dataset.resource);
  const id = form.dataset.id;
  const formData = new FormData(form);
  const values = {};
  for (const field of resource.fields) {
    values[field.name] = field.type === "checkbox" ? form.elements[field.name].checked : String(formData.get(field.name) || "").trim();
  }

  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    showToast("The end date must be on or after the start date.");
    form.elements.endDate.focus();
    return;
  }

  const current = store[resource.id];
  const now = new Date().toISOString();
  const nextRecord = id
    ? { ...current.find((record) => record.id === id), ...values, updatedAt: now }
    : { id: makeId(), ...values, createdAt: now, updatedAt: now };
  const nextRows = id
    ? current.map((record) => record.id === id ? nextRecord : record)
    : [nextRecord, ...current];
  const cloudChanges = [{ type: "upsert", resourceId: resource.id, records: [nextRecord] }];
  if (!await commit({ ...store, [resource.id]: nextRows }, cloudChanges)) return;
  location.hash = `/${resource.id}`;
  showToast(id ? "Record updated." : "Record added.");
}

async function deleteRecord(resourceId, id) {
  const resource = resourceById.get(resourceId);
  const record = store[resourceId].find((item) => item.id === id);
  if (!resource || !record) {
    showToast("That record is no longer available.");
    return;
  }
  const label = record.name || record.title || record.hiveNumber || resource.singular.toLowerCase();
  if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;
  const cloudChanges = [{ type: "delete", resourceId, recordId: id }];
  if (await commit({ ...store, [resourceId]: store[resourceId].filter((item) => item.id !== id) }, cloudChanges)) {
    render();
    showToast("Record deleted.");
  }
}

function closeToolbarMenus() {
  document.querySelectorAll(".toolbar-menu").forEach((menu) => { menu.hidden = true; });
  document.querySelectorAll('[data-action="toggle-filter-menu"], [data-action="toggle-column-menu"]').forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function exportData(resourceId) {
  const payload = {
    format: "fieldwise-workspace",
    version: 1,
    exportedAt: new Date().toISOString(),
    records: resourceId ? { [resourceId]: store[resourceId] } : store,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = resourceId ? `fieldwise-${resourceId}.json` : "fieldwise-workspace.json";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Workspace export downloaded.");
}

async function importData(file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch (error) {
    console.error("The selected file is not valid JSON.", error);
    showToast("Could not read that file as JSON.");
    return;
  }
  if (parsed.format !== "fieldwise-workspace" || parsed.version !== 1 || !parsed.records || typeof parsed.records !== "object") {
    showToast("Unsupported file. Import a Fieldwise workspace JSON export.");
    return;
  }
  const next = { ...store };
  const cloudChanges = [];
  for (const [resourceId, imported] of Object.entries(parsed.records)) {
    if (!resourceById.has(resourceId) || !Array.isArray(imported)) {
      showToast(`The export contains an unsupported section: ${resourceId}.`);
      return;
    }
    const currentById = new Map(next[resourceId].map((record) => [record.id, record]));
    for (const record of imported) {
      if (!record || typeof record !== "object" || typeof record.id !== "string") {
        showToast(`A record in ${resourceById.get(resourceId).nav} is invalid.`);
        return;
      }
      currentById.set(record.id, record);
    }
    next[resourceId] = Array.from(currentById.values());
    if (imported.length) cloudChanges.push({ type: "upsert", resourceId, records: imported });
  }
  if (await commit(next, cloudChanges)) {
    render();
    showToast("Workspace data imported.");
  }
}

async function importLocalData() {
  if (!currentUser) return;
  const localStore = loadStore();
  const localCount = resources.reduce((total, resource) => total + localStore[resource.id].length, 0);
  if (!localCount) {
    showToast("There are no local browser records to import.");
    return;
  }
  if (!window.confirm(`Import ${localCount} local record(s) into ${currentFarmName}? Matching record IDs will be replaced.`)) return;

  const next = { ...store };
  const cloudChanges = [];
  for (const resource of resources) {
    const records = localStore[resource.id];
    if (!records.length) continue;
    const byId = new Map(next[resource.id].map((record) => [record.id, record]));
    for (const record of records) byId.set(record.id, record);
    next[resource.id] = Array.from(byId.values());
    cloudChanges.push({ type: "upsert", resourceId: resource.id, records });
  }
  if (await commit(next, cloudChanges)) {
    render();
    showToast(`${localCount} local record(s) imported to your farm.`);
  }
}

sidebarToggle.addEventListener("click", () => setSidebarOpen(!sidebar.classList.contains("open")));
sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));

profileToggle.addEventListener("click", () => {
  const open = profileMenu.hidden;
  profileMenu.hidden = !open;
  profileToggle.setAttribute("aria-expanded", String(open));
  farmPopover.hidden = true;
  farmSwitcher.setAttribute("aria-expanded", "false");
});

farmSwitcher.addEventListener("click", () => {
  const open = farmPopover.hidden;
  farmPopover.hidden = !open;
  farmSwitcher.setAttribute("aria-expanded", String(open));
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
});

farmPopover.addEventListener("click", (event) => {
  const option = event.target.closest("[data-farm-id]");
  if (!option || option.dataset.farmId === currentFarmId) return;
  const selectedFarm = farms.find((farm) => farm.id === option.dataset.farmId);
  if (!selectedFarm) return;
  farmPopover.hidden = true;
  farmSwitcher.setAttribute("aria-expanded", "false");
  loadFarmRecords(selectedFarm).catch((error) => {
    console.error("Could not switch farm records.", error);
    showToast(`Could not load farm: ${error.message || "Cloud service request failed."}`);
  });
});

nav.addEventListener("click", (event) => {
  const button = event.target.closest(".nav-group-toggle");
  if (!button) return;
  const open = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", (event) => {
  const statusCard = event.target.closest("[data-status-group]");
  if (statusCard) {
    const resourceId = getRoute().resource;
    if (!resourceId) return;
    const state = listState[resourceId] || { query: "", filter: "", sort: "", direction: 1, hiddenColumns: [] };
    const nextGroup = statusCard.dataset.statusGroup === "all" ? "" : statusCard.dataset.statusGroup;
    listState[resourceId] = { ...state, statusGroup: state.statusGroup === nextGroup ? "" : nextGroup };
    render();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (!action) {
    if (!event.target.closest(".toolbar-controls")) closeToolbarMenus();
    return;
  }
  if (action.dataset.action === "toggle-filter-menu" || action.dataset.action === "toggle-column-menu") {
    const menu = document.getElementById(action.getAttribute("aria-controls"));
    const open = menu.hidden;
    closeToolbarMenus();
    menu.hidden = !open;
    action.setAttribute("aria-expanded", String(open));
    return;
  }
  if (action.dataset.action === "refresh-weather") {
    void refreshWeather();
    return;
  }
  if (action.dataset.action === "delete") {
    deleteRecord(action.dataset.resource, action.dataset.id).catch((error) => {
      console.error("Could not delete the farm record.", error);
      showToast(`Could not delete record: ${error.message || "Unexpected error."}`);
    });
  }
  if (action.dataset.action === "export-all") exportData();
  if (action.dataset.action === "export-current") exportData(action.dataset.resource);
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "farm-profile-form") {
    event.preventDefault();
    if (!event.target.reportValidity()) return;
    saveFarmProfile(event.target).catch((error) => {
      console.error("Could not save the farm profile.", error);
      showToast(`Could not save farm profile: ${error.message || "Unexpected error."}`);
    });
    return;
  }
  if (event.target.id === "farm-create-form") {
    event.preventDefault();
    if (!event.target.reportValidity()) return;
    createFarm(event.target.elements.farmName.value).catch((error) => {
      console.error("Could not create a farm.", error);
      showToast(`Could not create farm: ${error.message || "Unexpected error."}`);
    });
    return;
  }
  if (event.target.id !== "record-form") return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  saveForm(event.target).catch((error) => {
    console.error("Could not save the farm record.", error);
    showToast(`Could not save record: ${error.message || "Unexpected error."}`);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeToolbarMenus();
});

document.addEventListener("input", (event) => {
  if (event.target.id === "profile-farm-name") {
    const slug = document.querySelector("#profile-slug");
    if (slug && slug.dataset.userEdited !== "true") slug.value = slugifyFarmName(event.target.value);
    return;
  }
  if (event.target.id === "profile-slug") {
    event.target.dataset.userEdited = String(Boolean(event.target.value.trim()));
    return;
  }
  if (event.target.matches("[data-workday-hours]")) {
    const total = Array.from(document.querySelectorAll("[data-workday-hours]"))
      .reduce((sum, input) => sum + Number(input.value || 0), 0);
    const output = document.querySelector("[data-weekly-total]");
    if (output) output.textContent = String(Number(total.toFixed(2)));
    return;
  }
  if (event.target.id !== "record-search") return;
  const resourceId = getRoute().resource;
  if (!resourceId) return;
  listState[resourceId] = { ...(listState[resourceId] || {}), query: event.target.value };
  const resource = resourceById.get(resourceId);
  const panel = document.querySelector(".resource-panel");
  const focusPosition = event.target.selectionStart;
  const scroll = window.scrollY;
  const next = document.createElement("div");
  next.innerHTML = renderList(resource);
  panel.replaceWith(next.querySelector(".resource-panel"));
  const nextInput = document.querySelector("#record-search");
  nextInput.focus({ preventScroll: true });
  nextInput.setSelectionRange(focusPosition, focusPosition);
  window.scrollTo(0, scroll);
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-column-toggle]")) {
    const resourceId = getRoute().resource;
    if (!resourceId) return;
    const state = listState[resourceId] || { query: "", filter: "", sort: "", direction: 1, hiddenColumns: [] };
    const hiddenColumns = new Set(state.hiddenColumns || []);
    if (event.target.checked) hiddenColumns.delete(event.target.dataset.columnToggle);
    else hiddenColumns.add(event.target.dataset.columnToggle);
    listState[resourceId] = { ...state, hiddenColumns: Array.from(hiddenColumns) };
    document.querySelectorAll("[data-column-key]").forEach((cell) => {
      if (cell.dataset.columnKey === event.target.dataset.columnToggle) cell.hidden = !event.target.checked;
    });
    return;
  }
  if (event.target.matches(".related-record-select")) {
    event.target.classList.toggle("has-selection", Boolean(event.target.value));
    return;
  }
  if (event.target.id !== "record-filter") return;
  const resourceId = getRoute().resource;
  if (!resourceId) return;
  listState[resourceId] = { ...(listState[resourceId] || {}), filter: event.target.value };
  render();
});

document.addEventListener("click", (event) => {
  const sortButton = event.target.closest("[data-sort]");
  if (!sortButton) return;
  const { resource: resourceId, sort } = sortButton.dataset;
  const previous = listState[resourceId] || {};
  listState[resourceId] = { ...previous, sort, direction: previous.sort === sort ? -previous.direction : 1 };
  render();
});

document.querySelector("#import-data").addEventListener("click", () => {
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
  importFile.click();
});
document.querySelector("#export-data").addEventListener("click", () => {
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
  exportData();
});
document.querySelector("#sidebar-export").addEventListener("click", exportData);
document.querySelector("#auth-toggle-link").addEventListener("click", toggleAuthMode);
authForm.addEventListener("submit", (event) => { void handleAuthSubmit(event); });
signOutButton.addEventListener("click", () => { void logoutFarm(); });
importLocalDataButton.addEventListener("click", () => {
  profileMenu.hidden = true;
  profileToggle.setAttribute("aria-expanded", "false");
  importLocalData().catch((error) => {
    console.error("Could not import local browser records.", error);
    showToast(`Could not import local records: ${error.message || "Unexpected error."}`);
  });
});
importFile.addEventListener("change", async () => {
  const [file] = importFile.files || [];
  if (file) await importData(file);
  importFile.value = "";
});

document.addEventListener("click", (event) => {
  if (!profileMenu.hidden && !profileMenu.contains(event.target) && !profileToggle.contains(event.target)) {
    profileMenu.hidden = true;
    profileToggle.setAttribute("aria-expanded", "false");
  }
  if (!farmPopover.hidden && !farmPopover.contains(event.target) && !farmSwitcher.contains(event.target)) {
    farmPopover.hidden = true;
    farmSwitcher.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("hashchange", render);
render();
void initializeSupabase();
