import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Badge';
import { productCards } from '../../data/content';

export function ProductOverview() {
  return (
    <section className="py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Product Overview</Eyebrow>
          <h2 className="text-3xl font-bold text-paper sm:text-4xl">Built in Africa. Engineered for scale.</h2>
          <p className="mt-4 text-paper-muted">
            Three products, one infrastructure layer — use them individually or together.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {productCards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group flex flex-col rounded-3xl border border-paper/10 bg-ink-raised p-8 transition-colors hover:border-accent/40"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent/10">
                <card.icon className="size-6 text-accent" aria-hidden />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-accent">{card.category}</span>
              <h3 className="mt-3 font-display text-xl font-bold text-paper">{card.headline}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-paper-muted">{card.body}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-paper group-hover:text-accent">
                {card.cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
