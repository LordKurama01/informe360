import { ControlDashboardDesktop } from '@/blocks/control/desktop/ControlDashboardDesktop';
import { ControlDashboardMobile } from '@/blocks/control/mobile/ControlDashboardMobile';
export default function ControlPage() {
  return (
    <>
      <div className="desktop-only"><ControlDashboardDesktop /></div>
      <div className="mobile-only"><ControlDashboardMobile /></div>
    </>
  );
}
