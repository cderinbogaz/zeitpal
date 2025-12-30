import {
  ArrowRight,
  Check,
  Shield,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { AnimatedShinyText } from '@kit/ui/magicui';

import { LocalizedLink } from '~/components/localized-link';
import { SitePageHeader } from './site-page-header';

interface SEOLandingPageProps {
  title: string;
  subtitle: string;
  features: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
  benefits: string[];
  ctaText: string;
  ctaHref: string;
  relatedLinks: Array<{
    href: string;
    label: string;
  }>;
  faqItems?: Array<{
    question: string;
    answer: string;
  }>;
}

export function SEOLandingPage({
  title,
  subtitle,
  features,
  benefits,
  ctaText,
  ctaHref,
  relatedLinks,
  faqItems,
}: SEOLandingPageProps) {
  const structuredData = faqItems
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : null;

  return (
    <>
      {structuredData && (
        <script
          key={'ld:json'}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <div className={'flex flex-col space-y-4 xl:space-y-8'}>
        <SitePageHeader
          title={
            <AnimatedShinyText className="text-3xl md:text-4xl font-bold">
              {title}
            </AnimatedShinyText>
          }
          subtitle={subtitle}
        />

        <div className={'container pb-16'}>
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <Shield className="h-4 w-4 text-green-500" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <span>🇩🇪</span>
              <span>Made in Germany</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <Check className="h-4 w-4 text-green-500" />
              <span>Free for Small Teams</span>
            </div>
          </div>

          {/* Main CTA */}
          <div className="text-center mb-16">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <LocalizedLink href={ctaHref}>
                {ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </LocalizedLink>
            </Button>
            <p className="text-muted-foreground mt-4 text-sm">
              No credit card required. Ready in 5 minutes.
            </p>
          </div>

          {/* Features Grid */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              What ZeitPal Can Do for You
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="text-primary mb-4">{feature.icon}</div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits List */}
          <section className="mb-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Your Benefits with ZeitPal
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* FAQ Section */}
          {faqItems && faqItems.length > 0 && (
            <section className="mb-16 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <details
                    key={index}
                    className="group border rounded-lg px-6 py-4"
                  >
                    <summary className="flex items-center justify-between cursor-pointer font-medium">
                      {item.question}
                      <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-4 text-muted-foreground">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Secondary CTA */}
          <section className="text-center p-12 bg-muted/50 rounded-2xl mb-16">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Simplify Your Leave Management?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join over 500 satisfied teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <LocalizedLink href="/auth/sign-up">
                  Start for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </LocalizedLink>
              </Button>
              <Button asChild variant="outline" size="lg">
                <LocalizedLink href="/pricing">
                  View Pricing
                </LocalizedLink>
              </Button>
            </div>
          </section>

          {/* Related Links */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
            <div className="flex flex-wrap gap-3">
              {relatedLinks.map((link, index) => (
                <Button key={index} asChild variant="outline" size="sm">
                  <LocalizedLink href={link.href}>{link.label}</LocalizedLink>
                </Button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
