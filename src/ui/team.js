// Team page (members, pending invitations, invite form) and the invitation banner.

function formatTeamDate(value) {
  return formatDate(String(value || "").slice(0, 10));
}

function roleOptions(selected, allowed) {
  return allowed.map((role) => `<option value="${role}" ${role === selected ? "selected" : ""}>${roleLabel(role)}</option>`).join("");
}

// Shown above every page while the signed-in user has invitations waiting.
function renderInvitationBanner() {
  if (!pendingInvitations.length) return "";
  return `
    <section class="panel-card invite-banner" aria-label="Farm invitations">
      <p class="eyebrow">INVITATIONS</p>
      ${pendingInvitations.map((invitation) => `
        <div class="invite-row">
          <p><strong>${escapeHtml(invitation.farm_name)}</strong> invited you to join as <strong>${escapeHtml(roleLabel(invitation.role))}</strong>${invitation.invited_by_email ? ` · from ${escapeHtml(invitation.invited_by_email)}` : ""}.
            <small>Expires ${escapeHtml(formatTeamDate(invitation.expires_at))}</small></p>
          <div class="invite-actions">
            <button class="button button-green" type="button" data-action="accept-invitation" data-id="${escapeHtml(invitation.id)}">Accept</button>
            <button class="button button-quiet" type="button" data-action="decline-invitation" data-id="${escapeHtml(invitation.id)}">Decline</button>
          </div>
        </div>`).join("")}
    </section>`;
}

function renderTeamHeading(subtitle) {
  return `<div class="page-heading"><div><p class="eyebrow">FARM MANAGEMENT</p><h1>Team</h1><p class="page-subtitle">${escapeHtml(subtitle)}</p></div></div>`;
}

