# @ras-sh/convex-stripe

Unofficial Convex component for Stripe integration with subscription management, webhooks, and billing portal support.

## Features

- **Full Stripe Integration** - Customers, subscriptions, products, prices, invoices, and payment methods
- **Multi-Currency Support** - Handle payments in multiple currencies (USD, EUR, etc.)
- **Dev-Friendly Product Slugs** - Reference products by human-readable names
- **Webhook Handling** - Automatic sync with Stripe via secure webhooks
- **Billing Portal** - Pre-built integration with Stripe's billing portal
- **Checkout Sessions** - Easy checkout link generation
- **Type-Safe** - Full TypeScript support with generated types
- **Test & Live Mode** - Support for both Stripe environments

## Installation

```bash
npm install @ras-sh/convex-stripe stripe
```

## Quick Start

### 1. Set up the component in your Convex app

In your `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import stripe from "@ras-sh/convex-stripe/convex.config";

const app = defineApp();
app.use(stripe, { name: "stripe" });

export default app;
```

### 2. Create your Stripe instance

In your `convex/stripe.ts`:

```ts
import { components } from "./_generated/api";
import { StripeComponent } from "@ras-sh/convex-stripe";

export const stripe = new StripeComponent(components.stripe, {
  // Function to get current user info
  getUserInfo: async (ctx) => {
    const user = await getCurrentUser(ctx); // Your auth logic
    return {
      userId: user._id,
      email: user.email,
    };
  },

  // Optional: Map product slugs to Stripe IDs
  products: {
    premiumMonthly: {
      productId: "prod_xxxxx",
      priceId: "price_xxxxx",
    },
    premiumYearly: {
      productId: "prod_yyyyy",
      priceId: "price_yyyyy",
    },
  },

  // Stripe credentials
  apiKey: process.env.STRIPE_API_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  mode: "test", // or "live"
});
```

### 3. Set up webhooks

In your `convex/http.ts`:

```ts
import { httpRouter } from "convex/server";
import { stripe } from "./stripe";

const http = httpRouter();

// Register Stripe webhooks
stripe.registerRoutes(http, {
  path: "/stripe/webhook",
  // Optional callbacks for custom logic
  onSubscriptionCreated: async (ctx, event) => {
    console.log("New subscription!", event.data.object.id);
  },
  onInvoicePaid: async (ctx, event) => {
    console.log("Invoice paid!", event.data.object.id);
  },
});

export default http;
```

### 4. Expose the API to your frontend

In your `convex/stripe.ts`, export the API:

```ts
export const {
  getCurrentSubscription,
  listActiveProducts,
  getConfiguredProducts,
  generateCheckoutLink,
  generateBillingPortalLink,
  cancelSubscription,
  listUserInvoices,
  syncProducts,
} = stripe.api();
```

### 5. Use from your frontend

```tsx
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function SubscriptionPage() {
  const subscription = useQuery(api.stripe.getCurrentSubscription);
  const products = useQuery(api.stripe.getConfiguredProducts);
  const generateCheckout = useMutation(api.stripe.generateCheckoutLink);
  const openBillingPortal = useMutation(api.stripe.generateBillingPortalLink);

  const handleUpgrade = async () => {
    const { url } = await generateCheckout({
      priceIds: [products.premiumMonthly.priceId],
      successUrl: `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/cancel`,
      mode: "subscription",
    });
    window.location.href = url;
  };

  const handleManageBilling = async () => {
    const { url } = await openBillingPortal({
      returnUrl: window.location.href,
    });
    window.location.href = url;
  };

  return (
    <div>
      <h1>Subscription Status</h1>
      {subscription ? (
        <div>
          <p>Status: {subscription.status}</p>
          <p>
            Period ends:{" "}
            {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}
          </p>
          <button onClick={handleManageBilling}>Manage Billing</button>
        </div>
      ) : (
        <button onClick={handleUpgrade}>Upgrade to Premium</button>
      )}
    </div>
  );
}
```

## Configuration

### Environment Variables

Set these in your Convex dashboard (Settings → Environment Variables):

```bash
STRIPE_API_KEY=sk_test_xxx        # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxx   # Webhook signing secret
```

### Product Configuration

You can configure products in two ways:

#### 1. Static Configuration (Recommended)

Define product slugs in your Stripe instance:

```ts
products: {
  starter: { productId: "prod_xxx", priceId: "price_xxx" },
  pro: { productId: "prod_yyy", priceId: "price_yyy" },
  enterprise: { productId: "prod_zzz", priceId: "price_zzz" }
}
```

