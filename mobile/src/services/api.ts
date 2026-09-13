import { supabase } from '../lib/supabase';
import type { StructuredFindingDraft } from '../types/hse';

const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
async function token() { const { data } = await supabase.auth.getSession(); return data.session?.access_token || null; }

async function authorized(path: string, init: RequestInit) {
  if (!baseUrl) throw new Error('AI backend no configurado. La captura queda disponible para completar manualmente.');
  const accessToken = await token();
  if (!accessToken) throw new Error('Sesión vencida');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Backend error ${response.status}`);
  return payload;
}

export async function structureText(text: string): Promise<{ draft: StructuredFindingDraft; due_at: string | null; provider: string }> {
  return authorized('/api/hse/structure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
}

function multipartFile(uri: string, type: string, name: string) { return { uri, type, name } as unknown as Blob; }
export async function transcribeAudio(uri: string) { const body = new FormData(); body.append('file', multipartFile(uri, 'audio/mp4', 'capture.m4a')); return authorized('/api/hse/transcribe', { method: 'POST', body }) as Promise<{ text: string; provider: string }> ; }
export async function analyzeImage(uri: string, note: string) { const body = new FormData(); body.append('file', multipartFile(uri, 'image/jpeg', 'capture.jpg')); body.append('note', note); return authorized('/api/hse/analyze-image', { method: 'POST', body }) as Promise<{ draft: StructuredFindingDraft; provider: string }> ; }

export function manualDraft(text: string): StructuredFindingDraft {
  const clean = text.trim();
  return { title: clean.split(/[.!?\n]/).find(Boolean)?.trim().slice(0, 120) || 'Hallazgo pendiente de completar', description: clean || null, category: null, severity: 'medium', location_text: null, element_text: null, action: null, responsible_text: null, due_text: null, confidence: 0.1 };
}
