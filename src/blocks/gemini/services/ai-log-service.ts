import { getSupabaseAdmin } from '@/services/supabase/server';

interface AiLogInput {
  userId?: string;
  provider: string;
  model: string;
  promptType: string;
  inputSummary: string;
  outputPreview: string;
  latencyMs: number;
  rawResponse: string;
}

export async function logAiGeneration(input: AiLogInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { stored: false, reason: 'Supabase not configured' };
  const { error } = await supabase.from('ai_generation_logs').insert({
    user_id: input.userId || null,
    provider: input.provider,
    model: input.model,
    prompt_type: input.promptType,
    input_summary: input.inputSummary,
    output_preview: input.outputPreview,
    latency_ms: input.latencyMs,
    raw_response: input.rawResponse
  });
  if (error) return { stored: false, reason: error.message };
  return { stored: true };
}
