import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';

import { LeaveRequestDetail } from './_components/leave-request-detail';


interface LeaveRequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaveRequestDetailPage({ params }: LeaveRequestDetailPageProps) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        title={<Trans i18nKey="leave:detail.title" />}
        description={<Trans i18nKey="leave:description" />}
      >
        <Button variant="outline" asChild>
          <Link href={pathsConfig.app.leave}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <Trans i18nKey="common:back" />
          </Link>
        </Button>
      </PageHeader>

      <PageBody>
        <LeaveRequestDetail id={id} />
      </PageBody>
    </>
  );
}
