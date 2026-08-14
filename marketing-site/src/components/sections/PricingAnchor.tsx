import { Container } from '../ui/Container';
import { Placeholder } from '../ui/Placeholder';

export function PricingAnchor() {
  return (
    <section className="border-y border-paper/10 py-16">
      <Container className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-paper-dim">
          Zero Setup Fees · No Rigid Contracts · Pay-as-You-Go
        </p>
        <p className="mt-4 font-display text-3xl font-bold text-paper sm:text-4xl">
          From <Placeholder className="align-baseline text-[0.7em]">GHS X per SMS</Placeholder>
        </p>
      </Container>
    </section>
  );
}
