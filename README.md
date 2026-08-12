# YHack AI CRM

Internal CRM for a small school organization.

## Stack

- **Frontend:** React, Vite, TypeScript, React Router, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Auth:** JWT-based (interface ready for Supabase Auth migration)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### Backend

```bash
cd back-end
cp .env.example .env
# Edit DATABASE_URL in .env

npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Backend runs at http://localhost:5000

### Frontend

```bash
cd front-end/frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at http://localhost:5173

### Demo Credentials

- Admin: `admin@yhack.local` / `admin12345`
- Member: `member@yhack.local` / `member12345`

## Tests

```bash
# Backend
cd back-end && npm test

# Frontend
cd front-end/frontend && npm test
```

## Architecture Notes

- **Multi-tenancy:** Users belong to a `Tenant` (school org). All CRM data is scoped by `tenantId`.
- **Organization entity:** External companies/schools contacts belong to (not the tenant).
- **Soft deletion:** Contacts, organizations, interactions, tasks use `deletedAt`.
- **Auth:** Spec recommends Supabase Auth; current implementation uses JWT + bcrypt for local development. The auth service layer can be swapped without changing route handlers.
