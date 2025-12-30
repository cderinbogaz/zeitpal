'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { If } from '@kit/ui/if';
import { Input } from '@kit/ui/input';
import { LanguageSelector } from '@kit/ui/language-selector';
import { Skeleton } from '@kit/ui/skeleton';
import { Trans } from '@kit/ui/trans';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AccountSettingsProps {
  userId: string;
  user: UserData;
}

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export function AccountSettings({ userId: _userId, user }: AccountSettingsProps) {
  const supportsLanguageSelection = useSupportMultiLanguage();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || '',
    },
  });

  const onSubmit = async (data: UpdateProfileData) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="flex w-full flex-col space-y-4">
      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans i18nKey="account:accountImage" />
          </CardTitle>
          <CardDescription>
            <Trans i18nKey="account:accountImageDescription" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image || undefined} alt={user.name || 'Profile'} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              <Trans i18nKey="account:profilePictureSubheading" defaults="Your profile picture is synced from your authentication provider (Google or Microsoft)." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Name */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans i18nKey="account:name" />
          </CardTitle>
          <CardDescription>
            <Trans i18nKey="account:nameDescription" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans i18nKey="account:name" />
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <Trans i18nKey="account:updateProfileLoading" />
                ) : (
                  <Trans i18nKey="account:updateProfileSubmitLabel" />
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <If condition={supportsLanguageSelection}>
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="account:language" />
            </CardTitle>
            <CardDescription>
              <Trans i18nKey="account:languageDescription" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSelector />
          </CardContent>
        </Card>
      </If>

      {/* Email (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans i18nKey="account:updateEmailCardTitle" />
          </CardTitle>
          <CardDescription>
            <Trans i18nKey="account:updateEmailCardDescription" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              <Trans i18nKey="account:emailLabel" />
            </p>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              <Trans
                i18nKey="account:emailManagedByProvider"
                defaults="Your email is managed by your authentication provider and cannot be changed here."
              />
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AccountSettingsSkeleton() {
  return (
    <div className="flex w-full flex-col space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}

function useSupportMultiLanguage() {
  const { i18n } = useTranslation();
  const langs = (i18n?.options?.supportedLngs as string[]) ?? [];
  const supportedLangs = langs.filter((lang) => lang !== 'cimode');
  return supportedLangs.length > 1;
}
