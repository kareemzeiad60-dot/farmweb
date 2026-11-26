// Apiary resources: list columns and form fields.

const apiaryResources = [
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
];
