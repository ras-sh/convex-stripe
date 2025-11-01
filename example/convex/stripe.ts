import { StripeComponent } from "@ras-sh/convex-stripe";
import Stripe from "stripe";
import { api, components } from "./_generated/api.js";
import type { Doc } from "./_generated/dataModel.js";

// Initialize Stripe client
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-10-29.clover",
});

// Initialize the Stripe component
export const stripe = new StripeComponent(components.stripe, {
  getUserInfo: async (ctx) => {
    // return { userId: "123", email: "test@test.com" };
    // For this example, we'll use a mock user
    // In a real app, you'd get this from your auth system
    const user = (await ctx.runQuery(api.auth.getUser, {})) as Doc<"users">;
    if (!user) {
      throw new Error("No user found");
    }
    return { userId: user._id, email: user.email };
  },
  products: {
    // Configure your products here
    // These should match your Stripe product/price IDs
    premiumMonthly: {
      productId: "prod_xxx", // Replace with your Stripe product ID
      priceId: "price_xxx", // Replace with your Stripe price ID
    },
  },
  stripe: stripeClient,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY as string,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
});

// Export the Stripe API for frontend use
// Public actions/queries are wrapped with getUserInfo() and can be called from React hooks
// Sync functions are internal and can only be called from backend code (actions, mutations)
export const {
  // Public - can be called from frontend
  getCurrentSubscription,
  listUserSubscriptions,
  getConfiguredProducts,
  listUserInvoices,
  generateCheckoutLink,
  generateBillingPortalLink,
  cancelSubscription,
  // Internal - can only be called from backend code
  syncAll,
  syncProducts,
  syncCustomers,
  syncSubscriptions,
  syncInvoices,
} = stripe.api();

// For other backend-only operations, import and use stripe directly:
// - stripe.createCustomer(ctx, { userId, email, name }) - Create customer
// - stripe.getCustomerByUserId(ctx, { userId }) - Get customer
// etc.
