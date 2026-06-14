'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeneratedReport, ReportInput, ReportStyleMode, ReportUploadedFileCategory, ReportUploadedFileMetadata } from '@/types/report';
import { Button } from '@/shared/components/Button';
import { ReportPreview } from './ReportPreview';
import { PremiumUploadZone } from './PremiumUploadZone';
import styles from './ReportForm.module.css';

const technicalHuntType = 'Cacería técnica / recorrido de hallazgos';

const reportTypes = [
  'Inspección HSE',
  technicalHuntType,
  'Mejoras y mantenimiento de unidad',
  'Informe de desvíos',
  'Informe de incidente',
  'Informe de seguimiento',
  'Cierre de acción correctiva',
  'Informe ambiental',
  'Auditoría técnica'
];

const styleOptions: { value: ReportStyleMode; label: string; hint: string }[] = [
  { value: 'informe360', label: 'Estilo Informe360', hint: 'Claro, técnico y ordenado.' },
  { value: 'usuario', label: 'Usar mis informes anteriores', hint: 'Toma como referencia archivos subidos.' },
  { value: 'formal_tecnico', label: 'Plantilla técnica formal', hint: 'Informe profesional estándar.' },
  { value: 'mantenimiento', label: 'Mantenimiento / mejora de unidad', hint: 'Ideal para tareas realizadas y estado final.' },
  { value: 'hse', label: 'Inspección HSE', hint: 'Hallazgos, riesgos, acciones y seguimiento.' },
  { value: 'auditoria', label: 'Auditoría técnica', hint: 'Observaciones, conformidades y cierre.' }
];

type ChecklistStatus = 'Cumple' | 'No cumple' | 'N/A';
type ChecklistSeverity = 'Baja' | 'Media' | 'Alta' | 'Crítica';

interface HseChecklistItem {
  item: string;
  status: ChecklistStatus;
  severity: ChecklistSeverity;
  observation: string;
  evidenceName: string;
  suggestedAction: string;
}

const defaultHseChecklist: HseChecklistItem[] = [
  { item: 'Orden y limpieza del sector', status: 'Cumple', severity: 'Baja', observation: '', evidenceName: '', suggestedAction: 'Mantener condición y registrar evidencia si aplica.' },
  { item: 'Uso de EPP requerido', status: 'Cumple', severity: 'Media', observation: '', evidenceName: '', suggestedAction: 'Verificar uso antes de iniciar la tarea.' },
  { item: 'Señalización y delimitación', status: 'No cumple', severity: 'Alta', observation: '', evidenceName: '', suggestedAction: 'Corregir señalización y adjuntar evidencia de cierre.' }
];

const initial: ReportInput = {
  companyName: '',
  siteName: '',
  province: 'Neuquén',
  reportType: 'Inspección HSE',
  fieldNotes: '',
  audioTranscript: '',
  photoNotes: '',
  checklistItems: serializeHseChecklist(defaultHseChecklist),
  locationAddress: '',
  estimatedManualTimeMinutes: 180,
  inspectionDate: new Date().toISOString().slice(0, 10),
  reportStyleMode: 'formal_tecnico',
  reportTemplate: 'Plantilla técnica formal',
  referenceFileNames: [],
  referenceStyleNotes: '',
  evidenceFileNames: [],
  uploadedFiles: [],
  desiredTone: 'Técnico, formal y presentable'
};

const evidenceAccept = '.jpg,.jpeg,.png,.webp,.pdf';
const referenceAccept = '.pdf,.doc,.docx,.txt,.md';

