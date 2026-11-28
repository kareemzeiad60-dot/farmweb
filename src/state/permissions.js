// What the signed-in user may do in the current farm. The database enforces the same rules
// (RLS and the team functions); this only decides what the interface offers.

const roleLabels = { owner: "Owner", manager: "Manager", worker: "Worker", viewer: "Viewer" };
const roleDescriptions = {
  manager: "Edits all farm data and invites or removes workers and viewers.",
  worker: "Edits farm data and sees the tasks assigned to them.",
  viewer: "Read-only access to farm data.",
};

// Local (browser) mode has a single user who can do everything.
function canEditRecords() {
  return !isSupabaseMode || ["owner", "manager", "worker"].includes(currentRole);
}

function canManageTeam() {
  return isSupabaseMode && ["owner", "manager"].includes(currentRole);
}

function roleLabel(role) {
  return roleLabels[role] || "Member";
}
