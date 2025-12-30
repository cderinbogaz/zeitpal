import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { ApprovalRulesManagement } from './_components/approval-rules-management';


export default function AdminApprovalsPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="admin:approvalRules.title" />}
        description={<Trans i18nKey="admin:approvalRules.description" />}
      />

      <PageBody>
        <ApprovalRulesManagement />
      </PageBody>
    </>
  );
}
