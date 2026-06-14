import { LoginDesktop } from '@/blocks/auth/desktop/LoginDesktop';
import { LoginMobile } from '@/blocks/auth/mobile/LoginMobile';

export default function LoginPage() {
  return (
    <>
      <div className="desktop-only"><LoginDesktop /></div>
      <div className="mobile-only"><LoginMobile /></div>
    </>
  );
}
