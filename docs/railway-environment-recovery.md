# Railway environment recovery

The current Railway labels are known to be swapped. Treat the database that
the public backend actually reaches as **production**, even if Railway calls
it `dev`; do not migrate based on its display name.

## Safe recovery order

1. Put both services into maintenance or deploy freeze. Export a backup from
   each PostgreSQL service and record its Railway service ID, hostname and
   row counts (`users`, `items`, `borrowings`, `vote_proposals`).
2. Identify the live pair by opening the public backend's `DATABASE_URL`
   reference in Railway. Label that database `production` in the team notes.
   Never copy the dev database over it.
3. On the **actual production backend**, set `APP_ENV=production` and point
   `DATABASE_URL` to the live database. On the dev backend, set
   `APP_ENV=development` and point it to the separate dev database.
4. Set frontend variables in the matching environment:
   `NEXT_PUBLIC_API_URL` must point to that environment's backend and
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must equal the backend's `GOOGLE_CLIENT_ID`.
5. Deploy dev first and test with a throwaway KMITL test account. Then deploy
   production. Confirm `/health` returns the expected `environment` and that
   the public site displays the expected item count before changing domains.
6. Apply `backend/migrations/20260907_vote_and_thumbnail.sql` only to the
   database behind the corresponding backend. Apply it to the currently live
   database first, after its backup. Do not rely on `create_all` for columns on
   an existing PostgreSQL database.

## Google setup

Create a Google Web OAuth client and add every frontend origin (for example
`https://seraomee.com` and the dev frontend) under Authorized JavaScript
origins. Configure the same client ID as both `GOOGLE_CLIENT_ID` on the API
and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` on its frontend. The API validates the ID
token, verified email and exact `@kmitl.ac.th` suffix; the Google hosted-domain
hint is not trusted as authorization.

## Post-switch smoke test

- Sign in with a verified KMITL Google account; a non-KMITL account must fail.
- Submit a choice with a `shopee.co.th` link; it must appear and be votable
  immediately. Confirm public vote counts, shortlist, and purchase statuses
  are visible.
- Add an item from 1–6 photos. Check that the public list uses the compressed
  web thumbnail and that extra photos appear only under admin AI samples.
