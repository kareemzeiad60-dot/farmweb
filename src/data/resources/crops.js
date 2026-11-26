// Crops resources: list columns and form fields.

const cropResources = [
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
];
