// Estimates schedule risk for a task by comparing elapsed time since creation
// against reported progress, and flags anything already overdue or due very soon.
function assessTaskRisk(task, now = new Date()) {
  if (task.status === 'DONE') return 'on_track';
  if (!task.dueDate) return null;

  const due = new Date(task.dueDate).getTime();
  const created = new Date(task.createdAt).getTime();
  const nowMs = now.getTime();

  if (due < nowMs) return 'overdue';

  const totalSpan = due - created;
  const elapsed = nowMs - created;
  const expectedProgress = totalSpan > 0 ? Math.min(100, Math.max(0, (elapsed / totalSpan) * 100)) : 100;
  const actualProgress = task.progress || 0;

  const daysLeft = (due - nowMs) / (1000 * 60 * 60 * 24);

  if (daysLeft <= 3 && actualProgress < 80) return 'at_risk';
  if (expectedProgress - actualProgress >= 30) return 'at_risk';

  return 'on_track';
}

module.exports = { assessTaskRisk };
