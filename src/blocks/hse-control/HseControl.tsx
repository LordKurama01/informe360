'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createHseReport, getCurrentHseUser, getHseFindings, getHseSummary, getHseWorkspace, hseSignIn, hseSignOut, hseSignUp, seedHseDemo, type HseFinding, type HseSummary, type HseWorkspace } from '@/services/hse/browser';
import styles from './HseControl.module.css';

type Filter = 'open'|'overdue'|'upcoming'|'critical'|'closed'|'all';
const emptySummary: HseSummary = { open:0, overdue:0, dueNext7Days:0, closed:0, closedOnTime:0, closureCompliancePct:0, criticalOpen:0 };

export function HseControl() {
  const [booting, setBooting] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [workspace, setWorkspace] = useState<HseWorkspace|null>(null);
  const [summary, setSummary] = useState<HseSummary>(emptySummary);
  const [findings, setFindings] = useState<HseFinding[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('open');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin'|'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [reportTitle, setReportTitle] = useState('');

  const loadWorkspace = useCallback(async () => {
    setError(null);
    const user = await getCurrentHseUser();
    setSignedIn(Boolean(user));
    if (!user) { setWorkspace(null); setBooting(false); return; }
    const nextWorkspace = await getHseWorkspace();
    setWorkspace(nextWorkspace);
    if (nextWorkspace) {
      const [nextSummary, nextFindings] = await Promise.all([getHseSummary(nextWorkspace), getHseFindings(nextWorkspace, query)]);
      setSummary(nextSummary); setFindings(nextFindings);
    }
    setBooting(false);
  }, [query]);

  useEffect(() => { const timer=setTimeout(() => void loadWorkspace().catch(e => { setError(e instanceof Error?e.message:'Error'); setBooting(false); }), query ? 250 : 0); return () => clearTimeout(timer); }, [loadWorkspace, query]);

  const visible = useMemo(() => {
    const now=Date.now(), next7=now+7*86400000;
    if(filter==='closed') return findings.filter(f=>f.status==='closed');
    if(filter==='overdue') return findings.filter(f=>!['closed','cancelled'].includes(f.status)&&!!f.due_at&&new Date(f.due_at).getTime()<now);
    if(filter==='upcoming') return findings.filter(f=>!['closed','cancelled'].includes(f.status)&&!!f.due_at&&new Date(f.due_at).getTime()>=now&&new Date(f.due_at).getTime()<=next7);
    if(filter==='critical') return findings.filter(f=>!['closed','cancelled'].includes(f.status)&&f.severity==='critical');
    if(filter==='open') return findings.filter(f=>!['closed','cancelled'].includes(f.status));
    return findings;
  },[findings,filter]);

  async function auth() {
    if(!email.trim()||password.length<6){setError('Ingresá un email y una contraseña de al menos 6 caracteres.');return;}
    setBusy(true);setError(null);
    try { if(authMode==='signin') await hseSignIn(email,password); else await hseSignUp(email,password); await loadWorkspace(); }
    catch(e){setError(e instanceof Error?e.message:'No se pudo autenticar');}
    finally{setBusy(false);}
  }

  async function demo() {
    setBusy(true);setError(null);
    try{await seedHseDemo();await loadWorkspace();}
    catch(e){setError(e instanceof Error?e.message:'No se pudo cargar la demo');}
    finally{setBusy(false);}
  }

  async function signOut(){await hseSignOut();setSignedIn(false);setWorkspace(null);setFindings([]);setSummary(emptySummary);}
  function toggle(id:string){setSelected(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next;});}

  async function createReport(){
    if(!workspace||!selected.size)return;
    setBusy(true);setError(null);
    try{const chosen=findings.filter(f=>selected.has(f.id));const id=await createHseReport(workspace,chosen,reportTitle);window.location.href=`/app/hse/reports/${id}`;}
    catch(e){setError(e instanceof Error?e.message:'No se pudo crear el informe');}
    finally{setBusy(false);}
  }

  if(booting)return <main className={styles.authShell}><div className={styles.authCard}><span className={styles.eyebrow}>INFORME360 · HSE CONTROL</span><h1>Cargando espacio operativo…</h1></div></main>;

  if(!signedIn)return <main className={styles.authShell}><section className={styles.authCard}>
    <span className={styles.eyebrow}>INFORME360 · HSE CONTROL</span><h1>El escritorio de la operación</h1><p>Ingresá con la misma cuenta de HSE Copilot Mobile. El escritorio consume exactamente los mismos hallazgos, acciones y cierres protegidos por RLS.</p>
    <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)}/>
    {error?<div className={styles.error}>{error}</div>:null}<button className={styles.primary} disabled={busy} onClick={()=>void auth()}>{busy?'Procesando…':authMode==='signin'?'Ingresar':'Crear cuenta'}</button><button className={styles.ghost} onClick={()=>setAuthMode(value=>value==='signin'?'signup':'signin')}>{authMode==='signin'?'No tengo cuenta':'Ya tengo cuenta'}</button><Link href="/" className={styles.ghost}>Volver</Link>
  </section></main>;

  if(!workspace)return <main className={styles.shell}><section className={styles.setup}><span className={styles.eyebrow}>CUENTA CONECTADA</span><h2>Tu usuario todavía no tiene una organización HSE</h2><p>Podés crear la organización real desde la app móvil o cargar ahora una demo coherente para recorrer todo el producto.</p>{error?<div className={styles.error}>{error}</div>:null}<button className={styles.primary} disabled={busy} onClick={()=>void demo()}>{busy?'Preparando demo…':'Cargar demo comercial'}</button><button className={styles.ghost} onClick={()=>void signOut()}>Cerrar sesión</button></section></main>;

  return <main className={styles.shell}>
    <div className={styles.topbar}><div className={styles.brand}><div className={styles.mark}>360</div><div><span className={styles.eyebrow}>INFORME360 · HSE CONTROL</span><h1>Command Center</h1></div></div><div className={styles.topActions}><Link className={styles.ghost} href="/app/reports">Informes</Link><button className={styles.ghost} onClick={()=>void demo()} disabled={busy}>Demo</button><button className={styles.ghost} onClick={()=>void signOut()}>Salir</button></div></div>
    <div className={styles.workspace}>
      <section className={styles.hero}><div><span className={styles.eyebrow} style={{color:'#99f6e4'}}>OPERACIÓN EN VIVO</span><h2>{workspace.siteName||workspace.organizationName}</h2><p>Hallazgos capturados desde campo, acciones, vencimientos y cierres en una única fuente de verdad. Lo que se registra en el teléfono aparece acá.</p></div><div className={styles.heroMeta}><b>{workspace.organizationName}</b><span>Rol: {workspace.role}</span></div></section>
      <section className={styles.metrics}>
        <Metric label="Abiertos" value={summary.open} tone="primary" onClick={()=>setFilter('open')}/><Metric label="Vencidos" value={summary.overdue} tone="danger" onClick={()=>setFilter('overdue')}/><Metric label="Próx. 7 días" value={summary.dueNext7Days} tone="warn" onClick={()=>setFilter('upcoming')}/><Metric label="Críticos abiertos" value={summary.criticalOpen} tone="danger" onClick={()=>setFilter('critical')}/><Metric label="Cierre en plazo" value={`${summary.closureCompliancePct}%`} tone="good" onClick={()=>setFilter('closed')}/>
      </section>
      <section className={styles.toolbar}><input className={styles.search} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar código, hallazgo, sector, equipo o responsable…"/>{(['open','overdue','upcoming','critical','closed','all'] as Filter[]).map(item=><button key={item} className={`${styles.filter} ${filter===item?styles.filterActive:''}`} onClick={()=>setFilter(item)}>{({open:'Abiertos',overdue:'Vencidos',upcoming:'Próx. 7 días',critical:'Críticos',closed:'Cerrados',all:'Todos'} as const)[item]}</button>)}</section>
      {error?<div className={styles.error}>{error}</div>:null}
      <section className={styles.panel}><div className={styles.list}>{visible.map(finding=>{const overdue=!['closed','cancelled'].includes(finding.status)&&!!finding.due_at&&new Date(finding.due_at).getTime()<Date.now();const checked=selected.has(finding.id);return <article key={finding.id} className={`${styles.finding} ${checked?styles.findingSelected:''}`}><button className={`${styles.check} ${checked?styles.checkOn:''}`} onClick={()=>toggle(finding.id)}>{checked?'✓':''}</button><div><div className={styles.code}>{finding.code} · {finding.priority.toUpperCase()}</div><h3>{finding.title}</h3><div className={styles.meta}>{finding.location_text||finding.element_text||finding.category||'Sin ubicación'} · {finding.responsible_text||'Sin responsable'}{finding.due_at?` · ${new Date(finding.due_at).toLocaleDateString('es-AR')}`:''}</div></div><span className={`${styles.status} ${overdue?styles.overdue:''}`}>{overdue?'VENCIDO':finding.status==='closed'?'CERRADO':finding.status==='in_progress'?'EN CURSO':'ABIERTO'}</span></article>})}{!visible.length?<div className={styles.empty}>No hay hallazgos para esta vista.</div>:null}</div>
        <aside className={styles.side}><span className={styles.eyebrow}>INFORME DESDE HALLAZGOS</span><div className={styles.selection}>{selected.size}</div><h3>hallazgo{selected.size===1?'':'s'} seleccionado{selected.size===1?'':'s'}</h3><p>El informe queda vinculado a los registros originales. No duplica ni reescribe evidencia operacional.</p><input value={reportTitle} onChange={e=>setReportTitle(e.target.value)} placeholder={`Informe HSE · ${workspace.siteName||workspace.organizationName}`}/><button className={styles.primary} disabled={busy||!selected.size} onClick={()=>void createReport()}>{busy?'Generando…':'Crear informe técnico'}</button><button className={styles.ghost} onClick={()=>setSelected(new Set())}>Limpiar selección</button></aside>
      </section>
    </div>
  </main>;
}

function Metric({label,value,tone,onClick}:{label:string;value:number|string;tone:'primary'|'danger'|'warn'|'good';onClick:()=>void}){return <button className={`${styles.metric} ${styles[tone]}`} onClick={onClick}><strong>{value}</strong><span>{label}</span></button>}
