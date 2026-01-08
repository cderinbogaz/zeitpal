'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Skeleton } from '@kit/ui/skeleton';
import { Switch } from '@kit/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

interface Holiday {
  id: string;
  date: string;
  nameEn: string;
  nameDe: string;
  region: string | null;
  type: string;
  isHalfDay: boolean;
  isCompanyHoliday: boolean;
  isNational: boolean;
}

const holidaySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  nameEn: z.string().min(1, 'English name is required'),
  nameDe: z.string().min(1, 'German name is required'),
  type: z.enum(['company', 'optional']),
  isHalfDay: z.boolean(),
});

type HolidayFormData = z.infer<typeof holidaySchema>;

export function HolidaysManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      date: '',
      nameEn: '',
      nameDe: '',
      type: 'company',
      isHalfDay: false,
    },
  });

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/holidays?year=${year}&includeCompany=true`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch holidays');
      }
      const data = await response.json();
      setHolidays(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load holidays');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const openCreateDialog = () => {
    setEditingHoliday(null);
    form.reset({
      date: '',
      nameEn: '',
      nameDe: '',
      type: 'company',
      isHalfDay: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    form.reset({
      date: holiday.date,
      nameEn: holiday.nameEn,
      nameDe: holiday.nameDe,
      type: holiday.type as 'company' | 'optional',
      isHalfDay: holiday.isHalfDay,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: HolidayFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingHoliday
        ? `/api/holidays/${editingHoliday.id}`
        : '/api/holidays';
      const method = editingHoliday ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save holiday');
      }

      toast.success(
        editingHoliday
          ? 'Holiday updated successfully'
          : 'Holiday created successfully'
      );
      setIsDialogOpen(false);
      fetchHolidays();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save holiday');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingHoliday) return;

    try {
      const response = await fetch(`/api/holidays/${deletingHoliday.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete holiday');
      }

      toast.success('Holiday deleted successfully');
      setDeletingHoliday(null);
      fetchHolidays();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete holiday'
      );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const publicHolidays = holidays.filter((h) => !h.isCompanyHoliday);
  const companyHolidays = holidays.filter((h) => h.isCompanyHoliday);

  return (
    <div className="space-y-6">
      {/* Year selector and actions */}
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Company Holiday
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingHoliday ? 'Edit Holiday' : 'Add Company Holiday'}
              </DialogTitle>
              <DialogDescription>
                {editingHoliday
                  ? 'Update the holiday details below.'
                  : 'Add a custom company holiday that will be recognized in leave calculations.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (English)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Day Off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nameDe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (German)</FormLabel>
                      <FormControl>
                        <Input placeholder="Betriebsfreier Tag" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="company">
                            Company Holiday
                          </SelectItem>
                          <SelectItem value="optional">
                            Optional Holiday
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Company holidays are automatically excluded from leave
                        calculations.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isHalfDay"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Half Day</FormLabel>
                        <FormDescription>
                          Mark this as a half-day holiday
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? 'Saving...'
                      : editingHoliday
                        ? 'Update'
                        : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Company Holidays */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companyHolidays.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No company holidays added for {year}. Click &quot;Add Company
              Holiday&quot; to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyHolidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">
                      {formatDate(holiday.date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{holiday.nameEn}</p>
                        <p className="text-sm text-muted-foreground">
                          {holiday.nameDe}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={holiday.isHalfDay ? 'outline' : 'default'}>
                        {holiday.type === 'optional' ? 'Optional' : 'Company'}
                        {holiday.isHalfDay ? ' (½)' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(holiday)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingHoliday(holiday)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Public Holidays */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Public Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          {publicHolidays.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No public holidays found for {year}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Region</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publicHolidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">
                      {formatDate(holiday.date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{holiday.nameEn}</p>
                        <p className="text-sm text-muted-foreground">
                          {holiday.nameDe}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {holiday.isNational
                          ? 'National'
                          : holiday.region || 'Regional'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingHoliday}
        onOpenChange={() => setDeletingHoliday(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingHoliday?.nameEn}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
