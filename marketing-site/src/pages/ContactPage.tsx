import { Phone, Mail, MapPin } from 'lucide-react';
import { Container } from '../components/ui/Container';
import { ContactForm } from '../components/sections/ContactForm';
import { WhatsAppCTA } from '../components/sections/WhatsAppCTA';

export function ContactPage() {
  return (
    <>
      <WhatsAppCTA />

      <section className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-4xl font-bold text-paper sm:text-5xl">
              Let's build something reliable together
            </h1>
            <p className="mt-5 text-balance text-lg text-paper-muted">
              Questions about our products, a custom setup, or joining a training program? We're here to help.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-paper">Location & Reach</h2>
              <p className="mt-2 text-sm text-paper-muted">
                Based in Bolgatanga, Ghana — serving clients and institutions across Africa and globally.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                <a href="tel:+233507363607" className="flex items-center gap-3 text-sm text-paper hover:text-accent">
                  <Phone className="size-4 text-accent" aria-hidden />
                  +233 50 736 3607
                </a>
                <a
                  href="mailto:hello@edusavannah.com"
                  className="flex items-center gap-3 text-sm text-paper hover:text-accent"
                >
                  <Mail className="size-4 text-accent" aria-hidden />
                  hello@edusavannah.com
                </a>
                <span className="flex items-center gap-3 text-sm text-paper-muted">
                  <MapPin className="size-4 text-accent" aria-hidden />
                  Bolgatanga, Ghana
                </span>
              </div>
            </div>

            <div className="lg:col-span-3">
              <h2 className="mb-6 text-lg font-semibold text-paper">Quick Inquiry Form</h2>
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>

    </>
  );
}
