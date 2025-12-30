import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { TeamCalendar } from './_components/team-calendar';


export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title={<Trans i18nKey="leave:calendar.title" />}
        description={<Trans i18nKey="leave:calendar.description" />}
      />

      <PageBody>
        <TeamCalendar />
      </PageBody>
    </>
  );
}
