'use client';

import { useMemo, useState } from 'react';

import {
  addMonths,
  eachDayOfInterval,
  format,
  getDay,
  isSameMonth,
  isToday,
  isWeekend,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Skeleton } from '@kit/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { useCalendarEvents, useHolidays, useTeams } from '~/lib/hooks';

interface CalendarAbsence {
  id: string;
  user: { id: string; name: string; initials: string; image: string | null };
  leaveType: { code: string; color: string };
  startDate: string;
  endDate: string;
}

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  holidays: { date: string; name: string }[];
  absences: CalendarAbsence[];
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return initials || '?';
}

function CalendarDay({ date, currentMonth, holidays, absences }: CalendarDayProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isHoliday = holidays.some((h) => h.date === dateStr);
  const holiday = holidays.find((h) => h.date === dateStr);
  const dayAbsences = absences.filter(
    (a) => dateStr >= a.startDate && dateStr <= a.endDate
  );

  return (
    <div
      className={cn(
        'min-h-[100px] border-b border-r p-1',
        !isCurrentMonth && 'bg-muted/30',
        isWeekend(date) && 'bg-muted/50',
        isHoliday && 'bg-amber-50 dark:bg-amber-950/20'
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-xs',
            isToday(date) && 'bg-primary text-primary-foreground font-semibold',
            !isCurrentMonth && 'text-muted-foreground'
          )}
        >
          {format(date, 'd')}
        </span>
        {isHoliday && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="h-4 px-1 text-[10px]">
                H
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{holiday?.name}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="space-y-0.5">
        {dayAbsences.slice(0, 3).map((absence) => (
          <Tooltip key={absence.id}>
            <TooltipTrigger asChild>
              <div
                className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-white"
                style={{ backgroundColor: absence.leaveType.color }}
              >
                <Avatar className="h-4 w-4">
                  <AvatarImage src={absence.user.image ?? undefined} />
                  <AvatarFallback className="text-[8px]">
                    {absence.user.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{absence.user.name.split(' ')[0]}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{absence.user.name}</p>
              <p className="text-xs">
                <Trans i18nKey={`leave:types.${absence.leaveType.code}`} />
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(absence.startDate), 'MMM d')} -{' '}
                {format(new Date(absence.endDate), 'MMM d')}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        {dayAbsences.length > 3 && (
          <div className="text-muted-foreground px-1 text-[10px]">
            +{dayAbsences.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0 border-l border-t">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="border-b border-r p-2 text-center">
            <Skeleton className="mx-auto h-4 w-8" />
          </div>
        ))}
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} className="h-[100px] border-b border-r" />
        ))}
      </div>
    </div>
  );
}

export function TeamCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState('all');

  const currentYear = currentDate.getFullYear();
  const { data: holidaysData, isLoading: isLoadingHolidays } = useHolidays({ year: currentYear });
  const { data: teamsData = [], isLoading: isLoadingTeams } = useTeams();

  // Transform holidays to the format expected by CalendarDay
  const holidays = useMemo(() => {
    if (!holidaysData) return [];
    return holidaysData.map((h) => ({
      date: h.date,
      name: h.nameEn, // TODO: Use locale to determine which name to show
    }));
  }, [holidaysData]);

  const monthStart = startOfMonth(currentDate);

  // Get all days to display (including days from prev/next month to fill the grid)
  const startDay = getDay(monthStart);
  const adjustedStart = startDay === 0 ? 6 : startDay - 1; // Adjust for Monday start
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - adjustedStart);
  const calendarEnd = new Date(calendarStart.getTime() + 41 * 24 * 60 * 60 * 1000); // 6 weeks

  const { data: absencesData = [], isLoading: isLoadingAbsences } = useCalendarEvents({
    startDate: format(calendarStart, 'yyyy-MM-dd'),
    endDate: format(calendarEnd, 'yyyy-MM-dd'),
    teamId: selectedTeam === 'all' ? undefined : selectedTeam,
  });

  const absences = useMemo(() => {
    return absencesData.map((absence) => {
      const displayName = absence.user.name ?? absence.user.email ?? 'Unknown';

      return {
        id: absence.id,
        startDate: absence.startDate,
        endDate: absence.endDate,
        leaveType: absence.leaveType,
        user: {
          id: absence.user.id,
          name: displayName,
          initials: getInitials(displayName),
          image: absence.user.avatarUrl,
        },
      };
    });
  }, [absencesData]);

  const teams = useMemo(() => {
    return [
      { id: 'all', name: 'All Teams' },
      ...teamsData.map((team) => ({
        id: team.id,
        name: team.name,
      })),
    ];
  }, [teamsData]);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const isLoading = isLoadingHolidays || isLoadingAbsences || isLoadingTeams;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <CalendarSkeleton />
        </CardContent>
      </Card>
    );
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <Trans i18nKey="leave:calendar.today" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 border-b px-4 pb-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded bg-[#3B82F6]" />
            <Trans i18nKey="leave:types.vacation" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded bg-[#EF4444]" />
            <Trans i18nKey="leave:types.sick" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded bg-amber-100 dark:bg-amber-900/30" />
            <Trans i18nKey="leave:calendar.holiday" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="bg-muted/50 h-3 w-3 rounded" />
            <Trans i18nKey="leave:calendar.weekend" />
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-l border-t">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="border-b border-r p-2 text-center text-sm font-medium"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day) => (
            <CalendarDay
              key={day.toISOString()}
              date={day}
              currentMonth={currentDate}
              holidays={holidays}
              absences={absences}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
