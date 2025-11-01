import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { stripe } from "./stripe";

/**
 * Sync functions are now exposed as internal actions!
 *
 * You can call them from backend code (actions/mutations):
 * - await ctx.runAction(internal.stripe.syncAll, {})
 * - await ctx.runAction(internal.stripe.syncProducts, {})
 * - await ctx.runAction(internal.stripe.syncCustomers, {})
 * - await ctx.runAction(internal.stripe.syncSubscriptions, {})
 * - await ctx.runAction(internal.stripe.syncInvoices, {})
 *
 * Or call them from the Convex dashboard:
 * - internal.stripe.syncAll({})
 * - internal.stripe.syncProducts({})
 * etc.
 *
 * Examples below:
 */

/**
 * Example: Sync all data from Stripe to Convex
 * This syncs products, prices, customers, subscriptions, and invoices
 */
export const syncAllFromStripe = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.stripe.syncAll, {});
  },
});

/**
 * Example: Sync only products from Stripe to Convex
 */
export const syncProductsFromStripe = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.stripe.syncProducts, {});
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
