import type Stripe from "stripe";
import type { RunActionCtx, RunQueryCtx } from "../shared.js";

/**
 * Configuration for a single product
 */
export type ProductConfig = {
  productId: string;
  priceId?: string;
};

/**
 * Configuration for the Stripe component
 */
export type StripeConfig<Products extends Record<string, ProductConfig>> = {
  getUserInfo: (ctx: RunQueryCtx) => Promise<{ userId: string; email: string }>;
  products?: Products;
  stripe: Stripe;
  webhookSecret: string;
};

/**
 * Configuration for webhook handling
 */
export type WebhookConfig = {
  path?: string;
  onCheckoutComplete?: (
    ctx: RunActionCtx,
    event: Stripe.CheckoutSessionCompletedEvent
  ) => Promise<void>;
  onSubscriptionCreated?: (
    ctx: RunActionCtx,
    event: Stripe.CustomerSubscriptionCreatedEvent
  ) => Promise<void>;
  onSubscriptionUpdated?: (
    ctx: RunActionCtx,
    event: Stripe.CustomerSubscriptionUpdatedEvent
  ) => Promise<void>;
  onSubscriptionDeleted?: (
    ctx: RunActionCtx,
    event: Stripe.CustomerSubscriptionDeletedEvent
  ) => Promise<void>;
  onInvoicePaid?: (
    ctx: RunActionCtx,
    event: Stripe.InvoicePaidEvent
  ) => Promise<void>;
  onInvoiceFailed?: (
    ctx: RunActionCtx,
    event: Stripe.InvoicePaymentFailedEvent
  ) => Promise<void>;
};
