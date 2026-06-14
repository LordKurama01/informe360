import type { GeneratedReport } from '@/types/report';

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function list(items: string[]) {
  return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

export function buildReportHtml(report: GeneratedReport) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(report.title)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Arial, Helvetica, sans-serif; color:#172033; background:#fff; line-height:1.55; }
  .cover { border-bottom:4px solid #1e5be0; padding-bottom:18px; margin-bottom:24px; }
  .brand { color:#1e5be0; font-size:13px; letter-spacing:.14em; font-weight:600; text-transform:uppercase; }
  h1 { font-size:30px; line-height:1.08; margin:10px 0 12px; color:#111827; }
  h2 { font-size:18px; margin:26px 0 10px; color:#0f172a; border-bottom:1px solid #d9e2f1; padding-bottom:6px; }
  h3 { font-size:15px; margin:14px 0 6px; color:#111827; }
  p { margin:0 0 10px; }
  ul { margin:8px 0 0 20px; padding:0; }
  li { margin:5px 0; }
  .meta { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:14px; }
  .meta div, .box { border:1px solid #dce4ef; border-radius:10px; padding:10px 12px; background:#f8fafc; }
  .meta span { display:block; color:#64748b; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
  .meta b { color:#0f172a; }
  .summary { border-left:5px solid #1e5be0; background:#f6f9ff; padding:14px 16px; border-radius:10px; margin:12px 0 16px; }
  .detail { page-break-inside:avoid; border:1px solid #dce4ef; border-radius:12px; padding:12px 14px; margin:10px 0; }
  .detail b { display:block; color:#0f172a; margin-bottom:6px; }
  .detail small { display:block; color:#475569; margin-top:5px; }
  .action { page-break-inside:avoid; border-left:4px solid #d89d28; background:#fff8ea; padding:12px 14px; border-radius:10px; margin:10px 0; }
  .muted { color:#64748b; font-size:12px; }
  .impact { display:flex; gap:16px; margin:14px 0; }
  .impact div { flex:1; text-align:center; border:1px solid #dce4ef; border-radius:12px; padding:12px; }
  .impact b { display:block; font-size:24px; color:#0f172a; }
  .footer { border-top:1px solid #dce4ef; margin-top:28px; padding-top:12px; color:#64748b; font-size:12px; }
</style>
</head>
<body>
  <section class="cover">
    <div class="brand">Informe360 AI Agent</div>
    <h1>${escapeHtml(report.title)}</h1>
    <p class="muted">Preparado el ${new Date(report.generatedAt).toLocaleDateString('es-AR')} · Revisión y validación final a cargo del profesional responsable.</p>
    <div class="meta">
      <div><span>Riesgo sugerido</span><b>${escapeHtml(report.riskLevel)}</b></div>
      <div><span>Acciones SMART</span><b>${report.smartActions.length}</b></div>
      <div><span>Ahorro estimado</span><b>${report.impactMetrics.estimatedTimeSavedPercent}%</b></div>
    </div>
  </section>

  <h2>1. Resumen ejecutivo</h2>
  <div class="summary">${escapeHtml(report.executiveSummary)}</div>

  <h2>2. Descripción general</h2>
  <p>${escapeHtml(report.generalDescription)}</p>

  <h2>3. Detalle técnico</h2>
  ${report.technicalDetails.map(detail => `<div class="detail"><b>${escapeHtml(detail.title)}</b><p>${escapeHtml(detail.description)}</p>${detail.objective ? `<small><strong>Objetivo:</strong> ${escapeHtml(detail.objective)}</small>` : ''}${detail.benefit ? `<small><strong>Beneficio / riesgo controlado:</strong> ${escapeHtml(detail.benefit)}</small>` : ''}${detail.evidence ? `<small><strong>Evidencia:</strong> ${escapeHtml(detail.evidence)}</small>` : ''}</div>`).join('')}

  <h2>4. Hallazgos principales</h2>
  ${list(report.findings)}

  <h2>5. Estado final / condición observada</h2>
  ${list(report.finalStatus)}

  <h2>6. Acciones correctivas o preventivas SMART</h2>
  ${report.smartActions.map(action => `<div class="action"><b>${escapeHtml(action.action)}</b><p><strong>Responsable sugerido:</strong> ${escapeHtml(action.responsible)}</p><p><strong>Prioridad:</strong> ${escapeHtml(action.priority)} · <strong>Fecha sugerida:</strong> ${new Date(action.dueDate).toLocaleDateString('es-AR')}</p><p><strong>Evidencia de cierre:</strong> ${escapeHtml(action.evidence)}</p></div>`).join('')}

  <h2>7. Normativa relacionada</h2>
  ${list(report.relatedNormatives)}

  <h2>8. Documentación adjunta</h2>
  <p>${escapeHtml(report.attachmentsSummary)}</p>

  <h2>9. Seguimiento sugerido</h2>
  ${list(report.calendarSuggestions.map(item => `${item.title} - ${new Date(item.suggestedDate).toLocaleDateString('es-AR')} - ${item.reason}`))}

  <h2>10. Conclusión técnica</h2>
  <p>${escapeHtml(report.conclusion)}</p>

  <h2>11. Resumen para compartir</h2>
  <div class="box">${escapeHtml(report.clientSummary)}</div>

  <div class="impact">
    <div><span class="muted">Tiempo manual</span><b>${report.impactMetrics.estimatedManualTimeMinutes} min</b></div>
    <div><span class="muted">Con Informe360</span><b>${report.impactMetrics.estimatedAiTimeMinutes} min</b></div>
    <div><span class="muted">Ahorro</span><b>${report.impactMetrics.estimatedTimeSavedPercent}%</b></div>
  </div>

  <div class="footer">${escapeHtml(report.professionalDisclaimer)}</div>
</body>
</html>`;
}
