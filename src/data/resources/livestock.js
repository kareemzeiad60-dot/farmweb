// Livestock resources: list columns and form fields.

const livestockResources = [
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
];
