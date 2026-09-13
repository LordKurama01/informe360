'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getHseReport, type HseFinding } from '@/services/hse/browser';
import styles from '@/blocks/hse-control/HseControl.module.css';

type ReportData = { report: { id:string; title:string|null; report_type:string|null; status:string; generated_report:unknown; created_at:string }; findings:HseFinding[] };

export default function HseReportPage(){
  const params=useParams<{id:string}>();
  const [data,setData]=useState<ReportData|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{if(!params.id)return;void getHseReport(params.id).then(result=>setData(result as ReportData)).catch(e=>setError(e instanceof Error?e.message:'No se pudo abrir el informe'));},[params.id]);
  if(error)return <main className={styles.shell}><div className={styles.reportShell}><div className={styles.error}>{error}</div><Link className={styles.ghost} href="/app/hse">Volver a HSE Control</Link></div></main>;
  if(!data)return <main className={styles.shell}><div className={styles.reportShell}>Cargando informe…</div></main>;
  const generated=(data.report.generated_report && typeof data.report.generated_report==='object')?data.report.generated_report as Record<string,unknown>:{};
  return <main className={styles.shell}><article className={styles.reportShell}>
    <div className={styles.printActions}><Link className={styles.ghost} href="/app/hse">← HSE Control</Link><button className={styles.primary} onClick={()=>window.print()}>Imprimir / Guardar PDF</button></div>
    <header className={styles.reportHeader}><span className={styles.eyebrow}>INFORME360 · HSE COPILOT</span><h1>{data.report.title||'Informe HSE'}</h1><p>{data.report.report_type||'Recorrido HSE'} · {new Date(data.report.created_at).toLocaleString('es-AR')} · {data.findings.length} hallazgo{data.findings.length===1?'':'s'}</p></header>
    <section><h2>Resumen ejecutivo</h2><p>{typeof generated.executiveSummary==='string'?generated.executiveSummary:`Informe construido desde ${data.findings.length} registros operacionales trazables.`}</p></section>
    <section><h2>Hallazgos vinculados</h2>{data.findings.map((finding,index)=><section key={finding.id} className={styles.reportFinding}><span className={styles.eyebrow}>{String(index+1).padStart(2,'0')} · {finding.code}</span><h3>{finding.title}</h3>{finding.description?<p>{finding.description}</p>:null}<p className={styles.meta}><b>Severidad:</b> {finding.severity} · <b>Prioridad:</b> {finding.priority} · <b>Estado:</b> {finding.status}</p><p className={styles.meta}><b>Ubicación:</b> {finding.location_text||'—'} · <b>Elemento:</b> {finding.element_text||'—'} · <b>Responsable:</b> {finding.responsible_text||'—'}</p>{finding.due_at?<p className={styles.meta}><b>Vencimiento:</b> {new Date(finding.due_at).toLocaleString('es-AR')}</p>:null}{finding.closure_comment?<p><b>Cierre:</b> {finding.closure_comment}</p>:null}</section>)}</section>
    <footer><p className={styles.meta}>Este informe referencia los hallazgos originales de Informe360. La trazabilidad operacional permanece en la base y no se reemplaza por este documento.</p></footer>
  </article></main>;
}
