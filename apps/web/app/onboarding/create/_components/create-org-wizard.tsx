'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCreateOrganization } from '~/lib/hooks';

import { Button } from '@kit/ui/button';
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
import { cn } from '@kit/ui/utils';

import pathsConfig from '~/config/paths.config';
import { BUNDESLAND_NAMES, type Bundesland } from '~/lib/types';

const bundeslandOptions = Object.entries(BUNDESLAND_NAMES) as [Bundesland, { en: string; de: string }][];

const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
});

const step2Schema = z.object({
  bundesland: z.string().min(1, 'Please select a federal state'),
});

const step3Schema = z.object({
  defaultVacationDays: z.coerce.number().min(20).max(50),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FormData = z.infer<typeof fullSchema>;

const steps = [
  { title: 'Organization', description: 'Basic information' },
  { title: 'Location', description: 'Federal state' },
  { title: 'Policy', description: 'Leave settings' },
];

type SlugAvailability = 'idle' | 'checking' | 'available' | 'taken';

export function CreateOrgWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const createOrganization = useCreateOrganization();
  const [slugAvailability, setSlugAvailability] = useState<SlugAvailability>('idle');
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedSlug = useRef<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      name: '',
      slug: '',
      bundesland: '',
      defaultVacationDays: 30,
    },
    mode: 'onChange',
  });

  const _watchName = form.watch('name');

  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugAvailability('idle');
      return null;
    }

    if (lastCheckedSlug.current === slug) {
      if (slugAvailability === 'available') {
        return true;
      }
      if (slugAvailability === 'taken') {
        return false;
      }
      return null;
    }

    setSlugAvailability('checking');

    try {
      const response = await fetch(`/api/organizations/check-slug?slug=${encodeURIComponent(slug)}`);
      const result = await response.json();
      lastCheckedSlug.current = slug;

      if (result.data?.available) {
        setSlugAvailability('available');
        form.clearErrors('slug');
        return true;
      }

      setSlugAvailability('taken');
      form.setError('slug', {
        type: 'manual',
        message: 'This URL is already taken. Please choose a different one.',
      });
      return false;
    } catch {
      setSlugAvailability('idle');
      return null;
    }
  }, [form, slugAvailability]);

  const debouncedCheckSlug = useCallback((slug: string) => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (slugAvailability === 'taken') {
      form.clearErrors('slug');
    }
    setSlugAvailability('idle');

    checkTimeoutRef.current = setTimeout(() => {
      void checkSlugAvailability(slug);
    }, 500);
  }, [checkSlugAvailability, form, slugAvailability]);

  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    form.setValue('slug', slug);
    debouncedCheckSlug(slug);
  };

  const handleSlugChange = (value: string) => {
    form.setValue('slug', value, { shouldValidate: true });
    debouncedCheckSlug(value);
  };

  const ensureSlugAvailable = useCallback(async () => {
    const slug = form.getValues('slug');

    if (!slug || slug.length < 2) {
      return true;
    }

    const isAvailable = await checkSlugAvailability(slug);

    if (slugAvailability === 'checking') {
      return false;
    }

    return isAvailable !== false;
  }, [checkSlugAvailability, form, slugAvailability]);

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    switch (currentStep) {
      case 0:
        fieldsToValidate = ['name', 'slug'];
        break;
      case 1:
        fieldsToValidate = ['bundesland'];
        break;
      case 2:
        fieldsToValidate = ['defaultVacationDays'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    if (currentStep === 0) {
      const canProceed = await ensureSlugAvailable();
      if (!canProceed) {
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data: FormData) => {
    try {
      const canProceed = await ensureSlugAvailable();
      if (!canProceed) {
        return;
      }

      await createOrganization.mutateAsync({
        name: data.name,
        slug: data.slug,
        bundesland: data.bundesland as import('~/lib/types').Bundesland,
        defaultVacationDays: data.defaultVacationDays,
      });

      toast.success('Organization created successfully!');
      router.push(pathsConfig.app.home);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create organization');
    }
  };

  const isSubmitting = createOrganization.isPending;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                  index < currentStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : index === currentStep
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground'
                )}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="mt-1 text-xs">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-12',
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Organization Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder=""
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
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
                    <FormLabel>URL Slug</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder=""
                        onChange={(e) => handleSlugChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Your organization URL: zeitpal.com/{field.value || 'your-org'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="bundesland"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Federal State (Bundesland)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bundeslandOptions.map(([code, names]) => (
                          <SelectItem key={code} value={code}>
                            {names.de}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This determines which public holidays apply to your organization.
                      Each German state has different holidays.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Policy */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="defaultVacationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Vacation Days</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="w-24" />
                    </FormControl>
                    <FormDescription>
                      Annual vacation entitlement for employees. German law requires
                      a minimum of 20 days for a 5-day work week.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="mb-2 font-medium">You can customize later:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• Carryover rules</li>
                  <li>• Sick leave certificate requirements</li>
                  <li>• Approval workflows</li>
                  <li>• Leave types and policies</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
