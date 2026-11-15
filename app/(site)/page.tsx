import { BarSection } from "@/components/bar-section";
import { FusionSection } from "@/components/fusion-section";
import { Hero } from "@/components/hero";
import { House } from "@/components/house";
import { ProofSection } from "@/components/proof-section";
import { QuoteSection } from "@/components/quote-section";
import { Ticker } from "@/components/ticker";

export default function HomePage() {
  return (
    <main id="top">
      <Hero />
      <Ticker />
      <House />
      <BarSection />
      <ProofSection />
      <FusionSection />
      <QuoteSection />
    </main>
  );
}
