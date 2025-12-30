import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { PoliciesManagement } from './_components/policies-management';


export default function AdminPoliciesPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="admin:policies.title" />}
        description={<Trans i18nKey="admin:policies.description" />}
      />

      <PageBody>
        <PoliciesManagement />
      </PageBody>
    </>
  );
}
