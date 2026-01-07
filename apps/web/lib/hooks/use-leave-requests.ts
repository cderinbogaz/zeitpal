'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { LeaveRequest, LeaveRequestStatus } from '~/lib/types';
import { getCsrfToken } from '~/lib/utils/csrf';

interface LeaveRequestsResponse {
  data: LeaveRequest[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LeaveRequestDetailApproval {
  id: string;
  action: string;
  comment: string | null;
  createdAt: string;
  approver: {
    id: string;
    name: string | null;
  };
}

interface LeaveRequestDetailResponse {
  data: Omit<LeaveRequest, 'user' | 'leaveType' | 'approvals'> & {
    user: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
    leaveType: {
      id: string;
      code: string;
      nameEn: string;
      nameDe: string;
      color: string;
    };
    approvals: LeaveRequestDetailApproval[];
  };
}

interface UseLeaveRequestsOptions {
  userId?: string;
  status?: LeaveRequestStatus | LeaveRequestStatus[];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface CreateLeaveRequestInput {
  userId?: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  startHalfDay?: 'morning' | 'afternoon' | null;
  endHalfDay?: 'morning' | 'afternoon' | null;
  reason?: string;
}

interface UpdateLeaveRequestInput {
  id: string;
  status?: LeaveRequestStatus;
  reason?: string;
}

async function fetchLeaveRequest(id: string): Promise<LeaveRequestDetailResponse> {
  const response = await fetch(`/api/leave-requests/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Leave request not found');
    }
    throw new Error('Failed to fetch leave request');
  }

  return response.json();
}

async function fetchLeaveRequests(
  options: UseLeaveRequestsOptions = {}
): Promise<LeaveRequestsResponse> {
  const params = new URLSearchParams();

  if (options.userId) {
    params.set('userId', options.userId);
  }
  if (options.status) {
    const statuses = Array.isArray(options.status)
      ? options.status
      : [options.status];
    statuses.forEach((s) => params.append('status', s));
  }
  if (options.startDate) {
    params.set('startDate', options.startDate);
  }
  if (options.endDate) {
    params.set('endDate', options.endDate);
  }
  if (options.page) {
    params.set('page', options.page.toString());
  }
  if (options.limit) {
    params.set('limit', options.limit.toString());
  }

  const url = `/api/leave-requests${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 401) {
      return { data: [] };
    }
    throw new Error('Failed to fetch leave requests');
  }

  return response.json();
}

async function createLeaveRequest(
  input: CreateLeaveRequestInput
): Promise<LeaveRequest> {
  const response = await fetch('/api/leave-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': getCsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create leave request');
  }

  const result = await response.json();
  return result.data;
}

async function updateLeaveRequest(
  input: UpdateLeaveRequestInput
): Promise<LeaveRequest> {
  const { id, ...data } = input;
  const response = await fetch(`/api/leave-requests/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': getCsrfToken(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update leave request');
  }

  const result = await response.json();
  return result.data;
}

async function withdrawLeaveRequest(id: string): Promise<LeaveRequest> {
  return updateLeaveRequest({ id, status: 'withdrawn' });
}

async function cancelLeaveRequest(id: string): Promise<LeaveRequest> {
  return updateLeaveRequest({ id, status: 'cancelled' });
}

export function useLeaveRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['leave-request', id],
    queryFn: () => fetchLeaveRequest(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useLeaveRequests(options: UseLeaveRequestsOptions = {}) {
  return useQuery({
    queryKey: ['leave-requests', options],
    queryFn: () => fetchLeaveRequests(options),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useMyLeaveRequests(options: Omit<UseLeaveRequestsOptions, 'userId'> = {}) {
  return useQuery({
    queryKey: ['leave-requests', 'mine', options],
    queryFn: () => fetchLeaveRequests(options),
    staleTime: 1 * 60 * 1000,
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['leave-requests', 'pending-approvals'],
    queryFn: () => fetchLeaveRequests({ status: 'pending' }),
    staleTime: 30 * 1000, // 30 seconds - approvals need to be fresh
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      // Invalidate all leave request queries
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      // Also invalidate balances as they may have changed
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}

export function useWithdrawLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}
