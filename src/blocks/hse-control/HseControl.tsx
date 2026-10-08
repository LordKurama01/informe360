'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createHseReport, getCurrentHseUser, getHseFindings, getHseSummary, getHseWorkspace, hseSignIn, hseSignOut, hseSignUp, listHseReports, type HseReportRow, type HseFinding, type HseSummary, type HseWorkspace } from '@/services/hse/browser';
import styles from './HseControl.module.css';
import { formatClosureCompliance, formatHseCount, hseDataStatusLabel, type HseDataStatus } from '@/shared/hse/dashboard-metrics';
import { installStandardInspectionTemplates, listFormRuns, listFormTemplates, startHseInspection, type HseFormRunRow, type HseFormTemplate } from '@/services/hse/forms-browser';
import { filterInspectionRuns, inspectionStatusLabel, selectHseInspections, type InspectionRunFilter } from '@/shared/hse/inspection-view';
import { HseInspectionRunPanel } from './HseInspectionRunPanel';

type Filter = 'open'|'overdue'|'upcoming'|'critical'|'closed'|'all';
const emptySummary: HseSummary = { open:0, overdue:0, dueNext7Days:0, closed:0, closedOnTime:0, closureCompliancePct:0, criticalOpen:0 };

export function HseControl({ mode = 'overview', inspectionRunId }: { mode?: 'overview' | 'reports' | 'inspections' | 'inspection-run'; inspectionRunId?: string }) {
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [showSlowBoot, setShowSlowBoot] = useState(false);
  const [dataStatus, setDataStatus] = useState<HseDataStatus>('loading');
  const [signedIn, setSignedIn] = useState(false);
  const [workspace, setWorkspace] = useState<HseWorkspace|null>(null);
  const [summary, setSummary] = useState<HseSummary>(emptySummary);
  const [findings, setFindings] = useState<HseFinding[]>([]);
  const [baseFindings, setBaseFindings] = useState<HseFinding[]>([]);
  const [searchPending, setSearchPending] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [reports, setReports] = useState<HseReportRow[]>([]);
  const [inspectionTemplates, setInspectionTemplates] = useState<HseFormTemplate[]>([]);
  const [inspectionRuns, setInspectionRuns] = useState<HseFormRunRow[]>([]);
  const [inspectionMessage, setInspectionMessage] = useState<string | null>(null);
  const [inspectionSearch, setInspectionSearch] = useState('');
  const [inspectionFilter, setInspectionFilter] = useState<InspectionRunFilter>('all');
  const [reportSearch, setReportSearch] = useState('');
  const [query, setQuery] = useState('');
  const latestQueryRef = useRef('');
  const [filter, setFilter] = useState<Filter>('open');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin'|'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [nowMs, setNowMs] = useState(0);

  const loadWorkspace = useCallback(async () => {
    setError(null);
    setDataStatus('loading');
    const user = await getCurrentHseUser();
    setSignedIn(Boolean(user));
    if (!user) { setWorkspace(null); setBooting(false); return; }
    const nextWorkspace = await getHseWorkspace();
    setWorkspace(nextWorkspace);
    if (nextWorkspace) {
      if (mode === 'reports') {
        setReports(await listHseReports(nextWorkspace));
      } else if (mode === 'inspections') {
        const [templates, runs] = await Promise.all([
          listFormTemplates(nextWorkspace),
          listFormRuns(nextWorkspace),
        ]);
        setInspectionTemplates(templates);
        setInspectionRuns(runs);
      } else if (mode !== 'inspection-run') {
        const [nextSummary, nextFindings] = await Promise.all([getHseSummary(nextWorkspace), getHseFindings(nextWorkspace)]);
        setSummary(nextSummary);
        setBaseFindings(nextFindings);
        if (!latestQueryRef.current.trim()) setFindings(nextFindings);
        setNowMs(new Date().getTime());
      }
      setDataStatus('ready');
    }
    setBooting(false);
  }, [mode]);

  const handleLoadError = useCallback((reason: unknown) => {
    setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la información HSE.');
    setDataStatus('error');
    setBooting(false);
  }, []);

  useEffect(() => { const timer=setTimeout(() => void loadWorkspace().catch(handleLoadError), 0); return () => clearTimeout(timer); }, [loadWorkspace, handleLoadError]);

  // Search only refreshes the findings list. It must not revalidate session,
  // flash the entire dashboard, or make repeated summary/organization requests.
  useEffect(() => {
    if (mode !== 'overview' || !workspace || dataStatus !== 'ready') return;
    const searchText = query.trim();
    if (!searchText) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setSearchPending(true);
      setSearchError(null);
      void getHseFindings(workspace, searchText)
        .then(results => { if (active) setFindings(results); })
        .catch(reason => {
          if (active) setSearchError(reason instanceof Error ? reason.message : 'No se pudo buscar hallazgos.');
        })
        .finally(() => { if (active) setSearchPending(false); });
    }, 280);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, workspace, baseFindings, mode, dataStatus]);

  // Fast route transitions must not flash a full-screen login-like loading page.
  // Only render a subtle dashboard-shaped skeleton when the first request is slow.
  useEffect(() => {
    if (!booting) return;
    const timer = window.setTimeout(() => setShowSlowBoot(true), 320);
    return () => window.clearTimeout(timer);
  }, [booting]);

  const visible = useMemo(() => {
    const next7=nowMs+7*86400000;
    if(filter==='closed') return findings.filter(f=>f.status==='closed');
    if(filter==='overdue') return findings.filter(f=>!['closed','cancelled'].includes(f.status)&&!!f.due_at&&new Date(f.due_at).getTime()<nowMs);
    if(filter==='upcoming') return findings.filter(f=>!['closed','cancelled'].includes(f.status)&&!!f.due_at&&new Date(f.due_at).getTime()>=nowMs&&new Date(f.due_at).getTime()<=next7);
    if(filter==='critical') return findings.filter(f=>!['closed','cancelled'].includes(f.status)&&f.severity==='critical');
    if(filter==='open') return findings.filter(f=>!['closed','cancelled'].includes(f.status));
    return findings;
  },[findings,filter,nowMs]);

  async function auth() {
    if(!email.trim()||password.length<6){setError('Ingresá un email y una contraseña de al menos 6 caracteres.');return;}
    setBusy(true);setError(null);
    try { if(authMode==='signin') await hseSignIn(email,password); else await hseSignUp(email,password); await loadWorkspace(); }
    catch(e){setError(e instanceof Error?e.message:'No se pudo autenticar');}
    finally{setBusy(false);}
  }

  const inspectionData = useMemo(
    () => selectHseInspections(inspectionTemplates, inspectionRuns, workspace?.siteId ?? null),
    [inspectionTemplates, inspectionRuns, workspace?.siteId],
  );

  const visibleInspectionTemplates = useMemo(() => {
    const q = inspectionSearch.trim().toLocaleLowerCase('es-AR');
    return inspectionData.templates.filter(template => !q || template.name.toLocaleLowerCase('es-AR').includes(q));
  }, [inspectionData.templates, inspectionSearch]);
  const visibleInspectionRuns = useMemo(
    () => filterInspectionRuns(inspectionData.runs, inspectionData.names, inspectionSearch, inspectionFilter),
    [inspectionData.runs, inspectionData.names, inspectionSearch, inspectionFilter],
  );

  const visibleReports = useMemo(() => reports.filter(report => {
    const search = reportSearch.trim().toLocaleLowerCase('es-AR');
    return !search || [report.title, report.report_type, report.status].some(value => (value || '').toLocaleLowerCase('es-AR').includes(search));
  }), [reports, reportSearch]);

  function changeSearch(value: string) {
    latestQueryRef.current = value;
    setQuery(value);
    if (!value.trim()) {
      setFindings(baseFindings);
      setSearchPending(false);
      setSearchError(null);
    }
  }

  async function signOut(){await hseSignOut();setSignedIn(false);setWorkspace(null);setFindings([]);setBaseFindings([]);latestQueryRef.current='';setQuery('');setSearchError(null);setSummary(emptySummary);}
  function toggle(id:string){setSelected(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next;});}

  async function beginInspection(template: HseFormTemplate) {
    if (!workspace || busy) return;
    setBusy(true);
    setError(null);
    try {
      const id = await startHseInspection(workspace, template);
      router.push('/app/hse/inspections/' + id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar la inspección.');
    } finally {
      setBusy(false);
    }
  }

  async function installStandards() {
    if (!workspace || busy || mode !== 'inspections') return;
    setBusy(true);
    setError(null);
    setInspectionMessage(null);
    try {
      const added = await installStandardInspectionTemplates(workspace);
      setInspectionMessage(added > 0 ? `Se agregaron ${added} plantillas estándar.` : 'La biblioteca de plantillas estándar ya está actualizada.');
      await loadWorkspace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron incorporar las plantillas estándar.');
    } finally {
      setBusy(false);
    }
  }

  async function createReport(){
    if(!workspace||!selected.size)return;
    setBusy(true);setError(null);
    try{const chosen=findings.filter(f=>selected.has(f.id));const id=await createHseReport(workspace,chosen,reportTitle);window.location.href=`/app/hse/reports/${id}`;}
    catch(e){setError(e instanceof Error?e.message:'No se pudo crear el informe');}
    finally{setBusy(false);}
  }

  if(booting)return <main className={styles.bootFrame} aria-label="Cargando espacio operativo">
    {showSlowBoot ? <>
      <aside className={styles.bootAside} aria-hidden="true">
        <div className={styles.bootLogo}/><div className={styles.bootNavLine}/><div className={styles.bootNavLine}/><div className={styles.bootNavLine}/>
      </aside>
      <section className={styles.bootMain} role="status" aria-live="polite">
        <div className={styles.bootHeaderLine}/>
        <div className={styles.bootHero}/>
        <div className={styles.bootCards}><div/><div/><div/></div>
        <span className={styles.bootCaption}>Preparando tu espacio de trabajo…</span>
      </section>
    </> : null}
  </main>;

  if(!signedIn)return <main className={styles.authShell}>
    <section className={styles.authVisual}>
      <Brand variant="onDark"/>
      <div className={styles.authPitch}>
        <span className={styles.eyebrowLight}>HSE COPILOT · CAMPO PRIMERO</span>
        <h1>Ves algo.<br/>Lo decís.<br/><em>HSE Copilot hace el resto.</em></h1>
        <p>Capturá por voz, foto o texto desde el celular. En escritorio, supervisá hallazgos, vencimientos, inspecciones e informes con la misma fuente de verdad.</p>
        <div className={styles.authSignals}><span>Voz + foto</span><span>Offline</span><span>WhatsApp ready</span></div>
      </div>
      <div className={styles.authFoot}><span>Informe360</span><span>Operación HSE trazable</span></div>
    </section>
    <section className={styles.authPanel}>
      <div className={styles.authCard}>
        <div className={styles.authMobileBrand}><Brand variant="onLight"/></div>
        <span className={styles.eyebrow}>ACCESO SEGURO</span>
        <h2>{authMode==='signin'?'Entrá a HSE Copilot':'Creá tu acceso'}</h2>
        <p>Usá la misma cuenta en celular y escritorio.</p>
        <label>Correo electrónico<input className={styles.field} type="email" autoComplete="email" placeholder="nombre@empresa.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
        <label>Contraseña<input className={styles.field} type="password" autoComplete={authMode==='signin'?'current-password':'new-password'} placeholder="Mínimo 6 caracteres" value={password} onChange={e=>setPassword(e.target.value)}/></label>
        {error?<div className={styles.error}>{error}</div>:null}
        <button className={styles.primary} disabled={busy} onClick={()=>void auth()}>{busy?'Procesando…':authMode==='signin'?'Ingresar':'Crear cuenta'}</button>
        <button className={styles.linkButton} onClick={()=>setAuthMode(value=>value==='signin'?'signup':'signin')}>{authMode==='signin'?'¿Primera vez? Crear cuenta':'Ya tengo cuenta'}</button>
        <div className={styles.authDivider}><span/>Acceso operativo<span/></div>
        <p className={styles.authNote}>Tus hallazgos, evidencias y cierres se mantienen protegidos por permisos de organización y sitio.</p>
        <Link href="/" className={styles.backLink}>← Volver a Informe360</Link>
      </div>
    </section>
  </main>;

  if(!workspace)return <main className={styles.authShell}><section className={styles.authVisual}><Brand variant="onDark"/><div className={styles.authPitch}><span className={styles.eyebrowLight}>CUENTA CONECTADA</span><h1>Falta vincular tu organización HSE.</h1><p>Tu cuenta todavía no tiene una organización asignada. Solicitá acceso al administrador de tu empresa.</p></div></section><section className={styles.authPanel}><div className={styles.authCard}>{error?<div className={styles.error}>{error}</div>:null}<button className={styles.primary} disabled={busy} onClick={()=>void loadWorkspace()}>{busy?'Comprobando…':'Volver a comprobar acceso'}</button><button className={styles.secondary} onClick={()=>void signOut()}>Cerrar sesión</button></div></section></main>;

  return <main className={styles.appShell}>
    <aside className={styles.sideNav}>
      <div className={styles.sideBrand}><Brand variant="onDark"/></div>
      <nav className={styles.navList}>
        <Link className={`${styles.navItem} ${mode === 'overview' ? styles.navItemActive : ''}`} href="/app/hse"><span>01</span>Inicio</Link>
        {mode === 'overview' ? <button className={styles.navItem} onClick={()=>setFilter('open')}><span>02</span>Hallazgos</button> : <Link className={styles.navItem} href="/app/hse"><span>02</span>Hallazgos</Link>}
        <Link className={`${styles.navItem} ${mode === 'inspections' || mode === 'inspection-run' ? styles.navItemActive : ''}`} aria-current={mode === 'inspections' || mode === 'inspection-run' ? 'page' : undefined} href="/app/hse/inspections"><span>03</span>Inspecciones</Link>
        <Link className={styles.navItem} href="/app/hse/forms"><span>04</span>Formularios</Link>
        <Link className={styles.navItem} href="/app/calendar"><span>05</span>Agenda</Link>
        <Link className={`${styles.navItem} ${mode === 'reports' ? styles.navItemActive : ''}`} href="/app/hse/reports" aria-current={mode === 'reports' ? 'page' : undefined}><span>06</span>Informes</Link>
      </nav>
      <div className={styles.sideStatus}><span className={styles.liveDot}/><div><b>{workspace.organizationName}</b><small>{workspace.siteName||'Sitio operativo'}</small></div></div>
      <button className={styles.signOut} onClick={()=>void signOut()}>Cerrar sesión</button>
    </aside>

    <section className={styles.mainArea}>
      <header className={styles.topbar}>
        <div><span className={styles.eyebrow}>OPERACIÓN HSE</span><h1>{workspace.siteName||workspace.organizationName}</h1></div>
        <div className={styles.topActions}><span className={`${styles.syncBadge} ${dataStatus === 'error' ? styles.syncBadgeError : dataStatus === 'loading' ? styles.syncBadgeLoading : ''}`} role="status"><i aria-hidden="true"/>{hseDataStatusLabel(dataStatus)}</span><button className={styles.secondary} onClick={()=>void loadWorkspace().catch(handleLoadError)} disabled={busy || dataStatus === 'loading'} aria-label="Actualizar datos HSE">Actualizar</button></div>
      </header>

      <div className={styles.workspace}>
        {mode === 'inspection-run' && inspectionRunId ? <HseInspectionRunPanel workspace={workspace} runId={inspectionRunId}/> : mode === 'inspections' ? <>
          <section className={styles.hero}>
            <div>
              <span className={styles.eyebrowLight}>INSPECCIONES HSE</span>
              <h2>Inspecciones de campo.</h2>
              <p>Plantillas publicadas y ejecuciones registradas en tu organización.</p>
            </div>
            <div className={styles.heroSummary}>
              <strong>{formatHseCount(inspectionData.runs.length, dataStatus)}</strong>
              <span>inspecciones registradas</span>
              <small>{workspace.siteName || workspace.organizationName}</small>
            </div>
          </section>
          <section className={styles.listPanel}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.eyebrow}>BIBLIOTECA OPERATIVA</span>
                <h2>Plantillas de inspección</h2>
              </div>
              <div className={styles.inspectionActions}>
                <Link className={styles.reportStartLink} href="/app/hse/forms">Administrar plantillas →</Link>
                <button className={styles.secondary} disabled={busy || dataStatus === 'loading'} onClick={() => void installStandards()}>
                  {busy ? 'Preparando…' : 'Agregar estándares'}
                </button>
              </div>
            </div>
            <div className={styles.toolbar}>
              <input className={styles.search} value={inspectionSearch} onChange={event => setInspectionSearch(event.target.value)} aria-label="Buscar inspecciones" placeholder="Buscar por nombre de plantilla…" />
            </div>
            {error ? <div className={styles.error} role="alert">{error}</div> : null}
            {inspectionMessage ? <div className={styles.inspectionSuccess} role="status">{inspectionMessage}</div> : null}
            {dataStatus === 'loading' ? <div className={styles.empty} role="status">Consultando plantillas y ejecuciones…</div> : null}
            {dataStatus === 'ready' ? <div className={styles.inspectionCards}>
              {visibleInspectionTemplates.map(template => <article className={styles.inspectionCard} key={template.id}>
                <span className={styles.code}>INSPECCIÓN · v{template.publishedVersion?.version ?? '—'}</span>
                <h3>{template.name}</h3>
                <p>{template.description || 'Sin descripción registrada.'}</p>
                <div className={styles.inspectionCardFooter}>
                  <span className={styles.inspectionState}>{template.status === 'active' ? 'ACTIVA' : template.status === 'draft' ? 'BORRADOR' : 'ARCHIVADA'}</span>
                  <button className={styles.secondary} disabled={busy || dataStatus !== 'ready' || template.status !== 'active' || !template.publishedVersion}
                    onClick={() => void beginInspection(template)}>Iniciar inspección →</button>
                </div>
              </article>)}
              {!visibleInspectionTemplates.length ? <div className={styles.empty}>{inspectionSearch ? 'No encontramos plantillas con ese nombre.' : 'No hay plantillas de inspección para esta organización. Podés administrarlas desde Formularios.'}</div> : null}
            </div> : null}
          </section>
          <section className={styles.listPanel}>
            <div className={styles.sectionHead}>
              <div><span className={styles.eyebrow}>HISTORIAL OPERATIVO</span><h2>Últimas inspecciones</h2></div>
              <span className={styles.resultCount}>{dataStatus === 'ready' ? `${visibleInspectionRuns.length} registros` : '—'}</span>
            </div>
            <div className={styles.filterRow} role="group" aria-label="Filtrar ejecuciones de inspecciones">
              {([
                ['all', 'Todas'], ['pending', 'Pendientes'], ['submitted', 'Presentadas'],
              ] as const).map(([value, label]) =>
                <button key={value} className={`${styles.filter} ${inspectionFilter === value ? styles.filterActive : ''}`} aria-pressed={inspectionFilter === value} onClick={() => setInspectionFilter(value)}>{label}</button>
              )}
            </div>
            {dataStatus === 'ready' ? <div className={styles.list}>
              {visibleInspectionRuns.map(run => <Link key={run.id} className={styles.reportRow} href={`/app/hse/inspections/${run.id}`}>
                <div className={styles.reportRowContent}>
                  <span className={styles.code}>{new Date(run.started_at).toLocaleString('es-AR')}</span>
                  <h3>{inspectionData.names.get(run.template_id) || 'Inspección'}</h3>
                </div>
                <span className={styles.inspectionState}>{inspectionStatusLabel(run.status)} ↗</span>
              </Link>)}
              {!visibleInspectionRuns.length ? <div className={styles.empty}>{inspectionSearch || inspectionFilter !== 'all' ? 'No hay ejecuciones que coincidan con estos filtros.' : 'Todavía no se registraron ejecuciones de inspección para este sitio.'}</div> : null}
            </div> : null}
          </section>
        </> : mode === 'reports' ? <>
          <section className={styles.hero}>
            <div><span className={styles.eyebrowLight}>INFORMES TÉCNICOS</span><h2>Informes de tu operación.</h2><p>Historial generado desde hallazgos reales, organizado por empresa y sitio.</p></div>
            <div className={styles.heroSummary}><strong>{formatHseCount(reports.length, dataStatus)}</strong><span>informes registrados</span><small>{workspace.siteName || workspace.organizationName}</small></div>
          </section>
          <section className={styles.listPanel}>
            <div className={styles.sectionHead}>
              <div><span className={styles.eyebrow}>HISTORIAL OPERATIVO</span><h2>Informes generados</h2></div>
              <span className={styles.resultCount}>{visibleReports.length} registros</span>
            </div>
            <div className={styles.toolbar}><input className={styles.search} aria-label="Buscar informes" placeholder="Buscar por título, tipo o estado…" value={reportSearch} onChange={e=>setReportSearch(e.target.value)}/></div>
            {error ? <div className={styles.error} role="alert">{error}</div> : null}
            {dataStatus === 'loading' ? <div className={styles.empty} role="status">Consultando informes registrados…</div> : null}
            <div className={styles.list}>
              {visibleReports.map(report => <Link key={report.id} className={styles.reportRow} href={`/app/hse/reports/${report.id}`}>
                <div className={styles.reportRowContent}>
                  <span className={styles.code}>{new Date(report.created_at).toLocaleDateString('es-AR')} · {report.report_type || 'Informe HSE'}</span>
                  <h3>{report.title || 'Informe HSE sin título'}</h3>
                  <span className={styles.meta}>Registro guardado y vinculado a la operación</span>
                </div>
                <span className={styles.reportRowAction}>{report.status} <span aria-hidden="true">↗</span></span>
              </Link>)}
              {dataStatus === 'ready' && !visibleReports.length ? <div className={styles.empty}>
                <p>{reportSearch ? 'No encontramos informes que coincidan con tu búsqueda.' : 'Todavía no hay informes generados para este espacio.'}</p>
                {!reportSearch ? <Link className={styles.reportStartLink} href="/app/hse">Ir a Hallazgos para crear el primer informe →</Link> : null}
              </div> : null}
            </div>
          </section>
        </> : <>
        <section className={styles.hero}>
          <Image className={styles.heroMark} src="/brand/informe360-hse/informe360-hse-oscuro.svg" alt="" aria-hidden="true" width={1200} height={1200} unoptimized/>
          <div><span className={styles.eyebrowLight}>ESTADO OPERATIVO</span><h2>Lo importante, primero.</h2><p>Hallazgos, acciones y vencimientos sincronizados con el trabajo de campo.</p></div>
          <div className={styles.heroSummary}><strong>{formatHseCount(summary.open, dataStatus)}</strong><span>hallazgos abiertos</span><small>{summary.criticalOpen} críticos · {summary.overdue} vencidos</small></div>
        </section>

        <section className={styles.quickCapture}>
          <div><span className={styles.eyebrow}>CAPTURA DE CAMPO</span><h2>El celular es la herramienta principal.</h2><p>En obra, registrá lo que ves sin completar pantallas innecesarias. Voz, foto y texto terminan en este mismo tablero.</p></div>
          <div className={styles.captureModes}><div><b>VOZ</b><span>Describí el hallazgo caminando</span></div><div><b>FOTO</b><span>Guardá evidencia en contexto</span></div><div><b>TEXTO</b><span>Registrá una nota rápida</span></div></div>
        </section>

        <section className={styles.metrics}>
          <Metric label="Abiertos" value={formatHseCount(summary.open,dataStatus)} tone="primary" onClick={()=>setFilter('open')}/><Metric label="Vencidos" value={formatHseCount(summary.overdue,dataStatus)} tone="danger" onClick={()=>setFilter('overdue')}/><Metric label="Próx. 7 días" value={formatHseCount(summary.dueNext7Days,dataStatus)} tone="warn" onClick={()=>setFilter('upcoming')}/><Metric label="Críticos" value={formatHseCount(summary.criticalOpen,dataStatus)} tone="danger" onClick={()=>setFilter('critical')}/><Metric label="Cierre en plazo" value={formatClosureCompliance(summary,dataStatus)} tone="good" title={summary.closed === 0 ? 'Sin cierres registrados: indicador no aplicable' : undefined} onClick={()=>setFilter('closed')}/>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.listPanel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>HALLAZGOS</span><h2>Seguimiento operativo</h2></div><span className={styles.resultCount}>{searchPending ? 'Buscando…' : `${visible.length} registros`}</span></div>
            <div className={styles.toolbar}><input className={styles.search} value={query} onChange={e=>changeSearch(e.target.value)} placeholder="Buscar código, sector, equipo o responsable…"/><div className={styles.filterRow}>{(['open','overdue','upcoming','critical','closed','all'] as Filter[]).map(item=><button key={item} className={`${styles.filter} ${filter===item?styles.filterActive:''}`} onClick={()=>setFilter(item)}>{({open:'Abiertos',overdue:'Vencidos',upcoming:'7 días',critical:'Críticos',closed:'Cerrados',all:'Todos'} as const)[item]}</button>)}</div></div>
            {error?<div className={styles.error} role="alert">{error}</div>:null}
            {searchError?<div className={styles.error} role="alert">{searchError}</div>:null}
            {dataStatus === 'loading' ? <div className={styles.empty} role="status">Actualizando hallazgos…</div> : null}
            <div className={`${styles.list} ${searchPending ? styles.listSearching : ''}`} aria-busy={searchPending}>{visible.map(finding=>{const overdue=!['closed','cancelled'].includes(finding.status)&&!!finding.due_at&&new Date(finding.due_at).getTime()<nowMs;const checked=selected.has(finding.id);return <article key={finding.id} className={`${styles.finding} ${checked?styles.findingSelected:''}`}><button aria-label={`Seleccionar ${finding.code}`} className={`${styles.check} ${checked?styles.checkOn:''}`} onClick={()=>toggle(finding.id)}>{checked?'✓':''}</button><div><div className={styles.code}>{finding.code} · {finding.priority.toUpperCase()}</div><h3>{finding.title}</h3><div className={styles.meta}>{finding.location_text||finding.element_text||finding.category||'Sin ubicación'} · {finding.responsible_text||'Sin responsable'}{finding.due_at?` · ${new Date(finding.due_at).toLocaleDateString('es-AR')}`:''}</div></div><span className={`${styles.status} ${overdue?styles.overdue:''}`}>{overdue?'VENCIDO':finding.status==='closed'?'CERRADO':finding.status==='in_progress'?'EN CURSO':'ABIERTO'}</span></article>})}{dataStatus === 'ready' && !visible.length && !searchPending && !searchError?<div className={styles.empty}>No hay hallazgos para esta vista.</div>:null}</div>
          </div>

          <aside className={styles.side}>
            <span className={styles.eyebrow}>INFORME TÉCNICO</span><div className={styles.selection}>{selected.size}</div><h3>hallazgo{selected.size===1?'':'s'} seleccionado{selected.size===1?'':'s'}</h3><p>El informe queda vinculado a los registros originales y conserva su trazabilidad.</p><input value={reportTitle} onChange={e=>setReportTitle(e.target.value)} placeholder={`Informe HSE · ${workspace.siteName||workspace.organizationName}`}/><button className={styles.primary} disabled={busy||!selected.size} onClick={()=>void createReport()}>{busy?'Generando…':'Crear informe técnico'}</button><button className={styles.secondary} onClick={()=>setSelected(new Set())}>Limpiar selección</button>
          </aside>
        </section>
        </>}
      </div>
    </section>

    <nav className={styles.mobileDock} aria-label="Navegación HSE móvil">
      <Link href="/app/hse">Inicio</Link><Link href="/app/hse/inspections">Inspecciones</Link><Link className={styles.mobileDockPrimary} href="/app/hse"><Image src="/brand/informe360-hse/informe360-hse-claro.svg" alt="HSE" width={1200} height={1200} unoptimized/></Link><Link href="/app/calendar">Agenda</Link><Link href="/app/hse/reports">Informes</Link>
    </nav>
  </main>;
}

function Brand({variant='onDark'}:{variant?:'onDark'|'onLight'}){
  const src=variant==='onDark'?'/brand/informe360-hse/informe360-hse-oscuro.svg':'/brand/informe360-hse/informe360-hse-claro.svg';
  return <div className={styles.brandLockup}><Image className={styles.brandLogo} src={src} alt="Informe360 HSE" width={1200} height={1200} priority unoptimized/></div>;
}
function Metric({label,value,tone,onClick,title}:{label:string;value:number|string;tone:'primary'|'danger'|'warn'|'good';onClick:()=>void;title?:string}){return <button className={`${styles.metric} ${styles[tone]}`} onClick={onClick} title={title}><strong>{value}</strong><span>{label}</span></button>}
