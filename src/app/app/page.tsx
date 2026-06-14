import { UserDashboardDesktop } from '@/blocks/user-dashboard/desktop/UserDashboardDesktop';
import { UserDashboardMobile } from '@/blocks/user-dashboard/mobile/UserDashboardMobile';

export default function AppHomePage() {
  return (
    <>
      <div className="desktop-only"><UserDashboardDesktop /></div>
      <div className="mobile-only"><UserDashboardMobile /></div>
    </>
  );
}
