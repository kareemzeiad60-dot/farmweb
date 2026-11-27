// Team actions: invite, accept / decline, change roles, remove members, link workers to accounts.

async function teamRpc(name, args) {
  if (!sb || !currentUser) throw new Error("Sign in to manage the team.");
  const { data, error } = await sb.rpc(name, args);
  if (error) throw error;
  return data;
}

async function refreshTeam() {
  await loadTeam({ force: true });
  render();
}

async function inviteMember(form) {
  const email = form.elements.email.value.trim();
  const name = form.elements.name.value.trim();
  const role = form.elements.role.value;
  await teamRpc("invite_member", { p_farm_id: currentFarmId, p_email: email, p_role: role, p_name: name });
  form.reset();
  showToast(`Invitation created for ${email.toLowerCase()}.`, "success");
  await refreshTeam();
}

async function revokeInvitation(invitationId) {
  if (!window.confirm("Revoke this invitation?")) return;
  await teamRpc("revoke_invitation", { p_invitation_id: invitationId });
  showToast("Invitation revoked.", "success");
  await refreshTeam();
}

async function changeMemberRole(userId, role) {
  await teamRpc("update_member_role", { p_farm_id: currentFarmId, p_user_id: userId, p_role: role });
  showToast("Role updated.", "success");
  await refreshTeam();
}

async function removeMember(userId) {
  const member = teamState.members.find((item) => item.user_id === userId);
  if (!window.confirm(`Remove ${member?.email || "this person"} from ${currentFarmName}? They will lose access immediately.`)) return;
  await teamRpc("remove_member", { p_farm_id: currentFarmId, p_user_id: userId });
  showToast("Member removed.", "success");
  await refreshTeam();
}

async function leaveFarm() {
  if (!window.confirm(`Leave ${currentFarmName}? You will lose access to its records.`)) return;
  await teamRpc("remove_member", { p_farm_id: currentFarmId, p_user_id: currentUser.id });
  farms = await fetchFarms();
  location.hash = "#/";
  await loadFarmRecords(farms[0], currentUser.id);
  showToast("You left the farm.", "success");
}

// workerId = "" unlinks whichever worker record is linked to this member.
async function setWorkerAccount(userId, workerId) {
  const member = teamState.members.find((item) => item.user_id === userId);
  const targetWorkerId = workerId || member?.worker_id;
  if (!targetWorkerId) return;
  await teamRpc("set_worker_account", { p_worker_id: targetWorkerId, p_user_id: workerId ? userId : null });
  // Mirror the change locally so "My tasks" and the worker list stay correct without a reload.
  store = {
    ...store,
    "farm-workers": store["farm-workers"].map((worker) => {
      if (worker.id === workerId) return { ...worker, userId };
      if (worker.userId === userId) return { ...worker, userId: "" };
      return worker;
    }),
  };
  showToast(workerId ? "Worker record linked to this account." : "Worker record unlinked.", "success");
  await refreshTeam();
}

async function acceptInvitation(invitationId) {
  const farmId = await teamRpc("accept_invitation", { p_invitation_id: invitationId });
  const userId = currentUser.id;
  farms = await fetchFarms();
  const farm = farms.find((item) => item.id === farmId) || farms[0];
  pendingInvitations = pendingInvitations.filter((item) => item.id !== invitationId);
  location.hash = "#/";
  await loadFarmRecords(farm, userId);
  await loadPendingInvitations(userId);
  showToast(`You joined ${farm.name}.`, "success");
}

async function declineInvitation(invitationId) {
  await teamRpc("decline_invitation", { p_invitation_id: invitationId });
  pendingInvitations = pendingInvitations.filter((item) => item.id !== invitationId);
  render();
  showToast("Invitation declined.");
}
