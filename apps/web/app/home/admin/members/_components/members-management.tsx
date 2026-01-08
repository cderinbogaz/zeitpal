'use client';

import { useState } from 'react';

import { format } from 'date-fns';
import { Mail, MoreHorizontal, Plus, Shield, User, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Trans } from '@kit/ui/trans';

import { EmailTagsInput } from '~/components/email-tags-input';
import type { OrganizationRole } from '~/lib/types';
import {
  useInviteMember,
  useMemberInvites,
  useMembers,
  useRemoveMember,
  useUpdateMember,
} from '~/lib/hooks/use-members';
import { collectEmails } from '~/lib/utils/email-input';

const roleColors: Record<OrganizationRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  manager: 'secondary',
  member: 'outline',
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MembersManagement() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('member');
  const [isInviting, setIsInviting] = useState(false);
  const inviteMember = useInviteMember();
  const updateMember = useUpdateMember();
  const removeMember = useRemoveMember();
  const { data: members = [], isLoading: isMembersLoading, error: membersError } = useMembers();
  const {
    data: invites = [],
    isLoading: isInvitesLoading,
    error: invitesError,
  } = useMemberInvites();

  // Member removal confirmation state
  const [removingMember, setRemovingMember] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Cancel invite confirmation state
  const [cancellingInvite, setCancellingInvite] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [isCancellingInvite, setIsCancellingInvite] = useState(false);

  const handleInvite = async (emailsOverride?: string[]) => {
    const emailsToInvite =
      emailsOverride?.length ? emailsOverride : collectEmails(inviteEmails, inviteEmailInput);

    try {
      if (emailsToInvite.length === 0) {
        return;
      }

      setIsInviting(true);
      const results: Array<{ email: string; ok: boolean; error?: unknown }> = [];

      for (const email of emailsToInvite) {
        try {
          await inviteMember.mutateAsync({ email, role: inviteRole });
          results.push({ email, ok: true });
        } catch (error) {
          results.push({ email, ok: false, error });
        }
      }

      const failedInvites = results.filter((result) => !result.ok);
      const successfulInvites = results.filter((result) => result.ok);

      if (successfulInvites.length > 0) {
        toast.success(
          <Trans
            i18nKey="admin:members.inviteSent"
            count={successfulInvites.length}
          />
        );
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
        setInviteDialogOpen(false);
        setInviteEmails([]);
        setInviteRole('member');
      }

      setInviteEmailInput('');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to invite member'
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: OrganizationRole) => {
    try {
      await updateMember.mutateAsync({ memberId, role: newRole });
      toast.success('Role updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    setIsRemovingMember(true);
    try {
      await removeMember.mutateAsync(removingMember.id);
      setRemovingMember(null);
      toast.success('Member removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleCancelInvite = async () => {
    if (!cancellingInvite) return;
    setIsCancellingInvite(true);
    try {
      // TODO: Implement API call
      console.log('Cancelling invite:', cancellingInvite.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCancellingInvite(null);
    } finally {
      setIsCancellingInvite(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {members.length} <Trans i18nKey="admin:members.membersCount" />
          </h2>
        </div>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <Trans i18nKey="admin:members.inviteMember" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <Trans i18nKey="admin:members.inviteDialog.title" />
              </DialogTitle>
              <DialogDescription>
                <Trans i18nKey="admin:members.inviteDialog.description" />
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">
                  <Trans i18nKey="admin:members.inviteDialog.email" />
                </Label>
                <EmailTagsInput
                  id="email"
                  ariaLabel="Email address"
                  placeholder="colleague@company.com"
                  value={inviteEmails}
                  inputValue={inviteEmailInput}
                  onChange={setInviteEmails}
                  onInputChange={setInviteEmailInput}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">
                  <Trans i18nKey="admin:members.inviteDialog.role" />
                </Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as OrganizationRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <Trans i18nKey="admin:members.roles.admin" />
                    </SelectItem>
                    <SelectItem value="manager">
                      <Trans i18nKey="admin:members.roles.manager" />
                    </SelectItem>
                    <SelectItem value="member">
                      <Trans i18nKey="admin:members.roles.member" />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
              >
                <Trans i18nKey="common:cancel" />
              </Button>
              <Button
                onClick={() => void handleInvite()}
                disabled={!collectEmails(inviteEmails, inviteEmailInput).length || isInviting}
              >
                {isInviting ? (
                  <Trans i18nKey="admin:members.inviteDialog.sending" />
                ) : (
                  <Trans i18nKey="admin:members.inviteDialog.send" />
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Invites */}
      {(isInvitesLoading || invitesError || invites.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              <Trans i18nKey="admin:members.pendingInvites" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Trans i18nKey="admin:members.table.email" />
                  </TableHead>
                  <TableHead>
                    <Trans i18nKey="admin:members.table.role" />
                  </TableHead>
                  <TableHead>
                    <Trans i18nKey="admin:members.table.expires" />
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInvitesLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Loading invites...
                    </TableCell>
                  </TableRow>
                ) : invitesError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-destructive">
                      {invitesError instanceof Error
                        ? invitesError.message
                        : 'Failed to load invites'}
                    </TableCell>
                  </TableRow>
                ) : (
                  invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            roleColors[invite.role as OrganizationRole] ?? 'outline'
                          }
                        >
                          <Trans i18nKey={`admin:members.roles.${invite.role}`} />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCancellingInvite({
                              id: invite.id,
                              email: invite.email,
                            })
                          }
                        >
                          <Trans i18nKey="common:cancel" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Trans i18nKey="admin:members.table.member" />
                </TableHead>
                <TableHead>
                  <Trans i18nKey="admin:members.table.role" />
                </TableHead>
                <TableHead>
                  <Trans i18nKey="admin:members.table.teams" />
                </TableHead>
                <TableHead>
                  <Trans i18nKey="admin:members.table.joined" />
                </TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isMembersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : membersError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-destructive">
                    {membersError instanceof Error
                      ? membersError.message
                      : 'Failed to load members'}
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const displayName = member.user.name ?? member.user.email;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.avatarUrl || undefined} />
                            <AvatarFallback>
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{displayName}</p>
                            <p className="text-muted-foreground text-sm">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleColors[member.role as OrganizationRole] ?? 'outline'}>
                          <Trans i18nKey={`admin:members.roles.${member.role}`} />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {member.teamNames.length > 0 ? (
                            member.teamNames.map((team) => (
                              <Badge key={team} variant="outline" className="text-xs">
                                {team}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No teams</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.joinedAt
                          ? format(new Date(member.joinedAt), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <User className="mr-2 h-4 w-4" />
                              <Trans i18nKey="admin:members.actions.viewProfile" />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, 'admin')}
                              disabled={member.role === 'admin'}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              <Trans i18nKey="admin:members.actions.makeAdmin" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, 'manager')}
                              disabled={member.role === 'manager'}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              <Trans i18nKey="admin:members.actions.makeManager" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, 'member')}
                              disabled={member.role === 'member'}
                            >
                              <User className="mr-2 h-4 w-4" />
                              <Trans i18nKey="admin:members.actions.makeMember" />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setRemovingMember({ id: member.id, name: displayName })
                              }
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              <Trans i18nKey="admin:members.actions.remove" />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans i18nKey="admin:members.removeDialog.title" defaults="Remove Member" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="admin:members.removeDialog.description"
                defaults="Are you sure you want to remove {name} from this organization? This action cannot be undone."
                values={{ name: removingMember?.name || 'this member' }}
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
                <Trans i18nKey="admin:members.removeDialog.removing" defaults="Removing..." />
              ) : (
                <Trans i18nKey="admin:members.removeDialog.remove" defaults="Remove Member" />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invite Confirmation Dialog */}
      <AlertDialog
        open={!!cancellingInvite}
        onOpenChange={(open) => !open && setCancellingInvite(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans i18nKey="admin:members.cancelInviteDialog.title" defaults="Cancel Invitation" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="admin:members.cancelInviteDialog.description"
                defaults="Are you sure you want to cancel the invitation for {email}? They will no longer be able to join using this invite."
                values={{ email: cancellingInvite?.email || '' }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingInvite}>
              <Trans i18nKey="common:keepInvite" defaults="Keep Invite" />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvite}
              disabled={isCancellingInvite}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancellingInvite ? (
                <Trans i18nKey="admin:members.cancelInviteDialog.cancelling" defaults="Cancelling..." />
              ) : (
                <Trans i18nKey="admin:members.cancelInviteDialog.cancel" defaults="Cancel Invite" />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
