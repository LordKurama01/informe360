export function computeHseMetrics(items, now = new Date()) {
  const nowMs = now.getTime();
  const next7Ms = nowMs + 7 * 24 * 60 * 60 * 1000;
  let open = 0;
  let overdue = 0;
  let dueNext7Days = 0;
  let closed = 0;
  let closedOnTime = 0;
  let criticalOpen = 0;

  for (const item of items || []) {
    const isClosed = item.status === 'closed';
    const isActive = !['closed', 'cancelled'].includes(item.status);
    const dueMs = item.due_at ? new Date(item.due_at).getTime() : null;

    if (isActive) {
      open += 1;
      if (item.severity === 'critical') criticalOpen += 1;
      if (dueMs !== null && dueMs < nowMs) overdue += 1;
      if (dueMs !== null && dueMs >= nowMs && dueMs <= next7Ms) dueNext7Days += 1;
    }

    if (isClosed) {
      closed += 1;
      if (dueMs !== null && item.closed_at && new Date(item.closed_at).getTime() <= dueMs) closedOnTime += 1;
    }
  }

  return {
    open,
    overdue,
    dueNext7Days,
    closed,
    closedOnTime,
    closureCompliancePct: closed ? Math.round((closedOnTime / closed) * 100) : 0,
    criticalOpen,
  };
}

export function buildFindingSearchDocument(finding) {
  return [
    finding?.code,
    finding?.title,
    finding?.description,
    finding?.location_text,
    finding?.element_text,
    finding?.responsible_text,
    finding?.category,
  ].filter(value => typeof value === 'string' && value.trim()).join(' · ');
}
