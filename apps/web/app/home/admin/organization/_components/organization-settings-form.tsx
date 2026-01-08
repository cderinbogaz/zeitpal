'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
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
import { Separator } from '@kit/ui/separator';
import { Skeleton } from '@kit/ui/skeleton';
import { Switch } from '@kit/ui/switch';
import { Trans } from '@kit/ui/trans';

import { useOrganization, useUpdateOrganization } from '~/lib/hooks/use-organization';
import { COUNTRIES, REGIONS_BY_COUNTRY, type CountryCode } from '~/lib/types';

const organizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  country: z.string().min(1, 'Please select a country'),
  region: z.string().optional(),
  defaultVacationDays: z.coerce.number().min(20).max(50),
  carryoverEnabled: z.boolean(),
  carryoverMaxDays: z.coerce.number().min(0).max(30),
  sickLeaveAuThreshold: z.coerce.number().min(1).max(7),
  requireApproval: z.boolean(),
  autoApproveThreshold: z.coerce.number().min(0).max(10).nullable(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

const defaultFormValues: OrganizationFormData = {
  name: '',
  slug: '',
  country: 'DE',
  region: '',
  defaultVacationDays: 30,
  carryoverEnabled: true,
  carryoverMaxDays: 5,
  sickLeaveAuThreshold: 3,
  requireApproval: true,
  autoApproveThreshold: null,
};

export function OrganizationSettingsForm() {
  const { data: organization, isLoading, error } = useOrganization();
  const updateOrganization = useUpdateOrganization();

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: defaultFormValues,
  });

  // Populate form when organization data loads
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        slug: organization.slug || '',
        country: organization.country || 'DE',
        region: organization.region || '',
        defaultVacationDays: organization.defaultVacationDays ?? 30,
        carryoverEnabled: organization.carryoverEnabled ?? true,
        carryoverMaxDays: organization.carryoverMaxDays ?? 5,
        sickLeaveAuThreshold: organization.sickLeaveAuThreshold ?? 3,
        requireApproval: organization.requireApproval ?? true,
        autoApproveThreshold: organization.autoApproveThreshold ?? null,
      });
    }
  }, [organization, form]);

  const selectedCountry = form.watch('country') as CountryCode;
  const regionValue = form.watch('region');
  const regionOptions = REGIONS_BY_COUNTRY[selectedCountry] || [];
  const normalizedRegionValue = typeof regionValue === 'string' ? regionValue.trim() : '';
  const hasRegions = regionOptions.length > 0 || normalizedRegionValue.length > 0;

  const regionOptionsWithValue = useMemo(() => {
    if (!normalizedRegionValue) {
      return regionOptions;
    }

    if (regionOptions.some((option) => option.code === normalizedRegionValue)) {
      return regionOptions;
    }

    return [{ code: normalizedRegionValue, name: normalizedRegionValue }, ...regionOptions];
  }, [normalizedRegionValue, regionOptions]);

  useEffect(() => {
    if (!normalizedRegionValue || regionOptions.length === 0) {
      return;
    }

    const match = regionOptions.find(
      (option) => option.name.toLowerCase() === normalizedRegionValue.toLowerCase()
    );

    if (match) {
      form.setValue('region', match.code, { shouldValidate: true });
    }
  }, [form, normalizedRegionValue, regionOptions]);

  const carryoverEnabled = form.watch('carryoverEnabled');
  const requireApproval = form.watch('requireApproval');

  const handleCountryChange = (value: string) => {
    form.setValue('country', value, { shouldValidate: true });
    form.setValue('region', '');
  };

  const onSubmit = async (data: OrganizationFormData) => {
    if (hasRegions && !data.region) {
      form.setError('region', { message: 'Please select a state/region' });
      return;
    }

    try {
      await updateOrganization.mutateAsync({
        name: data.name,
        country: data.country as CountryCode,
        region: data.region ? data.region : null,
        defaultVacationDays: data.defaultVacationDays,
        carryoverEnabled: data.carryoverEnabled,
        carryoverMaxDays: data.carryoverMaxDays,
        sickLeaveAuThreshold: data.sickLeaveAuThreshold,
        requireApproval: data.requireApproval,
        autoApproveThreshold: data.autoApproveThreshold ?? undefined,
      });
      toast.success('Organization settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  if (isLoading) {
    return <OrganizationFormSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Failed to load organization settings</p>
        </CardContent>
      </Card>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center">
          <p className="text-muted-foreground">No organization found. Please create one first.</p>
          <Button asChild>
            <Link href="/onboarding/create">Create an organization</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              General organization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="admin:organization.name" />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="admin:organization.slug" />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Used in URLs: zeitpal.com/{field.value}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="admin:organization.country" defaults="Country" />
                  </FormLabel>
                  <Select onValueChange={handleCountryChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.filter((country) => country.isActive).map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.nameEn}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <Trans
                      i18nKey="admin:organization.countryHelp"
                      defaults="Where is your organization based?"
                    />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasRegions && (
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans i18nKey="admin:organization.region" defaults="State / Region" />
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state/region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                    {regionOptionsWithValue.map((region) => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      <Trans
                        i18nKey="admin:organization.regionHelp"
                        defaults="Regional public holidays may vary"
                      />
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Leave Policy */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="admin:policies.title" />
            </CardTitle>
            <CardDescription>
              Configure default leave entitlements and rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="defaultVacationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="admin:policies.defaultVacationDays" />
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="w-24" />
                  </FormControl>
                  <FormDescription>
                    <Trans i18nKey="admin:policies.defaultVacationDaysHelp" />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="carryoverEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      <Trans i18nKey="admin:policies.carryoverEnabled" />
                    </FormLabel>
                    <FormDescription>
                      Allow unused vacation days to carry over to the next year
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
              <FormField
                control={form.control}
                name="carryoverMaxDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans i18nKey="admin:policies.carryoverMaxDays" />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="w-24" />
                    </FormControl>
                    <FormDescription>
                      Maximum days that can be carried over (German law: typically expires March 31)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            <FormField
              control={form.control}
              name="sickLeaveAuThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="admin:policies.auThreshold" />
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="w-24" />
                  </FormControl>
                  <FormDescription>
                    <Trans i18nKey="admin:policies.auThresholdHelp" />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Approval Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="admin:policies.approval" />
            </CardTitle>
            <CardDescription>
              Configure approval workflow settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="requireApproval"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      <Trans i18nKey="admin:policies.requireApproval" />
                    </FormLabel>
                    <FormDescription>
                      Require manager approval for leave requests
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
                    <FormLabel>
                      <Trans i18nKey="admin:policies.autoApproveThreshold" />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-24"
                        placeholder="0"
                      />
                    </FormControl>
                    <FormDescription>
                      <Trans i18nKey="admin:policies.autoApproveHelp" />
                      {' '}Leave empty to require approval for all requests.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={updateOrganization.isPending}>
            {updateOrganization.isPending ? 'Saving...' : <Trans i18nKey="admin:organization.save" />}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function OrganizationFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
