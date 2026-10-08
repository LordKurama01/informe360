'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './LandingDesktop.module.css';

const contractHref = `https://wa.me/?text=${encodeURIComponent(
  'Hola, quiero contratar Informe360 Plan Profesional.'
)}`;

function trackContract() {
  void fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'contract_click', path: '/' })
  }).catch(() => undefined);
}

export function LandingDesktop() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Informe360 inicio">
          <Image src="/brand/informe360-hse/mark-light.png" alt="" width={42} height={42} className={styles.logoImage} priority />
          <span className={styles.brandText}><strong>Informe360</strong><small>HSE Copilot</small></span>
        </Link>

        <nav className={styles.nav} aria-label="Navegacion principal">
          <a href="#resultado">Resultado</a>
          <a href="#flujo">Como funciona</a>
          <a href="#planes">Planes</a>
        </nav>

        <Link href="/login" className={styles.loginButton}>Ingresar</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>HSE para operaciones de campo</span>
          <h1>Inspecciones, evidencia y acciones en un solo flujo.</h1>
          <p className={styles.lead}>
            Registrás la recorrida, capturás evidencia y completás formularios desde el campo. Informe360 organiza hallazgos, acciones, trazabilidad y el informe final sin reconstruir la operación después.
          </p>

          <div id="planes" className={styles.planBox}>
            <div className={styles.planHeader}>
              <span>Plan Profesional</span>
              <strong>Sin setup pesado</strong>
            </div>

            <div className={styles.prices}>
              <div>
                <small>Mensual</small>
                <b>$39.999 ARS</b>
                <span>/ mes</span>
              </div>
              <div className={styles.annualDeal}>
                <small>Anual</small>
                <b>$350.000 ARS</b>
                <span>/ a&ntilde;o</span>
              </div>
            </div>

            <p>Incluye inspecciones HSE, formularios versionados, evidencia, hallazgos, acciones SMART, trazabilidad, PDF profesional y soporte inicial.</p>

            <a className={styles.contractButton} href={contractHref} target="_blank" rel="noreferrer" onClick={trackContract}>
              Contratar
            </a>
          </div>
        </div>

        <aside className={styles.mockup} aria-label="Resultado final de Informe360">
          <div className={styles.mockupTop}>
            <span>Resultado final</span>
            <strong>Informe360</strong>
          </div>

          <section className={styles.reportPreview}>
            <small>Inspección cerrada</small>
            <h2>Recorrida HSE · Área operativa</h2>
            <p>Hallazgos, evidencia, responsables, vencimientos y cierre técnico.</p>
          </section>

          <div className={styles.outputGrid}>
            <section>
              <small>Evidencia</small>
              <strong>3 evidencias</strong>
              <span>Registro trazable</span>
            </section>
            <section>
              <small>Acciones</small>
              <strong>2 SMART</strong>
              <span>Responsable y vencimiento</span>
            </section>
          </div>

          <section className={styles.deliveryBox}>
            <small>Entrega</small>
            <strong>PDF profesional + historial operativo</strong>
          </section>
        </aside>
      </section>

      <section id="resultado" className={styles.resultSection}>
        <div className={styles.sectionIntro}>
          <span className={styles.kicker}>Resultado</span>
          <h2>De la recorrida al cierre, sin reconstruir el informe a mano.</h2>
        </div>

        <div className={styles.benefits}>
          <article>
            <h3>Informe editable</h3>
            <p>Hallazgos y conclusiones listos para revisar y entregar.</p>
          </article>
          <article>
            <h3>PDF profesional</h3>
            <p>Salida consistente con evidencia, responsables y trazabilidad.</p>
          </article>
          <article>
            <h3>Acciones SMART</h3>
            <p>Responsable, prioridad, vencimiento y evidencia de cierre.</p>
          </article>
          <article>
            <h3>Seguimiento</h3>
            <p>Pendientes y próximos pasos visibles después de cada recorrida.</p>
          </article>
        </div>
      </section>

      <section id="flujo" className={styles.flowSection}>
        <div className={styles.sectionIntro}>
          <span className={styles.kicker}>Como funciona</span>
          <h2>Tres pasos. Un único registro operativo.</h2>
        </div>

        <div className={styles.steps}>
          <article>
            <span>01</span>
            <h3>Abrís la recorrida</h3>
            <p>Empresa, sitio, sector, fecha y tipo de inspección.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Subis evidencia</h3>
            <p>Fotos, notas, formularios y evidencia desde el teléfono.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Revisas y entregas</h3>
            <p>Informe editable, PDF profesional y acciones de seguimiento.</p>
          </article>
        </div>
      </section>

      <footer className={styles.footer}>
        <strong>Informe360</strong>
        <span>Informes tecnicos, PDF profesional y seguimiento operativo.</span>
        <Link href="/login">Ingresar</Link>
      </footer>
    </main>
  );
}
