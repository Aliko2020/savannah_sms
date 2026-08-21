import { Container } from '../ui/Container';
import type { FeatureItem } from '../../data/content';

export function FeatureGrid({ features, columns = 2 }: { features: FeatureItem[]; columns?: 2 | 3 | 4 }) {
  const colClass = columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="">
      <Container>
        <div className={`grid grid-cols-1 gap-5 ${colClass}`}>
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className="group overflow-hidden rounded-2xl border border-paper/10 bg-ink-raised transition-all hover:border-paper/20"
            >
              <div className={`flex flex-col gap-5 ${feature.image ? 'lg:flex-row lg:items-center' : ''}`}>
                
                {/* Image or Icon Container */}
                {feature.image ? (
                  <div className="shrink-0 overflow-hidden border border-paper/10 bg-accent/5 lg:w-1/2">
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      loading="lazy"
                    />
                  </div>
                ) : feature.icon ? (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    <feature.icon className="size-5 text-accent" aria-hidden />
                  </div>
                ) : null}

                {/* Text Content */}
                <div className={feature.image ? 'lg:w-1/2' : 'w-full'}>
                  <h3 className="font-semibold text-paper">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper-muted">{feature.description}</p>
                </div>

              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}