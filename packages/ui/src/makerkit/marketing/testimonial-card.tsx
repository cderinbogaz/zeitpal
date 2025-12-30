import React from 'react';

import { Star } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../../shadcn/avatar';
import { Card, CardContent } from '../../shadcn/card';

export interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
  rating?: number;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatar,
  rating = 5,
  className,
}: TestimonialCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardContent className="flex h-full flex-col p-6">
        {rating > 0 && (
          <div className="mb-4 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-4 w-4',
                  i < rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-muted text-muted',
                )}
              />
            ))}
          </div>
        )}

        <blockquote className="text-foreground mb-6 flex-1 text-base italic leading-relaxed">
          &ldquo;{quote}&rdquo;
        </blockquote>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={author} />
            <AvatarFallback className="text-xs">
              {getInitials(author)}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-foreground text-sm font-semibold">{author}</p>
            <p className="text-muted-foreground text-xs">
              {role}, {company}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface TestimonialGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function TestimonialGrid({
  children,
  columns = 3,
  className,
}: TestimonialGridProps) {
  const colsClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', colsClass[columns], className)}>
      {children}
    </div>
  );
}
