-- Quote requests from the public site.
-- The server inserts with the Supabase service role key, which bypasses RLS.
-- Anonymous and signed-in clients have no access until step 3.

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  party text,
  services text[] not null default '{}',
  guests integer,
  event_date date,
  location text,
  name text,
  contact text,
  message text not null,
  status text not null default 'new',
  email_sent boolean not null default false,
  source text not null default 'website',
  constraint quote_requests_status_check
    check (status in ('new', 'contacted', 'booked', 'closed')),
  constraint quote_requests_guests_check
    check (guests is null or (guests >= 1 and guests <= 10000)),
  constraint quote_requests_source_check
    check (source in ('website'))
);

comment on table public.quote_requests is
  'Website quote requests. Inserts are server-only. Step 3 lets Danielle read and update rows after she signs in.';

comment on column public.quote_requests.status is
  'new, contacted, booked, or closed. The admin dashboard in step 3 updates this.';

comment on column public.quote_requests.email_sent is
  'True after Resend accepts the notification to Danielle.';

create index quote_requests_created_at_idx
  on public.quote_requests (created_at desc);

create index quote_requests_status_idx
  on public.quote_requests (status);

alter table public.quote_requests enable row level security;

-- No policies. With RLS on and no policy, anon and authenticated are denied.
-- Do not add an insert or select policy for anon. The browser never writes this table.
--
-- Step 3, once Danielle signs in with Supabase Auth, grant her access and add policies.
-- Example, limited to her account email:
--
--   grant select, update on public.quote_requests to authenticated;
--
--   create policy "admin reads quote requests"
--     on public.quote_requests for select
--     to authenticated
--     using ((select auth.jwt() ->> 'email') = 'danielle@example.com');
--
--   create policy "admin updates quote requests"
--     on public.quote_requests for update
--     to authenticated
--     using ((select auth.jwt() ->> 'email') = 'danielle@example.com')
--     with check ((select auth.jwt() ->> 'email') = 'danielle@example.com');

revoke all on table public.quote_requests from public, anon, authenticated;
grant all on table public.quote_requests to service_role;
