
import {
  FileText,
  Shield,
  Scale,
  BarChart3,
  Users,
  Globe,
} from 'lucide-react';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SEOLandingPage } from '~/(marketing)/_components/seo-landing-page';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:seo.hrSoftware.metaTitle'),
    description: t('marketing:seo.hrSoftware.metaDescription'),
  };
};

async function HRSoftwarePage() {
  const { t } = await createI18nServerInstance();

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Leave Management',
      description: 'Digital leave requests and approvals for the entire company.',
    },
    {
      icon: <Scale className="h-8 w-8" />,
      title: 'German Labor Law',
      description: 'Developed for German requirements: BUrlG, holidays by federal state, sick note obligations.',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'GDPR Compliant',
      description: 'Data protection to highest German standards. Servers in Germany.',
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'HR Reporting',
      description: 'Detailed reports on absences, vacation quotas and more.',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Employee Management',
      description: 'Flexibly manage teams, departments and approval workflows.',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Integrations',
      description: 'Connect with Slack, Google Workspace and other tools.',
    },
  ];

  const benefits = [
    'Developed specifically for the German market',
    'Compliant with BUrlG and GDPR',
    'All holidays by federal state integrated',
    'German servers for maximum data security',
    'Support available in German and English',
    'No hidden costs - transparent pricing',
  ];

  const faqItems = [
    {
      question: 'What sets ZeitPal apart from American HR tools?',
      answer: 'ZeitPal was specifically developed for German requirements: German labor law, holidays by federal state, GDPR compliance and German servers.',
    },
    {
      question: 'Is ZeitPal suitable for ISO certifications?',
      answer: 'Yes, ZeitPal documents all absences comprehensively and supports you with compliance requirements.',
    },
    {
      question: 'Is there an interface to payroll?',
      answer: 'Currently we offer data exports for payroll. API integrations are in planning.',
    },
  ];

  const relatedLinks = [
    { href: '/leave-management', label: 'Leave Management' },
    { href: '/absence-management', label: 'Absence Management' },
    { href: '/for-smes', label: 'For SMEs' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <SEOLandingPage
      title={t('marketing:seo.hrSoftware.h1')}
      subtitle={t('marketing:seo.hrSoftware.subtitle')}
      features={features}
      benefits={benefits}
      ctaText="Try HR Software for Free"
      ctaHref="/auth/sign-up"
      relatedLinks={relatedLinks}
      faqItems={faqItems}
    />
  );
}

export default withI18n(HRSoftwarePage);
