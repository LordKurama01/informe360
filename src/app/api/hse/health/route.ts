import { NextResponse } from 'next/server';
import { getHseAIStatus } from '@/services/ai/hse/router';
import { getWhatsAppChannelStatus } from '@/services/hse/channels/meta-whatsapp';

export const runtime = 'nodejs';

export async function GET() {
  const serverKeyConfigured = Boolean(
    process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
  const supabaseAdminConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && serverKeyConfigured
  );
  const providers = getHseAIStatus();
  const whatsapp = getWhatsAppChannelStatus();
  const enhancedAiConfigured = providers.some((provider) => provider.name !== 'manual');

  return NextResponse.json({
    ok: true,
    ready: supabaseAdminConfigured,
    product: 'HSE Copilot',
    capabilities: {
      serverData: supabaseAdminConfigured,
      enhancedAi: enhancedAiConfigured,
      whatsapp: whatsapp.configured,
    },
    providers,
    runtime: {
      supabaseAdminConfigured,
      whatsapp,
    },
  });
}
