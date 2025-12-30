import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { LeaveRequestForm } from './_components/leave-request-form';


export default function LeaveRequestPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="leave:request.title" />}
        description={<Trans i18nKey="leave:request.description" />}
      />

      <PageBody>
        <div className="mx-auto max-w-2xl">
          <LeaveRequestForm />
        </div>
      </PageBody>
    </>
  );
}
