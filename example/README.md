# Convex Stripe Component Example

This example demonstrates how to use the `@ras-sh/convex-stripe` component in your Convex application.

See [the main README](../) for a demo of how to incorporate this component into your application.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up your Stripe account and get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys).

3. Set environment variables in your Convex deployment:

```bash
npx convex env set STRIPE_SECRET_KEY sk_test_...
npx convex env set STRIPE_WEBHOOK_SECRET whsec_...
```

4. Update `convex/example.ts` with your Stripe product and price IDs:

```ts
products: {
  premiumMonthly: {
    productId: "prod_xxx", // Your Stripe product ID
    priceId: "price_xxx",  // Your Stripe price ID
  },
},
```

## Running the Example

Start the Convex development server:

```bash
npm run dev
```

## Webhook Setup

1. Your webhook endpoint will be available at:
   ```
   https://your-deployment.convex.site/stripe/webhook
   ```

2. Configure this URL in your [Stripe Dashboard](https://dashboard.stripe.com/webhooks):
   - Click "Add endpoint"
   - Enter your webhook URL
   - Select the following events:
     - `checkout.session.completed`
     - `customer.created`
     - `customer.updated`
     - `customer.deleted`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.created`
     - `invoice.updated`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `invoice.finalized`
     - `product.created`
     - `product.updated`
     - `product.deleted`
     - `price.created`
     - `price.updated`
     - `price.deleted`

3. Copy the webhook signing secret and set it in your environment:
   ```bash
   npx convex env set STRIPE_WEBHOOK_SECRET whsec_...
   ```

## Example Usage

### Create a Test User

From the Convex dashboard, run:

```ts
// Function: example:createTestUser
{
  email: "test@example.com",
  name: "Test User"
}
```

### Create a Checkout Session

```ts
// Function: example:createCheckout
{
  priceId: "price_xxx" // Your Stripe price ID
}
```

### Get Subscription Status

```ts
// Function: example:getSubscriptionStatus
{}
```

### List Available Products

```ts
// Function: example:listProducts
{}
```

### Cancel Subscription

```ts
// Function: example:cancelUserSubscription
{
  immediate: false // Set to true to cancel immediately, false to cancel at period end
}
```

### Sync Products from Stripe

```ts
// Function: example:syncStripeProducts
{}
```

## Features Demonstrated

- **Component Setup**: How to configure the Stripe component in `convex.config.ts`
- **Initialization**: Creating a `StripeComponent` instance with your configuration
- **User Management**: Linking Stripe customers to your users
- **Checkout Sessions**: Creating checkout sessions for subscriptions
- **Subscription Management**: Retrieving and managing subscriptions
- **Product Sync**: Syncing products from Stripe to Convex
- **Webhook Handling**: Processing Stripe webhook events
- **Billing Portal**: Generating billing portal links

## Learn More

- [Stripe Documentation](https://stripe.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Component README](../)
