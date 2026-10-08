import { redirect } from 'next/navigation';
import { LandingDesktop } from '@/blocks/landing/desktop/LandingDesktop';
import { LandingMobile } from '@/blocks/landing/mobile/LandingMobile';

export default function HomePage() {
  // Dedicated HSE web QA instances open the desktop command center, not the generic landing.
  // Production and other deployments keep the original public landing.
  if (process.env.HSE_WEB_QA_MODE === '1') redirect('/app/hse');
  return (
    <>
      <div className="desktop-only"><LandingDesktop /></div>
      <div className="mobile-only"><LandingMobile /></div>
    </>
  );
}
