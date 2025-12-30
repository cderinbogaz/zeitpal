import type { Metadata } from 'next';

import { ArrowRight, Calendar, Clock, User } from 'lucide-react';

import { LocalizedLink } from '~/components/localized-link';

import { Badge } from '@kit/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';


export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:blog'),
    description: t('marketing:blogSubtitle'),
  };
};

// Placeholder blog posts - in production, these would come from a CMS or MDX files
const blogPosts = [
  {
    slug: 'leave-management-best-practices',
    title: 'Leave Management Best Practices for German Companies',
    description:
      'Learn the essential best practices for managing employee leave in German companies, including BUrlG compliance and GDPR considerations.',
    author: 'ZeitPal Team',
    date: '2024-12-15',
    readTime: '5 min',
    category: 'Guide',
  },
  {
    slug: 'digital-sick-leave-reporting',
    title: 'The Complete Guide to Digital Sick Leave Reporting',
    description:
      'How to streamline sick leave reporting with digital tools while staying compliant with German labor laws.',
    author: 'ZeitPal Team',
    date: '2024-12-10',
    readTime: '7 min',
    category: 'Guide',
  },
  {
    slug: 'team-calendar-tips',
    title: '10 Tips for Better Team Calendar Management',
    description:
      'Practical tips to improve team visibility and avoid scheduling conflicts with a shared team calendar.',
    author: 'ZeitPal Team',
    date: '2024-12-05',
    readTime: '4 min',
    category: 'Tips',
  },
];

async function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          <Trans i18nKey="marketing:blog" />
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          <Trans i18nKey="marketing:blogSubtitle" />
        </p>
      </div>

      {/* Blog Grid */}
      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <LocalizedLink key={post.slug} href={`/blog/${post.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{post.category}</Badge>
                </div>
                <CardTitle className="mt-2 line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-primary">
                  <span className="text-sm font-medium">Read more</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </LocalizedLink>
        ))}
      </div>

      {/* Empty state for when there are no posts */}
      {blogPosts.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            No blog posts yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}

export default withI18n(BlogPage);
