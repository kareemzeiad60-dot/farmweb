// Details shown on about.html (About, Plans, Privacy Policy, Terms of Use, Contact).
// Fill in operatorName and contactEmail before sharing the page publicly.
window.FIELDWISE_SITE = {
  operatorName: "", // person or company that runs this site, e.g. "Green Valley Farms"
  contactEmail: "", // where people can reach you about privacy, support or account deletion
  lastUpdated: "2026-11-28", // update when you change the policies (YYYY-MM-DD)
  // Fieldwise does not take payments yet. Edit these cards when you decide on paid plans.
  plans: [
    {
      name: "Free",
      price: "Free",
      note: "No payment required",
      status: "Available now",
      features: [
        "All modules: crops, apiary, livestock, equipment, finance, team and tasks",
        "Use it in your browser only, or create a cloud account to sync your records",
        "Share a farm with managers, workers and viewers",
        "Export your data at any time",
      ],
      cta: { label: "Open Fieldwise", href: "index.html" },
    },
    {
      name: "Paid plans",
      price: "Later",
      note: "Not available yet",
      status: "Planned",
      features: [
        "Intended for larger farms and cooperatives",
        "Details and prices will be published here before anything is charged",
      ],
      cta: { label: "Ask to be notified", href: "#contact" },
    },
  ],
};
