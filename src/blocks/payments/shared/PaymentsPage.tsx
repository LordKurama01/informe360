import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import { ButtonLink } from '@/shared/components/Button';
import { founderOffer } from '@/config/commercial-offer';
import { moneyARS } from '@/shared/utils/format';
import styles from './PaymentsPage.module.css';

export function PaymentsPage() {
  return <main className={styles.wrap}>
    <nav><Link href="/app">← Centro operativo</Link><strong>Plan y pagos</strong></nav>
    <header><span>Acceso fundador</span><h1>Plan actual y beneficios</h1><p>Oferta simple para validar comercialmente sin sobrecargar el producto.</p></header>
    <section className={styles.grid}>
      <Card className={styles.price}><span>Plan activo</span><h2>{founderOffer.name}</h2><strong>{moneyARS(founderOffer.priceARS)} / mes</strong><p>Precio fundador hasta diciembre 2026 para quienes ingresen antes del cierre comercial.</p><ButtonLink href="/app" variant="secondary">Volver al centro operativo</ButtonLink></Card>
      <Card><h3>Incluye</h3><ul>{founderOffer.included.slice(0,7).map(item => <li key={item}>{item}</li>)}</ul></Card>
      <Card><h3>Estado</h3><p>Cuenta preparada para acceso fundador y validación comercial inicial.</p><p className={styles.ok}>Cuenta en modo fundador.</p></Card>
    </section>
  </main>;
}