Then reference by slug in your code:

```ts
const subscription = await stripe.getCurrentSubscription(ctx, { userId });
if (subscription?.productSlug === "pro") {
  // User has pro features
}
```

#### 2. Dynamic Products

List all products and filter dynamically:

```ts
const products = await stripe.listActiveProducts(ctx);
const monthlyProducts = products.filter(
  (p) => p.prices[0]?.recurringInterval === "month"
);
```

## API Reference

### Queries

#### `getCurrentSubscription()`

Get the current active subscription for the logged-in user.

```ts
const subscription = useQuery(api.stripe.getCurrentSubscription);
// Returns: { status, productSlug, currentPeriodEnd, ... } | null
```

#### `listUserSubscriptions()`

List all subscriptions (active and past) for the logged-in user.

```ts
const subscriptions = useQuery(api.stripe.listUserSubscriptions);
```

#### `listActiveProducts()`

List all active products from your Stripe catalog.

```ts
const products = useQuery(api.stripe.listActiveProducts);
```

#### `getConfiguredProducts()`

Get products configured with slugs.

```ts
const products = useQuery(api.stripe.getConfiguredProducts);
// Returns: { premiumMonthly: {...}, premiumYearly: {...} }
```

#### `listUserInvoices({ limit? })`

List invoices for the logged-in user.

```ts
const invoices = useQuery(api.stripe.listUserInvoices, { limit: 10 });
```

### Actions

#### `generateCheckoutLink({ priceIds, successUrl, cancelUrl, mode? })`

Create a Stripe Checkout session.

```ts
const { url } = await generateCheckout({
  priceIds: ["price_xxxxx"],
  successUrl: "https://myapp.com/success",
  cancelUrl: "https://myapp.com/cancel",
  mode: "subscription", // or "payment"
});
```

#### `generateBillingPortalLink({ returnUrl })`

Create a Stripe Billing Portal session.

```ts
const { url } = await openBillingPortal({
  returnUrl: "https://myapp.com/settings",
});
```

#### `cancelSubscription({ immediate? })`

Cancel the user's subscription.

```ts
await cancelSubscription({
  immediate: false, // true = cancel now, false = at period end
});
```

#### `syncProducts()`

Sync products from Stripe to Convex (call once after setup).

```ts
await syncProducts({});
```

## Webhook Events

The component automatically handles these Stripe events:

