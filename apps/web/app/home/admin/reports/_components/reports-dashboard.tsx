'use client';

import { useEffect, useState } from 'react';

import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Skeleton } from '@kit/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

interface LeaveSummary {
  period: {
    startDate: string;
    endDate: string;
    year: number;
  };
  summary: {
    totalRequests: number;
    totalDaysTaken: number;
    pendingRequests: number;
    approvedRequests: number;
    employeesWithLeave: number;
    employeesOnLeaveToday: number;
  };
  byLeaveType: Array<{
    leaveTypeId: string;
    code: string;
    nameEn: string;
    nameDe: string;
    color: string;
    requestCount: number;
    totalDays: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    requestCount: number;
    totalDays: number;
  }>;
  byTeam: Array<{
    teamId: string;
    teamName: string;
    color: string;
    requestCount: number;
    totalDays: number;
  }>;
}

interface EmployeeBalance {
  userId: string;
  name: string;
  email: string;
  role: string;
  leaveType: {
    name: string;
    code: string;
  } | null;
  balance: {
    entitled: number;
    carriedOver: number;
    adjustment: number;
    used: number;
    pending: number;
    remaining: number;
  } | null;
}

interface BalancesResponse {
  employees: EmployeeBalance[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function ReportsDashboard() {
  const [summary, setSummary] = useState<LeaveSummary | null>(null);
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [balancePage, setBalancePage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch(`/api/reports/leave-summary?year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      const data = await response.json();
      setSummary(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load report data'
      );
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchBalances = async () => {
    setIsLoadingBalances(true);
    try {
      const response = await fetch(
        `/api/reports/employee-balances?year=${year}&page=${balancePage}&pageSize=10`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch balance data');
      }
      const data = await response.json();
      setBalances(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load balance data'
      );
    } finally {
      setIsLoadingBalances(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    fetchBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, balancePage]);

  const handleExport = (type: 'balances' | 'requests' | 'summary') => {
    window.open(`/api/reports/export?type=${type}&year=${year}`, '_blank');
  };

  const getMonthName = (monthStr: string) => {
    const [yearPart, monthPart] = monthStr.split('-');
    const date = new Date(parseInt(yearPart ?? '0'), parseInt(monthPart ?? '1') - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const maxDays = Math.max(
    ...(summary?.monthlyTrends.map((t) => t.totalDays) || [1])
  );

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Year selector and Export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[80px] text-center text-lg font-semibold">
            {year}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select
          onValueChange={(value) =>
            handleExport(value as 'balances' | 'requests' | 'summary')
          }
        >
          <SelectTrigger className="w-[180px]">
            <Download className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Export CSV" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="summary">Export Summary</SelectItem>
            <SelectItem value="balances">Export Balances</SelectItem>
            <SelectItem value="requests">Export Requests</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {summary?.summary.totalRequests ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.summary.approvedRequests ?? 0} approved
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Days Taken</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {summary?.summary.totalDaysTaken ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total work days in {year}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {summary?.summary.pendingRequests ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {summary?.summary.employeesOnLeaveToday ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Employees absent
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="balances">Employee Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Leave by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Leave by Type
                </CardTitle>
                <CardDescription>
                  Distribution of leave days by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSummary ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {summary?.byLeaveType
                      .filter((lt) => lt.totalDays > 0)
                      .map((leaveType) => {
                        const total = summary.summary.totalDaysTaken || 1;
                        const percentage = Math.round(
                          (leaveType.totalDays / total) * 100
                        );
                        return (
                          <div key={leaveType.leaveTypeId} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                {leaveType.nameEn}
                              </span>
                              <span className="text-muted-foreground">
                                {leaveType.totalDays} days ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: leaveType.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    {summary?.byLeaveType.filter((lt) => lt.totalDays > 0)
                      .length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No leave data for {year}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Trends
                </CardTitle>
                <CardDescription>Leave days per month</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSummary ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summary?.monthlyTrends.map((trend) => (
                      <div
                        key={trend.month}
                        className="flex items-center gap-3"
                      >
                        <span className="w-10 text-sm text-muted-foreground">
                          {getMonthName(trend.month)}
                        </span>
                        <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded transition-all"
                            style={{
                              width: `${(trend.totalDays / maxDays) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm font-medium">
                          {trend.totalDays}d
                        </span>
                      </div>
                    ))}
                    {summary?.monthlyTrends.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No leave data for {year}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Distribution */}
          {summary?.byTeam && summary.byTeam.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Leave by Team
                </CardTitle>
                <CardDescription>
                  Total leave days taken per team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.byTeam
                    .filter((team) => team.totalDays > 0)
                    .map((team) => (
                      <div
                        key={team.teamId}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="font-medium">{team.teamName}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{team.totalDays} days</p>
                          <p className="text-xs text-muted-foreground">
                            {team.requestCount} requests
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>Employee Vacation Balances</CardTitle>
              <CardDescription>
                Overview of vacation entitlements and usage for {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBalances ? (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Entitled</TableHead>
                        <TableHead className="text-right">
                          Carried Over
                        </TableHead>
                        <TableHead className="text-right">Used</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balances?.employees.map((employee) => (
                        <TableRow key={employee.userId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {employee.balance?.entitled ?? '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {employee.balance?.carriedOver ?? '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {employee.balance?.used ?? '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {employee.balance?.pending ?? '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {employee.balance?.remaining ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {balances && balances.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {(balances.pagination.page - 1) * 10 + 1} to{' '}
                        {Math.min(
                          balances.pagination.page * 10,
                          balances.pagination.total
                        )}{' '}
                        of {balances.pagination.total} employees
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={balancePage === 1}
                          onClick={() => setBalancePage((p) => p - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {balancePage} of {balances.pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            balancePage === balances.pagination.totalPages
                          }
                          onClick={() => setBalancePage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
