import { NextResponse } from 'next/server';
import { getHseAIStatus } from '@/services/ai/hse/router';
import { getWhatsAppChannelStatus } from '@/services/hse/channels/meta-whatsapp';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: 'HSE Copilot',
    providers: getHseAIStatus(),
    runtime: {
      supabaseAdminConfigured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      whatsapp: getWhatsAppChannelStatus(),
    },
  });
}
