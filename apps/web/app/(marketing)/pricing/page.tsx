
import { ArrowRight, Check } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import { LocalizedLink } from '~/components/localized-link';
import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:pricing.metaTitle'),
    description: t('marketing:pricing.metaDescription'),
  };
};

async function PricingPage() {
  const { t } = await createI18nServerInstance();

  const pricingPlans = [
    {
      name: t('marketing:pricing.starter.name'),
      price: t('marketing:pricing.starter.price'),
      description: t('marketing:pricing.starter.description'),
      features: t('marketing:pricing.starter.features', { returnObjects: true }) as string[],
      cta: t('marketing:pricing.getStarted'),
      ctaHref: '/auth/sign-up',
      highlighted: false,
      badge: t('marketing:pricing.freeForever'),
    },
    {
      name: t('marketing:pricing.team.name'),
      price: t('marketing:pricing.team.price'),
      description: t('marketing:pricing.team.description'),
      features: t('marketing:pricing.team.features', { returnObjects: true }) as string[],
      cta: t('marketing:pricing.getStarted'),
      ctaHref: '/auth/sign-up',
      highlighted: true,
      badge: t('marketing:pricing.mostPopular'),
    },
    {
      name: t('marketing:pricing.enterprise.name'),
      price: t('marketing:pricing.enterprise.price'),
      description: t('marketing:pricing.enterprise.description'),
      features: t('marketing:pricing.enterprise.features', { returnObjects: true }) as string[],
      cta: t('marketing:pricing.contactSales'),
      ctaHref: '/contact',
      highlighted: false,
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ZeitPal',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: pricingPlans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price === 'Custom' ? undefined : plan.price,
      priceCurrency: plan.price === 'Custom' ? undefined : 'EUR',
      description: plan.description,
    })),
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
          title={t('marketing:pricing.title')}
          subtitle={t('marketing:pricing.subtitle')}
        />

        <div className={'container pb-16'}>
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{t('marketing:pricing.noCreditCard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{t('marketing:pricing.noHiddenFees')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{t('marketing:pricing.freeForever')}</span>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} plan={plan} />
            ))}
          </div>

          {/* FAQ Link */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              <Trans i18nKey={'marketing:pricingFaqPrompt'} defaults="Have questions about pricing?" />
            </p>
            <Button asChild variant={'outline'}>
              <LocalizedLink href={'/faq'}>
                <span>
                  <Trans i18nKey={'marketing:faq'} />
                </span>
                <ArrowRight className={'ml-2 w-4'} />
              </LocalizedLink>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default withI18n(PricingPage);

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}

function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <div
      className={`relative rounded-2xl border p-8 flex flex-col ${
        plan.highlighted
          ? 'border-primary shadow-lg scale-105 bg-gradient-to-b from-primary/5 to-transparent'
          : 'border-border'
      }`}
    >
      {plan.badge && (
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold ${
            plan.highlighted
              ? 'bg-primary text-primary-foreground'
              : 'bg-green-500 text-white'
          }`}
        >
          {plan.badge}
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
        <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
        <div className="flex items-baseline justify-center gap-1">
          {plan.price !== 'Custom' ? (
            <>
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">
                <Trans i18nKey={'marketing:pricing.perUser'} />
              </span>
            </>
          ) : (
            <span className="text-4xl font-bold">{plan.price}</span>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-8 flex-grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant={plan.highlighted ? 'default' : 'outline'}
        className="w-full"
        size="lg"
      >
        <LocalizedLink href={plan.ctaHref}>
          {plan.cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </LocalizedLink>
      </Button>
    </div>
  );
}
