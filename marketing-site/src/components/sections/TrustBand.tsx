import { Container } from '../ui/Container';
import { Placeholder } from '../ui/Placeholder';
import { trustBand } from '../../data/content';

export function TrustBand() {
  return (
    <section className="border-y border-paper/10 py-10">
      <Container>
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.14em] text-paper-dim">
          {trustBand.eyebrow}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {trustBand.stats.map((stat) => (
            <Placeholder key={stat.value}>{stat.value}</Placeholder>
          ))}
        </div>
      </Container>
    </section>
  );
}
