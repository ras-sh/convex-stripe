import type Stripe from "stripe";
import type { Doc } from "./_generated/dataModel.js";

/**
 * Utility functions for the Stripe component
 */

/**
 * Convert Stripe Customer to Convex document
 */
export function stripeCustomerToDoc(params: {
  customer: Stripe.Customer;
  userId: string;
}): Omit<Doc<"customers">, "_id" | "_creationTime"> {
  const { customer, userId } = params;
  return {
    stripeId: customer.id,
    userId,
    email: customer.email || "",
    name: customer.name || undefined,
    currency: customer.currency || undefined,
    created: customer.created,
    metadata: customer.metadata || undefined,
  };
}

/**
 * Convert Stripe Product to Convex document
 */
export function stripeProductToDoc(params: {
  product: Stripe.Product;
  slug?: string;
}): Omit<Doc<"products">, "_id" | "_creationTime"> {
  const { product, slug } = params;
  return {
    stripeId: product.id,
    name: product.name,
    description: product.description || undefined,
    active: product.active,
    type: product.type || undefined,
    slug,
    created: product.created,
    updated: product.updated,
    metadata: product.metadata || undefined,
  };
}

/**
 * Convert Stripe Price to Convex document
 */
export function stripePriceToDoc(params: {
  price: Stripe.Price;
  productId: string;
  slug?: string;
}): Omit<Doc<"prices">, "_id" | "_creationTime" | "productId"> & {
  productId: string;
} {
  const { price, productId, slug } = params;
  return {
    stripeId: price.id,
    productId,
    productStripeId:
      typeof price.product === "string" ? price.product : price.product.id,
    active: price.active,
    currency: price.currency,
    unitAmount: price.unit_amount || undefined,
    billingScheme: price.billing_scheme || undefined,
    type: price.type,
    recurringInterval: price.recurring?.interval || undefined,
    recurringIntervalCount: price.recurring?.interval_count || undefined,
    slug,
    created: price.created,
    metadata: price.metadata || undefined,
  };
}

/**
 * Convert Stripe Subscription to Convex document
 */
export function stripeSubscriptionToDoc(params: {
  subscription: Stripe.Subscription;
  customerId: string;
  userId: string;
  priceId?: string;
  productSlug?: string;
}): Omit<
  Doc<"subscriptions">,
  "_id" | "_creationTime" | "customerId" | "priceId"
> & {
  customerId: string;
  priceId?: string;
} {
  const { subscription, customerId, userId, priceId, productSlug } = params;
  const firstItem = subscription.items.data[0];
  const priceStripeId = firstItem?.price.id;

  return {
    stripeId: subscription.id,
    customerId,
    customerStripeId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    userId,
    status: subscription.status,
    priceId,
    priceStripeId,
    productSlug,
    currency: subscription.currency,
    currentPeriodStart: subscription.items.data[0]?.current_period_start ?? 0,
    currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? 0,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at || undefined,
    endedAt: subscription.ended_at || undefined,
    trialStart: subscription.trial_start || undefined,
    trialEnd: subscription.trial_end || undefined,
    created: subscription.created,
    metadata: subscription.metadata || undefined,
  };
}

/**
 * Convert Stripe Invoice to Convex document
 */
export function stripeInvoiceToDoc(params: {
  invoice: Stripe.Invoice;
  customerId: string;
  userId: string;
  subscriptionId?: string;
}): Omit<
  Doc<"invoices">,
  "_id" | "_creationTime" | "customerId" | "subscriptionId"
> & {
  customerId: string;
  subscriptionId?: string;
} {
  const { invoice, customerId, userId, subscriptionId } = params;
  return {
    stripeId: invoice.id,
    customerId,
    customerStripeId:
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id || "",
    userId,
    subscriptionId,
    subscriptionStripeId: (() => {
      const sub = invoice.parent?.subscription_details?.subscription;
      if (!sub) {
        return;
      }
      return typeof sub === "string" ? sub : sub?.id;
    })(),
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
  };
}

/**
 * Convert Stripe PaymentMethod to Convex document
 */
export function stripePaymentMethodToDoc(params: {
  paymentMethod: Stripe.PaymentMethod;
  customerId: string;
  userId: string;
  isDefault: boolean;
}): Omit<Doc<"paymentMethods">, "_id" | "_creationTime" | "customerId"> & {
  customerId: string;
} {
  const { paymentMethod, customerId, userId, isDefault } = params;
  return {
    stripeId: paymentMethod.id,
    customerId,
    customerStripeId:
      typeof paymentMethod.customer === "string"
        ? paymentMethod.customer || ""
        : paymentMethod.customer?.id || "",
    userId,
    type: paymentMethod.type,
    card: paymentMethod.card
      ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        }
      : undefined,
    isDefault,
    created: paymentMethod.created,
    metadata: paymentMethod.metadata || undefined,
  };
}

/**
 * Generate a slug from a product/price name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Format currency amount (from cents to display string)
 */
export function formatCurrency(
  amountInCents: number,
  currency: string
): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Get a display name for a subscription status
 */
export function getStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Active",
    canceled: "Canceled",
    incomplete: "Incomplete",
    incomplete_expired: "Incomplete (Expired)",
    past_due: "Past Due",
    trialing: "Trial",
    unpaid: "Unpaid",
  };
  return statusMap[status] || status;
}

/**
 * Check if a subscription is active
 */
export function isSubscriptionActive(status: string): boolean {
  return status === "active" || status === "trialing";
}
