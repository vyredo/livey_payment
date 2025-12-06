# LiveStream ERP Payment Gateway

Production-ready Stripe Connect (Express Accounts) integration for a live-stream ERP built with Bun, Hono, Prisma, React, Vite, Tailwind CSS, shadcn/ui, and Stripe Elements.

## Quick Start with Docker 🐳

```bash
# Start the services (PostgreSQL + Backend Server)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The server will be available at `http://localhost:3001`.

📖 **See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker instructions.**

---

## Features

- Seller onboarding with Stripe Connect Express (account links + login links)
- Destination charges with automatic platform fees (`application_fee_amount`)
- Orders created before payment with line items and status tracking
- Transaction records mapped to Stripe PaymentIntents
- Stripe webhooks for asynchronous payment + account status updates
- React checkout flow with PaymentElement and order summary
- Seller dashboard widget for viewing/connecting Stripe payouts

## Project Structure

```text
prisma/
  schema.prisma
src/
  server/
    index.ts
    lib/
      prisma.ts
    routes/
      orders.ts
      payments.ts
      webhooks.ts
    services/
      order.service.ts
      stripe.service.ts
    validators/
      order.schemas.ts
      payment.schemas.ts
  components/
    orders/
      CreateOrderForm.tsx
    payments/
      StripeConnectCard.tsx
      CheckoutForm.tsx
  pages/
    OrderConfirmation.tsx
```

## Prerequisites

**With Docker (Recommended):**

- Docker and Docker Compose
- Stripe account (test mode keys)

**Without Docker:**

- Bun (latest)
- Node.js 18+ (for tooling compatibility)
- PostgreSQL 14+ running locally
- Stripe account with:
  - Secret key (test mode)
  - Publishable key (test mode)
  - Webhook signing secret for `payment_intent.*` and `account.updated`

## Installation

```bash
bun install
```

## Environment setup

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Update the following values:

- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `APP_URL`

## Database Setup (Prisma + PostgreSQL)

### Quick Setup (Local Development)

Run the automated setup script:

```bash
chmod +x scripts/setup-local-db.sh
./scripts/setup-local-db.sh
```

This script will:
1. Generate Prisma Client
2. Run database migrations
3. Optionally seed the database with demo data

### Manual Setup

Generate the Prisma client:

```bash
bun run db:generate
```

Run database migrations:

```bash
bun run db:migrate
```

Deploy migrations (production):

```bash
bun run db:migrate:deploy
```

Seed the database (optional):

```bash
bun run db:seed
```

To inspect data with Prisma Studio:

```bash
bun run db:studio
```

### Docker Database Setup

When using Docker Compose, the database is automatically created and migrated on container startup via the [`scripts/init-db.sh`](scripts/init-db.sh:1) script.

### Available Database Scripts

- `bun run db:generate` - Generate Prisma Client
- `bun run db:migrate` - Run migrations in development
- `bun run db:migrate:deploy` - Deploy migrations in production
- `bun run db:push` - Push schema changes without migrations
- `bun run db:studio` - Open Prisma Studio
- `bun run db:seed` - Seed database with demo data

### Docker Scripts

- `bun run docker:up` - Start Docker services
- `bun run docker:down` - Stop Docker services
- `bun run docker:logs` - View Docker logs
- `bun run docker:rebuild` - Rebuild and restart containers

## Running the backend (Hono on Bun)

Start the API server:

```bash
bun run server:dev
```

This starts a Hono app mounted under `/api` with the following routes:

- `POST /api/orders` – create order
- `GET /api/orders/:orderId` – get order details
- `POST /api/payments/onboard` – start Stripe Connect onboarding
- `GET /api/payments/callback` – Stripe redirect handler
- `POST /api/payments/create-intent` – create PaymentIntent for an order
- `POST /api/payments/portal` – create Stripe Express dashboard login link
- `POST /api/webhooks/stripe` – Stripe webhook endpoint
- `GET /api/health` – health check

## Running the frontend (React + Vite)

This repository assumes a Vite + React + TypeScript + Tailwind + shadcn/ui setup under `src/`.
If you don’t already have one, you can scaffold it:

```bash
bunx create-vite@latest . --template react-ts
```

Then install Tailwind CSS and shadcn/ui according to their docs, and ensure:

- The alias `@` points to `./src` in `tsconfig.json` and `vite.config.ts`.
- shadcn/ui primitives exist for:
  - `Button`, `Badge`, `Card`, `Input`, `Label`, `Textarea`
  - `Table`, `Separator`, `Skeleton`

Wrap your app with React Query’s `QueryClientProvider` and render the components:

- `<CreateOrderForm />` for creating orders
- `<StripeConnectCard />` on the seller settings page
- `<CheckoutForm />` on the buyer checkout page
- `<OrderConfirmationPage />` on the post-payment success route

## Stripe Connect flow

1. **Seller onboarding**
   - Seller clicks “Connect with Stripe” in `StripeConnectCard`.
   - Backend calls Stripe `accounts.create` (if needed) and `accountLinks.create`.
   - The seller completes onboarding on Stripe; on return we update:
     - `stripeAccountId`
     - `stripeOnboardingCompleted`
     - `stripeAccountStatus`

2. **Order creation**
   - `CreateOrderForm` calls `POST /api/orders`.
   - An `Order` + `OrderItem[]` row set is created with financial totals.

3. **Payment intent**
   - Checkout calls `POST /api/payments/create-intent` with `orderId`.
   - Backend creates a destination charge PaymentIntent with:
     - `application_fee_amount` (platform revenue)
     - `transfer_data.destination` = seller’s `stripeAccountId`
   - A `Transaction` record is stored and the client secret is returned.

4. **Payment confirmation**
   - `CheckoutForm` uses Stripe `<PaymentElement />` and `confirmPayment`.
   - The buyer’s card and wallet details never hit your backend.

5. **Webhooks & order state**
   - `payment_intent.succeeded`:
     - `Transaction.status` → `succeeded`
     - `Order.status` → `paid`
     - `Order.paymentStatus` → `paid`
     - (Place inventory deduction / fulfillment logic here)
   - `payment_intent.payment_failed`:
     - `Transaction.status` → `failed`
     - (Notify seller / retry logic)
   - `account.updated`:
     - Syncs `stripeAccountStatus` on `Seller`.

## Notes

- All currency amounts are stored in **cents** (integer) to avoid floating-point errors.
- All API routes use Zod validation via `@hono/zod-validator`.
- Idempotency keys are applied per order when creating PaymentIntents.
- Credit card details are handled exclusively by Stripe Elements / PaymentElement.
