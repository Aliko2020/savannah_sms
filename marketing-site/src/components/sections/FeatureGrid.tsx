import { Container } from '../ui/Container';
import type { FeatureItem } from '../../data/content';

export function FeatureGrid({ features, columns = 4 }: { features: FeatureItem[]; columns?: 2 | 3 | 4 }) {
  const colClass = columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="">
      <Container>
        <div className={`grid grid-cols-1 gap-5 ${colClass}`}>
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-paper/10 bg-ink-raised p-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent/10">
                <feature.icon className="size-5 text-accent" aria-hidden />
              </div>
              <h3 className="font-semibold text-paper">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
