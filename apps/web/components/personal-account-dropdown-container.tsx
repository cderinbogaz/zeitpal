'use client';

import type { User } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Trans } from '@kit/ui/trans';

import { LogOut, Settings } from 'lucide-react';
import pathsConfig from '~/config/paths.config';

export function ProfileAccountDropdownContainer(props: {
  user?: User;
  showProfileName?: boolean;
  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };
}) {
  const { data: session } = useSession();
  const user = session?.user ?? props.user;

  if (!user) {
    return null;
  }

  const displayName = user.name ?? user.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-2 hover:bg-accent">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image ?? undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {props.showProfileName && (
          <div className="flex flex-col items-start text-sm">
            <span className="font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={pathsConfig.app.accountSettings} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <Trans i18nKey="account:settingsTab" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <Trans i18nKey="auth:signOut" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
