
import {
  FileText,
  Bell,
  Clock,
  Shield,
  Smartphone,
  CheckCircle,
} from 'lucide-react';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SEOLandingPage } from '~/(marketing)/_components/seo-landing-page';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:seo.krankmeldungDigital.metaTitle'),
    description: t('marketing:seo.krankmeldungDigital.metaDescription'),
  };
};

async function KrankmeldungDigitalPage() {
  const { t } = await createI18nServerInstance();

  const features = [
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: 'Sick Leave from Mobile',
      description: 'Employees report sick with a few clicks - also from smartphone.',
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: 'Automatic Sick Note Reminder',
      description: 'After 3 days, ZeitPal automatically reminds about the sick certificate.',
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Document Upload',
      description: 'Upload sick certificates directly and archive digitally.',
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Sick Leave Statistics',
      description: 'Overview of sick days per employee and team.',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'GDPR Compliant',
      description: 'Sensitive health data is protected to highest standards.',
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'Instant Notification',
      description: 'Managers are immediately notified of sick reports.',
    },
  ];

  const benefits = [
    'No more calls at 7 in the morning',
    'Automatic sick note reminder after 3 days',
    'Digital archive for sick certificates',
    'Overview of sick days for HR',
    'Privacy-compliant processing of sensitive data',
    'Distinction between illness and child sick leave',
  ];

  const faqItems = [
    {
      question: 'When must a sick certificate be uploaded?',
      answer: 'According to German labor law, a sick certificate must be available by the 4th day of illness at the latest. ZeitPal reminds automatically.',
    },
    {
      question: 'Is health data specially protected?',
      answer: 'Yes, health data is particularly sensitive and is stored encrypted. Only authorized persons have access.',
    },
    {
      question: 'Can child sick leave also be recorded?',
      answer: 'Yes, ZeitPal distinguishes between own illness and child sick leave with separate quotas.',
    },
  ];

  const relatedLinks = [
    { href: '/absence-management', label: 'Absence Management' },
    { href: '/leave-management', label: 'Leave Management' },
    { href: '/hr-software', label: 'HR Software' },
    { href: '/features', label: 'All Features' },
  ];

  return (
    <SEOLandingPage
      title={t('marketing:seo.krankmeldungDigital.h1')}
      subtitle={t('marketing:seo.krankmeldungDigital.subtitle')}
      features={features}
      benefits={benefits}
      ctaText="Start Digital Sick Reporting"
      ctaHref="/auth/sign-up"
      relatedLinks={relatedLinks}
      faqItems={faqItems}
    />
  );
}

export default withI18n(KrankmeldungDigitalPage);
