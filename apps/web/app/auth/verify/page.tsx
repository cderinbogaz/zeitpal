
import Link from 'next/link';

import { Mail } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:verifyEmail'),
  };
};

async function VerifyPage() {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <Mail className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          <Trans i18nKey={'auth:checkYourEmail'} />
        </h1>
        <p className="text-muted-foreground">
          <Trans i18nKey={'auth:checkYourEmailDescription'} />
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Button asChild variant="outline">
          <Link href={pathsConfig.auth.signIn}>
            <Trans i18nKey={'auth:backToSignIn'} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default withI18n(VerifyPage);
