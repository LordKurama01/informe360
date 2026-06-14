import Link from 'next/link';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import styles from './LoginMobile.module.css';

export function LoginMobile() {
  return (
    <main className={styles.wrap}>
      <Card className={styles.card}>
        <span>Informe360</span>
        <h1>Ingresá a tu espacio</h1>
        <p>Usá Google para identificarte. En local podés entrar directo para revisar la app.</p>
        <a href="/api/auth/google/start"><Button full>Ingresar con Google</Button></a>
        <Link href="/app"><Button full variant="secondary">Entrar en modo local</Button></Link>
        <Link href="/"><Button full variant="ghost">Volver</Button></Link>
      </Card>
    </main>
  );
}
