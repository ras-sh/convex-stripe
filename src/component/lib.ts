import { v } from "convex/values";
import {
  vDeletePaymentMethodArgs,
  vDeleteSubscriptionArgs,
  vListUserInvoicesArgs,
  vStripeId,
  vUpsertCustomerArgs,
  vUpsertInvoiceArgs,
  vUpsertPaymentMethodArgs,
  vUpsertPriceArgs,
  vUpsertProductArgs,
  vUpsertSubscriptionArgs,
  vUserId,
} from "../validators.js";
import { internalMutation, internalQuery, query } from "./_generated/server.js";

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
export const getCustomerByStripeId = internalQuery({
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
export const getProductByStripeId = internalQuery({
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
export const getPriceByStripeId = internalQuery({
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
export const getSubscriptionByStripeId = internalQuery({
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

/**
 * Get payment methods for a user
 */
export const listUserPaymentMethods = query({
  args: { userId: vUserId },
  handler: async (ctx, args) =>
    await ctx.db
      .query("paymentMethods")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect(),
});

// ===== INTERNAL MUTATIONS =====

/**
 * Create or update a customer
 */
export const upsertCustomer = internalMutation({
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
export const upsertProduct = internalMutation({
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
export const upsertPrice = internalMutation({
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
export const upsertSubscription = internalMutation({
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
export const deleteSubscription = internalMutation({
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
export const upsertInvoice = internalMutation({
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
 * Create or update a payment method
 */
export const upsertPaymentMethod = internalMutation({
  args: vUpsertPaymentMethodArgs.fields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("paymentMethods")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        card: args.card,
        isDefault: args.isDefault,
        metadata: args.metadata,
      });
      return existing._id;
    }

    return await ctx.db.insert("paymentMethods", args);
  },
});

/**
 * Delete a payment method
 */
export const deletePaymentMethod = internalMutation({
  args: vDeletePaymentMethodArgs.fields,
  handler: async (ctx, args) => {
    const paymentMethod = await ctx.db
      .query("paymentMethods")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (paymentMethod) {
      await ctx.db.delete(paymentMethod._id);
    }
  },
});

// Note: Actions for creating checkout sessions, portal links, etc.
// will be implemented in the client API layer, not here.
// These internal functions are meant to be called by webhooks and the client layer.