function renderTeamPage() {
  if (!isSupabaseMode) {
    return `${renderTeamHeading("People who can work in this farm.")}
      <section class="panel-card empty-state"><span class="empty-symbol">♙</span><h2>Sign in to share your farm</h2>
      <p>Inviting managers, workers and viewers needs a cloud account. In local preview your data stays in this browser for one person.</p></section>`;
  }

  if (!canManageTeam()) {
    return `${renderTeamHeading("People who can work in this farm.")}
      <section class="panel-card empty-state"><span class="empty-symbol">♙</span>
        <h2>You are a ${escapeHtml(roleLabel(currentRole).toLowerCase())} of ${escapeHtml(currentFarmName)}</h2>
        <p>Only the farm owner and managers can see and manage the team.</p>
        ${currentRole && currentRole !== "owner" ? '<button class="button button-quiet" type="button" data-action="leave-farm">Leave this farm</button>' : ""}
      </section>`;
  }

  if (teamState.status === "loading" || teamState.status === "idle") {
    return `${renderTeamHeading("Invite people and choose what they can do.")}
      <section class="panel-card empty-state" role="status"><h2>Loading team…</h2></section>`;
  }
  if (teamState.status === "error") {
    return `${renderTeamHeading("Invite people and choose what they can do.")}
      <section class="panel-card empty-state" role="alert"><span class="empty-symbol">!</span><h2>Team unavailable</h2><p>${escapeHtml(teamState.error)}</p>
      <button class="button button-quiet" type="button" data-action="reload-team">Try again</button></section>`;
  }

  const isOwner = currentRole === "owner";
  const inviteRoles = isOwner ? ["manager", "worker", "viewer"] : ["worker", "viewer"];
  const workers = store["farm-workers"];
  const appLink = `${location.origin}${location.pathname}`;

  const memberRows = teamState.members.map((member) => {
    const canChangeRole = isOwner && member.role !== "owner" && !member.is_self;
    const canRemove = !member.is_self && member.role !== "owner" && (isOwner || ["worker", "viewer"].includes(member.role));
    const workerChoices = workers.filter((worker) => !worker.userId || worker.userId === member.user_id);
    return `<tr>
      <td>${escapeHtml(member.email)}${member.is_self ? ' <span class="status-pill">You</span>' : ""}</td>
      <td>${canChangeRole
        ? `<select class="team-select" data-member-role data-user-id="${escapeHtml(member.user_id)}" aria-label="Role for ${escapeHtml(member.email)}">${roleOptions(member.role, ["manager", "worker", "viewer"])}</select>`
        : `<span class="status-pill ${member.role === "owner" ? "status-green" : ""}">${escapeHtml(roleLabel(member.role))}</span>`}</td>
      <td><select class="team-select" data-worker-link data-user-id="${escapeHtml(member.user_id)}" aria-label="Worker record for ${escapeHtml(member.email)}">
        <option value="">— not linked —</option>
        ${workerChoices.map((worker) => `<option value="${escapeHtml(worker.id)}" ${worker.id === member.worker_id ? "selected" : ""}>${escapeHtml(worker.name)}</option>`).join("")}
      </select></td>
      <td>${escapeHtml(formatTeamDate(member.joined_at))}</td>
      <td class="row-actions">${canRemove ? `<button class="row-action danger-action" type="button" data-action="remove-member" data-user-id="${escapeHtml(member.user_id)}">Remove</button>` : ""}</td>
    </tr>`;
  }).join("");

  const invitationRows = teamState.invitations.map((invitation) => {
    const canRevoke = isOwner || invitation.role !== "manager";
    return `<tr>
      <td>${escapeHtml(invitation.email)}${invitation.name ? ` <small>(${escapeHtml(invitation.name)})</small>` : ""}</td>
      <td><span class="status-pill status-amber">${escapeHtml(roleLabel(invitation.role))}</span></td>
      <td>${escapeHtml(formatTeamDate(invitation.created_at))}</td>
      <td>${escapeHtml(formatTeamDate(invitation.expires_at))}</td>
      <td class="row-actions">${canRevoke ? `<button class="row-action danger-action" type="button" data-action="revoke-invitation" data-id="${escapeHtml(invitation.id)}">Revoke</button>` : ""}</td>
    </tr>`;
  }).join("");

  return `
    ${renderTeamHeading("Invite people and choose what they can do.")}
    <form class="record-form panel-card" id="invite-form">
      <div class="card-heading"><div><p class="eyebrow">INVITE</p><h2>Invite someone to ${escapeHtml(currentFarmName)}</h2></div></div>
      <div class="form-grid">
        <label class="form-field" for="invite-email"><span class="field-label">Email <span class="required-mark">*</span></span>
          <input id="invite-email" name="email" type="email" required maxlength="254" autocomplete="off"></label>
        <label class="form-field" for="invite-role"><span class="field-label">Role <span class="required-mark">*</span></span>
          <select id="invite-role" name="role" required>${roleOptions("worker", inviteRoles)}</select></label>
        <label class="form-field" for="invite-name"><span class="field-label">Name (optional)</span>
          <input id="invite-name" name="name" maxlength="120" autocomplete="off"><small>Used for the worker record created when a worker joins.</small></label>
      </div>
      <ul class="role-help">
        ${inviteRoles.map((role) => `<li><strong>${roleLabel(role)}</strong> — ${escapeHtml(roleDescriptions[role])}</li>`).join("")}
      </ul>
      <p class="team-note">No email is sent. Ask them to sign up or sign in at <strong>${escapeHtml(appLink)}</strong> with the address above and confirm their email; the invitation then appears for them to accept. Invitations expire after 14 days.</p>
      <div class="form-actions"><button class="button button-green" type="submit">Create invitation</button></div>
    </form>

    <section class="panel-card team-card">
      <div class="card-heading"><div><p class="eyebrow">MEMBERS</p><h2>${teamState.members.length} ${teamState.members.length === 1 ? "person" : "people"} with access</h2></div></div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Worker record</th><th scope="col">Joined</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${memberRows}</tbody>
      </table></div>
    </section>

    <section class="panel-card team-card">
      <div class="card-heading"><div><p class="eyebrow">PENDING</p><h2>${teamState.invitations.length} pending ${teamState.invitations.length === 1 ? "invitation" : "invitations"}</h2></div></div>
      ${teamState.invitations.length ? `<div class="table-wrap"><table class="data-table">
        <thead><tr><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Sent</th><th scope="col">Expires</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${invitationRows}</tbody>
      </table></div>` : '<p class="team-note">No pending invitations.</p>'}
    </section>`;
}
