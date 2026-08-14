import { Quote } from 'lucide-react';
import { Container } from '../ui/Container';
import { Placeholder } from '../ui/Placeholder';

export function Testimonial() {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <div className="rounded-3xl border border-paper/10 bg-ink-raised p-10 text-center sm:p-14">
          <Quote className="mx-auto size-8 text-accent" aria-hidden />
          <p className="mt-6 text-balance font-display text-2xl leading-snug text-paper">
            <Placeholder className="whitespace-normal text-left align-baseline">
              "Edusavannah cut our fee reconciliation time from two days to under an hour, and parents now get
              results the same day we do."
            </Placeholder>
          </p>
          <p className="mt-6 text-sm font-medium text-paper-dim">
            — <Placeholder>Comfort Azumah, Headmistress, St. Peter's Preparatory School</Placeholder>
          </p>
        </div>
      </Container>
    </section>
  );
}
