// Navigation groups, farm modules and cross-record link sources.

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
