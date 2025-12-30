
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Bell,
  Smartphone,
  Globe,
  Scale,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';
import { AnimatedShinyText } from '@kit/ui/magicui';

import { LocalizedLink } from '~/components/localized-link';
import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:features.metaTitle'),
    description: t('marketing:features.metaDescription'),
  };
};

async function FeaturesPage() {
  const { t } = await createI18nServerInstance();

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: t('marketing:features.leaveManagement.title'),
      description: t('marketing:features.leaveManagement.description'),
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: t('marketing:features.teamCalendar.title'),
      description: t('marketing:features.teamCalendar.description'),
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: t('marketing:features.sickLeave.title'),
      description: t('marketing:features.sickLeave.description'),
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: t('marketing:features.approvals.title'),
      description: t('marketing:features.approvals.description'),
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: t('marketing:features.balances.title'),
      description: t('marketing:features.balances.description'),
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: t('marketing:features.reports.title'),
      description: t('marketing:features.reports.description'),
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: t('marketing:features.notifications.title'),
      description: t('marketing:features.notifications.description'),
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: t('marketing:features.mobile.title'),
      description: t('marketing:features.mobile.description'),
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: t('marketing:features.integrations.title'),
      description: t('marketing:features.integrations.description'),
    },
    {
      icon: <Scale className="h-8 w-8" />,
      title: t('marketing:features.germanLaw.title'),
      description: t('marketing:features.germanLaw.description'),
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ZeitPal',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    featureList: features.map((f) => f.title),
  };

  return (
    <>
      <script
        key={'ld:json'}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={'flex flex-col space-y-4 xl:space-y-8'}>
        <SitePageHeader
          title={
            <AnimatedShinyText className="text-3xl md:text-4xl font-bold">
              {t('marketing:features.title')}
            </AnimatedShinyText>
          }
          subtitle={t('marketing:features.subtitle')}
        />

        <div className={'container pb-16'}>
          {/* Features grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16 p-12 bg-muted/50 rounded-2xl max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">
              <Trans i18nKey={'marketing:ctaSection.heading'} />
            </h2>
            <p className="text-muted-foreground mb-8">
              <Trans i18nKey={'marketing:ctaSection.subheading'} />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <LocalizedLink href={'/auth/sign-up'}>
                  <Trans i18nKey={'marketing:cta.startFree'} />
                  <ArrowRight className={'ml-2 w-4'} />
                </LocalizedLink>
              </Button>
              <Button asChild variant="outline" size="lg">
                <LocalizedLink href={'/pricing'}>
                  <Trans i18nKey={'marketing:pricingLabel'} />
                  <ArrowRight className={'ml-2 w-4'} />
                </LocalizedLink>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withI18n(FeaturesPage);

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="rounded-xl border border-border p-6 hover:border-primary/50 transition-colors">
      <div className="text-primary mb-4">{feature.icon}</div>
      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
      <p className="text-muted-foreground text-sm">{feature.description}</p>
    </div>
  );
}
