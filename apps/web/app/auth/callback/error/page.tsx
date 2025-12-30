
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';

interface AuthCallbackErrorPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

async function AuthCallbackErrorPage(props: AuthCallbackErrorPageProps) {
  const { error } = await props.searchParams;
  const signInPath = pathsConfig.auth.signIn;

  return (
    <div className={'flex flex-col space-y-4 py-4'}>
      <Alert variant={'destructive'}>
        <AlertTitle>
          <Trans i18nKey={'auth:authenticationErrorAlertHeading'} />
        </AlertTitle>

        <AlertDescription>
          <Trans i18nKey={error ?? 'auth:authenticationErrorAlertBody'} />
        </AlertDescription>
      </Alert>

      <Button className={'w-full'} asChild>
        <Link href={signInPath}>
          <Trans i18nKey={'auth:signIn'} />
        </Link>
      </Button>
    </div>
  );
}

export default withI18n(AuthCallbackErrorPage);
