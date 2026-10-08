'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getHseInspection, saveHseInspectionDraft, signedHseInspectionPhoto,
  submitHseInspection, uploadHseInspectionPhoto, type HseInspectionBundle,
} from '@/services/hse/forms-browser';
import type { HseWorkspace } from '@/services/hse/browser';
import type { HseFormField } from '@/shared/hse/forms/types';
import { evaluateRequiredFields } from '@/shared/hse/forms/validation.mjs';
import styles from './HseControl.module.css';

type Answers = Record<string, unknown>;

function readOnlyRun(status: string) {
  return !['draft', 'in_progress'].includes(status);
}

function InspectionField({
  field, value, disabled, onChange, workspace, runId,
}: {
  field: HseFormField; value: unknown; disabled: boolean;
  onChange(value: unknown): void; workspace: HseWorkspace; runId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  useEffect(() => {
    if (field.type !== 'photo' || typeof value !== 'string' || !value) return;
    let active = true;
    void signedHseInspectionPhoto(value, workspace, runId)
      .then(url => { if (active) setPhotoUrl(url); })
      .catch(() => { if (active) setPhotoError('No se pudo abrir la evidencia privada.'); });
    return () => { active = false; };
  }, [field.type, value, workspace, runId]);

  const choose = (choices: Array<[string, string]>) =>
    <div className={styles.inspectionChoices}>
      {choices.map(([key, label]) =>
        <button key={key} type="button" disabled={disabled}
          aria-pressed={value === key} className={`${styles.inspectionChoice} ${value === key ? styles.inspectionChoiceActive : ''}`}
          onClick={() => onChange(key)}>{label}</button>)}
    </div>;

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || disabled || uploading) return;
    setUploading(true);
    setPhotoError(null);
    try {
      const reference = await uploadHseInspectionPhoto(workspace, runId, field.id, file);
      setPhotoUrl(null);
      onChange(reference);
    } catch (reason) {
      setPhotoError(reason instanceof Error ? reason.message : 'No se pudo subir la evidencia.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  let control;
  switch (field.type) {
    case 'compliance':
      control = choose([['complies', 'Cumple'], ['non_compliant', 'No cumple'], ['na', 'No aplica']]);
      break;
    case 'yes_no':
      control = choose([['yes', 'Sí'], ['no', 'No']]);
      break;
    case 'text':
      control = field.multiline
        ? <textarea className={styles.inspectionInput} rows={4} disabled={disabled}
            value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)}/>
        : <input className={styles.inspectionInput} disabled={disabled}
            value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)}/>;
      break;
    case 'number':
      control = <input type="number" className={styles.inspectionInput} disabled={disabled}
        min={field.min} max={field.max}
        value={typeof value === 'number' ? value : ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}/>;
      break;
    case 'date':
      control = <input type="date" className={styles.inspectionInput} disabled={disabled}
        value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)}/>;
      break;
    case 'select':
      control = <select className={styles.inspectionInput} disabled={disabled}
        value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)}>
        <option value="">Seleccionar…</option>
        {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>;
      break;
    case 'photo':
      control = <div className={styles.inspectionPhoto}>
        {photoUrl ? <Image src={photoUrl} width={720} height={360} unoptimized alt={'Evidencia: ' + field.label} className={styles.inspectionPreview}/> : null}
        {photoError ? <p className={styles.inspectionError} role="alert">{photoError}</p> : null}
        {!value ? <span>Sin fotografía adjunta.</span> : !photoUrl ? <span>Fotografía privada registrada.</span> : null}
        {!disabled ? <label className={styles.inspectionUpload}>{uploading ? 'Subiendo…' : value ? 'Reemplazar fotografía' : 'Adjuntar fotografía'}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => void upload(event)}/>
        </label> : null}
      </div>;
      break;
    case 'risk_matrix': {
      const matrix = value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown> : {};
      control = <div className={styles.inspectionChoices}>
        {(['likelihood', 'consequence'] as const).map(key =>
          <label key={key}>{key === 'likelihood' ? 'Probabilidad' : 'Consecuencia'}
            <select className={styles.inspectionInput} disabled={disabled}
              value={typeof matrix[key] === 'number' ? matrix[key] as number : ''}
              onChange={e => {
                const next = { ...matrix, [key]: Number(e.target.value) };
                onChange({ ...next, score: Number(next.likelihood || 0) * Number(next.consequence || 0) });
              }}>
              <option value="">Seleccionar…</option>
              {Array.from({ length: Math.min(5, key === 'likelihood' ? field.likelihoodScale || 5 : field.consequenceScale || 5) }, (_, index) =>
                <option key={index + 1} value={index + 1}>{index + 1}</option>)}
            </select>
          </label>)}
      </div>;
      break;
    }
    case 'repeater':
      control = <p className={styles.inspectionFieldHint}>Los bloques repetibles se completan desde la aplicación móvil. Esta inspección puede consultarse aquí, pero no enviarse desde la web hasta incorporar ese control.</p>;
      break;
  }

  return <div className={styles.inspectionField}>
    <label className={styles.inspectionLabel}>{field.label}{field.required ? ' *' : ''}</label>
    {field.helpText ? <p className={styles.inspectionFieldHint}>{field.helpText}</p> : null}
    {control}
  </div>;
}

