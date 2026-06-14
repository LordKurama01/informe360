import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import { evidenceCategories } from '../config/evidence-categories';
import styles from './XPrizeEvidencePage.module.css';

const minimumTargets = [
  ['Usuarios pagos mínimos', '10'],
  ['Ingresos mensuales mínimos', '$300.000 ARS'],
  ['Informes generados', '20'],
  ['PDFs exportados', '20'],
  ['Acciones SMART', '60'],
  ['Eventos/calendario', '20'],
  ['Logs IA', '50+'],
  ['Testimonios autorizados', '5'],
  ['Ahorro de tiempo', '30% a 50%']
];

export function XPrizeEvidencePage(){return <main className={styles.wrap}><nav><Link href="/control">← Control</Link><strong>Evidencia interna</strong></nav><h1>Evidencia comercial y operativa</h1><p className={styles.lead}>Métricas comerciales, uso real, reportes generados, logs de IA, pagos, PDFs y testimonios.</p><section className={styles.targets}>{minimumTargets.map(([k,v])=><Card key={k}><b>{k}</b><span>{v}</span></Card>)}</section><div className={styles.grid}>{evidenceCategories.map(c=><Card key={c}><h3>{c}</h3><p>Conectar a Supabase y carpeta evidence para registrar información verificable.</p></Card>)}</div></main>}
