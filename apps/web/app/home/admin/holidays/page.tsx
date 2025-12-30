import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { HolidaysManagement } from './_components/holidays-management';


export default function AdminHolidaysPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="admin:holidays.title" />}
        description={<Trans i18nKey="admin:holidays.description" />}
      />

      <PageBody>
        <HolidaysManagement />
      </PageBody>
    </>
  );
}
