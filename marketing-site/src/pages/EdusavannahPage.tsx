import { PageHero } from '../components/sections/PageHero';
import { FeatureGrid } from '../components/sections/FeatureGrid';
import { Testimonial } from '../components/sections/Testimonial';
import { FAQSection } from '../components/sections/FAQSection';
import { ClosingCTA } from '../components/sections/ClosingCTA';
import { Button } from '../components/ui/Button';
import { edusavannahFeatures, edusavannahFaq } from '../data/content';
import { APP_URL } from '../config';

export function EdusavannahPage() {
  return (
    <>
      <PageHero
        tag="Unified Education Management"
        title="Everything your institution needs to run — in one system"
        subhead="Keep administrators, teachers, and parents connected, from the first application to the last report card."
      >
        <Button variant="primary" href={APP_URL}>
          Open Edusavannah
        </Button>
        <Button variant="secondary" to="/contact">
          Talk to Us
        </Button>
      </PageHero>

      <FeatureGrid features={edusavannahFeatures} />
      <Testimonial />
      <FAQSection items={edusavannahFaq} />
      <ClosingCTA primaryLabel="Open Edusavannah" primaryHref={APP_URL} />
    </>
  );
}
