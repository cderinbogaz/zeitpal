
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Bell,
} from 'lucide-react';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SEOLandingPage } from '~/(marketing)/_components/seo-landing-page';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:seo.urlaubsverwaltung.metaTitle'),
    description: t('marketing:seo.urlaubsverwaltung.metaDescription'),
  };
};

async function UrlaubsverwaltungPage() {
  const { t } = await createI18nServerInstance();

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Leave Requests in Seconds',
      description: 'Employees submit requests with a few clicks. No forms, no emails.',
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'One-Click Approval',
      description: 'Managers approve or reject - also from smartphone.',
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: 'Team Calendar',
      description: 'All absences at a glance. Avoid overlaps.',
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Automatic Calculation',
      description: 'Remaining leave, carryover and pro-rata entitlements are automatically calculated.',
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: 'Notifications',
      description: 'Email notifications for new requests and status changes.',
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Half Vacation Days',
      description: 'Support for half days and flexible absence times.',
    },
  ];

  const benefits = [
    'No more Excel spreadsheets - everything digital and centralized',
    'Automatic calculation of remaining leave and carryover',
    'Team calendar shows all absences at a glance',
    'Mobile-optimized for approvals on the go',
    'GDPR compliant with German server locations',
    'Free for teams up to 5 people',
  ];

  const faqItems = [
    {
      question: 'What does leave management with ZeitPal cost?',
      answer: 'For teams up to 5 people, ZeitPal is permanently free. Larger teams pay from €4.99 per user/month.',
    },
    {
      question: 'Are legal holidays considered?',
      answer: 'Yes, ZeitPal knows all German holidays by federal state and calculates vacation days automatically correctly.',
    },
    {
      question: 'Can I import existing vacation data?',
      answer: 'Yes, we support importing Excel files. Our support will be happy to help you with the transition.',
    },
  ];

  const relatedLinks = [
    { href: '/absence-management', label: 'Absence Management' },
    { href: '/vacation-planner', label: 'Vacation Planner' },
    { href: '/digital-sick-leave', label: 'Digital Sick Reporting' },
    { href: '/for-startups', label: 'For Startups' },
  ];

  return (
    <SEOLandingPage
      title={t('marketing:seo.urlaubsverwaltung.h1')}
      subtitle={t('marketing:seo.urlaubsverwaltung.subtitle')}
      features={features}
      benefits={benefits}
      ctaText="Start Leave Management for Free"
      ctaHref="/auth/sign-up"
      relatedLinks={relatedLinks}
      faqItems={faqItems}
    />
  );
}

export default withI18n(UrlaubsverwaltungPage);
