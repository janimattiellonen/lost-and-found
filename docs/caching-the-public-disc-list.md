# Caching the public disc list

Status: **proposed, not implemented** (deferred 2026-08-30).

Every front-page visit currently costs a Supabase round trip: `DiscListPage`
fetches on mount, the loader runs `getDiscs()`, and nothing in the app sets a
single cache header. The list changes only when an admin marks a disc or an
import runs, so it is a good candidate for CDN caching.

## The approach

Set `Cache-Control` on the disc-list loader response and let Vercel's Edge
Network store it. This is plain HTTP caching — available on the Hobby tier,
not a paid feature, and not Next.js's plan-gated Data Cache.

```ts
// app/routes/discs.data.tsx
const payload = await loadDiscListData(request);

return data(payload, {
  headers: {
    'Cache-Control': payload.isLoggedIn
      ? 'private, no-store'
      : 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
  },
});
```

`max-age=0` keeps browsers honest while `s-maxage` lets the CDN hold the copy;
`stale-while-revalidate` refreshes it in the background instead of making a
visitor wait. `loadDiscListData` would need to return `isLoggedIn`, which it
already computes.

## The part that will bite

**The same URL returns two different payloads.** `loadDiscListData` strips
`externalId` for anonymous visitors. Vercel's edge cache does not vary on
`Cookie`, so an admin would be served the cached anonymous copy and the disc
table's action buttons would quietly stop rendering. It is not a data leak —
the anonymous body is a strict subset — but it is a real bug.

Fix by making the URL differ, since the query string is part of the cache key:

```ts
fetcher.load(isLoggedIn ? '/discs/data?admin=1' : '/discs/data');
```

`DiscListPage` can read `session` from the outlet context the way `DiscTable`
already does. The admin variant is `no-store` and never caches.

**Vercel refuses to cache any response carrying `Set-Cookie`.** Today the
loader has none: `createSupabaseServerClient` (app/models/utils.ts) deliberately
drops Supabase's cookie writes and `isUserLoggedIn` uses that variant. Switching
that loader to `createSupabaseServerClientWithHeaders` would silently disable
caching.

**Staleness.** After an admin marks a disc returned, the public list can lag by
up to `s-maxage`. 60s is probably fine here; 10–15s still absorbs most repeat
traffic. Hobby has no cache-purge API, so a bad cached response has to age out —
an argument for keeping the TTL short while verifying.

## Which URL actually gets cached

Because `app/routes/discs.data.tsx` has a default export, React Router treats it
as a normal route: `fetcher.load('/discs/data')` really requests
**`/discs/data.data`** (the single-fetch payload, ~138KB), while a plain GET to
`/discs/data` renders a full ~200KB HTML document. Both answer 200, so it is
easy to test the wrong one and conclude caching is broken.

Worth doing as part of this: drop that `export default function DiscsDataRoute()
{ return null }`. The file then becomes a true resource route — served directly
at `/discs/data`, no `.data` suffix, no pointless HTML variant — and a simpler
thing to cache.

## How to verify it works

Locally, only the header itself can be checked (there is no CDN in front of the
dev server):

```bash
curl -sI http://localhost:3400/discs/data.data | grep -iE 'cache-control|set-cookie'
```

On the deployment, the CDN reports its own decision:

```bash
curl -sI https://<app>/discs/data.data | grep -iE 'x-vercel-cache|age|cache-control'
```

- `MISS` on the first request, `HIT` on the second — that is the whole test.
- `age` counting up confirms the stored copy is being served.
- One `STALE` after `s-maxage` elapses is `stale-while-revalidate` working, not
  a failure.
- `BYPASS` means something opted out, usually a `Set-Cookie` or `no-store`.

Test the admin variant explicitly, and confirm the two bodies differ:

```bash
curl -s 'https://<app>/discs/data.data' | grep -c externalId    # expect 0
curl -s --cookie '<auth cookie>' 'https://<app>/discs/data.data?admin=1' | grep -c externalId
```

If an anonymous request ever returns `externalId`, the cache is serving an admin
response to the public — stop and fix that first.

## Alternatives considered

- **Module-scope cache in the serverless function**, ~30s TTL. Five lines, but
  survives only as long as an instance and does nothing on a cold start. Worth
  it alongside the CDN headers, not instead of them.
- **Move the query into the `_index` loader** so the list is server-rendered and
  the document itself is cacheable, dropping the extra client round trip. Better
  for first paint and for search engines, but it is a real refactor of
  `DiscListPage`, which fetches in a `useEffect` on mount — and the
  logged-in-variant problem applies to the HTML too.
