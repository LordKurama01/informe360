'use client';

import { useState } from 'react';
import type { GeneratedReport } from '@/types/report';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { buildReportHtml } from '@/blocks/pdf/templates/report-html';
import styles from './ReportPreview.module.css';

export function ReportPreview({ report }: { report: GeneratedReport }) {
  const [draft, setDraft] = useState(report);

  async function exportPdf() {
    await fetch('/api/events/track', { method: 'POST', body: JSON.stringify({ name: 'pdf_exported', metadata: { reportId: draft.id } }) });
    const html = buildReportHtml(draft);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  }

  async function createCalendarEvent() {
    const first = draft.calendarSuggestions[0];
    await fetch('/api/calendar/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: draft.id, ...first }) });
    alert('Seguimiento registrado en la agenda operativa del informe.');
  }

  async function copyClientSummary() {
    try {
      await navigator.clipboard.writeText(draft.clientSummary);
      alert('Resumen copiado para compartir.');
    } catch {
      alert('No se pudo copiar automáticamente. Podés seleccionar el resumen y copiarlo manualmente.');
    }
  }

  function improveConclusion() {
    setDraft(current => ({
      ...current,
      conclusion: `${current.conclusion} Se recomienda conservar la documentación respaldatoria, registrar evidencia de cierre y mantener el seguimiento preventivo conforme al criterio del profesional responsable.`
    }));
  }

  return (
    <Card className={styles.preview}>
      <div className={styles.head}>
        <span>Informe para revisión profesional</span>
        <div className={styles.headActions}>
          <Button variant="secondary" onClick={copyClientSummary}>Copiar resumen</Button>
          {draft.calendarSuggestions.length ? <Button variant="secondary" onClick={createCalendarEvent}>Registrar seguimiento</Button> : null}
          <Button onClick={exportPdf}>Preparar PDF</Button>
        </div>
      </div>

      <div className={styles.reportHeader}>
        <div>
          <label>Título editable</label>
          <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
        </div>
        <div className={styles.quality}>
          <b>{draft.qualityScore.score}%</b>
          <span>calidad del informe</span>
        </div>
      </div>

      <div className={styles.impact}>
        <b>Ahorro estimado</b>
        <span>{draft.impactMetrics.estimatedTimeSavedMinutes} min · {draft.impactMetrics.estimatedTimeSavedPercent}% menos tiempo</span>
      </div>

      <section className={styles.editorBlock}>
        <h3>Resumen ejecutivo</h3>
        <textarea value={draft.executiveSummary} onChange={e => setDraft({ ...draft, executiveSummary: e.target.value })} />
      </section>

      <section className={styles.editorBlock}>
        <h3>Descripción general</h3>
        <textarea value={draft.generalDescription} onChange={e => setDraft({ ...draft, generalDescription: e.target.value })} />
      </section>

      <section>
        <h3>Detalle técnico desarrollado</h3>
        <div className={styles.details}>{draft.technicalDetails.map((item, index) => (
          <div key={`${item.title}-${index}`}>
            <b>{item.title}</b>
            <p>{item.description}</p>
            {item.objective ? <small><strong>Objetivo:</strong> {item.objective}</small> : null}
            {item.benefit ? <small><strong>Beneficio / riesgo controlado:</strong> {item.benefit}</small> : null}
            {item.evidence ? <small><strong>Evidencia:</strong> {item.evidence}</small> : null}
          </div>
        ))}</div>
      </section>

      <section>
        <h3>Estado final</h3>
        <ul className={styles.cleanList}>{draft.finalStatus.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </section>

      <section>
        <h3>Acciones SMART</h3>
        <div className={styles.actions}>{draft.smartActions.map(a => <div key={a.id}><b>{a.action}</b><small>Prioridad: {a.priority} · Responsable: {a.responsible} · Evidencia: {a.evidence}</small></div>)}</div>
      </section>

      <section>
        <h3>Normativa relacionada</h3>
        <ul className={styles.cleanList}>{draft.relatedNormatives.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </section>

      <section>
        <h3>Documentación adjunta</h3>
        <p>{draft.attachmentsSummary}</p>
      </section>

      <section className={styles.editorBlock}>
        <div className={styles.sectionTitle}><h3>Conclusión técnica</h3><Button variant="secondary" onClick={improveConclusion}>Ampliar conclusión</Button></div>
        <textarea value={draft.conclusion} onChange={e => setDraft({ ...draft, conclusion: e.target.value })} />
      </section>

      <section>
        <h3>Resumen para compartir</h3>
        <div className={styles.clientSummary}>{draft.clientSummary}</div>
      </section>

      <section>
        <h3>Trazabilidad del flujo multiagente</h3>
        <div className={styles.trail}>{draft.decisionTrail.map(step => <div key={step.id}><b>{step.agentName}</b><span>{step.recommendation}</span><small>{step.reasoning}</small></div>)}</div>
      </section>

      <p className={styles.disclaimer}>{draft.professionalDisclaimer}</p>
    </Card>
  );
}
