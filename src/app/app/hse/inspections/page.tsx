'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getHseWorkspace, type HseWorkspace } from '@/services/hse/browser';
import { listFormRuns, listFormTemplates, type HseFormRunRow, type HseFormTemplate } from '@/services/hse/forms-browser';
import { getBrowserSupabase } from '@/services/supabase/browser';

export default function HseInspectionsPage(){
  const[workspace,setWorkspace]=useState<HseWorkspace|null>(null);const[templates,setTemplates]=useState<HseFormTemplate[]>([]);const[runs,setRuns]=useState<HseFormRunRow[]>([]);const[busy,setBusy]=useState(false);const[error,setError]=useState<string|null>(null);
  const load=useCallback(async()=>{setError(null);const ws=await getHseWorkspace();setWorkspace(ws);if(!ws)return;const all=await listFormTemplates(ws);const inspections=all.filter(item=>item.category==='inspection');setTemplates(inspections);const recent=await listFormRuns(ws);setRuns(recent.filter(row=>inspections.some(template=>template.id===row.template_id)));},[]);
  useEffect(()=>{const timer=setTimeout(()=>void load().catch(e=>setError(e instanceof Error?e.message:'Error')),0);return()=>clearTimeout(timer);},[load]);
  async function seed(){if(!workspace)return;setBusy(true);try{const{data,error:rpcError}=await getBrowserSupabase().rpc('seed_hse_inspection_templates',{p_organization_id:workspace.organizationId});if(rpcError)throw rpcError;await load();alert(Number(data||0)?`Se agregaron ${data} checklists.`:'La biblioteca estándar ya estaba cargada.');}catch(e){setError(e instanceof Error?e.message:'No se pudo preparar la biblioteca');}finally{setBusy(false);}}
  const names=new Map(templates.map(item=>[item.id,item.name]));
  return <main style={{minHeight:'100vh',background:'#f4f7f6',padding:'36px 24px',color:'#102a2a'}}><div style={{maxWidth:1100,margin:'0 auto',display:'grid',gap:18}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:11,fontWeight:900,color:'#0f766e',letterSpacing:1.4}}>INFORME360 · HSE CONTROL</div><h1 style={{margin:'4px 0 0',fontSize:34}}>Inspecciones y checklists</h1><p style={{color:'#64748b',margin:'6px 0 0'}}>Plantillas versionadas, evidencia y no conformidades vinculadas a hallazgos.</p></div><div style={{display:'flex',gap:8}}><Link href="/app/hse/forms" style={ghost}>Plantillas</Link><Link href="/app/hse" style={ghost}>Command Center</Link></div></header>
    {error?<div style={{...card,borderColor:'#fecaca',background:'#fef2f2',color:'#991b1b'}}>{error}</div>:null}
    <section style={{...card,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><b>Biblioteca estándar</b><div style={{fontSize:12,color:'#64748b',marginTop:3}}>Trabajo en altura · Espacio confinado · Matafuegos · Equipo de rescate/Pirosalva</div></div><button disabled={busy} onClick={()=>void seed()} style={primary}>{busy?'Preparando…':'Agregar estándares'}</button></section>
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>{templates.map(item=><article key={item.id} style={card}><div style={{fontSize:10,fontWeight:900,color:'#0f766e'}}>INSPECCIÓN · v{item.publishedVersion?.version||'–'}</div><h3 style={{margin:'6px 0'}}>{item.name}</h3><p style={{fontSize:12,color:'#64748b',lineHeight:1.5}}>{item.description}</p><span style={{fontSize:10,fontWeight:900,color:'#047857'}}>{item.status.toUpperCase()}</span></article>)}{!templates.length?<article style={card}>No hay checklists publicados todavía.</article>:null}</section>
    <section style={card}><h2 style={{marginTop:0}}>Últimas ejecuciones</h2><div style={{display:'grid',gap:8}}>{runs.map(run=><div key={run.id} style={{display:'flex',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid #eef2f1'}}><div><b>{names.get(run.template_id)||'Inspección'}</b><div style={{fontSize:11,color:'#64748b'}}>{new Date(run.started_at).toLocaleString('es-AR')}</div></div><span style={{fontSize:10,fontWeight:900,color:run.status==='submitted'?'#047857':'#b45309'}}>{run.status.toUpperCase()}</span></div>)}{!runs.length?<div style={{color:'#64748b'}}>Todavía no hay inspecciones ejecutadas.</div>:null}</div></section>
  </div></main>;
}
const card:React.CSSProperties={background:'#fff',border:'1px solid #dbe4e2',borderRadius:17,padding:17};
const primary:React.CSSProperties={border:0,borderRadius:11,padding:'10px 14px',background:'#0f766e',color:'#fff',fontWeight:850,cursor:'pointer'};
const ghost:React.CSSProperties={border:'1px solid #cbd5e1',borderRadius:10,padding:'9px 12px',background:'#fff',fontWeight:750,color:'#334155',textDecoration:'none'};
