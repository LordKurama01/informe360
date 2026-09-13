import { GroqHseProvider } from './groq-provider';
import { ManualHseProvider } from './manual-provider';
import { OllamaHseProvider } from './ollama-provider';
import type { AIProviderResult, HseAIProvider, TranscriptionResult } from './types';

function configuredProviders(): HseAIProvider[] {
  const providers: HseAIProvider[] = [];
  if (process.env.GROQ_API_KEY) providers.push(new GroqHseProvider(process.env.GROQ_API_KEY));
  if (process.env.OLLAMA_BASE_URL) providers.push(new OllamaHseProvider(process.env.OLLAMA_BASE_URL));
  providers.push(new ManualHseProvider());
  return providers;
}

export function getHseAIStatus() {
  return configuredProviders().map((provider) => ({ name: provider.name, model: provider.model, transcription: Boolean(provider.transcribeAudio), vision: Boolean(provider.analyzeImage) }));
}

export async function structureFieldEntry(text: string): Promise<AIProviderResult> {
  let lastError: unknown;
  for (const provider of configuredProviders()) {
    try {
      const draft = await provider.structureFieldEntry(text);
      return { draft, provider: provider.name, model: provider.model };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('No HSE AI provider available');
}

export async function transcribeAudio(file: File): Promise<TranscriptionResult> {
  let lastError: unknown;
  for (const provider of configuredProviders()) {
    if (!provider.transcribeAudio) continue;
    try {
      const text = await provider.transcribeAudio(file);
      return { text, provider: provider.name, model: provider.model };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('No transcription provider configured');
}

export async function analyzeImage(file: File, note?: string): Promise<AIProviderResult> {
  let lastError: unknown;
  for (const provider of configuredProviders()) {
    if (!provider.analyzeImage) continue;
    try {
      const draft = await provider.analyzeImage(file, note);
      return { draft, provider: provider.name, model: provider.model };
    } catch (error) {
      lastError = error;
    }
  }
  const manual = new ManualHseProvider();
  return { draft: await manual.structureFieldEntry(note || 'Evidencia fotográfica pendiente de revisar'), provider: manual.name, model: manual.model };
}
