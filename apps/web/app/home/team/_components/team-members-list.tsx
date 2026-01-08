'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kit/ui/alert-dialog';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Skeleton } from '@kit/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Trans } from '@kit/ui/trans';

import { useCancelLeaveRequest, useOrganization } from '~/lib/hooks';

import { LeaveRequestForm } from '../../leave/request/_components/leave-request-form';

const UNASSIGNED_TEAM = '__unassigned__';

interface TeamMemberAvailability {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  teamNames: string[];
  currentAbsence: { id: string; type: string; endDate: string } | null;
  nextAbsence: { id: string; startDate: string; type: string } | null;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  hr: 'HR',
  employee: 'Employee',
  member: 'Member',
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return email ? email[0]?.toUpperCase() ?? '?' : '?';
}

function TeamMembersTableSkeleton({ showActions }: { showActions: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Next Absence</TableHead>
          {showActions ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-1 h-3 w-36" />
                </div>
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            {showActions ? (
              <TableCell className="text-right">
                <Skeleton className="h-8 w-24" />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TeamMembersList() {
  const { data: organization } = useOrganization();
  const cancelLeaveRequest = useCancelLeaveRequest();
  const [members, setMembers] = useState<TeamMemberAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMember, setActiveMember] = useState<TeamMemberAvailability | null>(null);
  const [cancellingLeave, setCancellingLeave] = useState<{
    id: string;
    memberName: string;
    leaveType: string;
    dateLabel: string;
  } | null>(null);
  const isMountedRef = useRef(true);
  const canAddLeave = organization?.memberRole === 'admin';

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/team-availability');
      if (!response.ok) {
        throw new Error('Failed to load team members');
      }
      const data = await response.json();
      if (isMountedRef.current) {
        setMembers(data.data || []);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err.message : 'Failed to load team members'
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const handleTeamsUpdated = () => {
      loadMembers();
    };

    window.addEventListener('teams:updated', handleTeamsUpdated);

    return () => {
      window.removeEventListener('teams:updated', handleTeamsUpdated);
    };
  }, [loadMembers]);

  const handleCancelLeave = async () => {
    if (!cancellingLeave) return;

    try {
      await cancelLeaveRequest.mutateAsync(cancellingLeave.id);
      toast.success('Leave cancelled');
      setCancellingLeave(null);
      loadMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to cancel leave'
      );
    }
  };

  const teamEntries = useMemo<Array<[string, TeamMemberAvailability[]]>>(() => {
    if (members.length === 0) {
      return [];
    }

    const grouped = members.reduce(
      (acc, member) => {
        const teamsForMember =
          member.teamNames.length > 0 ? member.teamNames : [UNASSIGNED_TEAM];

        teamsForMember.forEach((teamName) => {
          if (!acc[teamName]) {
            acc[teamName] = [];
          }
          acc[teamName]!.push(member);
        });

        return acc;
      },
      {} as Record<string, TeamMemberAvailability[]>
    );

    return Object.entries(grouped)
      .map(
        ([teamName, teamMembers]) =>
          [
            teamName,
            [...teamMembers].sort((a, b) => {
              const aLabel = a.user.name || a.user.email;
              const bLabel = b.user.name || b.user.email;
              return aLabel.localeCompare(bLabel);
            }),
          ] as [string, TeamMemberAvailability[]]
      )
      .sort(([a], [b]) => {
        if (a === UNASSIGNED_TEAM) return 1;
        if (b === UNASSIGNED_TEAM) return -1;
        return a.localeCompare(b);
      });
  }, [members]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TeamMembersTableSkeleton showActions={canAddLeave} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={loadMembers}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No team members found yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {teamEntries.map(([teamName, teamMembers]) => {
        const teamLabel =
          teamName === UNASSIGNED_TEAM ? 'Unassigned' : teamName;

        return (
          <Card key={teamName}>
            <CardHeader>
              <CardTitle className="text-lg">
                {teamLabel}
                <Badge variant="outline" className="ml-2">
                  {teamMembers.length} members
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Absence</TableHead>
                    {canAddLeave ? (
                      <TableHead className="text-right">Actions</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => {
                    const memberName = member.user.name || member.user.email;
                    const currentAbsence = member.currentAbsence;
                    const nextAbsence = member.nextAbsence;
                    const currentDateLabel = currentAbsence
                      ? `ending ${format(
                          new Date(currentAbsence.endDate),
                          'MMM d, yyyy'
                        )}`
                      : null;
                    const nextDateLabel = nextAbsence
                      ? `starting ${format(
                          new Date(nextAbsence.startDate),
                          'MMM d, yyyy'
                        )}`
                      : null;

                    return (
                      <TableRow key={`${teamName}-${member.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={member.user.avatarUrl ?? undefined}
                            />
                            <AvatarFallback>
                              {getInitials(member.user.name, member.user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {memberName}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {roleLabels[member.role] ?? member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {currentAbsence ? (
                          <Badge variant="secondary">
                            <Trans
                              i18nKey={`leave:types.${currentAbsence.type}`}
                            />
                            {' until '}
                            {currentAbsence.endDate &&
                              format(
                                new Date(currentAbsence.endDate),
                                'MMM d'
                              )}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            Available
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {nextAbsence ? (
                          <>
                            <Trans
                              i18nKey={`leave:types.${nextAbsence.type}`}
                            />
                            {' from '}
                            {format(
                              new Date(nextAbsence.startDate),
                              'MMM d, yyyy'
                            )}
                          </>
                        ) : (
                          'None scheduled'
                        )}
                      </TableCell>
                      {canAddLeave ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="whitespace-nowrap"
                              onClick={() => setActiveMember(member)}
                            >
                              Add Leave
                            </Button>
                            {currentAbsence || nextAbsence ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">More actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {currentAbsence ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setCancellingLeave({
                                          id: currentAbsence.id,
                                          memberName,
                                          leaveType: currentAbsence.type,
                                          dateLabel: currentDateLabel ?? '',
                                        })
                                      }
                                    >
                                      Cancel current leave
                                    </DropdownMenuItem>
                                  ) : null}
                                  {nextAbsence ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setCancellingLeave({
                                          id: nextAbsence.id,
                                          memberName,
                                          leaveType: nextAbsence.type,
                                          dateLabel: nextDateLabel ?? '',
                                        })
                                      }
                                    >
                                      Cancel upcoming leave
                                    </DropdownMenuItem>
                                  ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                          </div>
                        </TableCell>
                      ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      <Dialog
        open={!!activeMember}
        onOpenChange={(open) => {
          if (!open) {
            setActiveMember(null);
          }
        }}
      >
        {activeMember ? (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Add leave for {activeMember.user.name || activeMember.user.email}
              </DialogTitle>
              <DialogDescription>
                Create a leave request on behalf of this team member.
              </DialogDescription>
            </DialogHeader>
            <LeaveRequestForm
              compact
              userId={activeMember.user.id}
              onCancel={() => setActiveMember(null)}
              onSuccess={() => {
                setActiveMember(null);
                loadMembers();
              }}
            />
          </DialogContent>
        ) : null}
      </Dialog>

      <AlertDialog
        open={!!cancellingLeave}
        onOpenChange={(open) => !open && setCancellingLeave(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel leave</AlertDialogTitle>
            <AlertDialogDescription>
              {cancellingLeave ? (
                <>
                  Are you sure you want to cancel{' '}
                  <span className="font-medium">
                    {cancellingLeave.memberName}
                  </span>
                  {"'s "}
                  <Trans i18nKey={`leave:types.${cancellingLeave.leaveType}`} />{' '}
                  leave {cancellingLeave.dateLabel}? The days will be returned
                  to their balance.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLeaveRequest.isPending}>
              Keep Leave
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelLeave}
              disabled={cancelLeaveRequest.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLeaveRequest.isPending ? 'Cancelling...' : 'Cancel Leave'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
