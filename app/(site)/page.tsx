import { BarSection } from "@/components/bar-section";
import { FusionSection } from "@/components/fusion-section";
import { Hero } from "@/components/hero";
import { House } from "@/components/house";
import { KitchenSection } from "@/components/kitchen-section";
import { MorningSection } from "@/components/morning-section";
import { ProofSection } from "@/components/proof-section";
import { QuoteSection } from "@/components/quote-section";
import { RentalsSection } from "@/components/rentals-section";
import { TeamSection } from "@/components/team-section";
import { Ticker } from "@/components/ticker";

export default function HomePage() {
  return (
    <main id="top">
      <Hero />
      <Ticker />
      <House />
      <BarSection />
      <TeamSection />
      <KitchenSection />
      <RentalsSection />
      <MorningSection />
      <ProofSection />
      <FusionSection />
      <QuoteSection />
    </main>
  );
}
