import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { requireOnboardingComplete } from '~/lib/server/check-onboarding';

import { LeaveBalanceOverview } from './_components/leave-balance-overview';
import { QuickActions } from './_components/quick-actions';
import { RecentRequests } from './_components/recent-requests';
import { TeamAbsences } from './_components/team-absences';


export default async function HomePage() {
  // Ensure user has completed onboarding (has an organization)
  // This will redirect to /onboarding if not
  await requireOnboardingComplete();

  return (
    <>
      <PageHeader
        title={<Trans i18nKey="leave:dashboard.title" />}
        description={<Trans i18nKey="leave:dashboard.description" />}
      >
        <QuickActions variant="header" />
      </PageHeader>

      <PageBody>
        <div className="grid gap-6">
          {/* Leave Balance Cards */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              <Trans i18nKey="leave:dashboard.yourBalance" />
            </h2>
            <LeaveBalanceOverview />
          </section>

          {/* Recent Requests */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              <Trans i18nKey="leave:dashboard.recentRequests" />
            </h2>
            <RecentRequests />
          </section>

          {/* Team Absences */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              <Trans i18nKey="leave:dashboard.teamAbsences" />
            </h2>
            <TeamAbsences />
          </section>
        </div>
      </PageBody>
    </>
  );
}
