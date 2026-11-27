// Team data: pending invitations for the signed-in user, and members / invitations of the farm.
// Backed by the functions in supabase/migrations/004_team_invitations.sql.

const teamSetupMessage = "Team management is not set up in the database yet. Run supabase/migrations/004_team_invitations.sql in the Supabase SQL editor.";

function isMissingTeamSetup(error) {
  return Boolean(error) && (error.code === "PGRST202" || error.code === "42883"
    || /could not find the function|schema cache|does not exist/i.test(error.message || ""));
}

// Invitations addressed to the signed-in user's (confirmed) email. Never fatal: without
// migration 004 the list is simply empty.
async function loadPendingInvitations(userId = currentUser?.id) {
  if (!sb || !currentUser || currentUser.id !== userId) return;
  const { data, error } = await sb.rpc("my_pending_invitations");
  if (currentUser?.id !== userId) return;
  if (error) {
    pendingInvitations = [];
    if (!isMissingTeamSetup(error)) console.warn("Could not load pending invitations.", error);
    return;
  }
  pendingInvitations = Array.isArray(data) ? data : [];
  render();
}

// Members and pending invitations of the current farm (owners and managers only).
async function loadTeam({ force = false } = {}) {
  if (!isSupabaseMode || !currentFarmId || !canManageTeam()) return;
  if (!force && teamState.farmId === currentFarmId && teamState.status !== "idle") return;

  const farmId = currentFarmId;
  teamState = { farmId, status: "loading", members: [], invitations: [], error: "" };
  try {
    const [membersResult, invitationsResult] = await Promise.all([
      sb.rpc("list_farm_members", { p_farm_id: farmId }),
      sb.from("farm_invitations")
        .select("id, email, role, name, created_at, expires_at")
        .eq("farm_id", farmId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);
    if (membersResult.error) throw membersResult.error;
    if (invitationsResult.error) throw invitationsResult.error;
    if (currentFarmId !== farmId) return;
    teamState = {
      farmId, status: "ready", error: "",
      members: membersResult.data || [],
      invitations: invitationsResult.data || [],
    };
  } catch (error) {
    if (currentFarmId !== farmId) return;
    console.error("Could not load the farm team.", error);
    teamState = {
      farmId, status: "error", members: [], invitations: [],
      error: isMissingTeamSetup(error) ? teamSetupMessage : (error.message || "Could not load the team."),
    };
  }
  if (getRoute().page === "team") render();
}
