// Finance resources: list columns and form fields.

const financeResources = [
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
];
