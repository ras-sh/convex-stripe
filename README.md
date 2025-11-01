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
npm install @ras-sh/convex-stripe stripe convex-helpers
```

This component requires `stripe` and `convex-helpers` as peer dependencies, giving you control over the Stripe version and allowing you to use the Stripe SDK directly for advanced operations.

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
  syncProducts,
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

#### Webhook Callbacks (Optional)

You can add custom handlers to respond to Stripe webhook events:

```ts
stripe.registerRoutes(http, {
  path: "/stripe/webhook",
  onCheckoutComplete: async (ctx, event) => {
    // Called when a checkout session completes
    console.log("Checkout completed:", event.data.object.id);
  },
  onSubscriptionCreated: async (ctx, event) => {
    // Called when a subscription is created
    console.log("Subscription created:", event.data.object.id);
  },
  onSubscriptionUpdated: async (ctx, event) => {
    // Called when a subscription is updated
    console.log("Subscription updated:", event.data.object.id);
  },
  onSubscriptionDeleted: async (ctx, event) => {
    // Called when a subscription is deleted
    console.log("Subscription deleted:", event.data.object.id);
  },
  onInvoicePaid: async (ctx, event) => {
    // Called when an invoice is paid
    console.log("Invoice paid:", event.data.object.id);
  },
  onInvoiceFailed: async (ctx, event) => {
    // Called when invoice payment fails
    console.log("Invoice payment failed:", event.data.object.id);
  },
});
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

### Environment Variables

Set environment variables in your Convex dashboard:

```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Webhook Setup

Configure webhook endpoint in Stripe dashboard:
- URL: `https://your-deployment.convex.site/stripe/webhook`
- Events: Select all checkout, customer, subscription, invoice, product, and price events

### Supported Stripe API Versions

This component supports Stripe SDK versions `^18.0.0` and `^19.0.0`. We recommend using the latest version:

```ts
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover", // Latest stable API version
});
```

The component uses a stable subset of Stripe's API that works across these versions.

## API

### Queries

- `getCurrentSubscription()` - Get active subscription for current user
- `listUserSubscriptions()` - List all subscriptions (past and present) for current user
- `listActiveProducts()` - List all products from Stripe
- `getConfiguredProducts()` - Get products configured with slugs
- `listUserInvoices({ limit? })` - List invoices for current user
- `listUserPaymentMethods()` - List saved payment methods for current user

### Actions

- `generateCheckoutLink({ priceIds, successUrl, cancelUrl, mode? })` - Create checkout session
- `generateBillingPortalLink({ returnUrl })` - Create billing portal session
- `cancelSubscription({ immediate? })` - Cancel user's subscription
- `syncProducts()` - Sync products from Stripe

### React Hooks

- `useSubscription()` - Get subscription with formatted dates and status helpers
- `useCurrentSubscription()` - Get raw subscription data
- `useUserSubscriptions()` - List all subscriptions (past and present)
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

### Advanced Methods

These methods are available on the `StripeComponent` instance for advanced use cases:

- `getCustomerByUserId(userId)` - Get Stripe customer record by user ID
- `createCustomer(userId, email, name?)` - Create a new Stripe customer
- `getProductBySlug(slug)` - Get product by custom slug
- `getPricesForProduct(productId)` - Get all prices for a product
- `getPriceBySlug(slug)` - Get price by custom slug

**Example:**
```ts
// In convex/stripe.ts
export const getCustomer = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getCurrentUser(ctx);
    return await stripe.getCustomerByUserId(ctx, { userId });
  },
});
```

## Maintenance and Updates

### Schema Updates

This component stores Stripe data in Convex tables and keeps them in sync via webhooks. When you update the component version:

1. Update the package: `npm install @ras-sh/convex-stripe@latest`
2. Deploy: `npx convex deploy`
3. Convex automatically handles schema migrations

### Stripe API Changes

The component is designed to work with Stripe SDK versions `^18.0.0` and `^19.0.0`. You can upgrade your Stripe SDK independently:

```bash
npm install stripe@latest
```

For new Stripe features, update both packages and check the component's changelog for any required configuration changes.

## License

MIT

## Links

- [GitHub](https://github.com/ras-sh/convex-stripe)
- [Stripe Docs](https://stripe.com/docs)
- [Convex Docs](https://docs.convex.dev)
