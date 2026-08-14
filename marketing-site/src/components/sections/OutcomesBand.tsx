import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Badge';
import { Placeholder } from '../ui/Placeholder';

export function OutcomesBand() {
  return (
    <section className="border-y border-paper/10 py-16">
      <Container className="text-center">
        <Eyebrow>Outcomes</Eyebrow>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          <Placeholder>Completion rate</Placeholder>
          <Placeholder>Job/internship placement rate</Placeholder>
        </div>
        <p className="mt-6 text-sm text-paper-dim">
          <Placeholder>Confirm completion/placement figures for this program specifically</Placeholder>
        </p>
      </Container>
    </section>
  );
}
