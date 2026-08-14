import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <section className="py-32">
      <Container className="text-center">
        <p className="font-display text-6xl font-bold text-paper">404</p>
        <p className="mt-4 text-paper-muted">This page doesn't exist.</p>
        <Button variant="primary" to="/" className="mt-8 inline-flex">
          Back to home
        </Button>
      </Container>
    </section>
  );
}
