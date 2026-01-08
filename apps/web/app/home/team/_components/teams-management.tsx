'use client';

import { useEffect, useState } from 'react';

import { format } from 'date-fns';
import { MoreHorizontal, Plus, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

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
import { Checkbox } from '@kit/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Skeleton } from '@kit/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Textarea } from '@kit/ui/textarea';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { EmailTagsInput } from '~/components/email-tags-input';
import { useInviteMember, useOrganization } from '~/lib/hooks';
import { apiFetch } from '~/lib/utils/csrf';
import { collectEmails } from '~/lib/utils/email-input';

const TEAM_COLORS = [
  { value: '#3B82F6', name: 'Blue' },
  { value: '#10B981', name: 'Green' },
  { value: '#F59E0B', name: 'Amber' },
  { value: '#EF4444', name: 'Red' },
  { value: '#8B5CF6', name: 'Purple' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#6366F1', name: 'Indigo' },
  { value: '#14B8A6', name: 'Teal' },
];

interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  memberCount: number;
}

interface OrgMember {
  id: string;
  role: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  teamNames: string[];
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  team: { id: string; name: string } | null;
}

const inviteRoleLabels: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  hr: 'HR',
  employee: 'Employee',
  member: 'Member',
};

function TeamsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TeamsManagement() {
  const { data: organization } = useOrganization();
  const canManageTeams = ['admin', 'manager', 'hr'].includes(
    organization?.memberRole ?? ''
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isInvitesLoading, setIsInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamColor, setTeamColor] = useState(TEAM_COLORS[0]?.value ?? '#3B82F6');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [addMemberIds, setAddMemberIds] = useState<string[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const inviteMember = useInviteMember();

  // Delete team state
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  // Manage team members state
  const [manageMembersTeam, setManageMembersTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<OrgMember[]>([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const [removingMember, setRemovingMember] = useState<{
    memberId: string;
    memberName: string;
    teamId: string;
    teamName: string;
  } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) {
        throw new Error('Failed to load teams');
      }
      const data = await response.json();
      setTeams(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    setIsMembersLoading(true);
    try {
      const response = await fetch('/api/members');
      if (!response.ok) {
        throw new Error('Failed to load members');
      }
      const data = await response.json();
      setMembers(data.data || []);
      setMembersError(null);
    } catch (err) {
      setMembersError(
        err instanceof Error ? err.message : 'Failed to load members'
      );
    } finally {
      setIsMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchMembers();
  }, []);

  const fetchInvites = async () => {
    setIsInvitesLoading(true);
    try {
      const response = await fetch('/api/members/invites');
      if (!response.ok) {
        throw new Error('Failed to load invites');
      }
      const data = await response.json();
      setInvites(data.data || []);
      setInvitesError(null);
    } catch (err) {
      setInvitesError(
        err instanceof Error ? err.message : 'Failed to load invites'
      );
    } finally {
      setIsInvitesLoading(false);
    }
  };

  useEffect(() => {
    if (canManageTeams) {
      fetchInvites();
    } else {
      setInvites([]);
      setInvitesError(null);
      setIsInvitesLoading(false);
    }
  }, [canManageTeams]);

  const resetForm = () => {
    setTeamName('');
    setTeamDescription('');
    setTeamColor(TEAM_COLORS[0]?.value ?? '#3B82F6');
    setSelectedMemberIds([]);
  };

  const toggleSelectedMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleAddMember = (memberId: string) => {
    setAddMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const notifyTeamsUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('teams:updated'));
    }
  };

  const openAddMembers = (team: Team) => {
    setActiveTeam(team);
    setAddMemberIds([]);
    setInviteEmails([]);
    setInviteEmailInput('');
    setAddDialogOpen(true);
  };

  const handleCreateTeam = async () => {
    if (!canManageTeams) {
      toast.error('You do not have permission to create teams');
      return;
    }

    const trimmedName = teamName.trim();
    if (!trimmedName) {
      return;
    }

    setIsCreating(true);

    try {
      const { error } = await apiFetch('/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          description: teamDescription.trim() || null,
          color: teamColor,
          memberIds: selectedMemberIds,
        }),
      });

      if (error) {
        throw new Error(error);
      }

      toast.success(<Trans i18nKey="admin:teams.created" defaults="Team created" />);
      setCreateDialogOpen(false);
      resetForm();
      fetchTeams();
      fetchMembers();
      notifyTeamsUpdated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create team'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddMembers = async () => {
    if (!canManageTeams) {
      toast.error('You do not have permission to add team members');
      return;
    }

    if (!activeTeam || addMemberIds.length === 0) {
      return;
    }

    setIsAddingMembers(true);

    try {
      const { error } = await apiFetch(
        `/api/teams/${activeTeam.id}/members`,
        {
          method: 'POST',
          body: JSON.stringify({ memberIds: addMemberIds }),
        }
      );

      if (error) {
        throw new Error(error);
      }

      toast.success('Members added to team');
      setAddDialogOpen(false);
      setActiveTeam(null);
      setAddMemberIds([]);
      fetchTeams();
      fetchMembers();
      notifyTeamsUpdated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to add members'
      );
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleInviteMember = async (emailsOverride?: string[]) => {
    if (!canManageTeams) {
      toast.error('You do not have permission to invite members');
      return;
    }

    if (!activeTeam) {
      return;
    }

    const emailsToInvite =
      emailsOverride?.length
        ? emailsOverride
        : collectEmails(inviteEmails, inviteEmailInput);

    if (emailsToInvite.length === 0) {
      return;
    }

    setIsInvitingMember(true);

    try {
      const results: Array<{ email: string; ok: boolean; error?: unknown }> = [];

      for (const email of emailsToInvite) {
        try {
          await inviteMember.mutateAsync({
            email,
            role: 'member',
            teamIds: [activeTeam.id],
          });
          results.push({ email, ok: true });
        } catch (error) {
          results.push({ email, ok: false, error });
        }
      }

      const failedInvites = results.filter((result) => !result.ok);
      const successfulInvites = results.filter((result) => result.ok);

      if (successfulInvites.length > 0) {
        toast.success(
          `Sent ${successfulInvites.length} invite${
            successfulInvites.length > 1 ? 's' : ''
          }.`
        );
        fetchInvites();
      }

      if (failedInvites.length > 0) {
        const firstError = failedInvites[0]?.error;
        toast.error(
          firstError instanceof Error
            ? firstError.message
            : 'Failed to invite member'
        );
        setInviteEmails(failedInvites.map((result) => result.email));
      } else {
        setInviteEmails([]);
      }

      setInviteEmailInput('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setIsInvitingMember(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!canManageTeams) {
      toast.error('You do not have permission to delete teams');
      return;
    }

    if (!deletingTeam) return;

    setIsDeletingTeam(true);

    try {
      const { error } = await apiFetch(`/api/teams/${deletingTeam.id}`, {
        method: 'DELETE',
      });

      if (error) {
        throw new Error(error);
      }

      toast.success(<Trans i18nKey="admin:teams.deleted" defaults="Team deleted" />);
      setDeletingTeam(null);
      fetchTeams();
      fetchMembers();
      notifyTeamsUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete team');
    } finally {
      setIsDeletingTeam(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    setIsLoadingTeamMembers(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (!response.ok) {
        throw new Error('Failed to load team members');
      }
      const data = await response.json();
      setTeamMembers(data.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load team members');
      setTeamMembers([]);
    } finally {
      setIsLoadingTeamMembers(false);
    }
  };

  const openManageMembers = (team: Team) => {
    setManageMembersTeam(team);
    fetchTeamMembers(team.id);
  };

  const handleRemoveMember = async () => {
    if (!canManageTeams) {
      toast.error('You do not have permission to remove team members');
      return;
    }

    if (!removingMember) return;

    setIsRemovingMember(true);

    try {
      const { error } = await apiFetch(
        `/api/teams/${removingMember.teamId}/members/${removingMember.memberId}`,
        { method: 'DELETE' }
      );

      if (error) {
        throw new Error(error);
      }

      toast.success('Member removed from team');
      setRemovingMember(null);

      // Refresh team members list
      if (manageMembersTeam) {
        fetchTeamMembers(manageMembersTeam.id);
      }
      fetchTeams();
      fetchMembers();
      notifyTeamsUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsRemovingMember(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {teams.length}{' '}
          <Trans i18nKey="admin:teams.teamsCount" defaults="Teams" />
        </h2>

        {canManageTeams ? (
          <Dialog
            open={createDialogOpen}
            onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                <Trans i18nKey="admin:teams.createTeam" defaults="Create Team" />
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <Trans
                  i18nKey="admin:teams.createDialog.title"
                  defaults="Create New Team"
                />
              </DialogTitle>
              <DialogDescription>
                <Trans
                  i18nKey="admin:teams.createDialog.description"
                  defaults="Create a new team to organize your members."
                />
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="team-name">
                  <Trans
                    i18nKey="admin:teams.createDialog.name"
                    defaults="Team Name"
                  />
                </Label>
                <Input
                  id="team-name"
                  placeholder="e.g. Engineering"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="team-description">
                  <Trans
                    i18nKey="admin:teams.createDialog.descriptionLabel"
                    defaults="Description"
                  />
                </Label>
                <Textarea
                  id="team-description"
                  placeholder="Team description..."
                  value={teamDescription}
                  onChange={(event) => setTeamDescription(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="team-color">
                  <Trans i18nKey="admin:teams.color" defaults="Team Color" />
                </Label>
                <div className="flex flex-wrap gap-3">
                  {TEAM_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setTeamColor(color.value)}
                      className={cn(
                        'h-10 w-10 rounded-full border-2 transition-all',
                        teamColor === color.value
                          ? 'scale-110 border-foreground ring-2 ring-offset-2 ring-offset-background'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>
                  <Trans i18nKey="admin:teams.members" defaults="Team Members" />
                </Label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  {isMembersLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-sm" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ))}
                    </div>
                  ) : membersError ? (
                    <p className="text-muted-foreground text-sm">
                      {membersError}
                    </p>
                  ) : members.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No members available yet.
                    </p>
                  ) : (
                    members
                      .slice()
                      .sort((a, b) => {
                        const aLabel = a.user.name || a.user.email;
                        const bLabel = b.user.name || b.user.email;
                        return aLabel.localeCompare(bLabel);
                      })
                      .map((member) => (
                        <label
                          key={member.user.id}
                          className="flex cursor-pointer items-start gap-2"
                        >
                          <Checkbox
                            checked={selectedMemberIds.includes(member.user.id)}
                            onCheckedChange={() =>
                              toggleSelectedMember(member.user.id)
                            }
                          />
                          <div className="leading-tight">
                            <p className="text-sm font-medium">
                              {member.user.name || member.user.email}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {member.user.email}
                            </p>
                          </div>
                        </label>
                      ))
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Select members to add now, or invite more later.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                <Trans i18nKey="common:cancel" defaults="Cancel" />
              </Button>
              <Button onClick={handleCreateTeam} disabled={!teamName || isCreating}>
                {isCreating ? (
                  <Trans
                    i18nKey="admin:teams.createDialog.creating"
                    defaults="Creating..."
                  />
                ) : (
                  <Trans
                    i18nKey="admin:teams.createDialog.create"
                    defaults="Create Team"
                  />
                )}
              </Button>
            </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {isLoading ? (
        <TeamsSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchTeams}>
              <Trans i18nKey="common:retry" defaults="Try Again" />
            </Button>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Trans i18nKey="admin:teams.noTeams" defaults="No teams created yet" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="truncate">{team.name}</span>
                    </CardTitle>
                    {team.description ? (
                      <CardDescription className="mt-1 line-clamp-2">{team.description}</CardDescription>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {team.memberCount}
                    </Badge>
                    {canManageTeams ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingTeam(team)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <Trans
                              i18nKey="admin:teams.actions.delete"
                              defaults="Delete Team"
                            />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {canManageTeams ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openAddMembers(team)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      <Trans
                        i18nKey="admin:teams.actions.addMembers"
                        defaults="Add Members"
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openManageMembers(team)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <Trans
                        i18nKey="admin:teams.actions.manageMembers"
                        defaults="Manage"
                      />
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canManageTeams ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans
                i18nKey="teams:pendingInvitesHeading"
                defaults="Pending Invites"
              />
            </CardTitle>
            <CardDescription>
              <Trans
                i18nKey="teams:pendingInvitesDescription"
                defaults="Here you can manage the pending invitations to your team."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isInvitesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            ) : invitesError ? (
              <div className="text-sm text-muted-foreground">
                {invitesError}
              </div>
            ) : invites.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                <Trans
                  i18nKey="teams:noPendingInvites"
                  defaults="No pending invites found"
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Trans i18nKey="teams:emailLabel" defaults="Email" />
                    </TableHead>
                    <TableHead>
                      <Trans i18nKey="teams:roleLabel" defaults="Role" />
                    </TableHead>
                    <TableHead>
                      <Trans i18nKey="teams:teamNameLabel" defaults="Team" />
                    </TableHead>
                    <TableHead>
                      <Trans i18nKey="teams:expiresAtLabel" defaults="Expires at" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {inviteRoleLabels[invite.role] ?? invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{invite.team?.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            setActiveTeam(null);
            setAddMemberIds([]);
            setInviteEmails([]);
            setInviteEmailInput('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTeam ? `Add members to ${activeTeam.name}` : 'Add members'}
            </DialogTitle>
            <DialogDescription>
              Select members to add to this team.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            <Label>
              <Trans i18nKey="admin:teams.members" defaults="Team Members" />
            </Label>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
              {isMembersLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-sm" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : membersError ? (
                <p className="text-muted-foreground text-sm">{membersError}</p>
              ) : activeTeam ? (
                (() => {
                  const availableMembers = members
                    .filter((member) => !member.teamNames.includes(activeTeam.name))
                    .sort((a, b) => {
                      const aLabel = a.user.name || a.user.email;
                      const bLabel = b.user.name || b.user.email;
                      return aLabel.localeCompare(bLabel);
                    });

                  if (availableMembers.length === 0) {
                    return (
                      <p className="text-muted-foreground text-sm">
                        No available members to add.
                      </p>
                    );
                  }

                  return availableMembers.map((member) => (
                    <label
                      key={member.user.id}
                      className="flex cursor-pointer items-start gap-2"
                    >
                      <Checkbox
                        checked={addMemberIds.includes(member.user.id)}
                        onCheckedChange={() => toggleAddMember(member.user.id)}
                      />
                      <div className="leading-tight">
                        <p className="text-sm font-medium">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {member.user.email}
                        </p>
                      </div>
                    </label>
                  ));
                })()
              ) : (
                <p className="text-muted-foreground text-sm">
                  No team selected.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Invite by email</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <EmailTagsInput
                placeholder="name@company.com"
                className="flex-1"
                value={inviteEmails}
                inputValue={inviteEmailInput}
                onChange={setInviteEmails}
                onInputChange={setInviteEmailInput}
                onSubmit={(emails) => void handleInviteMember(emails)}
              />
              <Button
                type="button"
                onClick={() => void handleInviteMember()}
                disabled={
                  !activeTeam ||
                  collectEmails(inviteEmails, inviteEmailInput).length === 0 ||
                  isInvitingMember
                }
              >
                {isInvitingMember ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              {activeTeam
                ? `We will add them to ${activeTeam.name} after they accept.`
                : 'Select a team to send an invite.'}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              <Trans i18nKey="common:cancel" defaults="Cancel" />
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={!activeTeam || addMemberIds.length === 0 || isAddingMembers}
            >
              {isAddingMembers ? 'Adding...' : 'Add Members'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Team Members Dialog */}
      <Dialog
        open={!!manageMembersTeam}
        onOpenChange={(open) => {
          if (!open) {
            setManageMembersTeam(null);
            setTeamMembers([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: manageMembersTeam?.color }}
              />
              {manageMembersTeam?.name}
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="admin:teams.manageMembersDialog.description"
                defaults="View and manage team members."
              />
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto rounded-md border">
            {isLoadingTeamMembers ? (
              <div className="space-y-2 p-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2 text-sm">
                  <Trans
                    i18nKey="admin:teams.manageMembersDialog.noMembers"
                    defaults="No members in this team yet."
                  />
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setManageMembersTeam(null);
                    if (manageMembersTeam) {
                      openAddMembers(manageMembersTeam);
                    }
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Members
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {teamMembers.map((member) => (
                  <div
                    key={member.user.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {(member.user.name || member.user.email)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setRemovingMember({
                          memberId: member.user.id,
                          memberName: member.user.name || member.user.email,
                          teamId: manageMembersTeam!.id,
                          teamName: manageMembersTeam!.name,
                        })
                      }
                    >
                      <UserMinus className="h-4 w-4" />
                      <span className="sr-only">Remove member</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (manageMembersTeam) {
                  const team = manageMembersTeam;
                  setManageMembersTeam(null);
                  openAddMembers(team);
                }
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Members
            </Button>
            <Button
              variant="outline"
              onClick={() => setManageMembersTeam(null)}
            >
              <Trans i18nKey="common:close" defaults="Close" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <AlertDialog
        open={!!deletingTeam}
        onOpenChange={(open) => !open && setDeletingTeam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans
                i18nKey="admin:teams.deleteDialog.title"
                defaults="Delete Team"
              />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="admin:teams.deleteDialog.description"
                defaults="Are you sure you want to delete the team '{teamName}'? This will remove all members from the team. This action cannot be undone."
                values={{ teamName: deletingTeam?.name || '' }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTeam}>
              <Trans i18nKey="common:cancel" defaults="Cancel" />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isDeletingTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingTeam ? (
                <Trans
                  i18nKey="admin:teams.deleteDialog.deleting"
                  defaults="Deleting..."
                />
              ) : (
                <Trans
                  i18nKey="admin:teams.deleteDialog.delete"
                  defaults="Delete Team"
                />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member from Team Confirmation Dialog */}
      <AlertDialog
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans
                i18nKey="admin:teams.removeMemberDialog.title"
                defaults="Remove Team Member"
              />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="admin:teams.removeMemberDialog.description"
                defaults="Are you sure you want to remove {memberName} from {teamName}? They will no longer have access to team-specific features."
                values={{
                  memberName: removingMember?.memberName || '',
                  teamName: removingMember?.teamName || '',
                }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>
              <Trans i18nKey="common:cancel" defaults="Cancel" />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingMember ? (
                <Trans
                  i18nKey="admin:teams.removeMemberDialog.removing"
                  defaults="Removing..."
                />
              ) : (
                <Trans
                  i18nKey="admin:teams.removeMemberDialog.remove"
                  defaults="Remove Member"
                />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
