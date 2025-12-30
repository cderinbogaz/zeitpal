'use client';

import Image from 'next/image';

import {
  ArrowRightIcon,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Bell,
  Smartphone,
  Globe,
  Lock,
  Scale,
  Server,
  Shield,
  Users,
  PlayCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LocalizedLink } from '~/components/localized-link';

import {
  CtaButton,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
  Pill,
  StatsSection,
  TrustBadges,
  TestimonialCard,
  CTASection,
  FAQAccordion,
} from '@kit/ui/marketing';
import {
  AnimatedGradientText,
  AnimatedList,
  Marquee,
} from '@kit/ui/magicui';

function Home() {
  const { t } = useTranslation('marketing');

  const stats = [
    { value: '10,000+', label: t('stats.daysManaged') },
    { value: '500+', label: t('stats.teams') },
    { value: '4.9/5', label: t('stats.rating') },
    { value: '99.9%', label: t('stats.uptime') },
  ];

  const trustBadges = [
    { icon: <Shield className="h-4 w-4" />, label: t('trust.gdprCompliant') },
    { icon: '🇩🇪', label: t('trust.madeInGermany') },
    { icon: <Lock className="h-4 w-4" />, label: t('trust.sslEncrypted') },
    { icon: <Server className="h-4 w-4" />, label: t('trust.germanServers') },
    { icon: <Check className="h-4 w-4" />, label: t('trust.noHiddenCosts') },
  ];

  const testimonials = [
    {
      quote: t('testimonials.1.quote'),
      author: t('testimonials.1.author'),
      role: t('testimonials.1.role'),
      company: t('testimonials.1.company'),
      rating: 5,
    },
    {
      quote: t('testimonials.2.quote'),
      author: t('testimonials.2.author'),
      role: t('testimonials.2.role'),
      company: t('testimonials.2.company'),
      rating: 5,
    },
    {
      quote: t('testimonials.3.quote'),
      author: t('testimonials.3.author'),
      role: t('testimonials.3.role'),
      company: t('testimonials.3.company'),
      rating: 5,
    },
    {
      quote: t('testimonials.4.quote'),
      author: t('testimonials.4.author'),
      role: t('testimonials.4.role'),
      company: t('testimonials.4.company'),
      rating: 5,
    },
  ];

  const faqItems = t('faqItems', { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  const _featureIcons: Record<string, React.ReactNode> = {
    leaveManagement: <FileText className="h-5 w-5" />,
    teamCalendar: <Calendar className="h-5 w-5" />,
    sickLeave: <Clock className="h-5 w-5" />,
    approvals: <CheckCircle className="h-5 w-5" />,
    balances: <BarChart3 className="h-5 w-5" />,
    reports: <BarChart3 className="h-5 w-5" />,
    notifications: <Bell className="h-5 w-5" />,
    mobile: <Smartphone className="h-5 w-5" />,
    integrations: <Globe className="h-5 w-5" />,
    germanLaw: <Scale className="h-5 w-5" />,
  };

  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      {/* Hero Section */}
      <div className={'container mx-auto'}>
        <Hero
          pill={
            <Pill label={t('hero.pill')}>
              <span>{t('hero.pill')}</span>
            </Pill>
          }
          title={
            <span className="block">
              <AnimatedGradientText>{t('hero.title')}</AnimatedGradientText>
            </span>
          }
          subtitle={
            <span>
              {t('hero.subtitle')}
            </span>
          }
          cta={<MainCallToActionButton />}
          image={
            <Image
              priority
              className={
                'dark:border-primary/10 rounded-2xl border border-gray-200 shadow-2xl'
              }
              width={3558}
              height={2222}
              src={`/images/dashboard.webp`}
              alt={`ZeitPal Dashboard - Leave Management`}
            />
          }
        />
      </div>

      {/* Trust Badges */}
      <div className={'container mx-auto'}>
        <TrustBadges badges={trustBadges} />
      </div>

      {/* Stats Section */}
      <div className={'container mx-auto'}>
        <StatsSection
          heading={t('stats.heading')}
          stats={stats}
        />
      </div>

      {/* Features Section */}
      <div className={'container mx-auto'}>
        <div className={'flex flex-col space-y-16 xl:space-y-32 2xl:space-y-36'}>
          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  {t('features.title')}
                </b>
                .{' '}
                <span className="text-muted-foreground font-normal">
                  {t('features.subtitle')}
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <Users className="h-5" />
                <span>{t('features.title')}</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-2 overflow-hidden'}
                label={t('features.leaveManagement.title')}
                description={t('features.leaveManagement.description')}
              />

              <FeatureCard
                className={'relative col-span-2 w-full overflow-hidden lg:col-span-1'}
                label={t('features.teamCalendar.title')}
                description={t('features.teamCalendar.description')}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={t('features.sickLeave.title')}
                description={t('features.sickLeave.description')}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={t('features.approvals.title')}
                description={t('features.approvals.description')}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={t('features.balances.title')}
                description={t('features.balances.description')}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden'}
                label={t('features.germanLaw.title')}
                description={t('features.germanLaw.description')}
              />
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      {/* Live Updates Demo */}
      <div className={'container mx-auto'}>
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              {t('liveUpdates.heading')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              {t('liveUpdates.subheading')}
            </p>
          </div>
          <div className="flex-1 w-full max-w-md overflow-hidden">
            <AnimatedList delay={2000} className="w-full">
              <div className="flex items-center gap-3 p-4 bg-card border rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('liveUpdates.item1')}</p>
                  <p className="text-xs text-muted-foreground">{t('liveUpdates.time1')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card border rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('liveUpdates.item2')}</p>
                  <p className="text-xs text-muted-foreground">{t('liveUpdates.time2')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card border rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('liveUpdates.item3')}</p>
                  <p className="text-xs text-muted-foreground">{t('liveUpdates.time3')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card border rounded-lg shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('liveUpdates.item4')}</p>
                  <p className="text-xs text-muted-foreground">{t('liveUpdates.time4')}</p>
                </div>
              </div>
            </AnimatedList>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className={'container mx-auto'}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('testimonials.heading')}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            {t('testimonials.subheading')}
          </p>
        </div>
        <div className="relative flex flex-col overflow-hidden">
          <Marquee pauseOnHover className="[--duration:35s]">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                company={testimonial.company}
                rating={testimonial.rating}
                className="w-[350px] shrink-0"
              />
            ))}
          </Marquee>
        </div>
      </div>

      {/* FAQ Section */}
      <div className={'container mx-auto max-w-3xl'}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('faq')}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            {t('faqSubtitle')}
          </p>
        </div>
        <FAQAccordion items={faqItems} />
      </div>

      {/* CTA Section */}
      <div className={'container mx-auto'}>
        <CTASection
          heading={t('ctaSection.heading')}
          subheading={t('ctaSection.subheading')}
          variant="centered"
          primaryCta={{
            text: t('ctaSection.startFree'),
            href: '/auth/sign-up',
          }}
          secondaryCta={{
            text: t('cta.watchDemo'),
            href: '/demo',
          }}
        />
      </div>
    </div>
  );
}

export { Home as HomeClient };

function MainCallToActionButton() {
  const { t } = useTranslation('marketing');

  return (
    <div className={'flex flex-col sm:flex-row gap-4'}>
      <CtaButton>
        <LocalizedLink href={'/auth/sign-up'}>
          <span className={'flex items-center space-x-2'}>
            <span>{t('hero.cta')}</span>
            <ArrowRightIcon
              className={
                'animate-in fade-in slide-in-from-left-8 h-4' +
                ' zoom-in fill-mode-both delay-1000 duration-1000'
              }
            />
          </span>
        </LocalizedLink>
      </CtaButton>

      <CtaButton variant={'outline'}>
        <LocalizedLink href={'/demo'}>
          <span className={'flex items-center space-x-2'}>
            <PlayCircle className="h-4 w-4" />
            <span>{t('hero.ctaSecondary')}</span>
          </span>
        </LocalizedLink>
      </CtaButton>
    </div>
  );
}
