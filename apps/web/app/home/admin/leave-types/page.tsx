import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { LeaveTypesManagement } from './_components/leave-types-management';


export default function AdminLeaveTypesPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="admin:leaveTypes.title" />}
        description={<Trans i18nKey="admin:leaveTypes.description" />}
      />

      <PageBody>
        <LeaveTypesManagement />
      </PageBody>
    </>
  );
}
