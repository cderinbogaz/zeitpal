import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { OrganizationSettingsForm } from './_components/organization-settings-form';


export default function AdminOrganizationPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="admin:organization.title" />}
        description={<Trans i18nKey="admin:organization.description" />}
      />

      <PageBody>
        <div className="mx-auto max-w-2xl">
          <OrganizationSettingsForm />
        </div>
      </PageBody>
    </>
  );
}
