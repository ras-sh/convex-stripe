import { v } from "convex/values";
import {
  vDeleteCustomerArgs,
  vDeleteSubscriptionArgs,
  vListUserInvoicesArgs,
  vStripeId,
  vUpsertCustomerArgs,
  vUpsertInvoiceArgs,
  vUpsertPriceArgs,
  vUpsertProductArgs,
  vUpsertSubscriptionArgs,
  vUserId,
} from "../validators.js";
import { mutation, query } from "./_generated/server.js";

// ===== QUERIES =====

/**
 * Get a customer by user ID
 */
export const getCustomerByUserId = query({
  args: { userId: vUserId },
  handler: async (ctx, args) =>
    await ctx.db
      .query("customers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first(),
});

/**
 * Get a customer by Stripe ID
 */
export const getCustomerByStripeId = query({
  args: { stripeId: vStripeId },
  handler: async (ctx, args) =>
    await ctx.db
      .query("customers")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first(),
});

/**
 * Get all active products
 */
export const listActiveProducts = query({
  args: {},
  handler: async (ctx) =>
    await ctx.db
      .query("products")
      .withIndex("active", (q) => q.eq("active", true))
      .collect(),
});

/**
 * Get a product by slug
 */
export const getProductBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("products")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first(),
});

/**
 * Get a product by Stripe ID
 */
export const getProductByStripeId = query({
  args: { stripeId: vStripeId },
  handler: async (ctx, args) =>
    await ctx.db
      .query("products")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first(),
});

/**
 * Get prices for a product
 */
export const getPricesForProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("prices")
      .withIndex("productId", (q) => q.eq("productId", args.productId))
      .collect(),
});

/**
 * Get a price by slug
 */
export const getPriceBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("prices")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first(),
});

/**
 * Get a price by Stripe ID
 */
export const getPriceByStripeId = query({
  args: { stripeId: vStripeId },
  handler: async (ctx, args) =>
    await ctx.db
      .query("prices")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first(),
});

/**
 * Get the current active subscription for a user
 */
export const getCurrentSubscription = query({
  args: { userId: vUserId },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();

    // Return the first active subscription
    return subscriptions[0] || null;
  },
});

/**
 * List all subscriptions for a user
 */
export const listUserSubscriptions = query({
  args: { userId: vUserId },
  handler: async (ctx, args) =>
    await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect(),
});

/**
 * Get a subscription by Stripe ID
 */
export const getSubscriptionByStripeId = query({
  args: { stripeId: vStripeId },
  handler: async (ctx, args) =>
    await ctx.db
      .query("subscriptions")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first(),
});

/**
 * List invoices for a user
 */
export const listUserInvoices = query({
  args: {
    userId: vUserId,
    ...vListUserInvoicesArgs.fields,
  },
  handler: async (ctx, args) => {
    const transaction = ctx.db
      .query("invoices")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await transaction.take(args.limit);
    }

    return await transaction.collect();
  },
});

// ===== MUTATIONS =====

/**
 * Create or update a customer
 */
export const upsertCustomer = mutation({
  args: vUpsertCustomerArgs.fields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        currency: args.currency,
        metadata: args.metadata,
      });
      return existing._id;
    }

    return await ctx.db.insert("customers", args);
  },
});

/**
 * Create or update a product
 */
export const upsertProduct = mutation({
  args: vUpsertProductArgs.fields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("products")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        description: args.description,
        active: args.active,
        type: args.type,
        slug: args.slug,
        updated: args.updated,
        metadata: args.metadata,
      });
      return existing._id;
    }

    return await ctx.db.insert("products", args);
  },
});

/**
 * Create or update a price
 */
export const upsertPrice = mutation({
  args: vUpsertPriceArgs.fields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("prices")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        productId: args.productId,
        productStripeId: args.productStripeId,
        active: args.active,
        currency: args.currency,
        unitAmount: args.unitAmount,
        billingScheme: args.billingScheme,
        type: args.type,
        recurringInterval: args.recurringInterval,
        recurringIntervalCount: args.recurringIntervalCount,
        slug: args.slug,
        metadata: args.metadata,
      });
      return existing._id;
    }

    return await ctx.db.insert("prices", args);
  },
});

/**
 * Create or update a subscription
 */
export const upsertSubscription = mutation({
  args: vUpsertSubscriptionArgs.fields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        priceId: args.priceId,
        priceStripeId: args.priceStripeId,
        productSlug: args.productSlug,
        currency: args.currency,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        canceledAt: args.canceledAt,
        endedAt: args.endedAt,
        trialStart: args.trialStart,
        trialEnd: args.trialEnd,
        metadata: args.metadata,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", args);
  },
});

/**
 * Delete a subscription
 */
export const deleteSubscription = mutation({
  args: vDeleteSubscriptionArgs.fields,
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (subscription) {
      await ctx.db.delete(subscription._id);
    }
  },
});

/**
 * Create or update an invoice
 */
export const upsertInvoice = mutation({
  args: vUpsertInvoiceArgs.fields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("invoices")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        amountPaid: args.amountPaid,
        amountRemaining: args.amountRemaining,
        invoicePdf: args.invoicePdf,
        hostedInvoiceUrl: args.hostedInvoiceUrl,
        paidAt: args.paidAt,
        metadata: args.metadata,
      });
      return existing._id;
    }

    return await ctx.db.insert("invoices", args);
  },
});

/**
 * Delete a customer by Stripe ID
 */
export const deleteCustomer = mutation({
  args: vDeleteCustomerArgs.fields,
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();
    if (customer) {
      await ctx.db.delete(customer._id);
    }
  },
});

/**
 * Deactivate a product (set active=false) by Stripe ID
 */
export const deactivateProduct = mutation({
  args: v.object({ stripeId: vStripeId }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("products")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { active: false });
    }
  },
});

/**
 * Deactivate a price (set active=false) by Stripe ID
 */
export const deactivatePrice = mutation({
  args: v.object({ stripeId: vStripeId }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("prices")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { active: false });
    }
  },
});

// Note: Actions for creating checkout sessions, portal links, etc.
// will be implemented in the client API layer, not here.
// These internal functions are meant to be called by webhooks and the client layer.
