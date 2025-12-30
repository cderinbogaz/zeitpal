import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { LeaveBalanceOverview } from '../_components/leave-balance-overview';
import { LeaveRequestsList } from './_components/leave-requests-list';
import { NewLeaveRequestDialog } from './_components/new-leave-request-dialog';


export default function LeavePage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="leave:title" />}
        description={<Trans i18nKey="leave:description" />}
      >
        <NewLeaveRequestDialog />
      </PageHeader>

      <PageBody>
        <div className="grid gap-6">
          {/* Leave Balance */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              <Trans i18nKey="leave:balance.title" />
            </h2>
            <LeaveBalanceOverview />
          </section>

          {/* Leave Requests */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              <Trans i18nKey="leave:dashboard.recentRequests" />
            </h2>
            <LeaveRequestsList />
          </section>
        </div>
      </PageBody>
    </>
  );
}
