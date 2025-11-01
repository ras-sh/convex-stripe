import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema for the Stripe component
 *
 * This defines all the tables used to store Stripe data in Convex:
 * - customers: Stripe customer records linked to app users
 * - products: Stripe products synced from your catalog
 * - prices: Stripe prices associated with products
 * - subscriptions: Active and historical subscription records
 * - invoices: Invoice history for customers
 * - paymentMethods: Stored payment methods per customer
 */
export const schema = defineSchema({
  /**
   * Customers table
   * Maps app users to Stripe customers
   */
  customers: defineTable({
    // Stripe customer ID
    stripeCustomerId: v.string(),
    // App's user ID (from your users table)
    userId: v.string(),
    // Customer email
    email: v.string(),
    // Customer name
    name: v.optional(v.string()),
    // Default currency for this customer
    currency: v.optional(v.string()),
    // Stripe timestamps
    created: v.number(),
    // Custom metadata (Stripe.Metadata is Record<string, string>)
    metadata: v.optional(v.record(v.string(), v.string())),
  })
    .index("stripeCustomerId", ["stripeCustomerId"])
    .index("userId", ["userId"]),

  /**
   * Products table
   * Stores Stripe products synced from your catalog
   */
  products: defineTable({
    // Stripe product ID
    stripeProductId: v.string(),
    // Product name
    name: v.string(),
    // Product description
    description: v.optional(v.string()),
    // Whether product is active
    active: v.boolean(),
    // Product type: "service" or "good"
    type: v.optional(v.string()),
    // Custom slug for easy reference (e.g., "premium-monthly")
    slug: v.optional(v.string()),
    // Stripe timestamps
    created: v.number(),
    updated: v.number(),
    // Custom metadata (Stripe.Metadata is Record<string, string>)
    metadata: v.optional(v.record(v.string(), v.string())),
  })
    .index("stripeProductId", ["stripeProductId"])
    .index("slug", ["slug"])
    .index("active", ["active"]),

  /**
   * Prices table
   * Stores Stripe prices associated with products
   */
  prices: defineTable({
    // Stripe price ID
    stripePriceId: v.string(),
    // Associated product ID (references products table)
    productId: v.id("products"),
    // Stripe product ID for reference
    stripeProductId: v.string(),
    // Whether price is active
    active: v.boolean(),
    // Currency (e.g., "usd", "eur")
    currency: v.string(),
    // Price amount in cents
    unitAmount: v.optional(v.number()),
    // Billing scheme: "per_unit" or "tiered"
    billingScheme: v.optional(v.string()),
    // Pricing type: "one_time" or "recurring"
    type: v.string(),
    // Recurring interval: "day", "week", "month", "year"
    recurringInterval: v.optional(v.string()),
    // Recurring interval count
    recurringIntervalCount: v.optional(v.number()),
    // Custom slug for easy reference (e.g., "premium-monthly-usd")
    slug: v.optional(v.string()),
    // Stripe timestamps
    created: v.number(),
    // Custom metadata (Stripe.Metadata is Record<string, string>)
    metadata: v.optional(v.record(v.string(), v.string())),
  })
    .index("stripePriceId", ["stripePriceId"])
    .index("productId", ["productId"])
    .index("slug", ["slug"])
    .index("active", ["active"])
    .index("productId_currency_type", ["productId", "currency", "type"])
    .index("productId_active", ["productId", "active"]),

  /**
   * Subscriptions table
   * Stores customer subscriptions
   */
  subscriptions: defineTable({
    // Stripe subscription ID
    stripeSubscriptionId: v.string(),
    // Customer ID (references customers table)
    customerId: v.id("customers"),
    // Stripe customer ID for reference
    stripeCustomerId: v.string(),
    // User ID for quick lookups
    userId: v.string(),
    // Subscription status
    status: v.string(),
    // Current price ID (references prices table)
    priceId: v.optional(v.id("prices")),
    // Stripe price ID for reference
    stripePriceId: v.optional(v.string()),
    // Product slug if using configured products
    productSlug: v.optional(v.string()),
    // Currency
    currency: v.string(),
    // Current period start (Unix timestamp)
    currentPeriodStart: v.number(),
    // Current period end (Unix timestamp)
    currentPeriodEnd: v.number(),
    // Cancel at period end flag
    cancelAtPeriodEnd: v.boolean(),
    // Canceled at (Unix timestamp)
    canceledAt: v.optional(v.number()),
    // Ended at (Unix timestamp)
    endedAt: v.optional(v.number()),
    // Trial start (Unix timestamp)
    trialStart: v.optional(v.number()),
    // Trial end (Unix timestamp)
    trialEnd: v.optional(v.number()),
    // Stripe timestamps
    created: v.number(),
    // Custom metadata (Stripe.Metadata is Record<string, string>)
    metadata: v.optional(v.record(v.string(), v.string())),
  })
    .index("stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("customerId", ["customerId"])
    .index("userId", ["userId"])
    .index("userId_status", ["userId", "status"])
    .index("status", ["status"]),

  /**
   * Invoices table
   * Stores customer invoice history
   */
  invoices: defineTable({
    // Stripe invoice ID
    stripeInvoiceId: v.string(),
    // Customer ID (references customers table)
    customerId: v.id("customers"),
    // Stripe customer ID for reference
    stripeCustomerId: v.string(),
    // User ID for quick lookups
    userId: v.string(),
    // Subscription ID if invoice is for a subscription
    subscriptionId: v.optional(v.id("subscriptions")),
    // Stripe subscription ID for reference
    stripeSubscriptionId: v.optional(v.string()),
    // Invoice status
    status: v.string(),
    // Currency
    currency: v.string(),
    // Amount due in cents
    amountDue: v.number(),
    // Amount paid in cents
    amountPaid: v.number(),
    // Amount remaining in cents
    amountRemaining: v.number(),
    // Subtotal in cents
    subtotal: v.number(),
    // Total in cents
    total: v.number(),
    // Tax in cents
    tax: v.optional(v.number()),
    // Invoice PDF URL
    invoicePdf: v.optional(v.string()),
    // Hosted invoice URL
    hostedInvoiceUrl: v.optional(v.string()),
    // Billing reason
    billingReason: v.optional(v.string()),
    // Period start (Unix timestamp)
    periodStart: v.number(),
    // Period end (Unix timestamp)
    periodEnd: v.number(),
    // Due date (Unix timestamp)
    dueDate: v.optional(v.number()),
    // Paid at (Unix timestamp)
    paidAt: v.optional(v.number()),
    // Stripe timestamps
    created: v.number(),
    // Custom metadata (Stripe.Metadata is Record<string, string>)
    metadata: v.optional(v.record(v.string(), v.string())),
  })
    .index("stripeInvoiceId", ["stripeInvoiceId"])
    .index("customerId", ["customerId"])
    .index("userId", ["userId"])
    .index("userId_status", ["userId", "status"])
    .index("subscriptionId", ["subscriptionId"]),
});

export default schema;
