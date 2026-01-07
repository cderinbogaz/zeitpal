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
import { Input } from '@kit/ui/input';
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

import type { OrganizationRole, MemberStatus } from '~/lib/types';
import { useInviteMember } from '~/lib/hooks/use-members';

// TODO: Replace with React Query
const mockMembers: {
  id: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  role: OrganizationRole;
  status: MemberStatus;
  joinedAt: string;
  teamNames: string[];
}[] = [];

const mockInvites: {
  id: string;
  email: string;
  role: OrganizationRole;
  expiresAt: string;
  createdAt: string;
}[] = [];

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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('member');
  const inviteMember = useInviteMember();
  const isInviting = inviteMember.isPending;

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

  const handleInvite = async () => {
    try {
      const email = inviteEmail.trim();
      if (!email) {
        return;
      }

      await inviteMember.mutateAsync({ email, role: inviteRole });
      toast.success(<Trans i18nKey="admin:members.inviteSent" />);
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to invite member'
      );
    }
  };

  const handleRoleChange = async (memberId: string, newRole: OrganizationRole) => {
    // TODO: Implement API call
    console.log('Changing role:', { memberId, newRole });
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    setIsRemovingMember(true);
    try {
      // TODO: Implement API call
      console.log('Removing member:', removingMember.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setRemovingMember(null);
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
            {mockMembers.length} <Trans i18nKey="admin:members.membersCount" />
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
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
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
                onClick={handleInvite}
                disabled={!inviteEmail || isInviting}
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
      {mockInvites.length > 0 && (
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
                {mockInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleColors[invite.role]}>
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
                        onClick={() => setCancellingInvite({ id: invite.id, email: invite.email })}
                      >
                        <Trans i18nKey="common:cancel" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
              {mockMembers.map((member) => (
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
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleColors[member.role]}>
                      <Trans i18nKey={`admin:members.roles.${member.role}`} />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.teamNames.map((team) => (
                        <Badge key={team} variant="outline" className="text-xs">
                          {team}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(member.joinedAt), 'MMM d, yyyy')}
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
                          onClick={() => setRemovingMember({ id: member.id, name: member.user.name })}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          <Trans i18nKey="admin:members.actions.remove" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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
