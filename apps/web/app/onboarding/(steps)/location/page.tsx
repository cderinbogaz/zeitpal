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
  BUNDESLAND_NAMES,
  COUNTRIES,
  type CountryCode,
} from '~/lib/types';

import { OnboardingStepWrapper } from '../../_components/onboarding-step-wrapper';
import { StepInfoBox } from '../../_components/step-info-box';

// Region data for countries with regional holidays
const REGIONS: Record<string, Array<{ code: string; name: string }>> = {
  DE: Object.entries(BUNDESLAND_NAMES).map(([code, names]) => ({
    code,
    name: names.de,
  })),
  AT: [
    { code: 'W', name: 'Wien' },
    { code: 'NOE', name: 'Niederösterreich' },
    { code: 'OOE', name: 'Oberösterreich' },
    { code: 'SBG', name: 'Salzburg' },
    { code: 'T', name: 'Tirol' },
    { code: 'VBG', name: 'Vorarlberg' },
    { code: 'KTN', name: 'Kärnten' },
    { code: 'STMK', name: 'Steiermark' },
    { code: 'BGLD', name: 'Burgenland' },
  ],
  CH: [
    { code: 'ZH', name: 'Zürich' },
    { code: 'BE', name: 'Bern' },
    { code: 'LU', name: 'Luzern' },
    { code: 'ZG', name: 'Zug' },
    { code: 'BS', name: 'Basel-Stadt' },
    { code: 'BL', name: 'Basel-Landschaft' },
    { code: 'AG', name: 'Aargau' },
    { code: 'SG', name: 'St. Gallen' },
    { code: 'GR', name: 'Graubünden' },
    { code: 'TI', name: 'Tessin' },
    { code: 'VD', name: 'Waadt' },
    { code: 'GE', name: 'Genf' },
  ],
  GB: [
    { code: 'ENG', name: 'England' },
    { code: 'SCT', name: 'Scotland' },
    { code: 'WLS', name: 'Wales' },
    { code: 'NIR', name: 'Northern Ireland' },
  ],
};

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
  const hasRegions = countryConfig?.hasRegionalHolidays && REGIONS[selectedCountry];
  const regions = REGIONS[selectedCountry] || [];

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
