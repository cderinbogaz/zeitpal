
import { use } from 'react';

import { PageBody, PageHeader } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { AccountSettings } from './_components/account-settings';
import { NotificationSettings } from './_components/notification-settings';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:settingsTab');

  return {
    title,
  };
};

function PersonalAccountSettingsPage() {
  const user = use(requireUserInServerComponent());
  const userId = user.id ?? '';

  if (!userId) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={<Trans i18nKey="common:settingsTabLabel" />}
        description={<Trans i18nKey="common:settingsTabDescription" />}
      />
      <PageBody>
        <div className="flex w-full flex-1 flex-col space-y-8 lg:max-w-2xl">
          <AccountSettings
            userId={userId}
            user={{
              id: userId,
              name: user.name ?? null,
              email: user.email ?? null,
              image: user.image ?? null,
            }}
          />
          <NotificationSettings userId={userId} />
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(PersonalAccountSettingsPage);
