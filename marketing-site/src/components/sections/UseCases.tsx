import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Badge';
import type { UseCase } from '../../data/content';

export function UseCases({ items }: { items: UseCase[] }) {
  return (
    <section className="py-20">
      <Container className="text-center">
        <Eyebrow>Use Cases</Eyebrow>
        <h2 className="mb-10 text-3xl font-bold text-paper">Who this is built for</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {items.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-ink-raised px-5 py-2.5 text-sm font-medium text-paper"
            >
              <item.icon className="size-4 text-accent" aria-hidden />
              {item.label}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
