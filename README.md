# @ras-sh/convex-stripe

Convex component for Stripe integration with subscription management, webhooks, and checkout flows.

## Features

- Full Stripe integration (customers, subscriptions, products, prices, invoices)
- Automatic webhook sync with signature verification
- Product slugs for developer-friendly references
- Multi-currency support
- Checkout sessions and billing portal
- Type-safe with full TypeScript support

## Installation

```bash
npm install @ras-sh/convex-stripe stripe
```

## Quick Start

### 1. Configure the component

In `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import stripe from "@ras-sh/convex-stripe/convex.config";

const app = defineApp();
app.use(stripe, { name: "stripe" });

export default app;
```

### 2. Initialize Stripe

In `convex/stripe.ts`:

```ts
import { components } from "./_generated/api";
import { StripeComponent } from "@ras-sh/convex-stripe";

export const stripe = new StripeComponent(components.stripe, {
  getUserInfo: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return { userId: user._id, email: user.email };
  },
  products: {
    premiumMonthly: { productId: "prod_xxx", priceId: "price_xxx" },
  },
  apiKey: process.env.STRIPE_API_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  mode: "test",
});

export const {
  getCurrentSubscription,
  listActiveProducts,
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

### 4. Set up React provider

Wrap your app with the `StripeProvider`:

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

### 5. Use React hooks

```tsx
import {
  useSubscription,
  useGenerateCheckoutLink,
  useGenerateBillingPortalLink,
} from "@ras-sh/convex-stripe/react";

function SubscriptionPage() {
  const subscription = useSubscription();
  const generateCheckout = useGenerateCheckoutLink();
  const generatePortal = useGenerateBillingPortalLink();

  const handleUpgrade = async () => {
    const { url } = await generateCheckout({
      priceIds: ["price_xxx"],
      successUrl: `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/cancel`,
      mode: "subscription",
    });
    window.location.href = url;
  };

  const handleManageBilling = async () => {
    const { url } = await generatePortal({
      returnUrl: window.location.href,
    });
    window.location.href = url;
  };

  return (
    <div>
      {subscription?.isActive ? (
        <div>
          <p>Status: {subscription.data.status}</p>
          <p>Period ends: {subscription.periodEndDate}</p>
          {subscription.isCanceling && <p>Cancels at period end</p>}
          <button onClick={handleManageBilling}>Manage Billing</button>
        </div>
      ) : (
        <button onClick={handleUpgrade}>Upgrade</button>
      )}
    </div>
  );
}
```

## Configuration

Set environment variables in your Convex dashboard:

```bash
STRIPE_API_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Configure webhook endpoint in Stripe dashboard:
- URL: `https://your-deployment.convex.site/stripe/webhook`
- Events: Select all checkout, customer, subscription, invoice, product, and price events

## API

### Queries

- `getCurrentSubscription()` - Get active subscription for current user
- `listActiveProducts()` - List all products from Stripe
- `getConfiguredProducts()` - Get products configured with slugs
- `listUserInvoices({ limit? })` - List invoices for current user

### Actions

- `generateCheckoutLink({ priceIds, successUrl, cancelUrl, mode? })` - Create checkout session
- `generateBillingPortalLink({ returnUrl })` - Create billing portal session
- `cancelSubscription({ immediate? })` - Cancel user's subscription
- `syncProducts()` - Sync products from Stripe

### React Hooks

- `useSubscription()` - Get subscription with formatted dates and status helpers
- `useCurrentSubscription()` - Get raw subscription data
- `useActiveProducts()` - List all products
- `useConfiguredProducts()` - Get products with slugs
- `useUserInvoices({ limit? })` - List invoices
- `useGenerateCheckoutLink()` - Generate checkout session
- `useGenerateBillingPortalLink()` - Generate billing portal session
- `useCancelSubscription()` - Cancel subscription

### Utilities

- `formatCurrency(amountInCents, currency)` - Format prices (e.g., `formatCurrency(1999, "usd")` → "$19.99")
- `formatDate(timestamp, options?)` - Format Unix timestamps
- `isSubscriptionActive(status)` - Check if subscription is active or trialing

## License

MIT

## Links

- [GitHub](https://github.com/ras-sh/convex-stripe)
- [Stripe Docs](https://stripe.com/docs)
- [Convex Docs](https://docs.convex.dev)
