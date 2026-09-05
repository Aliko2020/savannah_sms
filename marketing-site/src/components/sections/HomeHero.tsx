import { ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { APP_URL } from "../../config";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden mt-16 md:mt-4 p-4">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2.5 text-sm text-paper-dim">
              <span>Local Solutions for Global Reach</span>
              <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
            </div>

            <h1 className="max-w-xl font-sans text-4xl font-black leading-[1.02] tracking-tight text-paper sm:text-5xl">
              Modern software that grows your  <br />
              <span className="text-accent"> business.</span>
            </h1>

            <p className="mt-7 max-w-md text-sm text-paper-muted">
              Smart Tools to Streamline Operations and Hands-On Tech Training to
              Launch Careers.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" href={APP_URL}>
                Get Started
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="">
            <img
              src="/images/public.png"
              alt="Sunset over Bolgatanga, Upper East Region, Ghana"
              className="w-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
