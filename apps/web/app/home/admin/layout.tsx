import type { ReactNode } from 'react';

import { redirect } from 'next/navigation';

import { requireOnboardingComplete } from '~/lib/server/check-onboarding';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { role } = await requireOnboardingComplete();

  if (!['admin', 'manager', 'hr'].includes(role)) {
    redirect('/home');
  }

  return <>{children}</>;
}
