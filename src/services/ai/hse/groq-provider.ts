import { HSE_FINDING_SCHEMA, normalizeStructuredDraft } from './contract.mjs';
import type { HseAIProvider } from './types';

const SYSTEM_PROMPT = `Sos un extractor de hallazgos HSE. Convertí la observación del usuario en un registro operativo breve y concreto. No inventes leyes, normas, periodicidades ni vencimientos regulatorios. due_text sólo puede contener una fecha o frase temporal expresada explícitamente por el usuario; si no existe, debe ser null. action debe ser una acción correctiva práctica, no asesoramiento legal. Si faltan datos, usá null y bajá confidence.`;

export class GroqHseProvider implements HseAIProvider {
  readonly name = 'groq';
  readonly model: string;
  private readonly apiKey: string;

  constructor(apiKey: string, model = process.env.GROQ_HSE_MODEL || 'qwen/qwen3.8-27b') {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async completion(messages: unknown[]) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.1,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'hse_finding_draft', strict: true, schema: HSE_FINDING_SCHEMA },
        },
      }),
    });
    if (!response.ok) throw new Error(`Groq completion failed: ${response.status} ${await response.text()}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned no structured content');
    return normalizeStructuredDraft(JSON.parse(content) as Record<string, unknown>);
  }

  async structureFieldEntry(text: string) {
    return this.completion([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ]);
  }

  async transcribeAudio(file: File) {
    const body = new FormData();
    body.append('file', file, file.name || 'capture.m4a');
    body.append('model', process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo');
    body.append('language', 'es');
    body.append('response_format', 'json');
    body.append('temperature', '0');
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body,
    });
    if (!response.ok) throw new Error(`Groq transcription failed: ${response.status} ${await response.text()}`);
    const payload = await response.json() as { text?: string };
    if (!payload.text?.trim()) throw new Error('Groq returned empty transcription');
    return payload.text.trim();
  }

  async analyzeImage(file: File, note = '') {
    const bytes = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mime = file.type || 'image/jpeg';
    return this.completion([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analizá esta evidencia visual como posible hallazgo HSE. Describí sólo lo visible. Nota del usuario: ${note || '(sin nota)'}` },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${bytes}` } },
        ],
      },
    ]);
  }
}
