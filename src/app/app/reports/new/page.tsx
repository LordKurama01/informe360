import { NewReportDesktop } from '@/blocks/reports/desktop/NewReportDesktop';
import { NewReportMobile } from '@/blocks/reports/mobile/NewReportMobile';

export default function NewReportPage() {
  return (
    <>
      <div className="desktop-only"><NewReportDesktop /></div>
      <div className="mobile-only"><NewReportMobile /></div>
    </>
  );
}
