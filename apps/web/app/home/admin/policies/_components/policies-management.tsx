'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
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
import { Separator } from '@kit/ui/separator';
import { Skeleton } from '@kit/ui/skeleton';
import { Switch } from '@kit/ui/switch';

const policiesSchema = z.object({
  defaultVacationDays: z.coerce.number().min(20).max(50),
  carryoverEnabled: z.boolean(),
  carryoverMaxDays: z.coerce.number().min(0).max(30),
  carryoverExpiryDate: z.string().regex(/^\d{2}-\d{2}$/),
  sickLeaveAuThreshold: z.coerce.number().min(1).max(7),
  requireApproval: z.boolean(),
  autoApproveThreshold: z.coerce.number().min(0).max(10).nullable(),
});

type PoliciesFormData = z.infer<typeof policiesSchema>;

interface Organization {
  id: string;
  name: string;
  defaultVacationDays: number;
  carryoverEnabled: boolean;
  carryoverMaxDays: number;
  carryoverExpiryDate: string;
  sickLeaveAuThreshold: number;
  requireApproval: boolean;
  autoApproveThreshold: number | null;
}

export function PoliciesManagement() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PoliciesFormData>({
    resolver: zodResolver(policiesSchema),
    defaultValues: {
      defaultVacationDays: 30,
      carryoverEnabled: true,
      carryoverMaxDays: 5,
      carryoverExpiryDate: '03-31',
      sickLeaveAuThreshold: 3,
      requireApproval: true,
      autoApproveThreshold: null,
    },
  });

  const carryoverEnabled = form.watch('carryoverEnabled');
  const requireApproval = form.watch('requireApproval');

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }
        const data = await response.json();
        if (data.data) {
          setOrganization(data.data);
          form.reset({
            defaultVacationDays: data.data.defaultVacationDays || 30,
            carryoverEnabled: data.data.carryoverEnabled ?? true,
            carryoverMaxDays: data.data.carryoverMaxDays || 5,
            carryoverExpiryDate: data.data.carryoverExpiryDate || '03-31',
            sickLeaveAuThreshold: data.data.sickLeaveAuThreshold || 3,
            requireApproval: data.data.requireApproval ?? true,
            autoApproveThreshold: data.data.autoApproveThreshold,
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load organization'
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganization();
  }, [form]);

  const onSubmit = async (data: PoliciesFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save policies');
      }

      const result = await response.json();
      setOrganization(result.data);
      toast.success('Leave policies saved successfully');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save policies'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
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
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No organization found. Please create an organization first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Vacation Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Vacation Policy</CardTitle>
              <CardDescription>
                Configure default vacation entitlements for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="defaultVacationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Annual Vacation Days</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="w-32" />
                    </FormControl>
                    <FormDescription>
                      Standard vacation entitlement for new employees (German
                      minimum: 20 days for 5-day week)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Carryover Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Carryover Policy</CardTitle>
              <CardDescription>
                Configure how unused vacation days are handled at year end
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="carryoverEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-x-4 rounded-lg border p-4">
                    <div className="flex-1 space-y-0.5 text-left">
                      <FormLabel className="text-base">
                        Allow Vacation Carryover
                      </FormLabel>
                      <FormDescription>
                        Allow unused vacation days to carry over to the next
                        year
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

              {carryoverEnabled && (
                <>
                  <FormField
                    control={form.control}
                    name="carryoverMaxDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Carryover Days</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-32" />
                        </FormControl>
                        <FormDescription>
                          Maximum number of days that can be carried over
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carryoverExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carryover Expiry Date</FormLabel>
                        <FormControl>
                          <Input {...field} className="w-32" placeholder="MM-DD" />
                        </FormControl>
                        <FormDescription>
                          Date by which carried-over days must be used (German
                          standard: March 31st = 03-31)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Sick Leave Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Sick Leave Policy</CardTitle>
              <CardDescription>
                Configure sick leave documentation requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="sickLeaveAuThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Doctor&apos;s Note Required After (Days)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="w-32" />
                    </FormControl>
                    <FormDescription>
                      Number of consecutive sick days after which a
                      doctor&apos;s certificate (AU) is required. German
                      standard: 3 days (can be changed to 1 day by employer)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Approval Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Policy</CardTitle>
              <CardDescription>
                Configure leave request approval workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="requireApproval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-x-4 rounded-lg border p-4">
                    <div className="flex-1 space-y-0.5 text-left">
                      <FormLabel className="text-base">
                        Require Approval for Leave Requests
                      </FormLabel>
                      <FormDescription>
                        All leave requests must be approved by a manager
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

              {requireApproval && (
                <FormField
                  control={form.control}
                  name="autoApproveThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auto-Approve Threshold (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-32"
                          placeholder="Disabled"
                        />
                      </FormControl>
                      <FormDescription>
                        Automatically approve requests up to this many days.
                        Leave empty to require approval for all requests.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Policies'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