export function ReportForm({ compact = false }: { compact?: boolean }) {
  const [input, setInput] = useState<ReportInput>(initial);
  const [hseChecklist, setHseChecklist] = useState<HseChecklistItem[]>(defaultHseChecklist);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const uploadedFilesRef = useRef<ReportUploadedFileMetadata[]>([]);

  useEffect(() => {
    uploadedFilesRef.current = input.uploadedFiles || [];
  }, [input.uploadedFiles]);

  useEffect(() => {
    return () => {
      uploadedFilesRef.current.forEach(file => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
      });
    };
  }, []);

  const completion = useMemo(() => {
    const required = [input.companyName, input.siteName, input.reportType, input.fieldNotes];
    return Math.round((required.filter(Boolean).length / required.length) * 100);
  }, [input]);

  const evidenceFiles = useMemo(
    () => (input.uploadedFiles || []).filter(file => file.category === 'evidence'),
    [input.uploadedFiles]
  );

  const referenceFiles = useMemo(
    () => (input.uploadedFiles || []).filter(file => file.category === 'reference'),
    [input.uploadedFiles]
  );

  async function generate() {
    setLoading(true);
    setError(null);

    const payload: ReportInput = {
      ...input,
      uploadedFiles: sanitizeUploadedFiles(input.uploadedFiles || [])
    };

    try {
      const res = await fetch('/api/gemini/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar');
      setReport(data.report);
      setStep(5);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'No se pudo generar';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function loadDemo() {
    const demoFiles: ReportUploadedFileMetadata[] = [
      {
        id: makeUploadId('evidence'),
        name: 'protector-bateria.jpg',
        size: 820000,
        type: 'image/jpeg',
        extension: 'jpg',
        category: 'evidence',
        description: 'Registro fotográfico del protector de batería instalado.',
        useInReport: true,
        useAsAnnex: true
      },
      {
        id: makeUploadId('evidence'),
        name: 'mangueras-espiraladas.jpg',
        size: 910000,
        type: 'image/jpeg',
        extension: 'jpg',
        category: 'evidence',
        description: 'Evidencia visual del espiralado protector en mangueras hidráulicas.',
        useInReport: true,
        useAsAnnex: true
      },
      {
        id: makeUploadId('reference'),
        name: 'Informe modelo de mejoras y mantenimiento.pdf',
        size: 1250000,
        type: 'application/pdf',
        extension: 'pdf',
        category: 'reference',
        description: 'Modelo de informe técnico previo para tomar estructura y tono.',
        useAsStyleReference: true,
        useAsAnnex: false
      }
    ];

    const demoChecklist: HseChecklistItem[] = [
      { item: 'Sistema hidráulico', status: 'Cumple', severity: 'Media', observation: 'Sin pérdidas visibles luego del recambio preventivo.', evidenceName: 'mangueras-espiraladas.jpg', suggestedAction: 'Registrar control preventivo posterior.' },
      { item: 'Instalación eléctrica', status: 'Cumple', severity: 'Media', observation: 'Instalación aislada y protegida.', evidenceName: '', suggestedAction: 'Verificar estado en próxima inspección.' },
      { item: 'Elementos de seguridad', status: 'Cumple', severity: 'Alta', observation: 'Matafuegos instalado y protector de batería incorporado.', evidenceName: 'protector-bateria.jpg', suggestedAction: 'Adjuntar evidencia final de cierre.' }
    ];

    setHseChecklist(demoChecklist);
    setInput({
      companyName: '25 de Mayo S.A.',
      siteName: 'Unidad con pluma telescópica',
      province: 'Neuquén',
      reportType: 'Mejoras y mantenimiento de unidad',
      locationAddress: 'Base operativa PIC, Neuquén',
      inspectionDate: new Date().toISOString().slice(0, 10),
      fieldNotes: 'Se instaló protector de batería de acrílico transparente. Se realizó recubrimiento total de mangueras hidráulicas mediante espiralado protector. Se reemplazaron preventivamente mangueras hidráulicas ubicadas en el interior del cajón de la pluma telescópica. Se aisló instalación eléctrica. Se instaló matafuegos en la parte posterior del equipo. Se colocaron tapas protectoras en conexiones hidráulicas de la pluma. Se realizó control integral de la unidad.',
      audioTranscript: 'La unidad queda operativa. Se verificaron sistema hidráulico, sistema eléctrico, estado estructural y elementos de seguridad incorporados.',
      photoNotes: 'Foto 1: protector de batería instalado. Foto 2: mangueras con espiralado protector. Foto 3: matafuegos posterior. Foto 4: tapas protectoras en conexiones hidráulicas.',
      checklistItems: serializeHseChecklist(demoChecklist),
      estimatedManualTimeMinutes: 180,
      reportStyleMode: 'usuario',
      reportTemplate: 'Informe de mejoras y mantenimiento',
      referenceFileNames: demoFiles.filter(file => file.category === 'reference').map(file => file.name),
      referenceStyleNotes: 'Usar estructura con descripción de tareas realizadas, estado final del equipo, documentación adjunta y conclusión técnica profesional.',
      evidenceFileNames: demoFiles.filter(file => file.category === 'evidence').map(file => file.name),
      uploadedFiles: demoFiles,
      desiredTone: 'Técnico, formal, operativo y presentable'
    });
    setStep(1);
  }

  function update<K extends keyof ReportInput>(key: K, value: ReportInput[K]) {
    setInput(current => ({ ...current, [key]: value }));
  }

  function updateChecklistItem(index: number, patch: Partial<HseChecklistItem>) {
    const next = hseChecklist.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    ));
    setHseChecklist(next);
    update('checklistItems', serializeHseChecklist(next));
  }

  function addChecklistItem() {
    const next = [
      ...hseChecklist,
      { item: 'Nuevo punto HSE', status: 'Cumple' as ChecklistStatus, severity: 'Media' as ChecklistSeverity, observation: '', evidenceName: '', suggestedAction: '' }
    ];
    setHseChecklist(next);
    update('checklistItems', serializeHseChecklist(next));
  }

  function removeChecklistItem(index: number) {
    const next = hseChecklist.filter((_, itemIndex) => itemIndex !== index);
    setHseChecklist(next);
    update('checklistItems', serializeHseChecklist(next));
  }

  function setUploadedFiles(nextFiles: ReportUploadedFileMetadata[]) {
    setInput(current => {
      const evidenceFileNames = nextFiles.filter(file => file.category === 'evidence').map(file => file.name);
      const referenceFileNames = nextFiles.filter(file => file.category === 'reference').map(file => file.name);

      return {
        ...current,
        uploadedFiles: nextFiles,
        evidenceFileNames,
        referenceFileNames
      };
    });
  }

  function addFiles(files: FileList | File[], category: ReportUploadedFileCategory) {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    const accepted = category === 'evidence' ? evidenceAccept : referenceAccept;
    const existing = input.uploadedFiles || [];
    const newFiles = fileArray
      .filter(file => isAccepted(file, accepted))
      .map(file => buildFileMetadata(file, category));

    if (!newFiles.length) return;
    setUploadedFiles([...existing, ...newFiles]);
  }

  function removeFile(id: string) {
    const currentFiles = input.uploadedFiles || [];
    const target = currentFiles.find(file => file.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    setUploadedFiles(currentFiles.filter(file => file.id !== id));
  }

  function updateFile(id: string, patch: Partial<ReportUploadedFileMetadata>) {
    setUploadedFiles((input.uploadedFiles || []).map(file => (
      file.id === id ? { ...file, ...patch } : file
    )));
  }

  const canGenerate = Boolean(input.companyName && input.siteName && input.reportType && input.fieldNotes);
  const isTechnicalHunt = input.reportType === technicalHuntType;

  return (
    <div className={compact ? styles.compact : styles.wrap}>
      <section className={styles.formShell}>
        <div className={styles.formHeader}>
          <div>
            <span className={styles.eyebrow}>Informe técnico asistido</span>
            <h2>Nuevo informe</h2>
            <p>Cargá la visita, elegí estilo y generá una versión profesional lista para revisar, exportar y seguir.</p>
          </div>
          <div className={styles.progress}>
            <b>{completion}%</b>
            <span>datos mínimos</span>
          </div>
        </div>

        <div className={styles.stepper}>
          {[['1','Datos'], ['2','Evidencia'], ['3','Estilo'], ['4','Generar'], ['5','Revisar']].map(([n, label]) => (
            <button key={n} className={step === Number(n) ? styles.activeStep : ''} onClick={() => setStep(Number(n))} type="button"><b>{n}</b>{label}</button>
          ))}
        </div>

        <div className={styles.form}>
          {step === 1 ? (
            <div className={styles.panel}>
              <div className={styles.panelTitle}><h3>1. Datos generales</h3><Button variant="secondary" onClick={loadDemo}>Cargar ejemplo</Button></div>
              <label>Empresa<input value={input.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Ej: 25 de Mayo S.A." /></label>
              <label>Lugar / unidad / base<input value={input.siteName} onChange={e => update('siteName', e.target.value)} placeholder="Ej: Unidad con pluma telescópica" /></label>
              <label>Dirección / ubicación para Maps<input value={input.locationAddress || ''} onChange={e => update('locationAddress', e.target.value)} placeholder="Ej: Base PIC Neuquén" /></label>
              <div className={styles.row}>
                <label>Provincia<input value={input.province} onChange={e => update('province', e.target.value)} /></label>
                <label>Fecha<input type="date" value={input.inspectionDate || ''} onChange={e => update('inspectionDate', e.target.value)} /></label>
              </div>
              <label>Tipo de informe<select value={input.reportType} onChange={e => update('reportType', e.target.value)}>{reportTypes.map(type => <option key={type}>{type}</option>)}</select></label>
              {isTechnicalHunt ? (
                <p className={styles.helper}>Recorrido guiado para buscar hallazgos, desvíos, riesgos u oportunidades de mejora sobre cualquier tema: orden y limpieza, EPP, contratistas, señalización, ambiental, izaje, herramientas o tránsito interno.</p>
              ) : null}
              <div className={styles.row}>
                <label>Profesional responsable<input value={input.authorName || ''} onChange={e => update('authorName', e.target.value)} placeholder="Nombre y apellido" /></label>
                <label>Cargo / rol<input value={input.professionalRole || ''} onChange={e => update('professionalRole', e.target.value)} placeholder="Técnico HSE, Supervisor, etc." /></label>
              </div>
              <div className={styles.actions}><Button variant="secondary" onClick={() => setStep(2)}>Siguiente</Button></div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className={styles.panel}>
              <h3>2. Observaciones, checklist y evidencia</h3>
              <label>Observaciones de campo<textarea value={input.fieldNotes} onChange={e => update('fieldNotes', e.target.value)} placeholder={isTechnicalHunt ? 'Describí el recorrido, tema buscado, sectores visitados, hallazgos, desvíos, riesgos u oportunidades detectadas.' : 'Pegá lo que pasó, tareas realizadas, hallazgos, desvíos, condiciones observadas...'} /></label>
              <section className={styles.checklistShell}>
                <div className={styles.checklistHead}>
                  <div>
                    <b>Checklist HSE estructurado</b>
                    <span>Cada punto queda listo para informe, evidencia y acción sugerida.</span>
                  </div>
                  <Button variant="secondary" onClick={addChecklistItem}>Agregar ítem</Button>
                </div>
                <div className={styles.checklistList}>
                  {hseChecklist.map((item, index) => (
                    <article className={styles.checklistItem} key={`${item.item}-${index}`}>
                      <label>Ítem<input value={item.item} onChange={e => updateChecklistItem(index, { item: e.target.value })} /></label>
                      <div className={styles.checklistGrid}>
                        <label>Estado<select value={item.status} onChange={e => updateChecklistItem(index, { status: e.target.value as ChecklistStatus })}><option>Cumple</option><option>No cumple</option><option>N/A</option></select></label>
                        <label>Severidad<select value={item.severity} onChange={e => updateChecklistItem(index, { severity: e.target.value as ChecklistSeverity })}><option>Baja</option><option>Media</option><option>Alta</option><option>Crítica</option></select></label>
                        <label>Evidencia<select value={item.evidenceName} onChange={e => updateChecklistItem(index, { evidenceName: e.target.value })}><option value="">Sin asociar</option>{evidenceFiles.map(file => <option key={file.id} value={file.name}>{file.name}</option>)}</select></label>
                      </div>
                      <label>Observación breve<textarea value={item.observation} onChange={e => updateChecklistItem(index, { observation: e.target.value })} placeholder="Condición observada, desvío o criterio técnico." /></label>
                      <label>Acción sugerida<input value={item.suggestedAction} onChange={e => updateChecklistItem(index, { suggestedAction: e.target.value })} placeholder="Ej: corregir, verificar, adjuntar cierre." /></label>
                      {hseChecklist.length > 1 ? <Button variant="secondary" onClick={() => removeChecklistItem(index)}>Quitar ítem</Button> : null}
                    </article>
                  ))}
                </div>
              </section>
              <label>Audio transcripto<textarea value={input.audioTranscript || ''} onChange={e => update('audioTranscript', e.target.value)} placeholder="Pegá transcripción de WhatsApp o audio" /></label>
              <label>Notas de fotos<textarea value={input.photoNotes || ''} onChange={e => update('photoNotes', e.target.value)} placeholder="Describí fotos o evidencias adjuntas" /></label>

              <PremiumUploadZone
                title="Evidencia del informe"
                subtitle="Fotos, PDFs, actas o registros vinculados a la visita."
                cta="Arrastrá archivos acá o tocá para subir evidencia"
                accept={evidenceAccept}
                category="evidence"
                files={evidenceFiles}
                useOptions={[
                  { key: 'useInReport', label: 'Usar en informe' },
                  { key: 'useAsAnnex', label: 'Anexo' }
                ]}
                onFilesSelected={addFiles}
                onRemoveFile={removeFile}
                onUpdateFile={updateFile}
              />

              <div className={styles.actions}><Button variant="secondary" onClick={() => setStep(1)}>Atrás</Button><Button variant="secondary" onClick={() => setStep(3)}>Siguiente</Button></div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className={styles.panel}>
              <h3>3. Estilo de redacción y documentos modelo</h3>
              <p className={styles.helper}>Subí informes anteriores para que el sistema tome como referencia tu forma técnica de redactar. No copia texto literal: detecta estructura, tono, vocabulario y forma de conclusión.</p>
              <div className={styles.styleGrid}>{styleOptions.map(option => (
                <button type="button" key={option.value} className={input.reportStyleMode === option.value ? styles.styleCardActive : styles.styleCard} onClick={() => update('reportStyleMode', option.value)}>
                  <b>{option.label}</b><span>{option.hint}</span>
                </button>
              ))}</div>
              <label>Plantilla activa<input value={input.reportTemplate || ''} onChange={e => update('reportTemplate', e.target.value)} placeholder="Ej: Informe de mejoras y mantenimiento" /></label>

              <PremiumUploadZone
                title="Documentos de referencia"
                subtitle="Informes anteriores o modelos para tomar estructura, tono y forma técnica."
                cta="Arrastrá archivos acá o tocá para subir documentos"
                accept={referenceAccept}
                category="reference"
                files={referenceFiles}
                useOptions={[
                  { key: 'useAsStyleReference', label: 'Referencia de estilo' },
                  { key: 'useAsAnnex', label: 'Usar como anexo' }
                ]}
                onFilesSelected={addFiles}
                onRemoveFile={removeFile}
                onUpdateFile={updateFile}
              />

              <label>Notas de estilo<textarea value={input.referenceStyleNotes || ''} onChange={e => update('referenceStyleNotes', e.target.value)} placeholder="Ej: usar descripción de tareas realizadas, estado final del equipo, documentación adjunta y conclusión técnica profesional." /></label>
              <div className={styles.actions}><Button variant="secondary" onClick={() => setStep(2)}>Atrás</Button><Button variant="secondary" onClick={() => setStep(4)}>Siguiente</Button></div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className={styles.panel}>
              <h3>4. Generar informe profesional</h3>
              <div className={styles.summaryBox}>
                <div><span>Tipo</span><b>{input.reportType}</b></div>
                <div><span>Estilo</span><b>{styleOptions.find(item => item.value === input.reportStyleMode)?.label || 'Informe360'}</b></div>
                <div><span>Referencias</span><b>{referenceFiles.length}</b></div>
                <div><span>Evidencias</span><b>{evidenceFiles.length}</b></div>
              </div>
              <label>Tiempo manual estimado en minutos<input type="number" value={input.estimatedManualTimeMinutes || 180} onChange={e => update('estimatedManualTimeMinutes', Number(e.target.value))} /></label>
              {error ? <p className={styles.error}>{error}</p> : null}
              <div className={styles.actions}><Button variant="secondary" onClick={() => setStep(3)}>Atrás</Button><Button onClick={generate} disabled={loading || !canGenerate}>{loading ? 'Generando informe...' : 'Generar informe con IA'}</Button></div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className={styles.panel}>
              <h3>5. Revisar y cerrar entrega</h3>
              <p className={styles.helper}>Controlá datos, checklist y evidencia antes de preparar el PDF o registrar seguimiento.</p>
              <div className={styles.summaryBox}>
                <div><span>Empresa</span><b>{input.companyName || 'Sin cargar'}</b></div>
                <div><span>Tipo</span><b>{input.reportType}</b></div>
                <div><span>Evidencias</span><b>{evidenceFiles.length}</b></div>
                <div><span>Acciones</span><b>{report?.smartActions.length ?? 0}</b></div>
              </div>
              <label>Observaciones revisadas<textarea value={input.fieldNotes} onChange={e => update('fieldNotes', e.target.value)} /></label>
              <div className={styles.reviewChecklist}>
                {hseChecklist.map((item, index) => (
                  <div key={`${item.item}-${index}`}>
                    <b>{item.item}</b>
                    <span>{item.status} · Severidad {item.severity}</span>
                    <small>{item.observation || 'Sin observación'}{item.evidenceName ? ` · Evidencia: ${item.evidenceName}` : ''}</small>
                    <small>Acción: {item.suggestedAction || 'Sin acción sugerida'}</small>
                  </div>
                ))}
              </div>
              <div className={styles.fileList}>
                {evidenceFiles.length ? evidenceFiles.map(file => <span key={file.id}>{file.name}</span>) : <span>Sin evidencia cargada</span>}
              </div>
              {report ? (
                <p className={styles.helper}>Vista previa generada disponible en el panel de informe. Desde ahí podés copiar resumen, registrar seguimiento y preparar PDF.</p>
              ) : (
                <p className={styles.helper}>Generá el informe para habilitar revisión profesional, acciones SMART y preparación de PDF.</p>
              )}
              <div className={styles.actions}>
                <Button variant="secondary" onClick={() => setStep(4)}>Volver a generar</Button>
                <Button onClick={generate} disabled={loading || !canGenerate}>{loading ? 'Generando...' : report ? 'Regenerar informe' : 'Generar informe'}</Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <aside className={styles.previewShell}>
        {report ? <ReportPreview report={report} /> : <div className={styles.empty}>
          <span>Vista previa profesional</span>
          <h3>El informe aparecerá acá</h3>
          <p>Incluye descripción general, detalle técnico, acciones SMART, normativa relacionada, anexos, conclusión y resumen listo para exportar.</p>
        </div>}
      </aside>
    </div>
  );
}

function buildFileMetadata(file: File, category: ReportUploadedFileCategory): ReportUploadedFileMetadata {
  const extension = getExtension(file.name);
  const isImage = file.type.startsWith('image/');
  return {
    id: makeUploadId(category),
    name: file.name,
    size: file.size,
    type: file.type || fallbackMimeType(extension),
    extension,
    category,
    description: '',
    useInReport: category === 'evidence',
    useAsAnnex: false,
    useAsStyleReference: category === 'reference',
    previewUrl: isImage ? URL.createObjectURL(file) : undefined
  };
}

function sanitizeUploadedFiles(files: ReportUploadedFileMetadata[]): ReportUploadedFileMetadata[] {
  return files.map(({ previewUrl: _previewUrl, ...file }) => file);
}

function isAccepted(file: File, accept: string) {
  const extension = `.${getExtension(file.name).toLowerCase()}`;
  return accept.split(',').map(item => item.trim().toLowerCase()).includes(extension);
}

function getExtension(name: string) {
  const parts = name.split('.');
  return parts.length > 1 ? String(parts.pop()).toLowerCase() : 'file';
}

function makeUploadId(category: ReportUploadedFileCategory) {
  return `${category}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function fallbackMimeType(extension: string) {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    md: 'text/markdown',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  };

  return map[extension] || 'application/octet-stream';
}

function serializeHseChecklist(items: HseChecklistItem[]) {
  return items.map((item, index) => {
    const evidence = item.evidenceName ? ` Evidencia: ${item.evidenceName}.` : '';
    const observation = item.observation ? ` Observación: ${item.observation}.` : '';
    const action = item.suggestedAction ? ` Acción sugerida: ${item.suggestedAction}.` : '';
    return `${index + 1}. ${item.item}: ${item.status}. Severidad: ${item.severity}.${observation}${evidence}${action}`;
  }).join('\n');
}
