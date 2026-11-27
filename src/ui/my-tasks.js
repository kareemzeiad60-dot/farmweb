// "My tasks": tasks assigned to the worker record linked to the signed-in account.

function myWorkerIds() {
  if (!currentUser) return new Set();
  return new Set(store["farm-workers"].filter((worker) => worker.userId === currentUser.id).map((worker) => worker.id));
}

function myTasks() {
  const ids = myWorkerIds();
  return store.tasks.filter((task) => ids.has(task.assignedTo));
}

function renderMyTasks() {
  const heading = `<div class="page-heading"><div><p class="eyebrow">FARM MANAGEMENT</p><h1>My tasks</h1><p class="page-subtitle">Work assigned to you in ${escapeHtml(currentFarmName)}.</p></div></div>`;
  if (!isSupabaseMode) {
    return `${heading}<section class="panel-card empty-state"><span class="empty-symbol">☷</span><h2>Sign in to see your tasks</h2><p>Tasks are assigned to people with their own account.</p></section>`;
  }
  if (!myWorkerIds().size) {
    return `${heading}<section class="panel-card empty-state"><span class="empty-symbol">☷</span><h2>Your account is not linked to a worker record</h2>
      <p>A farm owner or manager can link it from the Team page. Workers invited with the Worker role are linked automatically.</p></section>`;
  }

  const priorityRank = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
  const tasks = [...myTasks()].sort((a, b) => (a.status === "Complete") - (b.status === "Complete")
    || (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2)
    || String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")));
  const canEdit = canEditRecords();
  return `${heading}
    <section class="panel-card team-card">
      ${tasks.length ? `<div class="table-wrap"><table class="data-table">
        <thead><tr><th scope="col">Task</th><th scope="col">Priority</th><th scope="col">Due</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${tasks.map((task) => `<tr>
          <td>${escapeHtml(task.title)}${task.description ? `<br><small>${escapeHtml(task.description)}</small>` : ""}</td>
          <td>${escapeHtml(task.priority || "")}</td>
          <td>${escapeHtml(formatDate(task.dueDate))}</td>
          <td><span class="status-pill ${task.status === "Complete" ? "status-green" : ""}">${escapeHtml(task.status)}</span></td>
          <td class="row-actions">${canEdit && task.status !== "Complete" ? `<button class="row-action" type="button" data-action="complete-task" data-id="${escapeHtml(task.id)}">Mark complete</button>` : ""}</td>
        </tr>`).join("")}</tbody>
      </table></div>` : '<p class="team-note">Nothing is assigned to you right now.</p>'}
    </section>`;
}
