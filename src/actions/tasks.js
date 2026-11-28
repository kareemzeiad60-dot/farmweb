// Task shortcuts used by the "My tasks" page.

async function completeTask(taskId) {
  const task = store.tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("That task is no longer available.");
    return;
  }
  if (!canEditRecords()) {
    showToast("Your role is read-only.");
    return;
  }
  const nextTask = { ...task, status: "Complete", updatedAt: new Date().toISOString() };
  const nextTasks = store.tasks.map((item) => item.id === taskId ? nextTask : item);
  const cloudChanges = [{ type: "upsert", resourceId: "tasks", records: [nextTask] }];
  if (await commit({ ...store, tasks: nextTasks }, cloudChanges)) {
    render();
    showToast("Task marked complete.", "success");
  }
}
