export function getGoogleAuthUrl() {
  // Para versión deploy inicial: botón de Google Auth preparado.
  // Con Supabase Auth: usar supabase.auth.signInWithOAuth({ provider: 'google' }) en cliente.
  return '/api/auth/google/start';
}
