import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Badge';
import { Accordion } from '../ui/Accordion';
import { Placeholder } from '../ui/Placeholder';
import type { FaqItem } from '../../data/content';

export function FAQSection({ items }: { items: FaqItem[] }) {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mb-10 text-3xl font-bold text-paper">Frequently asked questions</h2>
        <Accordion
          items={items.map((item) => ({
            question: item.question,
            answer: item.confirmed ? item.answer : <Placeholder>{item.answer}</Placeholder>,
          }))}
        />
      </Container>
    </section>
  );
}
