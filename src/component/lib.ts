import { v } from "convex/values";
import Stripe from "stripe";
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
import { api } from "./_generated/api.js";
import { action, mutation, query } from "./_generated/server.js";

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

// ===== SYNC ACTIONS =====

/**
 * Sync all products and prices from Stripe to Convex
 * Can be called from the Convex dashboard
 */
export const syncProducts = action({
  args: {
    stripeSecretKey: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = new Stripe(args.stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
    });

    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    for (const product of products.data) {
      // Upsert product
      const productId = await ctx.runMutation(api.lib.upsertProduct, {
        stripeId: product.id,
        name: product.name,
        description: product.description || undefined,
        active: product.active,
        type: product.type || undefined,
        slug: undefined,
        created: product.created,
        updated: product.updated,
        metadata: product.metadata,
      });

      if (!productId) {
        continue;
      }

      // Fetch and upsert prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 100,
      });

      for (const price of prices.data) {
        await ctx.runMutation(api.lib.upsertPrice, {
          stripeId: price.id,
          productId,
          productStripeId: product.id,
          active: price.active,
          currency: price.currency,
          unitAmount: price.unit_amount || undefined,
          billingScheme: price.billing_scheme || undefined,
          type: price.type,
          recurringInterval: price.recurring?.interval || undefined,
          recurringIntervalCount: price.recurring?.interval_count || undefined,
          slug: undefined,
          created: price.created,
          metadata: price.metadata,
        });
      }
    }
  },
});

/**
 * Sync all customers from Stripe to Convex
 * Can be called from the Convex dashboard
 */
export const syncCustomers = action({
  args: {
    stripeSecretKey: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = new Stripe(args.stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
    });

    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const customers = await stripe.customers.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const customer of customers.data) {
        if (customer.deleted) {
          continue;
        }

        const userId = customer.metadata?.userId;
        if (!userId) {
          continue;
        }

        await ctx.runMutation(api.lib.upsertCustomer, {
          stripeId: customer.id,
          userId,
          email: customer.email || "",
          name: customer.name || undefined,
          currency: customer.currency || undefined,
          created: customer.created,
          metadata: customer.metadata,
        });
      }

      hasMore = customers.has_more;
      if (hasMore && customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1]?.id;
      }
    }
  },
});

/**
 * Sync all subscriptions from Stripe to Convex
 * Can be called from the Convex dashboard
 */
export const syncSubscriptions = action({
  args: {
    stripeSecretKey: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = new Stripe(args.stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
    });

    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const subscriptions = await stripe.subscriptions.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const subscription of subscriptions.data) {
        const customer = await ctx.runQuery(api.lib.getCustomerByStripeId, {
          stripeId: subscription.customer as string,
        });

        if (!customer) {
          continue;
        }

        const price = subscription.items.data[0]?.price;
        if (!price) {
          continue;
        }

        const priceDoc = await ctx.runQuery(api.lib.getPriceByStripeId, {
          stripeId: price.id,
        });

        const productSlug = priceDoc?.slug?.split("-")[0] ?? undefined;
        const firstItem = subscription.items.data[0];
        const currentPeriodStart = firstItem?.current_period_start ?? 0;
        const currentPeriodEnd = firstItem?.current_period_end ?? 0;

        await ctx.runMutation(api.lib.upsertSubscription, {
          stripeId: subscription.id,
          customerId: customer._id,
          customerStripeId: subscription.customer as string,
          userId: customer.userId,
          status: subscription.status,
          priceId: priceDoc?._id,
          priceStripeId: price.id,
          productSlug,
          currency: subscription.currency,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at || undefined,
          endedAt: subscription.ended_at || undefined,
          trialStart: subscription.trial_start || undefined,
          trialEnd: subscription.trial_end || undefined,
          created: subscription.created,
          metadata: subscription.metadata || undefined,
        });
      }

      hasMore = subscriptions.has_more;
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1]?.id;
      }
    }
  },
});

/**
 * Sync all invoices from Stripe to Convex
 * Can be called from the Convex dashboard
 */
export const syncInvoices = action({
  args: {
    stripeSecretKey: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = new Stripe(args.stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
    });

    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const invoices = await stripe.invoices.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const invoice of invoices.data) {
        const customer = await ctx.runQuery(api.lib.getCustomerByStripeId, {
          stripeId: invoice.customer as string,
        });

        if (!customer) {
          continue;
        }

        const subscriptionId: string | undefined = undefined;
        const subscriptionStripeId: string | undefined = undefined;

        await ctx.runMutation(api.lib.upsertInvoice, {
          stripeId: invoice.id,
          customerId: customer._id,
          customerStripeId: invoice.customer as string,
          userId: customer.userId,
          subscriptionId,
          subscriptionStripeId,
          status: invoice.status || "draft",
          currency: invoice.currency,
          amountDue: invoice.amount_due,
          amountPaid: invoice.amount_paid,
          amountRemaining: invoice.amount_remaining,
          subtotal: invoice.subtotal,
          total: invoice.total,
          tax: undefined,
          invoicePdf: invoice.invoice_pdf || undefined,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          billingReason: invoice.billing_reason || undefined,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
          dueDate: invoice.due_date || undefined,
          paidAt: invoice.status_transitions?.paid_at || undefined,
          created: invoice.created,
          metadata: invoice.metadata || undefined,
        });
      }

      hasMore = invoices.has_more;
      if (hasMore && invoices.data.length > 0) {
        startingAfter = invoices.data[invoices.data.length - 1]?.id;
      }
    }
  },
});

/**
 * Sync all data from Stripe to Convex
 * Can be called from the Convex dashboard
 */
export const syncAll = action({
  args: {
    stripeSecretKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(api.lib.syncProducts, {
      stripeSecretKey: args.stripeSecretKey,
    });
    await ctx.runAction(api.lib.syncCustomers, {
      stripeSecretKey: args.stripeSecretKey,
    });
    await ctx.runAction(api.lib.syncSubscriptions, {
      stripeSecretKey: args.stripeSecretKey,
    });
    await ctx.runAction(api.lib.syncInvoices, {
      stripeSecretKey: args.stripeSecretKey,
    });
  },
});
