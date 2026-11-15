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
npm test
npm run lint
npm run build
npm start
```

The page and the production build run with no environment variables. A quote submit then keeps what the visitor typed and falls back to texting Danielle. Copy `.env.example` to `.env.local` when you connect Supabase and Resend.

Hosting target is Vercel. `npm run build` is the production build.

## Save a quote request

The form posts to `POST /api/quotes`. The route checks the body, ignores a filled honeypot, rate-limits by IP (five posts in 15 minutes on that server process), inserts with the Supabase service role key, and emails Danielle through Resend. The visitor still gets the text, copy, and email actions. If the save fails, or the Supabase variables are missing, the form falls back to the text message and does not clear the fields.

Anonymous visitors cannot read the table. There is no insert policy for the browser. Step 3 adds Danielle’s signed-in read and update access. The migration file says what that policy should look like.

### Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/20261115000000_create_quote_requests.sql`. With the Supabase CLI linked to the project, `supabase db push` runs the same file.
3. In Project Settings → API, copy the project URL, the anon public key, and the service role key.

### Resend

1. Create an API key at [resend.com](https://resend.com).
2. Verify the domain you will send from.
3. Choose Danielle’s inbox as the notify address, and a from address on that verified domain.

### Vercel

In the project’s Environment Variables, add:

| Name | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Server, to reach the project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Not used until step 3 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Inserts quote rows |
| `RESEND_API_KEY` | Server only. Sends the notification |
| `QUOTE_NOTIFY_EMAIL` | Danielle’s inbox |
| `QUOTE_FROM_EMAIL` | Verified Resend sender |

Redeploy after saving them. A missing Supabase URL or service role key does not crash the build. The form tells the visitor to text Danielle instead.

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
  api/quotes/route.ts saves a quote and emails Danielle
components/           page sections. Client components are the header, the quote form, and the service links that preselect a chip.
lib/
  site.ts             phone, links, and the form’s choices
  quote.ts            builds the text the visitor can still send
  quote-schema.ts     zod validation for the post body
  submit-quote.ts     save, then email, with the failure cases
  email.ts            Resend wrapper
  supabase-admin.ts   service-role client
  rate-limit.ts       in-memory limit per IP
public/fotos/         event photos
public/brand/         draft logo files and the hero poster. See Logo.
supabase/migrations/  quote_requests table and RLS
.env.example          Supabase, Resend, and Stripe variable names
```

## Logo

The chosen mark is the Deco Monogram, a PT monogram in a chamfered art-deco badge, brass on night. It will be the hero lockup, the header mark, and the favicon. Those files are still being drawn. Until they arrive, `public/brand/` holds the previous coupe lockup so the page has a logo. That artwork is not the final choice. Swap it by replacing the files and keeping the names.

| File | Use |
| --- | --- |
| `logo-full-light.svg` / `.png` | Cream type. The hero lockup uses the SVG. |
| `logo-full.svg` / `.png` | Night type, for a light background. |
| `logo-mark-light.svg` / `.png` | Mark for dark backgrounds. Header on night. |
| `logo-mark.svg` / `.png` | Mark for light backgrounds. Header on cream. |

The placeholder lockup is 809.72×240. If the Deco files are a different size, update `BRAND_LOGO_ASPECT` in `lib/brand.ts`. The header reads `logo-mark-light.svg` on dark grounds and `logo-mark.svg` on cream. The favicon is `app/icon.svg` until the Deco favicon files arrive. The typed headline stays in the image alt. “Jersey City & South Florida” and the quote button stay as live text.

## Fonts

`next/font` loads only the faces the live page actually uses:

- Federo 400, the wordmarks
- Cormorant Garamond italic 500, the italic lines
- Mulish 400 and 600, body and buttons

Anton, Archivo, Big Shoulders Display, Instrument Serif, and Instrument Sans are named by the unused type pairs in the stylesheet and are not loaded. Mulish 700 was in the old Google Fonts request and is not used. The chip buttons declare weight 500; the old font request did not include 500, so those buttons already drew in Mulish 400, and they still do.

## Roadmap

1. The Next.js skeleton, with the current page ported. Done in the parent pull request.
2. Save quote requests to Supabase and email them to Danielle. This branch. The text-message fallback stays.
3. A logged-in admin dashboard so Danielle can manage requests, using Supabase Auth. `/admin` is the empty page that dashboard will replace. The migration notes the select and update policies to add.
4. Online booking with Stripe deposits.
