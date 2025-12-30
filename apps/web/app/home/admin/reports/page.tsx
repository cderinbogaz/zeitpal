import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { ReportsDashboard } from './_components/reports-dashboard';


export default function AdminReportsPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="admin:reports.title" />}
        description={<Trans i18nKey="admin:reports.description" />}
      />

      <PageBody>
        <ReportsDashboard />
      </PageBody>
    </>
  );
}
