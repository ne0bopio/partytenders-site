# PartyTenders

Website for PartyTenders, Danielle Belletiere’s bartending, staffing, and catering company in New Jersey, New York, and South Florida. The public page is the current one-page site, rebuilt on Next.js so the business can grow it.

Palette 2 (cherry and brass) and type 3 (Federo, Cormorant Garamond, Mulish) are the current direction. The palette values for the other two trials are still in `app/globals.css`.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin placeholder is at [http://localhost:3000/admin](http://localhost:3000/admin).

```bash
npm run lint
npm run build
npm start
```

No environment variables are required for this step. `.env.example` lists the names later steps will use. Copy it to `.env.local` when those steps start, and leave the values empty until then.

Hosting target is Vercel. `npm run build` is the production build.

## Project structure

```
app/
  layout.tsx          fonts, global CSS, share metadata
  globals.css         the existing stylesheet
  icon.svg            favicon
  (site)/             public pages. The route group is not part of the URL.
    page.tsx          the one-page site
    layout.tsx        header and footer
  admin/page.tsx      placeholder for Danielle’s dashboard
components/           page sections. Client components are the header, the quote form, and the service links that preselect a chip.
lib/
  site.ts             phone, links, and the form’s choices
  quote.ts            builds the quote message. Step 2 swaps the transport, not this shape.
public/fotos/         event photos
.env.example          future Supabase and Stripe variable names
```

The quote form still prepares a text to Danielle at 484-358-2578. On a phone, submit opens that message for the visitor to review and send. On a computer, where `sms:` links do not open, the form shows the same message with copy and email actions. The site does not send it.

## Fonts

`next/font` loads only the faces the live page actually uses:

- Federo 400, the wordmarks
- Cormorant Garamond italic 500, the italic lines
- Mulish 400 and 600, body and buttons

Anton, Archivo, Big Shoulders Display, Instrument Serif, and Instrument Sans are named by the unused type pairs in the stylesheet and are not loaded. Mulish 700 was in the old Google Fonts request and is not used. The chip buttons declare weight 500; the old font request did not include 500, so those buttons already drew in Mulish 400, and they still do.

## Roadmap

1. This skeleton, with the current page ported.
2. Save quote requests to Supabase and email them to Danielle. `lib/quote.ts` already returns the payload an API route can accept.
3. A logged-in admin dashboard so Danielle can manage requests, using Supabase Auth. `/admin` is the empty page that dashboard will replace.
4. Online booking with Stripe deposits.

Steps 2–4 are not built yet.
