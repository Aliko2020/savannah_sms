import { PageHero } from '../components/sections/PageHero';
import { FeatureGrid } from '../components/sections/FeatureGrid';
import { ClosingCTA } from '../components/sections/ClosingCTA';
import { Button } from '../components/ui/Button';
import { bulkSmsFeatures } from '../data/content';
import { APP_URL } from '../config';

export function BulkSmsPage() {
  return (
    <>
      <PageHero
        tag="Messaging Infrastructure"
        title="Reach everyone. In seconds."
        subhead="Send thousands of messages using your own sender ID — for campaigns, OTPs, alerts, and transactional updates."
      >
        <Button variant="primary" href={APP_URL}>
          Start Sending
        </Button>
        <Button variant="secondary" to="/contact">
          Request a Demo
        </Button>
      </PageHero>

      <FeatureGrid features={bulkSmsFeatures} columns={3} />
      {/* <PricingAnchor />
      <UseCases items={bulkSmsUseCases} />
      <TrustSignals />
      <FAQSection items={bulkSmsFaq} /> */}
      <ClosingCTA primaryLabel="Start Sending" primaryHref={APP_URL} />
    </>
  );
}
