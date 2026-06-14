import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import styles from './DecisionTrailPage.module.css';

const steps = [
  ['Agente de entrada', 'Ordena observaciones, fotos, audio transcripto y checklist en un caso técnico.'],
  ['Agente técnico', 'Detecta hallazgos, causas probables, riesgos y prioridad sugerida.'],
  ['Agente normativo', 'Relaciona normativa para revisión profesional del responsable técnico.'],
  ['Agente SMART', 'Convierte hallazgos en acciones con responsable, fecha de cierre y evidencia.'],
  ['Agente calendario', 'Propone vencimientos, recordatorios y reinspecciones.'],
  ['Agente ejecutivo', 'Resume el informe para cliente, gerencia o responsable operativo.'],
  ['Agente evidencia', 'Registra input, output, edición del usuario, PDF y tiempo ahorrado.']
];

export function DecisionTrailPage() {
  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}><Link href="/control">← Control</Link><strong>Trazabilidad de IA</strong></nav>
      <header className={styles.header}>
        <span>Agentes Gemini</span>
        <h1>Trazabilidad de decisión</h1>
        <p>Registro de entradas, agentes ejecutados, recomendaciones, acciones generadas y edición del usuario.</p>
      </header>
      <section className={styles.timeline}>{steps.map(([name, text], i) => <Card key={name}><b>{i+1}. {name}</b><p>{text}</p></Card>)}</section>
    </main>
  );
}
