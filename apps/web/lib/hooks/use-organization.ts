'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { Organization, CountryCode } from '~/lib/types';
import { getCsrfToken } from '~/lib/utils/csrf';

interface OrganizationResponse {
  data: Organization | null;
}

interface CreateOrganizationInput {
  name: string;
  slug: string;
  country: CountryCode;
  region?: string | null;
  defaultVacationDays: number;
}

interface UpdateOrganizationInput {
  name?: string;
  country?: CountryCode;
  region?: string | null;
  defaultVacationDays?: number;
  carryoverEnabled?: boolean;
  carryoverMaxDays?: number;
  carryoverExpiryDate?: string;
  sickLeaveAuThreshold?: number;
  requireApproval?: boolean;
  autoApproveThreshold?: number | null;
}

async function fetchOrganization(): Promise<Organization | null> {
  const response = await fetch('/api/organizations');

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error('Failed to fetch organization');
  }

  const result: OrganizationResponse = await response.json();
  return result.data;
}

async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  const response = await fetch('/api/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': getCsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create organization');
  }

  const result = await response.json();
  return result.data;
}

async function updateOrganization(input: UpdateOrganizationInput): Promise<Organization> {
  const response = await fetch('/api/organizations', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': getCsrfToken(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update organization');
  }

  const result = await response.json();
  return result.data;
}

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: fetchOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: (data) => {
      queryClient.setQueryData(['organization'], data);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganization,
    onSuccess: (data) => {
      queryClient.setQueryData(['organization'], data);
    },
  });
}