- `checkout.session.completed` - Checkout completed
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.paid` - Invoice successfully paid
- `invoice.payment_failed` - Payment failed
- `invoice.finalized` - Invoice finalized
- `product.created` / `product.updated` - Product changes
- `price.created` / `price.updated` - Price changes

### Custom Webhook Handlers

Add custom logic to webhook events:

```ts
stripe.registerRoutes(http, {
  onSubscriptionCreated: async (ctx, event) => {
    // Send welcome email
    await ctx.runMutation(internal.emails.sendWelcome, {
      userId: event.data.object.metadata.userId,
    });
  },
  onSubscriptionDeleted: async (ctx, event) => {
    // Log churn
    await ctx.runMutation(internal.analytics.logChurn, {
      reason: event.data.object.cancellation_details?.reason,
    });
  },
  onInvoiceFailed: async (ctx, event) => {
    // Send payment failure notification
    await ctx.runMutation(internal.emails.sendPaymentFailed, {
      customerId: event.data.object.customer,
    });
  },
});
```

## Data Model

The component stores the following data in Convex:

### Customers

Links Stripe customers to your app's users.

```ts
{
  stripeId: string;          // Stripe customer ID
  userId: string;            // Your app's user ID
  email: string;
  name?: string;
  currency?: string;
  created: number;           // Unix timestamp
  metadata?: any;
}
```

### Products

Your product catalog synced from Stripe.

```ts
{
  stripeId: string;          // Stripe product ID
  name: string;
  description?: string;
  active: boolean;
  type?: string;             // "service" or "good"
  slug?: string;             // Dev-friendly identifier
  created: number;
  updated: number;
  metadata?: any;
}
```

### Prices

Prices associated with products.

```ts
{
  stripeId: string;          // Stripe price ID
  productId: Id<"products">;
  productStripeId: string;
  active: boolean;
  currency: string;          // "usd", "eur", etc.
  unitAmount?: number;       // Amount in cents
  type: string;              // "one_time" or "recurring"
  recurringInterval?: string; // "month", "year", etc.
  slug?: string;
  created: number;
  metadata?: any;
}
```

### Subscriptions

Customer subscriptions.

```ts
{
  stripeId: string;          // Stripe subscription ID
  customerId: Id<"customers">;
  userId: string;
  status: string;            // "active", "canceled", etc.
  priceId?: Id<"prices">;
  productSlug?: string;
  currency: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd?: number;
  created: number;
  metadata?: any;
}
```

### Invoices

Invoice history.

```ts
{
  stripeId: string;
  customerId: Id<"customers">;
  userId: string;
  subscriptionId?: Id<"subscriptions">;
  status: string;            // "paid", "open", etc.
  currency: string;
  amountDue: number;         // Cents
  amountPaid: number;        // Cents
  total: number;             // Cents
  invoicePdf?: string;       // PDF URL
  hostedInvoiceUrl?: string;
  created: number;
  metadata?: any;
}
```

## Advanced Usage

### Feature Gating by Subscription

```ts
export const addTodo = mutation({
  handler: async (ctx, args) => {
    const { userId } = await getCurrentUser(ctx);
    const subscription = await stripe.getCurrentSubscription(ctx, { userId });

    // Check subscription status
    if (!subscription || subscription.status !== "active") {
      throw new Error("Active subscription required");
    }

    // Check plan
    if (subscription.productSlug !== "pro") {
      throw new Error("Pro plan required for this feature");
    }

    // Create todo...
  },
});
```

### Multi-Currency Support

```ts
// Get prices in different currencies
const prices = await stripe.getPricesForProduct(ctx, { productId });
const usdPrice = prices.find((p) => p.currency === "usd");
const eurPrice = prices.find((p) => p.currency === "eur");
```

### Trial Subscriptions

Stripe trial subscriptions are automatically tracked:

```ts
const subscription = await stripe.getCurrentSubscription(ctx, { userId });
if (subscription?.trialEnd && subscription.trialEnd > Date.now() / 1000) {
  // User is in trial period
}
```

### One-Time Payments

For one-time payments (not subscriptions):

```ts
await generateCheckout({
  priceIds: ["price_one_time"],
  successUrl: "https://myapp.com/success",
  cancelUrl: "https://myapp.com/cancel",
  mode: "payment", // Important: use "payment" not "subscription"
});
```

## Setup Checklist

- [ ] Install `@ras-sh/convex-stripe` and `stripe`
- [ ] Add component to `convex.config.ts`
- [ ] Create Stripe instance in `convex/stripe.ts`
- [ ] Set up webhooks in `convex/http.ts`
- [ ] Add environment variables (`STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Create products in Stripe dashboard
- [ ] Run `syncProducts()` to import products
- [ ] Configure webhook endpoint in Stripe dashboard
  - URL: `https://your-deployment.convex.site/stripe/webhook`
  - Events: Select all relevant events
- [ ] Test with Stripe test mode
- [ ] Switch to live mode for production

## Troubleshooting

### Webhooks not working

1. Check webhook secret is correct
2. Verify webhook URL in Stripe dashboard
3. Check Stripe dashboard for webhook delivery logs
4. Ensure you selected the correct events in Stripe

### Customer not found errors

Make sure users are authenticated and `getUserInfo` returns valid data:

```ts
getUserInfo: async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return {
    userId: identity.subject,
    email: identity.email!,
  };
};
```

### Products not syncing

Run `syncProducts()` from your Convex dashboard or via a mutation:

```ts
// convex/admin.ts
export const syncStripeProducts = mutation({
  handler: async (ctx) => {
    await stripe.syncProducts(ctx);
  },
});
```

## Examples

See the `/example` directory for a complete example app showing:

- User authentication
- Product listing
- Checkout flow
- Billing portal
- Subscription management
- Invoice history

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- GitHub Issues: https://github.com/ras-sh/convex-stripe/issues
- Email: hi@ras.sh
- Stripe Documentation: https://stripe.com/docs
- Convex Documentation: https://docs.convex.dev

## Acknowledgments

Built with inspiration from:

- [@polar-sh/convex-polar](https://github.com/polarsource/polar/tree/main/clients/packages/convex) - Official Polar Convex component
- [convex-saas](https://github.com/get-convex/convex-saas) - Convex + Stripe SaaS template

---

Made with ❤️ by [@ras-sh](https://github.com/ras-sh)
