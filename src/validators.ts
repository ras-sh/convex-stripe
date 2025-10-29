import { v } from "convex/values";
import { typedV } from "convex-helpers/validators";
import type { Doc } from "./component/_generated/dataModel.js";
import schema from "./component/schema.js";

const vv = typedV(schema);

// ID validators
const vStripeCustomerId = vv.id("customers");
const vStripeProductId = vv.id("products");
const vStripePriceId = vv.id("prices");
const vStripeSubscriptionId = vv.id("subscriptions");

// Common field validators
export const vUserId = v.string();
export const vStripeId = v.string();
export const vMetadata = v.optional(v.record(v.string(), v.string()));

// Nested object validators
const vCard = v.object({
  brand: v.string(),
  last4: v.string(),
  expMonth: v.number(),
  expYear: v.number(),
});

// Mutation argument validators
export const vUpsertCustomerArgs = v.object({
  stripeId: v.string(),
  userId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  currency: v.optional(v.string()),
  created: v.number(),
  metadata: vMetadata,
});

export const vUpsertProductArgs = v.object({
  stripeId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  active: v.boolean(),
  type: v.optional(v.string()),
  slug: v.optional(v.string()),
  created: v.number(),
  updated: v.number(),
  metadata: vMetadata,
});

export const vUpsertPriceArgs = v.object({
  stripeId: v.string(),
  productId: vStripeProductId,
  productStripeId: v.string(),
  active: v.boolean(),
  currency: v.string(),
  unitAmount: v.optional(v.number()),
  billingScheme: v.optional(v.string()),
  type: v.string(),
  recurringInterval: v.optional(v.string()),
  recurringIntervalCount: v.optional(v.number()),
  slug: v.optional(v.string()),
  created: v.number(),
  metadata: vMetadata,
});

export const vUpsertSubscriptionArgs = v.object({
  stripeId: v.string(),
  customerId: vStripeCustomerId,
  customerStripeId: v.string(),
  userId: v.string(),
  status: v.string(),
  priceId: v.optional(vStripePriceId),
  priceStripeId: v.optional(v.string()),
  productSlug: v.optional(v.string()),
  currency: v.string(),
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  cancelAtPeriodEnd: v.boolean(),
  canceledAt: v.optional(v.number()),
  endedAt: v.optional(v.number()),
  trialStart: v.optional(v.number()),
  trialEnd: v.optional(v.number()),
  created: v.number(),
  metadata: vMetadata,
});

export const vUpsertInvoiceArgs = v.object({
  stripeId: v.string(),
  customerId: vStripeCustomerId,
  customerStripeId: v.string(),
  userId: v.string(),
  subscriptionId: v.optional(vStripeSubscriptionId),
  subscriptionStripeId: v.optional(v.string()),
  status: v.string(),
  currency: v.string(),
  amountDue: v.number(),
  amountPaid: v.number(),
  amountRemaining: v.number(),
  subtotal: v.number(),
  total: v.number(),
  tax: v.optional(v.number()),
  invoicePdf: v.optional(v.string()),
  hostedInvoiceUrl: v.optional(v.string()),
  billingReason: v.optional(v.string()),
  periodStart: v.number(),
  periodEnd: v.number(),
  dueDate: v.optional(v.number()),
  paidAt: v.optional(v.number()),
  created: v.number(),
  metadata: vMetadata,
});

export const vUpsertPaymentMethodArgs = v.object({
  stripeId: v.string(),
  customerId: vStripeCustomerId,
  customerStripeId: v.string(),
  userId: v.string(),
  type: v.string(),
  card: v.optional(vCard),
  isDefault: v.boolean(),
  created: v.number(),
  metadata: vMetadata,
});

export const vDeleteSubscriptionArgs = v.object({
  stripeId: v.string(),
});

export const vDeletePaymentMethodArgs = v.object({
  stripeId: v.string(),
});

// Public API argument validators
export const vListUserInvoicesArgs = v.object({
  limit: v.optional(v.number()),
});

export const vGenerateCheckoutLinkArgs = v.object({
  priceIds: v.array(v.string()),
  successUrl: v.string(),
  cancelUrl: v.string(),
  mode: v.optional(v.union(v.literal("subscription"), v.literal("payment"))),
});

export const vGenerateBillingPortalLinkArgs = v.object({
  returnUrl: v.string(),
});

export const vCancelSubscriptionArgs = v.object({
  immediate: v.optional(v.boolean()),
});

// Type exports - use Doc types from dataModel for proper Id types
export type StripeCustomer = Doc<"customers">;
