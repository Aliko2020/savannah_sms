import { ShieldCheck } from 'lucide-react';
import { Container } from '../ui/Container';
import { Placeholder } from '../ui/Placeholder';

const signals = [
  { label: 'Delivery rate', value: 'Delivery rate %' },
  { label: 'Uptime SLA', value: 'Uptime SLA' },
  { label: 'Data handling', value: 'Data handling / Ghana Data Protection Act compliance note' },
];

export function TrustSignals() {
  return (
    <section className="border-y border-paper/10 py-16">
      <Container>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {signals.map((signal) => (
            <div key={signal.label} className="flex items-start gap-3 rounded-2xl border border-paper/10 bg-ink-raised p-6">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-paper-dim">{signal.label}</p>
                <p className="mt-1">
                  <Placeholder>{signal.value}</Placeholder>
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
