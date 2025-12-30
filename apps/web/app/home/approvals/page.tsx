import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { ApprovalQueue } from './_components/approval-queue';


export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="leave:approvals.title" />}
        description={<Trans i18nKey="leave:approvals.description" />}
      />

      <PageBody>
        <ApprovalQueue />
      </PageBody>
    </>
  );
}
