import { NextResponse } from 'next/server';
import { getHseAIStatus } from '@/services/ai/hse/router';
import { getWhatsAppChannelStatus } from '@/services/hse/channels/meta-whatsapp';

export const runtime = 'nodejs';

export async function GET() {
  const serverKeyConfigured = Boolean(
    process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );

  return NextResponse.json({
    ok: true,
    product: 'HSE Copilot',
    providers: getHseAIStatus(),
    runtime: {
      supabaseAdminConfigured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && serverKeyConfigured
      ),
      whatsapp: getWhatsAppChannelStatus(),
    },
  });
}
