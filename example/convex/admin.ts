import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { stripe } from "./stripe";

/**
 * Example: Sync products from Stripe to Convex
 * This should be called from backend code only (e.g., admin dashboard, cron job)
 * NOT from the frontend
 */
export const syncProductsFromStripe = action({
  args: {},
  handler: async (ctx) => {
    // Use stripe methods directly in backend code
    await stripe.syncProducts(ctx);
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
