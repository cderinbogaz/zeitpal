import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { TeamMembersList } from './_components/team-members-list';
import { TeamsManagement } from './_components/teams-management';


export default function TeamPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="common:routes.team" />}
        description="View your team members and their availability"
      />

      <PageBody>
        <div className="grid gap-6">
          <section>
            <TeamsManagement />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">
              <Trans i18nKey="common:accountMembers" defaults="Team Members" />
            </h2>
            <TeamMembersList />
          </section>
        </div>
      </PageBody>
    </>
  );
}
