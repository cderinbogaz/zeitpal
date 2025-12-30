import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { MembersManagement } from './_components/members-management';


export default function AdminMembersPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="admin:members.title" />}
        description={<Trans i18nKey="admin:members.description" />}
      />

      <PageBody>
        <MembersManagement />
      </PageBody>
    </>
  );
}
