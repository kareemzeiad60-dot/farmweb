// Farm management resources: list columns and form fields.

const farmManagementResources = [
  {
    id: "users", nav: "Team", singular: "User", group: "Farm management",
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
