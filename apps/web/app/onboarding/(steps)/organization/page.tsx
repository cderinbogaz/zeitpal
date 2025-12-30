'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@kit/ui/utils';
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

import { useOnboarding } from '~/lib/contexts/onboarding-context';

import { OnboardingStepWrapper } from '../../_components/onboarding-step-wrapper';
import { StepInfoBox } from '../../_components/step-info-box';

const organizationSchema = z.object({
  organizationName: z.string().min(2, 'Name must be at least 2 characters'),
  organizationSlug: z
    .string()
    .min(2, 'URL must be at least 2 characters')
    .max(50, 'URL must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

type SlugAvailability = 'idle' | 'checking' | 'available' | 'taken';

export default function OrganizationPage() {
  const router = useRouter();
  const { state, updateData, goToStep, markStepCompleted } = useOnboarding();
  const [slugAvailability, setSlugAvailability] = useState<SlugAvailability>('idle');
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedSlug = useRef<string>('');

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationName: state.data.organizationName || '',
      organizationSlug: state.data.organizationSlug || '',
    },
    mode: 'onChange',
  });

  // Check slug availability with debounce
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugAvailability('idle');
      return;
    }

    // Skip if we already checked this slug
    if (lastCheckedSlug.current === slug) {
      return;
    }

    setSlugAvailability('checking');

    try {
      const response = await fetch(`/api/organizations/check-slug?slug=${encodeURIComponent(slug)}`);

      const data = await response.json();
      lastCheckedSlug.current = slug;

      if (data.available) {
        setSlugAvailability('available');
      } else {
        setSlugAvailability('taken');
        form.setError('organizationSlug', {
          type: 'manual',
          message: 'This URL is already taken. Please choose a different one.',
        });
      }
    } catch {
      setSlugAvailability('idle');
    }
  }, [form]);

  // Debounced slug check
  const debouncedCheckSlug = useCallback((slug: string) => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Clear error when user starts typing
    if (slugAvailability === 'taken') {
      form.clearErrors('organizationSlug');
    }
    setSlugAvailability('idle');

    checkTimeoutRef.current = setTimeout(() => {
      checkSlugAvailability(slug);
    }, 500);
  }, [checkSlugAvailability, form, slugAvailability]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Check initial slug if present
  useEffect(() => {
    const initialSlug = state.data.organizationSlug;
    if (initialSlug && initialSlug.length >= 2) {
      checkSlugAvailability(initialSlug);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue('organizationName', value);
    // Only auto-generate if user hasn't manually edited the slug
    const currentSlug = form.getValues('organizationSlug');
    const previousName = state.data.organizationName || '';
    const expectedSlug = previousName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!currentSlug || currentSlug === expectedSlug) {
      const newSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      form.setValue('organizationSlug', newSlug, { shouldValidate: true });
      debouncedCheckSlug(newSlug);
    }
  };

  // Handle manual slug changes
  const handleSlugChange = (value: string) => {
    form.setValue('organizationSlug', value, { shouldValidate: true });
    debouncedCheckSlug(value);
  };

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    // Prevent proceeding if slug is taken or still checking
    if (slugAvailability === 'taken') {
      form.setError('organizationSlug', {
        type: 'manual',
        message: 'This URL is already taken. Please choose a different one.',
      });
      return;
    }

    if (slugAvailability === 'checking') {
      // Wait for the check to complete
      return;
    }

    const values = form.getValues();
    updateData({
      organizationName: values.organizationName,
      organizationSlug: values.organizationSlug,
    });
    markStepCompleted('organization');
    goToStep('location');
    router.push('/onboarding/location');
  };

  return (
    <OnboardingStepWrapper
      title="Name Your Organization"
      description="This is your company's workspace in ZeitPal"
      showBack={true}
      prevStep="profile"
      onNext={handleNext}
    >
      <Form {...form}>
        <form className="space-y-6">
          {/* Header icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>

          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder=""
                    {...field}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  Your company or team name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="organizationSlug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Unique URL</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                      zeitpal.com/
                    </span>
                    <div className="relative flex-1">
                      <Input
                        placeholder=""
                        className={cn(
                          "rounded-l-none pr-10",
                          slugAvailability === 'taken' && "border-destructive focus-visible:ring-destructive",
                          slugAvailability === 'available' && "border-green-500 focus-visible:ring-green-500"
                        )}
                        {...field}
                        onChange={(e) => handleSlugChange(e.target.value)}
                      />
                      {field.value && field.value.length >= 2 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {slugAvailability === 'checking' && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {slugAvailability === 'available' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {slugAvailability === 'taken' && (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Share this link with your team members to join
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <StepInfoBox variant="info">
            Your organization name and URL can be changed later in settings.
          </StepInfoBox>
        </form>
      </Form>
    </OnboardingStepWrapper>
  );
}
