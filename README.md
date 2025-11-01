# @ras-sh/convex-stripe

⚡💳 Stripe integration for Convex. Syncs customers, subscriptions, and payments through secure webhooks and helpful utilities.

## Features

- Full Stripe integration (customers, subscriptions, products, prices, invoices)
- Automatic webhook sync with signature verification
- Product slugs for developer-friendly references
- Multi-currency support
- Checkout sessions and billing portal
- Type-safe with full TypeScript support

## Installation

```bash
npm install @ras-sh/convex-stripe stripe convex-helpers
```

## Quick Start

### 1. Configure the component

In `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import stripe from "@ras-sh/convex-stripe/convex.config";

const app = defineApp();
app.use(stripe);

export default app;
```

### 2. Initialize Stripe

In `convex/stripe.ts`:

```ts
import { components } from "./_generated/api";
import { StripeComponent } from "@ras-sh/convex-stripe";
import Stripe from "stripe";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export const stripe = new StripeComponent(components.stripe, {
  getUserInfo: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return { userId: user._id, email: user.email };
  },
  products: {
    premiumMonthly: { productId: "prod_xxx", priceId: "price_xxx" },
  },
  stripe: stripeClient,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
});

export const {
  getCurrentSubscription,
  listUserSubscriptions,
  listActiveProducts,
  getConfiguredProducts,
  listUserInvoices,
  generateCheckoutLink,
  generateBillingPortalLink,
  cancelSubscription,
} = stripe.api();
```

### 3. Set up webhooks

In `convex/http.ts`:

```ts
import { httpRouter } from "convex/server";
import { stripe } from "./stripe";

const http = httpRouter();

stripe.registerRoutes(http, {
  path: "/stripe/webhook",
});

export default http;
```

Add custom webhook handlers (optional):

```ts
stripe.registerRoutes(http, {
  path: "/stripe/webhook",
  onCheckoutComplete: async (ctx, event) => {},
  onSubscriptionCreated: async (ctx, event) => {},
  onSubscriptionUpdated: async (ctx, event) => {},
  onSubscriptionDeleted: async (ctx, event) => {},
  onInvoicePaid: async (ctx, event) => {},
  onInvoiceFailed: async (ctx, event) => {},
});
```

### 4. Use in React

```tsx
import { ConvexProvider } from "convex/react";
import { StripeProvider } from "@ras-sh/convex-stripe/react";
import { api } from "../convex/_generated/api";

function App() {
  return (
    <ConvexProvider client={convex}>
      <StripeProvider api={api.stripe}>
        <YourApp />
      </StripeProvider>
    </ConvexProvider>
  );
}
```

```tsx
import { useSubscription, useGenerateCheckoutLink } from "@ras-sh/convex-stripe/react";

function SubscriptionPage() {
  const subscription = useSubscription();
  const generateCheckout = useGenerateCheckoutLink();

  const handleUpgrade = async () => {
    const { url } = await generateCheckout({
      priceIds: ["price_xxx"],
      successUrl: `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/cancel`,
    });
    window.location.href = url;
  };

  return subscription?.isActive ? (
    <p>Active until {subscription.periodEndDate}</p>
  ) : (
    <button onClick={handleUpgrade}>Upgrade</button>
  );
}
```

## Configuration

### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Webhook Setup

Configure webhook endpoint in your Stripe dashboard:
- URL: `https://your-deployment.convex.site/stripe/webhook`
- Events: Select all checkout, customer, subscription, invoice, product, and price events

## API

### Queries

- `getCurrentSubscription()`
- `listUserSubscriptions()`
- `listActiveProducts()`
- `getConfiguredProducts()`
- `listUserInvoices({ limit? })`

### Actions

- `generateCheckoutLink({ priceIds, successUrl, cancelUrl, mode? })`
- `generateBillingPortalLink({ returnUrl })`
- `cancelSubscription({ immediate? })`

### Internal Actions

Available via `ctx.runAction(internal.stripe.*)`:

- `syncAll()`
- `syncProducts()`
- `syncCustomers()`
- `syncSubscriptions()`
- `syncInvoices()`

### React Hooks

- `useSubscription()`
- `useCurrentSubscription()`
- `useUserSubscriptions()`
- `useActiveProducts()`
- `useConfiguredProducts()`
- `useUserInvoices({ limit? })`
- `useGenerateCheckoutLink()`
- `useGenerateBillingPortalLink()`
- `useCancelSubscription()`

### Utilities

- `formatCurrency(amountInCents, currency)`
- `formatDate(timestamp, options?)`
- `isSubscriptionActive(status)`

## License

MIT

## Links

- [GitHub](https://github.com/ras-sh/convex-stripe)
- [Stripe Docs](https://stripe.com/docs)
- [Convex Docs](https://docs.convex.dev)
