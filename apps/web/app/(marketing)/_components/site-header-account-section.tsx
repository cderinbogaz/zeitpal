'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import type { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

import { LocalizedLink } from '~/components/localized-link';

import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';

import { LanguageSwitcher } from '~/components/language-switcher';
import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const ModeToggle = dynamic(
  () =>
    import('@kit/ui/mode-toggle').then((mod) => ({
      default: mod.ModeToggle,
    })),
  {
    ssr: false,
  },
);

const features = {
  enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

export function SiteHeaderAccountSection({
  user,
}: React.PropsWithChildren<{
  user: User | null;
}>) {
  if (!user) {
    return <AuthButtons />;
  }

  return <UserDropdown user={user} />;
}

function UserDropdown({ user }: { user: User }) {
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <div className="flex items-center gap-2">
      <LanguageSwitcher />

      <If condition={features.enableThemeToggle}>
        <ModeToggle />
      </If>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={pathsConfig.app.home}>
              <Trans i18nKey={'account:homePage'} defaults="Dashboard" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/' })}
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <Trans i18nKey={'auth:signOut'} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AuthButtons() {
  return (
    <div className={'flex space-x-2'}>
      <div className={'hidden space-x-0.5 md:flex'}>
        <LanguageSwitcher />

        <If condition={features.enableThemeToggle}>
          <ModeToggle />
        </If>

        <Button asChild variant={'ghost'}>
          <LocalizedLink href={pathsConfig.auth.signIn}>
            <Trans i18nKey={'auth:signIn'} />
          </LocalizedLink>
        </Button>
      </div>

      <Button asChild className="group" variant={'default'}>
        <LocalizedLink href={pathsConfig.auth.signUp}>
          <Trans i18nKey={'auth:signUp'} />
        </LocalizedLink>
      </Button>
    </div>
  );
}
