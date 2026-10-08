'use client';
import { useMemo, useState } from 'react';
import { createHseReminder, updateHseReminderStatus, type HseFinding, type HseReminder, type HseWorkspace } from '@/services/hse/browser';
import styles from './HseControl.module.css';

export function HseAgendaPanel({workspace,findings,reminders,onRefresh}:{
  workspace:HseWorkspace;findings:HseFinding[];reminders:HseReminder[];onRefresh():Promise<void>;
}) {
  const [title,setTitle]=useState('');
  const [when,setWhen]=useState('');
  const [notes,setNotes]=useState('');
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);
  const [filter,setFilter]=useState<'upcoming'|'all'>('upcoming');
  const today = Date.now();
  const due = useMemo(() => findings
    .filter(x => x.due_at && x.status !== 'closed' && x.status !== 'cancelled')
    .sort((a,b)=>new Date(a.due_at!).getTime()-new Date(b.due_at!).getTime()),
    [findings]);
  const ordered = useMemo(()=>[...reminders].sort((a,b)=>
    new Date(a.scheduled_for).getTime()-new Date(b.scheduled_for).getTime()),[reminders]);
  const visible = ordered.filter(x=>filter==='all'||x.status==='pending');
  const overdue = due.filter(x=>new Date(x.due_at!).getTime()<today).length;

  async function save() {
    if(pending)return;
    setError(null);setNotice(null);
    if(!title.trim()||!when){setError('Completá título y fecha/hora.');return;}
    setPending(true);
    try {
      await createHseReminder(workspace,{title,notes,scheduledFor:when,channel:'in_app'});
      await onRefresh();
      setTitle('');setNotes('');setWhen('');
      setNotice('Recordatorio creado y guardado en la agenda.');
    } catch(e){setError(e instanceof Error?e.message:'No se pudo crear el recordatorio.');}
    finally{setPending(false);}
  }
  async function changeStatus(id:string,status:'completed'|'cancelled') {
    if(pending)return;
    setError(null);setNotice(null);setPending(true);
    try {
      await updateHseReminderStatus(workspace,id,status);
      await onRefresh();
      setNotice(status==='completed'?'Recordatorio completado.':'Recordatorio cancelado.');
    } catch(e){setError(e instanceof Error?e.message:'No se pudo actualizar.');}
    finally{setPending(false);}
  }
  return <>
    <section className={styles.hero}>
      <div><span className={styles.eyebrowLight}>AGENDA HSE</span><h2>Próximos compromisos.</h2>
        <p>Vencimientos de hallazgos y recordatorios de tu organización, sin mezclar calendarios de otras aplicaciones.</p></div>
      <div className={styles.heroSummary}><strong>{due.length}</strong><span>hallazgos con vencimiento</span>
        <small>{overdue} vencidos · {workspace.siteName||workspace.organizationName}</small></div>
    </section>
    {error?<div className={styles.error} role="alert">{error}</div>:null}
    {notice?<div className={styles.inspectionSuccess} role="status">{notice}</div>:null}
    <div className={styles.agendaColumns}>
      <section className={styles.listPanel}>
        <div className={styles.sectionHead}><div><span className={styles.eyebrow}>SEGUIMIENTO DE HALLAZGOS</span>
          <h2>Vencimientos operativos</h2></div><span className={styles.resultCount}>{due.length} próximos o vencidos</span></div>
        <div className={styles.list}>
          {due.map(f=><div key={f.id} className={styles.reportRow}>
            <div className={styles.reportRowContent}><span className={styles.code}>{f.code} · {f.severity.toUpperCase()}</span>
              <h3>{f.title}</h3><span className={styles.meta}>{f.responsible_text||'Responsable no asignado'} · {f.status}</span></div>
            <span className={styles.agendaDate}>{new Date(f.due_at!).toLocaleDateString('es-AR')}{new Date(f.due_at!).getTime()<today?' · Vencido':''}</span>
          </div>)}
          {!due.length?<div className={styles.empty}>No hay hallazgos abiertos con vencimiento registrado.</div>:null}
        </div>
      </section>
      <section className={styles.listPanel}>
        <div className={styles.sectionHead}><div><span className={styles.eyebrow}>ORGANIZACIÓN DEL TRABAJO</span>
          <h2>Recordatorios</h2></div><span className={styles.resultCount}>{reminders.length} registrados</span></div>
        <div className={styles.agendaCreate}>
          <label>Título<input className={styles.inspectionInput} placeholder="Ej. Revisar equipos de rescate" value={title} onChange={e=>setTitle(e.target.value)}/></label>
          <label>Fecha y hora<input className={styles.inspectionInput} type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)}/></label>
          <label>Notas<textarea className={styles.inspectionInput} rows={2} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
          <button className={styles.primary} onClick={()=>void save()} disabled={pending||!title.trim()||!when}>
            {pending?'Guardando…':'Agregar recordatorio'}</button>
        </div>
        <div className={styles.filterRow} role="group" aria-label="Estado de recordatorios">
          <button className={`${styles.filter} ${filter==='upcoming'?styles.filterActive:''}`} aria-pressed={filter==='upcoming'} onClick={()=>setFilter('upcoming')}>Pendientes</button>
          <button className={`${styles.filter} ${filter==='all'?styles.filterActive:''}`} aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>Todos</button>
        </div>
        <div className={styles.list}>
          {visible.map(reminder=><div key={reminder.id} className={styles.reportRow}>
            <div className={styles.reportRowContent}>
              <span className={styles.code}>{new Date(reminder.scheduled_for).toLocaleString('es-AR')} · {reminder.channel}</span>
              <h3>{reminder.title||'Recordatorio HSE'}</h3>
              {reminder.notes?<span className={styles.meta}>{reminder.notes}</span>:null}
              <span className={styles.inspectionState}>{reminder.status}</span>
            </div>
            {reminder.status==='pending'?<div className={styles.agendaActions}>
              <button className={styles.secondary} disabled={pending} onClick={()=>void changeStatus(reminder.id,'completed')}>Completar</button>
              <button className={styles.secondary} disabled={pending} onClick={()=>void changeStatus(reminder.id,'cancelled')}>Cancelar</button>
            </div>:null}
          </div>)}
          {!visible.length?<div className={styles.empty}>{filter==='upcoming'?'No hay recordatorios pendientes.':'Todavía no hay recordatorios registrados.'}</div>:null}
        </div>
      </section>
    </div>
  </>;
}
