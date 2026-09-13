import { HSE_FINDING_SCHEMA, normalizeStructuredDraft } from './contract.mjs';
import type { HseAIProvider } from './types';

export class OllamaHseProvider implements HseAIProvider {
  readonly name = 'ollama';
  readonly model: string;
  private readonly baseUrl: string;

  constructor(baseUrl: string, model = process.env.OLLAMA_HSE_MODEL || 'qwen3:4b') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async structureFieldEntry(text: string) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: HSE_FINDING_SCHEMA,
        options: { temperature: 0.1 },
        messages: [
          { role: 'system', content: 'Extraé un hallazgo HSE. No inventes normas ni vencimientos legales. due_text sólo si el usuario expresó una fecha o frase temporal.' },
          { role: 'user', content: text },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Ollama failed: ${response.status}`);
    const payload = await response.json() as { message?: { content?: string } };
    if (!payload.message?.content) throw new Error('Ollama returned empty content');
    return normalizeStructuredDraft(JSON.parse(payload.message.content) as Record<string, unknown>);
  }
}
