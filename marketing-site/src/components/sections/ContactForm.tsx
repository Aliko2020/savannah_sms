import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

const inputClasses =
  'w-full rounded-xl border border-paper/15 bg-ink px-4 py-3 text-sm text-paper placeholder:text-paper-dim outline-none transition-colors focus:border-accent';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);

  // TODO: wire to a real submission endpoint before launch — this only
  // validates client-side and shows a confirmation state for now.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-paper/10 bg-ink-raised p-10 text-center">
        <CheckCircle2 className="size-8 text-accent" aria-hidden />
        <p className="font-display text-xl font-bold text-paper">Message sent</p>
        <p className="text-sm text-paper-muted">Thanks for reaching out — we'll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input required name="name" placeholder="Full name" className={inputClasses} />
        <input required name="contact" placeholder="Email or phone" className={inputClasses} />
      </div>

      <select required name="interest" defaultValue="" className={inputClasses}>
        <option value="" disabled>
          I'm interested in…
        </option>
        <option value="product">Product</option>
        <option value="training">Training</option>
        <option value="general">General</option>
      </select>

      <textarea required name="message" placeholder="Your message" rows={5} className={inputClasses} />

      <label className="flex items-start gap-3 text-sm text-paper-muted">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 rounded border-paper/30 bg-ink text-accent accent-accent"
        />
        I agree to be contacted about my inquiry.
      </label>

      <Button type="submit" variant="primary" className="mt-2 self-start">
        Send Message
      </Button>
    </form>
  );
}
