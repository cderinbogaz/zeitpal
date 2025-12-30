
import {
  Building2,
  Users,
  BarChart3,
  Shield,
  Globe,
  Headphones,
} from 'lucide-react';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SEOLandingPage } from '~/(marketing)/_components/seo-landing-page';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:useCases.mittelstand.metaTitle'),
    description: t('marketing:useCases.mittelstand.metaDescription'),
  };
};

async function FuerMittelstandPage() {
  const { t } = await createI18nServerInstance();

  const features = [
    {
      icon: <Building2 className="h-8 w-8" />,
      title: 'Multiple Teams & Departments',
      description: 'Organize employees in teams with their own approval workflows.',
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Advanced Reports',
      description: 'Detailed statistics on absences, sick leave rates, and vacation quotas.',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Flexible Approval Chains',
      description: 'Define multi-level approval workflows by absence type.',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Slack & Calendar Integration',
      description: 'Connect ZeitPal with the tools you already use.',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'German Labor Law Compliant',
      description: 'BUrlG-compliant with holidays by federal state and sick note reminders.',
    },
    {
      icon: <Headphones className="h-8 w-8" />,
      title: 'Priority Support',
      description: 'Quick help with questions. Personal support available.',
    },
  ];

  const benefits = [
    'Scalable solution for 6-50+ employees',
    'Multi-level approval workflows',
    'Detailed reports for HR and management',
    'Integration with existing tools',
    'Compliant with German labor law',
    'Personal support during implementation',
  ];

  const faqItems = [
    {
      question: 'Can we manage multiple locations with different holidays?',
      answer: 'Yes, you can specify the corresponding federal state for each location. Holidays are automatically considered correctly.',
    },
    {
      question: 'How does migration from our current system work?',
      answer: 'Our team supports you with importing existing data. Excel imports are possible, and we help with setup.',
    },
    {
      question: 'Are there volume discounts for larger teams?',
      answer: 'Yes, for teams of 50+ employees we offer custom enterprise pricing. Contact us for a quote.',
    },
  ];

  const relatedLinks = [
    { href: '/for-startups', label: 'For Startups' },
    { href: '/hr-software', label: 'HR Software' },
    { href: '/absence-management', label: 'Absence Management' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <SEOLandingPage
      title={t('marketing:useCases.mittelstand.h1')}
      subtitle={t('marketing:useCases.mittelstand.subtitle')}
      features={features}
      benefits={benefits}
      ctaText="Try Team Plan for Free"
      ctaHref="/auth/sign-up"
      relatedLinks={relatedLinks}
      faqItems={faqItems}
    />
  );
}

export default withI18n(FuerMittelstandPage);
