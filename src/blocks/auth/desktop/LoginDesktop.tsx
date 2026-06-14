import Link from 'next/link';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import styles from './LoginDesktop.module.css';

export function LoginDesktop() {
  return (
    <main className={styles.wrap}>
      <Card className={styles.card}>
        <span>Informe360 AI Agent</span>
        <h1>Ingresá a tu espacio de trabajo</h1>
        <p>El acceso con Google identifica al usuario. Los permisos de Calendar se solicitan aparte, solo cuando se agenda seguimiento.</p>
        <a href="/api/auth/google/start"><Button full>Ingresar con Google</Button></a>
        <Link href="/app"><Button full variant="secondary">Entrar a la app en modo local</Button></Link>
        <Link href="/"><Button full variant="ghost">Volver a la landing</Button></Link>
      </Card>
    </main>
  );
}
