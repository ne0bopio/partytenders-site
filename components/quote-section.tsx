import { QuoteForm } from "@/components/quote-form";

export function QuoteSection() {
  return (
    <section className="quote w-cream" id="quote" data-world="cream">
      <h2 className="quote-h">Get a quote</h2>
      <QuoteForm />
    </section>
  );
}
