import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { stripe } from "./stripe";

/**
 * Example: Sync all data from Stripe to Convex
 * This syncs products, prices, customers, subscriptions, and invoices
 * This should be called from backend code only (e.g., admin dashboard, cron job)
 * NOT from the frontend
 *
 * Use this when migrating from another Stripe integration to seamlessly
 * transfer all your existing data
 */
export const syncAllFromStripe = action({
  args: {},
  handler: async (ctx) => {
    await stripe.syncAll(ctx);
  },
});

/**
 * Example: Sync only products from Stripe to Convex
 * This should be called from backend code only (e.g., admin dashboard, cron job)
 * NOT from the frontend
 */
export const syncProductsFromStripe = action({
  args: {},
  handler: async (ctx) => {
    await stripe.syncProducts(ctx);
  },
});

/**
 * Example: Sync only customers from Stripe to Convex
 */
export const syncCustomersFromStripe = action({
  args: {},
  handler: async (ctx) => {
    await stripe.syncCustomers(ctx);
  },
});

/**
 * Example: Sync only subscriptions from Stripe to Convex
 */
export const syncSubscriptionsFromStripe = action({
  args: {},
  handler: async (ctx) => {
    await stripe.syncSubscriptions(ctx);
  },
});

/**
 * Example: Sync only invoices from Stripe to Convex
 */
export const syncInvoicesFromStripe = action({
  args: {},
  handler: async (ctx) => {
    await stripe.syncInvoices(ctx);
  },
});

/**
 * Example: Create a customer for a user
 * This demonstrates calling stripe methods directly from backend code
 */
export const createCustomerForUser = action({
  args: {},
  handler: async (ctx) => {
    // Get a user (in real app, you'd get the current authenticated user)
    const user = await ctx.runQuery(api.auth.getUser, {});
    if (!user) {
      throw new Error("No user found");
    }

    // Use stripe.createCustomer directly
    const customer = await stripe.createCustomer(ctx, {
      userId: user._id,
      email: user.email,
      name: user.name,
    });

    return customer;
  },
});
