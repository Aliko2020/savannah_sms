import { Container } from "../components/ui/Container";
import { ClosingCTA } from "../components/sections/ClosingCTA";

export function AboutPage() {
  return (
    <>
      <section className="py-20 sm:py-24">
        <Container className="max-w-3xl">
          <h1 className="text-2xl font-semibold mt-8 mb-4">About Edusavannah</h1>
          <p className="mt-6 text-sm leading-relaxed text-paper-muted">
            Founded in 2026 and based out of Bolgatanga, Edusavannah is
            dedicated to bringing world-class technology solutions and digital
            literacy to Northern Ghana. We bridge the local digital divide by
            combining practical, 1-on-1 tech and language training for early
            talent, custom software solutions for growing businesses, and an
            modern management platform for educational institutions.
          </p>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Mission Statement</h2>
          <p className="text-sm leading-relaxed text-paper-muted">
            To drive digital transformation in Northern Ghana by providing
            world-class technology training, empowering educational institutions
            with modern platforms, and delivering tailored software solutions
            that help local businesses succeed in today’s digital age.
          </p>
        </Container>
      </section>

      <ClosingCTA
        primaryLabel="Explore our products"
        primaryTo="/"
        secondaryLabel="Contact Us"
      />
    </>
  );
}
