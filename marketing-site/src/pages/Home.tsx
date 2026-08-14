import { HomeHero } from '../components/sections/HomeHero';
import { ProblemSolution } from '../components/sections/ProblemSolution';
import { ProductOverview } from '../components/sections/ProductOverview';

export function Home() {
  return (
    <>
      <HomeHero />
      {/* <TrustBand /> */}
      <ProblemSolution />
      <ProductOverview />
    </>
  );
}
