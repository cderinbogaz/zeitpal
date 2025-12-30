'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Building2, UserPlus } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { cn } from '@kit/ui/utils';

type OnboardingOption = 'create' | 'join' | null;

export function OnboardingOptions() {
  const [selectedOption, setSelectedOption] = useState<OnboardingOption>(null);
  const [inviteCode, setInviteCode] = useState('');

  return (
    <div className="space-y-6">
      {/* Option Cards */}
      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => setSelectedOption('create')}
          className={cn(
            'flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50',
            selectedOption === 'create' && 'border-primary bg-primary/5'
          )}
        >
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
            <Building2 className="text-primary h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Create an Organization</h3>
            <p className="text-muted-foreground text-sm">
              Start fresh with a new organization for your team
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedOption('join')}
          className={cn(
            'flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50',
            selectedOption === 'join' && 'border-primary bg-primary/5'
          )}
        >
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
            <UserPlus className="text-primary h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Join with Invite Code</h3>
            <p className="text-muted-foreground text-sm">
              Join an existing organization with an invite code
            </p>
          </div>
        </button>
      </div>

      {/* Action Area */}
      {selectedOption === 'create' && (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm">
            You&apos;ll be the administrator of your new organization. You can invite
            team members after setup.
          </p>
          <Button asChild className="w-full">
            <Link href="/onboarding/create">Continue to Setup</Link>
          </Button>
        </div>
      )}

      {selectedOption === 'join' && (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="Enter your invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Ask your organization administrator for an invite code
            </p>
          </div>
          <Button
            className="w-full"
            disabled={!inviteCode.trim()}
            asChild={inviteCode.trim().length > 0}
          >
            {inviteCode.trim() ? (
              <Link href={`/invite/${inviteCode.trim()}`}>Join Organization</Link>
            ) : (
              <span>Join Organization</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
