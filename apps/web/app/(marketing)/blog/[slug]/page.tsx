import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { LocalizedLink } from '~/components/localized-link';

import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';


interface PageProps {
  params: Promise<{ slug: string }>;
}

// Placeholder blog posts - in production, these would come from a CMS or MDX files
const blogPosts: Record<
  string,
  {
    title: string;
    description: string;
    author: string;
    date: string;
    readTime: string;
    category: string;
    content: string;
  }
> = {
  'leave-management-best-practices': {
    title: 'Leave Management Best Practices for German Companies',
    description:
      'Learn the essential best practices for managing employee leave in German companies, including BUrlG compliance and GDPR considerations.',
    author: 'ZeitPal Team',
    date: '2024-12-15',
    readTime: '5 min',
    category: 'Guide',
    content: `
## Introduction

Managing employee leave effectively is crucial for any organization, but German companies face unique challenges due to specific labor laws and regulations. This guide covers the essential best practices for leave management in Germany.

## Understanding BUrlG (Bundesurlaubsgesetz)

The German Federal Leave Act (BUrlG) establishes minimum requirements for annual leave:

- **Minimum entitlement**: 24 working days per year (based on a 6-day work week)
- **For 5-day weeks**: This translates to 20 working days minimum
- **Carryover rules**: Unused leave must typically be taken by March 31 of the following year

## Key Best Practices

### 1. Digitize Your Leave Management

Moving from spreadsheets to a dedicated leave management system like ZeitPal offers several advantages:

- Automatic calculation of leave balances
- Clear approval workflows
- Team calendar visibility
- GDPR-compliant data handling

### 2. Establish Clear Policies

Document your leave policies clearly, including:

- How to request leave
- Approval timelines
- Notice periods for different leave types
- Carryover rules

### 3. Plan for Peak Periods

German school holidays and public holidays often lead to high leave requests. Plan ahead by:

- Reviewing leave patterns from previous years
- Setting blackout periods if necessary
- Encouraging early leave planning

## Conclusion

Effective leave management requires a combination of clear policies, the right tools, and proactive planning. With ZeitPal, German companies can streamline their leave management while staying compliant with local regulations.
    `,
  },
  'digital-sick-leave-reporting': {
    title: 'The Complete Guide to Digital Sick Leave Reporting',
    description:
      'How to streamline sick leave reporting with digital tools while staying compliant with German labor laws.',
    author: 'ZeitPal Team',
    date: '2024-12-10',
    readTime: '7 min',
    category: 'Guide',
    content: `
## Introduction

Digital sick leave reporting is transforming how German companies manage employee absences. This guide explains how to implement an effective digital system.

## Legal Requirements in Germany

German law requires employees to:

- Notify their employer of illness on the first day
- Provide a medical certificate (AU) if illness exceeds 3 days
- Since 2023, doctors transmit AU certificates electronically (eAU)

## Benefits of Digital Reporting

### For Employees
- Report sick leave from anywhere
- No paper forms needed
- Clear status visibility

### For HR Teams
- Automatic notifications
- Central record keeping
- Easy reporting and analytics

## Implementation Tips

1. **Choose the right tool**: Select a system that integrates with your existing HR processes
2. **Train your team**: Ensure everyone knows how to use the new system
3. **Set up notifications**: Automatic reminders for AU certificates after 3 days
4. **Maintain privacy**: Ensure GDPR compliance in all data handling

## Conclusion

Digital sick leave reporting saves time and reduces administrative burden while ensuring compliance with German labor laws.
    `,
  },
  'team-calendar-tips': {
    title: '10 Tips for Better Team Calendar Management',
    description:
      'Practical tips to improve team visibility and avoid scheduling conflicts with a shared team calendar.',
    author: 'ZeitPal Team',
    date: '2024-12-05',
    readTime: '4 min',
    category: 'Tips',
    content: `
## Introduction

A well-managed team calendar is essential for coordination and planning. Here are 10 tips to make the most of your shared calendar.

## The Tips

### 1. Use a Centralized System
Ensure all team members use the same calendar system for visibility.

### 2. Color-Code Leave Types
Use different colors for vacation, sick leave, and other absence types.

### 3. Set Up Notifications
Configure alerts for new leave requests and approvals.

### 4. Review Regularly
Hold monthly reviews of upcoming absences to plan workload.

### 5. Block Critical Periods
Mark important project deadlines when leave should be avoided.

### 6. Encourage Early Planning
The sooner leave is planned, the better for team coordination.

### 7. Integrate with Other Tools
Sync your leave calendar with Slack, Google Calendar, or Outlook.

### 8. Make It Mobile-Friendly
Ensure team members can check the calendar from their phones.

### 9. Set Clear Policies
Define rules for minimum staffing levels and blackout periods.

### 10. Use Analytics
Review leave patterns to identify trends and potential issues.

## Conclusion

A well-managed team calendar improves visibility, reduces conflicts, and helps everyone plan better.
    `,
  },
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.description,
  };
};

async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-16 md:py-24">
      {/* Back Button */}
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" asChild className="mb-8">
          <LocalizedLink href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </LocalizedLink>
        </Button>

        {/* Header */}
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">
            {post.category}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
        </header>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {post.content.split('\n').map((paragraph, index) => {
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={index} className="mt-8 text-2xl font-bold">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="mt-6 text-xl font-semibold">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('- ')) {
              return (
                <li key={index} className="ml-4">
                  {paragraph.replace('- ', '')}
                </li>
              );
            }
            if (paragraph.trim()) {
              return (
                <p key={index} className="mt-4">
                  {paragraph}
                </p>
              );
            }
            return null;
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-lg bg-muted p-8 text-center">
          <h3 className="text-2xl font-bold">
            Ready to simplify your leave management?
          </h3>
          <p className="mt-2 text-muted-foreground">
            Start using ZeitPal for free today.
          </p>
          <Button asChild className="mt-6">
            <LocalizedLink href="/auth/sign-up">Get Started Free</LocalizedLink>
          </Button>
        </div>
      </div>
    </article>
  );
}

export default withI18n(BlogPostPage);
