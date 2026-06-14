import { LandingDesktop } from '@/blocks/landing/desktop/LandingDesktop';
import { LandingMobile } from '@/blocks/landing/mobile/LandingMobile';

export default function HomePage() {
  return (
    <>
      <div className="desktop-only"><LandingDesktop /></div>
      <div className="mobile-only"><LandingMobile /></div>
    </>
  );
}
