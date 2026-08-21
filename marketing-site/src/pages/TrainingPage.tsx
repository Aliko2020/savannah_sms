import { PageHero } from "../components/sections/PageHero";
import { CourseCatalog } from "../components/sections/CourseCatalog";
import { FeatureGrid } from "../components/sections/FeatureGrid";
import { FAQSection } from "../components/sections/FAQSection";
import { ClosingCTA } from "../components/sections/ClosingCTA";
import { Button } from "../components/ui/Button";
import { courseCatalog, deliveryModels, trainingFaq } from "../data/content";

export function TrainingPage() {
  return (
    <>
      <PageHero
        tag="Digital and Language Skills Program"
        title="Give your child a competitive edge."
        subhead="Nurturing Young Minds with Practical Tech Skills for Tomorrow’s Digital Economy.built to produce skills that stick, not just certificates."
        meta={["📍 In-Person (Bolgatanga)", "Online"]}
      >
        <Button variant="secondary" to="/contact">
          Inquire
        </Button>
        <Button
          as="a"
          href="/Course_Catalog.pdf"
          download="Course_Catalog.pdf"
          variant="primary"
        >
          Download Courses
        </Button>
      </PageHero>

      <CourseCatalog tracks={courseCatalog} />

      <section className="mb-4 py-4">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold text-paper">Delivery Models</h2>
        </div>
      </section>
      <FeatureGrid features={deliveryModels} columns={2} />

      <FAQSection items={trainingFaq} />
      <ClosingCTA
        heading="Courses Taught by Highly Qualified Instructors."
        primaryLabel="Enroll in a Course"
        primaryTo="/contact"
      />
    </>
  );
}
