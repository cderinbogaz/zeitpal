
import { ArrowRight, Shield, Heart, Zap, Users } from 'lucide-react';

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
    title: t('marketing:aboutLabel'),
    description: t('marketing:aboutSubtitle'),
  };
};

async function AboutPage() {
  const { t } = await createI18nServerInstance();

  const values = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: t('marketing:about.values.privacy.title'),
      description: t('marketing:about.values.privacy.description'),
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: t('marketing:about.values.simplicity.title'),
      description: t('marketing:about.values.simplicity.description'),
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: t('marketing:about.values.transparency.title'),
      description: t('marketing:about.values.transparency.description'),
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: t('marketing:about.values.community.title'),
      description: t('marketing:about.values.community.description'),
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ZeitPal',
    description: t('marketing:aboutSubtitle'),
    url: 'https://zeitpal.com',
    logo: 'https://zeitpal.com/logo.png',
    sameAs: [],
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
          title={t('marketing:aboutLabel')}
          subtitle={t('marketing:aboutSubtitle')}
        />

        <div className={'container pb-16 max-w-4xl mx-auto'}>
          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">
              <AnimatedShinyText className="text-2xl font-bold">
                <Trans i18nKey={'marketing:about.mission.title'} />
              </AnimatedShinyText>
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-muted-foreground leading-relaxed">
                <Trans i18nKey={'marketing:about.mission.description'} />
              </p>
            </div>
          </section>

          {/* Story Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">
              <Trans i18nKey={'marketing:about.story.title'} />
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-muted-foreground leading-relaxed mb-4">
                <Trans i18nKey={'marketing:about.story.paragraph1'} />
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <Trans i18nKey={'marketing:about.story.paragraph2'} />
              </p>
            </div>
          </section>

          {/* Values Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">
              <Trans i18nKey={'marketing:about.values.title'} />
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {values.map((value, index) => (
                <div key={index} className="flex gap-4 p-6 rounded-xl border border-border">
                  <div className="text-primary shrink-0">{value.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center p-12 bg-muted/50 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              <Trans i18nKey={'marketing:about.cta.title'} />
            </h2>
            <p className="text-muted-foreground mb-8">
              <Trans i18nKey={'marketing:about.cta.description'} />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <LocalizedLink href={'/auth/sign-up'}>
                  <Trans i18nKey={'marketing:cta.startFree'} />
                  <ArrowRight className={'ml-2 w-4'} />
                </LocalizedLink>
              </Button>
              <Button asChild variant="outline" size="lg">
                <LocalizedLink href={'/contact'}>
                  <Trans i18nKey={'marketing:contact'} />
                  <ArrowRight className={'ml-2 w-4'} />
                </LocalizedLink>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default withI18n(AboutPage);
