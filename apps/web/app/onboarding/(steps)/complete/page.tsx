'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
  MapPin,
  PartyPopper,
  Settings2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { useOnboarding } from '~/lib/contexts/onboarding-context';
import { COUNTRIES } from '~/lib/types';
import { getCsrfToken } from '~/lib/utils/csrf';

import { OnboardingProgress } from '../../_components/onboarding-progress';

export default function CompletePage() {
  const router = useRouter();
  const { state, completeOnboarding } = useOnboarding();
  const [isCreating, setIsCreating] = useState(false);

  const { data } = state;

  const countryConfig = COUNTRIES.find((c) => c.code === data.country);

  const handleComplete = async () => {
    setIsCreating(true);
    try {
      // Create organization via API
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          // Profile
          displayName: data.displayName,
          timezone: data.timezone,
          locale: data.locale,
          // Organization
          organizationName: data.organizationName,
          organizationSlug: data.organizationSlug,
          country: data.country,
          region: data.region,
          // Policy
          defaultVacationDays: data.defaultVacationDays,
          carryoverEnabled: data.carryoverEnabled,
          carryoverMaxDays: data.carryoverMaxDays,
          // Team (optional)
          teamName: data.skipTeam ? null : data.teamName,
          teamColor: data.skipTeam ? null : data.teamColor,
          // Invites (optional)
          invites: data.skipInvites ? [] : data.invites,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete setup');
      }

      await completeOnboarding();
      toast.success('Organization created successfully!');
      router.push('/home');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to complete setup'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleGoToDashboard = () => {
    handleComplete();
  };

  const handleConfigureLeaveTypes = async () => {
    await handleComplete();
    router.push('/home/admin/leave-types');
  };

  const handleInviteMore = async () => {
    await handleComplete();
    router.push('/home/admin/members');
  };

  // Summary items
  const summaryItems = [
    {
      icon: Building2,
      label: 'Organization',
      value: data.organizationName || 'Not set',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: data.region
        ? `${data.region}, ${countryConfig?.nameEn || data.country}`
        : countryConfig?.nameEn || 'Not set',
    },
    {
      icon: Calendar,
      label: 'Vacation Days',
      value: data.defaultVacationDays
        ? `${data.defaultVacationDays} days/year`
        : 'Not set',
    },
    {
      icon: Users,
      label: 'Team',
      value: data.skipTeam
        ? 'Skipped'
        : data.teamName || 'Not created',
    },
    {
      icon: UserPlus,
      label: 'Invites',
      value: data.skipInvites
        ? 'Skipped'
        : data.invites?.length
          ? `${data.invites.length} team member${data.invites.length > 1 ? 's' : ''}`
          : 'None',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-4">
          <OnboardingProgress />

          <div className="pt-4 text-center">
            {/* Celebration icon */}
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <PartyPopper className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>

            <CardTitle className="text-3xl">You&apos;re All Set!</CardTitle>
            <CardDescription className="mt-2 text-base">
              Your organization is ready to go
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="rounded-lg border bg-muted/30">
            <div className="border-b px-4 py-3">
              <h3 className="font-medium">Summary</h3>
            </div>
            <div className="divide-y">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Primary action */}
          <Button
            onClick={handleGoToDashboard}
            size="lg"
            className="w-full text-base"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating your organization...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Go to Dashboard
              </>
            )}
          </Button>

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleConfigureLeaveTypes}
              disabled={isCreating}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Configure Leave Types
            </Button>
            <Button
              variant="outline"
              onClick={handleInviteMore}
              disabled={isCreating}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite More Members
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
