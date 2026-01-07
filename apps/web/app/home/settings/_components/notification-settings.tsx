'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@kit/ui/form';
import { Separator } from '@kit/ui/separator';
import { Skeleton } from '@kit/ui/skeleton';
import { Switch } from '@kit/ui/switch';
import { Trans } from '@kit/ui/trans';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

// Notification preferences schema
const notificationPreferencesSchema = z.object({
  emailOnApproval: z.boolean(),
  emailOnRejection: z.boolean(),
  emailOnRequestSubmitted: z.boolean(),
  emailOnTeamAbsence: z.boolean(),
  emailDigestFrequency: z.enum(['immediate', 'daily', 'weekly', 'none']),
  emailOnApprovalNeeded: z.boolean(),
  emailOnUpcomingLeave: z.boolean(),
});

type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

const defaultPreferences: NotificationPreferences = {
  emailOnApproval: true,
  emailOnRejection: true,
  emailOnRequestSubmitted: true,
  emailOnTeamAbsence: false,
  emailDigestFrequency: 'immediate',
  emailOnApprovalNeeded: true,
  emailOnUpcomingLeave: true,
};

interface NotificationSettingsProps {
  userId: string;
}

export function NotificationSettings({ userId: _userId }: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<NotificationPreferences>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: defaultPreferences,
  });

  // Fetch user preferences
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.notificationPreferences) {
            form.reset({
              ...defaultPreferences,
              ...data.notificationPreferences,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, [form]);

  const onSubmit = async (data: NotificationPreferences) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPreferences: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <NotificationSettingsSkeleton />;
  }

  const notificationItemClassName =
    'flex flex-row items-center justify-between gap-x-4 rounded-lg border p-4';

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="account:notifications.title" defaults="Notifications" />
            </CardTitle>
            <CardDescription>
              <Trans i18nKey="account:notifications.description" defaults="Manage how you receive notifications about your leave requests" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Digest Frequency */}
            <FormField
              control={form.control}
              name="emailDigestFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="account:notifications.digestFrequency" defaults="Email Frequency" />
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="immediate">
                        <Trans i18nKey="account:notifications.immediate" defaults="Immediate" />
                      </SelectItem>
                      <SelectItem value="daily">
                        <Trans i18nKey="account:notifications.daily" defaults="Daily digest" />
                      </SelectItem>
                      <SelectItem value="weekly">
                        <Trans i18nKey="account:notifications.weekly" defaults="Weekly digest" />
                      </SelectItem>
                      <SelectItem value="none">
                        <Trans i18nKey="account:notifications.none" defaults="No emails" />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <Trans i18nKey="account:notifications.digestFrequencyHelp" defaults="Choose how often you want to receive email notifications" />
                  </FormDescription>
                </FormItem>
              )}
            />

            <Separator />

            {/* Leave Request Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                <Trans i18nKey="account:notifications.leaveRequests" defaults="Leave Requests" />
              </h4>

              <FormField
                control={form.control}
                name="emailOnApproval"
                render={({ field }) => (
                  <FormItem className={notificationItemClassName}>
                    <div className="flex-1 space-y-0.5 text-left">
                      <FormLabel className="text-base">
                        <Trans i18nKey="account:notifications.onApproval" defaults="Request approved" />
                      </FormLabel>
                      <FormDescription>
                        <Trans i18nKey="account:notifications.onApprovalHelp" defaults="Get notified when your leave request is approved" />
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailOnRejection"
                render={({ field }) => (
                  <FormItem className={notificationItemClassName}>
                    <div className="flex-1 space-y-0.5 text-left">
                      <FormLabel className="text-base">
                        <Trans i18nKey="account:notifications.onRejection" defaults="Request rejected" />
                      </FormLabel>
                      <FormDescription>
                        <Trans i18nKey="account:notifications.onRejectionHelp" defaults="Get notified when your leave request is rejected" />
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailOnRequestSubmitted"
                render={({ field }) => (
                  <FormItem className={notificationItemClassName}>
                    <div className="flex-1 space-y-0.5 text-left">
                      <FormLabel className="text-base">
                        <Trans i18nKey="account:notifications.onSubmitted" defaults="Request confirmation" />
                      </FormLabel>
                      <FormDescription>
                        <Trans i18nKey="account:notifications.onSubmittedHelp" defaults="Get a confirmation email when you submit a leave request" />
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailOnUpcomingLeave"
                render={({ field }) => (
                  <FormItem className={notificationItemClassName}>
                    <div className="flex-1 space-y-0.5 text-left">
                      <FormLabel className="text-base">
                        <Trans i18nKey="account:notifications.onUpcoming" defaults="Upcoming leave reminder" />
                      </FormLabel>
                      <FormDescription>
                        <Trans i18nKey="account:notifications.onUpcomingHelp" defaults="Get a reminder before your approved leave starts" />
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Manager Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                <Trans i18nKey="account:notifications.managerNotifications" defaults="Manager Notifications" />
              </h4>

              <FormField
                control={form.control}
                name="emailOnApprovalNeeded"
                render={({ field }) => (
                  <FormItem className={notificationItemClassName}>
                    <div className="flex-1 space-y-0.5 text-left">
                      <FormLabel className="text-base">
                        <Trans i18nKey="account:notifications.onApprovalNeeded" defaults="Pending approvals" />
                      </FormLabel>
                      <FormDescription>
                        <Trans i18nKey="account:notifications.onApprovalNeededHelp" defaults="Get notified when team members submit requests for your approval" />
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Team Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                <Trans i18nKey="account:notifications.teamNotifications" defaults="Team Notifications" />
              </h4>

              <FormField
                control={form.control}
                name="emailOnTeamAbsence"
                render={({ field }) => (
                  <FormItem className={notificationItemClassName}>
                    <div className="flex-1 space-y-0.5 text-left">
                      <FormLabel className="text-base">
                        <Trans i18nKey="account:notifications.onTeamAbsence" defaults="Team absences" />
                      </FormLabel>
                      <FormDescription>
                        <Trans i18nKey="account:notifications.onTeamAbsenceHelp" defaults="Get notified when team members will be absent" />
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Trans i18nKey="account:notifications.saving" defaults="Saving..." />
            ) : (
              <Trans i18nKey="account:notifications.save" defaults="Save preferences" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function NotificationSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
