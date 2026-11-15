import { HeroActions, HeroLockup } from "@/components/hero-copy";
import { HeroStage } from "@/components/hero-stage";

export function Hero() {
  return (
    <section className="hero w-night" data-world="night">
      <HeroLockup />
      <HeroStage />
      <HeroActions />
    </section>
  );
}