export function HseInspectionRunPanel({ workspace, runId }: { workspace: HseWorkspace; runId: string }) {
  const [bundle, setBundle] = useState<HseInspectionBundle | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const next = await getHseInspection(workspace, runId);
    setBundle(next);
    setAnswers(next.answers);
  }, [workspace, runId]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void getHseInspection(workspace, runId).then(next => {
        if (active) { setBundle(next); setAnswers(next.answers); }
      }).catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudo abrir la inspección.');
      }).finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [workspace, runId]);

  async function persist(submit: boolean) {
    if (!bundle || busy || readOnlyRun(bundle.run.status)) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      if (submit) {
        if (bundle.version.schema_json.sections.some(s => s.fields.some(f => f.type === 'repeater'))) {
          throw new Error('Esta plantilla contiene bloques repetibles. Completá el envío en la aplicación móvil.');
        }
        const missing = evaluateRequiredFields(bundle.version.schema_json, answers);
        if (missing.length) throw new Error('Faltan respuestas obligatorias: ' + missing.join(', '));
        await submitHseInspection(workspace, bundle, answers);
      } else {
        await saveHseInspectionDraft(workspace, bundle, answers);
      }
      await reload();
      setMessage(submit ? 'Inspección presentada. Las respuestas ya no pueden editarse.' : 'Borrador guardado en Supabase.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron guardar los cambios.');
    } finally { setBusy(false); }
  }

  if (loading) return <section className={styles.listPanel} role="status">Recuperando inspección y respuestas…</section>;
  if (!bundle) return <section className={styles.listPanel}>
    <div className={styles.error} role="alert">{error || 'No se encontró la inspección o no tenés acceso.'}</div>
    <Link className={styles.reportStartLink} href="/app/hse/inspections">Volver a Inspecciones →</Link>
  </section>;

  const locked = readOnlyRun(bundle.run.status);
  const unsupported = bundle.version.schema_json.sections.some(s => s.fields.some(f => f.type === 'repeater'));
  return <>
    <section className={styles.hero}>
      <div>
        <span className={styles.eyebrowLight}>INSPECCIÓN · VERSIÓN {bundle.version.version}</span>
        <h2>{bundle.template.name}</h2>
        <p>Inicio: {new Date(bundle.run.started_at).toLocaleString('es-AR')}</p>
      </div>
      <div className={styles.heroSummary}><strong className={styles.inspectionRunStatus}>{locked ? 'Cerrada' : 'En curso'}</strong>
        <span>{bundle.run.status}</span></div>
    </section>
    <section className={styles.listPanel}>
      <div className={styles.sectionHead}>
        <div><span className={styles.eyebrow}>EJECUCIÓN VERSIONADA</span><h2>Respuestas de inspección</h2></div>
        <Link className={styles.reportStartLink} href="/app/hse/inspections">← Volver al historial</Link>
      </div>
      {locked ? <p className={styles.inspectionSuccess}>Ejecución presentada o cerrada. Las respuestas son de solo lectura.</p> : null}
      {unsupported ? <p className={styles.inspectionFieldHint}>La plantilla incluye bloques repetibles. Para conservar su estructura, finalizá esa parte desde la app móvil.</p> : null}
      {error ? <div className={styles.error} role="alert">{error}</div> : null}
      {message ? <div className={styles.inspectionSuccess} role="status">{message}</div> : null}
      {bundle.version.schema_json.sections.map((section, index) =>
        <div key={section.id} className={styles.inspectionSection}>
          <h3>{index + 1}. {section.title}</h3>
          {section.description ? <p>{section.description}</p> : null}
          {section.fields.map(field =>
            <InspectionField key={field.id} field={field} value={answers[field.id]} disabled={locked || busy}
              workspace={workspace} runId={runId}
              onChange={value => { setMessage(null); setAnswers(previous => ({ ...previous, [field.id]: value })); }} />)}
        </div>)}
      {!locked ? <div className={styles.inspectionSubmit}>
        <button className={styles.secondary} disabled={busy} onClick={() => void persist(false)}>{busy ? 'Guardando…' : 'Guardar borrador'}</button>
        <button className={styles.primary} disabled={busy || unsupported} onClick={() => void persist(true)}>{busy ? 'Procesando…' : 'Presentar inspección'}</button>
      </div> : null}
    </section>
  </>;
}
