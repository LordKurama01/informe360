import Link from 'next/link';
import { Card } from '@/shared/components/Card';
import styles from './InspectionsMapPage.module.css';

const demoLocations = [
  { company: 'Transporte El Norte', place: 'Base Junín', address: 'Ruta 7, Junín, Buenos Aires', status: 'seguimiento pendiente' },
  { company: 'Contratista Demo', place: 'Base Neuquén', address: 'Parque Industrial, Neuquén', status: 'reinspección sugerida' }
];

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function InspectionsMapPage() {
  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}><Link href="/app">← Panel</Link><strong>Inspecciones / Maps</strong></nav>
      <header className={styles.header}>
        <span>Google Maps preparado</span>
        <h1>Ubicación de visitas, bases e inspecciones.</h1>
        <p>V1 usa enlaces de Maps y guarda dirección. La integración avanzada queda preparada para geocoding/map preview sin frenar ventas.</p>
      </header>
      <section className={styles.grid}>{demoLocations.map(item => <Card key={item.address}><h3>{item.company}</h3><p>{item.place}</p><small>{item.address}</small><a href={mapsUrl(item.address)} target="_blank" rel="noreferrer">Abrir en Google Maps</a><b>{item.status}</b></Card>)}</section>
    </main>
  );
}
