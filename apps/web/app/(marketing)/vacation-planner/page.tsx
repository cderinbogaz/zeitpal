
import {
  Calendar,
  CheckCircle,
  Clock,
  Users,
  Bell,
  Eye,
} from 'lucide-react';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SEOLandingPage } from '~/(marketing)/_components/seo-landing-page';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:seo.urlaubsplaner.metaTitle'),
    description: t('marketing:seo.urlaubsplaner.metaDescription'),
  };
};

async function UrlaubsplanerPage() {
  const { t } = await createI18nServerInstance();

  const features = [
    {
      icon: <Calendar className="h-8 w-8" />,
      title: 'Visual Team Calendar',
      description: 'All vacation times clearly displayed in a calendar view.',
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: 'Conflict Checking',
      description: 'Automatic warning for overlaps in the team.',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Team View',
      description: 'See who is available when - ideal for project planning.',
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: 'Reminders',
      description: 'Automatic notifications for upcoming vacation times.',
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Holidays Included',
      description: 'All German holidays by federal state already entered.',
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'Export Function',
      description: 'Export the calendar for other applications.',
    },
  ];

  const benefits = [
    'Clear calendar view for the whole team',
    'Identify conflicts and bottlenecks early',
    'Better project planning through vacation overview',
    'Automatic consideration of holidays',
    'Easy coordination in the team',
    'Access from anywhere - also mobile',
  ];

  const faqItems = [
    {
      question: 'Can I sync the vacation planner with Google Calendar?',
      answer: 'Yes, ZeitPal offers calendar sync with common calendar apps like Google Calendar and Outlook.',
    },
    {
      question: 'Are bridge days and school holidays displayed?',
      answer: 'All legal holidays are displayed. School holidays can be added as notes.',
    },
    {
      question: 'Can employees view the team calendar?',
      answer: 'Yes, visibility can be flexibly adjusted - from "own only" to "entire company".',
    },
  ];

  const relatedLinks = [
    { href: '/leave-management', label: 'Leave Management' },
    { href: '/absence-management', label: 'Absence Management' },
    { href: '/features', label: 'All Features' },
    { href: '/for-startups', label: 'For Startups' },
  ];

  return (
    <SEOLandingPage
      title={t('marketing:seo.urlaubsplaner.h1')}
      subtitle={t('marketing:seo.urlaubsplaner.subtitle')}
      features={features}
      benefits={benefits}
      ctaText="Use Vacation Planner for Free"
      ctaHref="/auth/sign-up"
      relatedLinks={relatedLinks}
      faqItems={faqItems}
    />
  );
}

export default withI18n(UrlaubsplanerPage);
