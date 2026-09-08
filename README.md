# FleetGuard Pro

Phase-one foundation for a fleet management and vehicle safety SaaS product.

## Start locally

```bash
npm install
cp .env.example .env
npm run dev
```

The marketing site is at `/`, the reserved application shell is at `/dashboard`, and the health endpoint is `/api/health`.

## Database

Set `DATABASE_URL` to a PostgreSQL database, then run:

```bash
npm run db:generate
npm run db:push
```

Authentication and object storage are intentionally deferred. The schema includes company-aware roles and document URL fields so those services can be added without restructuring the core domain.
