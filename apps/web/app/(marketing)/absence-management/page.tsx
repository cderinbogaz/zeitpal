
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Users,
} from 'lucide-react';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SEOLandingPage } from '~/(marketing)/_components/seo-landing-page';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:seo.abwesenheitsmanagement.metaTitle'),
    description: t('marketing:seo.abwesenheitsmanagement.metaDescription'),
  };
};

async function AbwesenheitsmanagementPage() {
  const { t } = await createI18nServerInstance();

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'All Absence Types',
      description: 'Vacation, illness, home office, special leave - everything in one system.',
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: 'Clear Team Calendar',
      description: 'See immediately who is absent when. Plan better.',
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'Flexible Approval Workflows',
      description: 'Define approval chains by absence type and team.',
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Detailed Reports',
      description: 'Absence statistics, sick rates and more at a glance.',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Team Management',
      description: 'Organize employees in teams with their own settings.',
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Real-Time Overview',
      description: 'Current absences and upcoming vacation times in view.',
    },
  ];

  const benefits = [
    'Central management of all absence types',
    'Transparency for managers and employees',
    'Automatic notifications and reminders',
    'Reports for HR and management',
    'Integration with calendar apps possible',
    'Fully GDPR compliant',
  ];

  const faqItems = [
    {
      question: 'What types of absence are supported?',
      answer: 'ZeitPal supports vacation, illness, child sick leave, home office, special leave, parental leave, maternity protection, overtime reduction and other customizable types.',
    },
    {
      question: 'Can different teams have different rules?',
      answer: 'Yes, you can define own approval workflows and settings for each team.',
    },
    {
      question: 'How secure is my data?',
      answer: 'All data is encrypted and stored on German servers. ZeitPal is fully GDPR compliant.',
    },
  ];

  const relatedLinks = [
    { href: '/leave-management', label: 'Leave Management' },
    { href: '/digital-sick-leave', label: 'Digital Sick Reporting' },
    { href: '/hr-software', label: 'HR Software' },
    { href: '/for-smes', label: 'For SMEs' },
  ];

  return (
    <SEOLandingPage
      title={t('marketing:seo.abwesenheitsmanagement.h1')}
      subtitle={t('marketing:seo.abwesenheitsmanagement.subtitle')}
      features={features}
      benefits={benefits}
      ctaText="Try Absence Management for Free"
      ctaHref="/auth/sign-up"
      relatedLinks={relatedLinks}
      faqItems={faqItems}
    />
  );
}

export default withI18n(AbwesenheitsmanagementPage);
