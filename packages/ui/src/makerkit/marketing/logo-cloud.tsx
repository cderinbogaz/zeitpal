import React from 'react';

import { cn } from '../../lib/utils';

export interface LogoCloudLogo {
  src: string;
  alt: string;
  href?: string;
  width?: number;
  height?: number;
}

export interface LogoCloudProps {
  logos: LogoCloudLogo[];
  heading?: string;
  className?: string;
  grayscale?: boolean;
}

export function LogoCloud({
  logos,
  heading,
  className,
  grayscale = true,
}: LogoCloudProps) {
  return (
    <section className={cn('py-8 md:py-12', className)}>
      {heading && (
        <p className="text-muted-foreground mb-8 text-center text-sm font-medium">
          {heading}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {logos.map((logo, index) => {
          const LogoImage = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo.src}
              alt={logo.alt}
              width={logo.width ?? 120}
              height={logo.height ?? 40}
              className={cn(
                'h-8 w-auto object-contain md:h-10',
                grayscale && 'opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0',
              )}
            />
          );

          if (logo.href) {
            return (
              <a
                key={index}
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                {LogoImage}
              </a>
            );
          }

          return (
            <div key={index} className="flex items-center">
              {LogoImage}
            </div>
          );
        })}
      </div>
    </section>
  );
}
