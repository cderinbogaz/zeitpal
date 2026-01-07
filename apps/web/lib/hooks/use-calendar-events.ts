'use client';

import { useQuery } from '@tanstack/react-query';

interface CalendarEvent {
  id: string;
  startDate: string;
  endDate: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  leaveType: {
    code: string;
    color: string;
  };
}

interface CalendarEventsResponse {
  data: CalendarEvent[];
}

interface UseCalendarEventsOptions {
  startDate: string;
  endDate: string;
  teamId?: string;
}

async function fetchCalendarEvents(
  options: UseCalendarEventsOptions
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  params.set('startDate', options.startDate);
  params.set('endDate', options.endDate);

  if (options.teamId) {
    params.set('teamId', options.teamId);
  }

  const response = await fetch(`/api/calendar?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 401) {
      return [];
    }
    throw new Error('Failed to fetch calendar events');
  }

  const result: CalendarEventsResponse = await response.json();
  return result.data;
}

export function useCalendarEvents(options: UseCalendarEventsOptions) {
  return useQuery({
    queryKey: ['calendar', options],
    queryFn: () => fetchCalendarEvents(options),
    enabled: Boolean(options.startDate && options.endDate),
    staleTime: 60 * 1000, // 1 minute
  });
}
