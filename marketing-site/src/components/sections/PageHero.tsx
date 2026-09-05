import type { ReactNode } from 'react';
import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Badge';

export function PageHero({
  tag,
  title,
  subhead,
  meta,
  bgImageUrl,
  children,
}: {
  tag: string;
  title: string;
  subhead: string;
  meta?: string[];
  bgImageUrl?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-paper/10 py-20 sm:py-24 md:h-screen">
      {/* Faded Background Image */}
      {bgImageUrl && (
        <div className="absolute inset-0 -z-10">
          <img
            src={bgImageUrl}
            alt=""
            className="h-full w-full object-fit opacity-3" 
          />
          {/* Optional overlay gradient to ensure text readability */}
          <div className="absolute inset-0 bg-gradien from-transparent via-black/20 to-black/60" />
        </div>
      )}

      <Container className="text-center">
        <Eyebrow>{tag}</Eyebrow>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-tight text-paper sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-paper-muted">{subhead}</p>

        {meta && meta.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {meta.map((m) => (
              <span
                key={m}
                className="rounded-full border border-paper/15 px-3 py-1 text-xs font-medium text-paper-muted"
              >
                {m}
              </span>
            ))}
          </div>
        )}

        {children && <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">{children}</div>}
      </Container>
    </section>
  );
}