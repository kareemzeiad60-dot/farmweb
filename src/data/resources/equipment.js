// Equipment resources: machines and their service log.

const equipmentResources = [
  {
    id: "equipment", nav: "Equipment", singular: "Equipment", group: "Equipment",
    // "warranty" and "nextService" are computed (see src/ui/equipment.js).
    columns: [["name", "Equipment"], ["category", "Category"], ["make", "Make"], ["model", "Model"], ["status", "Status"], ["warranty", "Warranty"], ["nextService", "Next service"], ["hoursMeter", "Engine hours"]],
    fields: [
      { name: "name", label: "Equipment name", required: true },
      { name: "category", label: "Category", type: "select", required: true, options: ["Tractor", "Machinery", "Implement", "Vehicle", "Irrigation equipment", "Tool", "Other"] },
      { name: "make", label: "Make" },
      { name: "model", label: "Model" },
      { name: "serialNumber", label: "Serial / plate number" },
      { name: "status", label: "Status", type: "select", required: true, options: ["Active", "Under maintenance", "Out of service", "Retired"] },
      { name: "location", label: "Storage location" },
      { name: "hoursMeter", label: "Engine hours", type: "number", min: 0, step: "0.1", hint: "Current hour-meter reading. Used to flag services that are due by hours." },
      { name: "purchaseDate", label: "Purchase date", type: "date" },
      { name: "purchaseCost", label: "Purchase cost", type: "number", min: 0, step: "0.01" },
      { name: "supplier", label: "Supplier / dealer" },
      { name: "warrantyExpiry", label: "Warranty expires", type: "date", hint: "You will be warned 60 days before the warranty ends." },
      { name: "warrantyNotes", label: "Warranty details", hint: "Provider, coverage or contract number." },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "equipment-services", nav: "Service Log", singular: "Service record", group: "Equipment",
    columns: [["equipment", "Equipment"], ["serviceType", "Service"], ["status", "Status"], ["serviceDate", "Date"], ["hoursAtService", "Hours"], ["cost", "Cost"], ["performedBy", "Done by"], ["nextServiceDate", "Next due"]],
    fields: [
      { name: "equipment", label: "Equipment", type: "relation", relation: "equipment", required: true },
      { name: "serviceType", label: "Service type", type: "select", required: true, options: ["Routine service", "Oil & filter change", "Repair", "Inspection", "Parts replacement", "Warranty claim", "Other"] },
      { name: "status", label: "Status", type: "select", required: true, options: ["Completed", "Scheduled"], hint: "Choose Scheduled to plan an upcoming service." },
      { name: "serviceDate", label: "Service date", type: "date", required: true },
      { name: "hoursAtService", label: "Engine hours at service", type: "number", min: 0, step: "0.1" },
      { name: "cost", label: "Cost", type: "number", min: 0, step: "0.01" },
      { name: "performedBy", label: "Done by / workshop" },
      { name: "nextServiceDate", label: "Next service due", type: "date", hint: "Optional. The equipment list flags it when it is close or overdue." },
      { name: "nextServiceHours", label: "Next service at (engine hours)", type: "number", min: 0, step: "0.1" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
];
