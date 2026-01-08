'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { OrganizationRole, MemberStatus } from '~/lib/types';
import { getCsrfToken } from '~/lib/utils/csrf';

export interface MemberListItem {
  id: string;
  role: string;
  status: string;
  joinedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  teamNames: string[];
}

export interface MemberInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  team: { id: string; name: string } | null;
}

interface MembersResponse {
  data: MemberListItem[];
}

interface MemberInvitesResponse {
  data: MemberInvite[];
}

interface InviteMemberInput {
  email: string;
  role: OrganizationRole;
  teamIds?: string[];
}

export interface InviteMemberResponse {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  inviteUrl: string | null;
  skipped?: boolean;
}

interface UpdateMemberInput {
  memberId: string;
  role?: OrganizationRole;
  status?: MemberStatus;
}

async function fetchMembers(): Promise<MemberListItem[]> {
  const response = await fetch('/api/members');

  if (!response.ok) {
    if (response.status === 401) {
      return [];
    }
    throw new Error('Failed to fetch members');
  }

  const result: MembersResponse = await response.json();
  return result.data ?? [];
}

async function fetchMemberInvites(): Promise<MemberInvite[]> {
  const response = await fetch('/api/members/invites');

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return [];
    }
    throw new Error('Failed to fetch invites');
  }

  const result: MemberInvitesResponse = await response.json();
  return result.data ?? [];
}

async function inviteMember(input: InviteMemberInput): Promise<InviteMemberResponse> {
  const response = await fetch('/api/members/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': getCsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to invite member');
  }

  const result = await response.json();
  return result;
}

async function updateMember(input: UpdateMemberInput): Promise<MemberListItem> {
  const { memberId, ...data } = input;
  const response = await fetch(`/api/members/${memberId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': getCsrfToken(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update member');
  }

  const result = await response.json();
  return {
    ...result.data,
    teamNames: result.data?.teamNames ?? [],
  };
}

async function removeMember(memberId: string): Promise<void> {
  const response = await fetch(`/api/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      'x-csrf-token': getCsrfToken(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove member');
  }
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useMemberInvites() {
  return useQuery({
    queryKey: ['invites'],
    queryFn: fetchMemberInvites,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
