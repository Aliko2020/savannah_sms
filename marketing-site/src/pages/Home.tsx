import { HomeHero } from '../components/sections/HomeHero';
import { ProblemSolution } from '../components/sections/ProblemSolution';
import { ProductOverview } from '../components/sections/ProductOverview';
// import { TrustBand } from '../components/sections/TrustBand';


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
