import { Container } from '../ui/Container';
import { Button } from '../ui/Button';

export function ClosingCTA({
  heading = 'Trusted by progressive institutions.',
  primaryLabel,
  primaryTo,
  primaryHref,
  secondaryLabel = 'Talk to Us',
}: {
  heading?: string;
  primaryLabel: string;
  primaryTo?: string;
  primaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="py-20">
      <Container>
        <div className="rounded-3xl border border-paper/10 bg-ink-raised px-8 py-16 text-center">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold text-paper sm:text-4xl">{heading}</h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {primaryHref ? (
              <Button variant="primary" href={primaryHref}>
                {primaryLabel}
              </Button>
            ) : (
              <Button variant="primary" to={primaryTo ?? '/'}>
                {primaryLabel}
              </Button>
            )}
            <Button variant="secondary" to="/contact">
              {secondaryLabel}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
