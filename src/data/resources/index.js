// All resources in navigation order, plus lookups.

const resources = [
  ...cropResources,
  ...apiaryResources,
  ...livestockResources,
  ...equipmentResources,
  ...financeResources,
  ...farmManagementResources,
];

const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
const storageKey = "fieldwise-data-v1";
