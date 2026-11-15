import { Photo } from "@/components/photo";
import { FUSION_URL } from "@/lib/site";

export function FusionSection() {
  return (
    <section className="fusion w-team" id="fusion" data-world="team">
      <figure className="arch" data-speed="-.05">
        <Photo
          src="/fotos/fusion-cart.jpg"
          alt="The Fusion Mixology Cart set up outdoors"
          objectPosition="30% 60%"
          sizes="(min-width: 860px) 320px, 62vw"
        />
      </figure>
      <div className="fusion-t">
        <p className="by">Also by Danielle</p>
        <h2 className="fusion-h">Fusion Mixology Cart</h2>
        <p className="ltext">
          Her mobile cocktail cart, for parties outside in spring and summer.
        </p>
        <div className="links">
          <a href={FUSION_URL} target="_blank" rel="noopener noreferrer">
            See the cart
          </a>
        </div>
      </div>
    </section>
  );
}
