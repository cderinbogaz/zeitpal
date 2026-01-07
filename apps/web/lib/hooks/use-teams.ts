'use client';

import { useQuery } from '@tanstack/react-query';

import type { Team } from '~/lib/types';

interface TeamsResponse {
  data: Team[];
}

async function fetchTeams(): Promise<Team[]> {
  const response = await fetch('/api/teams');

  if (!response.ok) {
    if (response.status === 401) {
      return [];
    }
    throw new Error('Failed to fetch teams');
  }

  const result: TeamsResponse = await response.json();
  return result.data;
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
