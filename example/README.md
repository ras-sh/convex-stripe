# Convex Stripe Component Example

See [the main README](../) for complete documentation.

## Setup

```bash
npm install
npx convex env set STRIPE_SECRET_KEY sk_test_...
npx convex env set STRIPE_WEBHOOK_SECRET whsec_...
```

Update `convex/stripe.ts` with your Stripe product/price IDs:

```ts
products: {
  premiumMonthly: {
    productId: "prod_xxx",
    priceId: "price_xxx",
  },
},
```

## Webhook Setup

Configure `https://your-deployment.convex.site/stripe/webhook` in your [Stripe Dashboard](https://dashboard.stripe.com/webhooks) and select all checkout, customer, subscription, invoice, product, and price events.

## Usage

Sync data from Stripe:

```ts
// Convex dashboard
internal.stripe.syncAll({})
```

See `convex/example.ts` for more examples.
