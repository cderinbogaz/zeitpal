
import {
  Rocket,
  Zap,
  Clock,
  Users,
  Shield,
  Heart,
} from 'lucide-react';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SEOLandingPage } from '~/(marketing)/_components/seo-landing-page';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:useCases.startups.metaTitle'),
    description: t('marketing:useCases.startups.metaDescription'),
  };
};

async function FuerStartupsPage() {
  const { t } = await createI18nServerInstance();

  const features = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Free Forever',
      description: 'For teams up to 5 people. No hidden costs, no credit card.',
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Ready in 5 Minutes',
      description: 'Register, invite team, get started. No complicated setup.',
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Save Time',
      description: 'No Excel lists, no emails. Everything in one place.',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Team Transparency',
      description: 'Everyone sees who is on vacation when. Better planning for all.',
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: 'Grows With You',
      description: 'As your team grows, simply upgrade. Fair pricing.',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Professional From Day One',
      description: 'GDPR-compliant and secure - even if you are still small.',
    },
  ];

  const benefits = [
    'Free for teams up to 5 people - permanently',
    'Professional leave management from day one',
    'No time wasted on HR bureaucracy',
    'Mobile-first - perfect for modern teams',
    'Automatic calculation of vacation entitlements',
    'Easy upgrade when the team grows',
  ];

  const faqItems = [
    {
      question: 'Is the Starter plan really free forever?',
      answer: 'Yes! The Starter plan for teams up to 5 people is permanently free. No time limit, no hidden costs.',
    },
    {
      question: 'What happens when we grow to 6 employees?',
      answer: 'You can upgrade to the Team plan anytime (€4.99/user/month). All data is preserved.',
    },
    {
      question: 'Can we also use ZeitPal for interns?',
      answer: 'Yes, any employee - whether full-time, part-time or intern - can use ZeitPal. Pro-rata vacation entitlements are automatically calculated.',
    },
  ];

  const relatedLinks = [
    { href: '/for-smes', label: 'For SMEs' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/leave-management', label: 'Leave Management' },
    { href: '/features', label: 'All Features' },
  ];

  return (
    <SEOLandingPage
      title={t('marketing:useCases.startups.h1')}
      subtitle={t('marketing:useCases.startups.subtitle')}
      features={features}
      benefits={benefits}
      ctaText="Start Free for Startups"
      ctaHref="/auth/sign-up"
      relatedLinks={relatedLinks}
      faqItems={faqItems}
    />
  );
}

export default withI18n(FuerStartupsPage);
