'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { useOnboarding } from '~/lib/contexts/onboarding-context';
import {
  COUNTRIES,
  REGIONS_BY_COUNTRY,
  type CountryCode,
} from '~/lib/types';

import { OnboardingStepWrapper } from '../../_components/onboarding-step-wrapper';
import { StepInfoBox } from '../../_components/step-info-box';

const locationSchema = z.object({
  country: z.string().min(1, 'Please select a country'),
  region: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

export default function LocationPage() {
  const router = useRouter();
  const { state, updateData, goToStep, markStepCompleted } = useOnboarding();

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: state.data.country || 'DE',
      region: state.data.region || '',
    },
    mode: 'onChange',
  });

  const selectedCountry = form.watch('country') as CountryCode;
  const countryConfig = COUNTRIES.find((c) => c.code === selectedCountry);
  const regions = REGIONS_BY_COUNTRY[selectedCountry] || [];
  const hasRegions = countryConfig?.hasRegionalHolidays && regions.length > 0;

  const handleCountryChange = (value: string) => {
    form.setValue('country', value);
    // Reset region when country changes
    form.setValue('region', '');
  };

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    // If country has regions and none selected, require it
    if (hasRegions && !form.getValues('region')) {
      form.setError('region', { message: 'Please select a state/region' });
      return;
    }

    const values = form.getValues();
    updateData({
      country: values.country as CountryCode,
      region: values.region,
    });
    markStepCompleted('location');
    goToStep('policy');
    router.push('/onboarding/policy');
  };

  return (
    <OnboardingStepWrapper
      title="Your Location"
      description="This determines public holidays for your team"
      showBack={true}
      prevStep="organization"
      onNext={handleNext}
    >
      <Form {...form}>
        <form className="space-y-6">
          {/* Header icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </div>

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select
                  onValueChange={handleCountryChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COUNTRIES.filter((c) => c.isActive).map((country) => (
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
                  Where is your organization based?
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
                    {selectedCountry === 'DE'
                      ? 'Federal State (Bundesland)'
                      : selectedCountry === 'CH'
                        ? 'Canton'
                        : selectedCountry === 'AT'
                          ? 'Federal State (Bundesland)'
                          : 'Region'}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your state/region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedCountry === 'DE'
                      ? 'Each German state has different public holidays'
                      : 'Regional public holidays may vary'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {countryConfig?.legalNoteEn && (
            <StepInfoBox variant="info">
              <strong>{countryConfig.nameEn}:</strong>{' '}
              {countryConfig.legalNoteEn}
            </StepInfoBox>
          )}
        </form>
      </Form>
    </OnboardingStepWrapper>
  );
}
