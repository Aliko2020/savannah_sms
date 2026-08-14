import { ArrowRight, CheckCircle2, Clock, MessageCircle, Zap } from 'lucide-react';
import { Container } from '../ui/Container';

const WHATSAPP_NUMBER = '233507363607';

export function WhatsAppCTA() {
  return (
    <section className="border-b border-paper/10 py-20 sm:py-24">
      <Container className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-accent/30">
          <MessageCircle className="size-8 text-white" aria-hidden />
        </div>

        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          Available on WhatsApp
        </span>

        <h2 className="mt-6 text-4xl font-bold leading-tight text-paper sm:text-5xl">
          Let's talk on
          <br />
          <span className="text-accent">WhatsApp.</span>
        </h2>

        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-paper-muted">
          No email threads. Just a real conversation with our team — we typically respond within minutes.
        </p>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(15,157,88,0.45)] transition-colors hover:bg-accent-hover"
        >
          <MessageCircle className="size-4" aria-hidden />
          Open WhatsApp Chat
          <ArrowRight className="size-4" aria-hidden />
        </a>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-paper-dim">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-accent" aria-hidden />
            Instant replies during business hours
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-accent" aria-hidden />
            Mon – Fri, 8 AM – 6 PM GM
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-accent" aria-hidden />
            No waiting. Just a conversation.
          </span>
        </div>
      </Container>
    </section>
  );
}
