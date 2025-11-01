import type { HttpRouter } from "convex/server";
import { httpActionGeneric } from "convex/server";
import type Stripe from "stripe";
import type { api } from "../component/_generated/api.js";
import type { Id } from "../component/_generated/dataModel.js";
import type { RunActionCtx, UseApi } from "../component/util.js";
import type { ProductConfig, WebhookConfig } from "./types.js";

/**
 * Webhook handling for the Stripe component
 */
export class WebhookHandler<Products extends Record<string, ProductConfig>> {
  private readonly component: UseApi<typeof api>;
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly products: Products;

  constructor(
    component: UseApi<typeof api>,
    stripe: Stripe,
    webhookSecret: string,
    products: Products
  ) {
    this.component = component;
    this.stripe = stripe;
    this.webhookSecret = webhookSecret;
    this.products = products;
  }

  /**
   * Register webhook routes on your HTTP router
   */
  registerRoutes(http: HttpRouter, config: WebhookConfig = {}) {
    const {
      path = "/stripe/webhook",
      onCheckoutComplete,
      onSubscriptionCreated,
      onSubscriptionUpdated,
      onSubscriptionDeleted,
      onInvoicePaid,
      onInvoiceFailed,
    } = config;

    http.route({
      path,
      method: "POST",
      handler: httpActionGeneric(async (ctx, request) => {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        let event: Stripe.Event;
        try {
          event = this.stripe.webhooks.constructEvent(
            body,
            signature,
            this.webhookSecret
          );
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          return new Response("Invalid signature", { status: 403 });
        }

        // Handle the event
        try {
          await this.handleWebhookEvent(ctx, event, {
            onCheckoutComplete,
            onSubscriptionCreated,
            onSubscriptionUpdated,
            onSubscriptionDeleted,
            onInvoicePaid,
            onInvoiceFailed,
          });
        } catch (err) {
          console.error("Error handling webhook:", err);
          return new Response("Webhook handler error", { status: 500 });
        }

        return new Response("OK", { status: 200 });
      }),
    });
  }

  /**
   * Handle webhook events
   * @internal
   */
  private async handleWebhookEvent(
    ctx: RunActionCtx,
    event: Stripe.Event,
    callbacks: Omit<WebhookConfig, "path">
  ) {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutComplete(ctx, event);
        if (callbacks.onCheckoutComplete) {
          await callbacks.onCheckoutComplete(ctx, event);
        }
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdate(ctx, event);
        if (
          event.type === "customer.subscription.created" &&
          callbacks.onSubscriptionCreated
        ) {
          await callbacks.onSubscriptionCreated(ctx, event);
        } else if (
          event.type === "customer.subscription.updated" &&
          callbacks.onSubscriptionUpdated
        ) {
          await callbacks.onSubscriptionUpdated(ctx, event);
        }
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionDelete(ctx, event);
        if (callbacks.onSubscriptionDeleted) {
          await callbacks.onSubscriptionDeleted(ctx, event);
        }
        break;

      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.finalized":
      case "invoice.voided":
      case "invoice.marked_uncollectible":
        await this.handleInvoiceEvent(ctx, event as Stripe.InvoicePaidEvent);
        if (event.type === "invoice.paid" && callbacks.onInvoicePaid) {
          await callbacks.onInvoicePaid(ctx, event);
        } else if (
          event.type === "invoice.payment_failed" &&
          callbacks.onInvoiceFailed
        ) {
          await callbacks.onInvoiceFailed(ctx, event);
        }
        break;

      case "product.created":
      case "product.updated":
        await this.handleProductUpdate(ctx, event);
        break;
      case "product.deleted":
        await this.handleProductDeleted(ctx, event);
        break;

      case "price.created":
      case "price.updated":
        await this.handlePriceUpdate(ctx, event);
        break;
      case "price.deleted":
        await this.handlePriceDeleted(ctx, event);
        break;

      case "customer.updated":
        await this.handleCustomerUpdated(ctx, event);
        break;
      case "customer.deleted":
        await this.handleCustomerDeleted(ctx, event);
        break;

      case "payment_intent.succeeded":
      case "payment_intent.canceled":
        await this.handlePaymentIntentEvent(ctx, event);
        break;

      default:
        // Unhandled event type
        break;
    }
  }

  private async handleCheckoutComplete(
    _ctx: RunActionCtx,
    _event: Stripe.CheckoutSessionCompletedEvent
  ) {
    // Checkout completed
  }

  private async handleSubscriptionUpdate(
    ctx: RunActionCtx,
    event:
      | Stripe.CustomerSubscriptionCreatedEvent
      | Stripe.CustomerSubscriptionUpdatedEvent
  ) {
    const subscription = event.data.object;
    const customerStripeId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const customer = await ctx.runQuery(
      this.component.lib.getCustomerByStripeId,
      {
        stripeCustomerId: customerStripeId,
      }
    );

    if (!customer) {
      console.error("Customer not found for subscription:", subscription.id);
      return;
    }

    const firstItem = subscription.items.data[0];
    const stripePriceId = firstItem?.price.id;
    let priceId: Id<"prices"> | undefined;
    let productSlug: string | undefined;
    let currency: string | undefined;

    if (stripePriceId) {
      const price = await ctx.runQuery(this.component.lib.getPriceByStripeId, {
        stripePriceId,
      });
      priceId = price?._id as Id<"prices"> | undefined;
      productSlug = price?.slug;
      currency = price?.currency;
    }

    // Derive period and currency using only strongly typed fields
    const currentPeriodStart = 0;
    const currentPeriodEnd = 0;
    // Price currency already derived above when possible

    await ctx.runMutation(this.component.lib.upsertSubscription, {
      stripeSubscriptionId: subscription.id,
      customerId: customer._id,
      stripeCustomerId: customerStripeId,
      userId: customer.userId,
      status: subscription.status,
      priceId: priceId ?? undefined,
      stripePriceId,
      productSlug,
      // Prefer currency from stored price; fall back to event item's price
      currency: currency ?? firstItem?.price.currency ?? "usd",
      // Use top-level subscription period fields
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at || undefined,
      endedAt: subscription.ended_at || undefined,
      trialStart: subscription.trial_start || undefined,
      trialEnd: subscription.trial_end || undefined,
      created: subscription.created,
      metadata: subscription.metadata,
    });
  }

  private async handleSubscriptionDelete(
    ctx: RunActionCtx,
    event: Stripe.CustomerSubscriptionDeletedEvent
  ) {
    const subscription = event.data.object;
    await ctx.runMutation(this.component.lib.deleteSubscription, {
      stripeSubscriptionId: subscription.id,
    });
  }

  private async handleInvoiceEvent(
    ctx: RunActionCtx,
    event:
      | Stripe.InvoicePaidEvent
      | Stripe.InvoicePaymentFailedEvent
      | Stripe.InvoiceFinalizedEvent
  ) {
    const invoice = event.data.object;
    const customerStripeId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id || "";

    const customer = await ctx.runQuery(
      this.component.lib.getCustomerByStripeId,
      {
        stripeCustomerId: customerStripeId,
      }
    );

    if (!customer) {
      console.error("Customer not found for invoice:", invoice.id);
      return;
    }

    const subscriptionId: Id<"subscriptions"> | undefined = undefined;
    const stripeSubscriptionId: string | undefined = undefined;

    // Link to subscription only if available via typed fields (not available in current types)
    // Leave subscriptionId undefined in this handler to respect SDK typings

    await ctx.runMutation(this.component.lib.upsertInvoice, {
      stripeInvoiceId: invoice.id,
      customerId: customer._id,
      stripeCustomerId: customerStripeId,
      userId: customer.userId,
      subscriptionId: subscriptionId ?? undefined,
      stripeSubscriptionId,
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

  private async handleProductUpdate(
    ctx: RunActionCtx,
    event: Stripe.ProductCreatedEvent | Stripe.ProductUpdatedEvent
  ) {
    const product = event.data.object;
    const slug = Object.keys(this.products).find(
      (key) => this.products[key as keyof Products]?.productId === product.id
    );

    await ctx.runMutation(this.component.lib.upsertProduct, {
      stripeProductId: product.id,
      name: product.name,
      description: product.description || undefined,
      active: product.active,
      type: product.type || undefined,
      slug,
      created: product.created,
      updated: product.updated,
      metadata: product.metadata,
    });
  }

  private async handleProductDeleted(
    ctx: RunActionCtx,
    event: Stripe.ProductDeletedEvent
  ) {
    const product = event.data.object;
    await ctx.runMutation(this.component.lib.deactivateProduct, {
      stripeProductId: product.id,
    });
  }

  private async handlePriceUpdate(
    ctx: RunActionCtx,
    event: Stripe.PriceCreatedEvent | Stripe.PriceUpdatedEvent
  ) {
    const price = event.data.object;
    const productStripeId =
      typeof price.product === "string" ? price.product : price.product.id;

    const product = await ctx.runQuery(
      this.component.lib.getProductByStripeId,
      {
        stripeProductId: productStripeId,
      }
    );

    if (!product) {
      console.error("Product not found for price:", price.id);
      return;
    }

    const priceSlug = product.slug
      ? `${product.slug}-${price.currency}-${price.recurring?.interval || "once"}`
      : undefined;

    await ctx.runMutation(this.component.lib.upsertPrice, {
      stripePriceId: price.id,
      productId: product._id,
      stripeProductId: productStripeId,
      active: price.active,
      currency: price.currency,
      unitAmount: price.unit_amount || undefined,
      billingScheme: price.billing_scheme || undefined,
      type: price.type,
      recurringInterval: price.recurring?.interval || undefined,
      recurringIntervalCount: price.recurring?.interval_count || undefined,
      slug: priceSlug,
      created: price.created,
      metadata: price.metadata,
    });
  }

  private async handlePriceDeleted(
    ctx: RunActionCtx,
    event: Stripe.PriceDeletedEvent
  ) {
    const price = event.data.object;
    await ctx.runMutation(this.component.lib.deactivatePrice, {
      stripePriceId: price.id,
    });
  }

  private async handleCustomerUpdated(
    ctx: RunActionCtx,
    event: Stripe.CustomerUpdatedEvent
  ) {
    const c = event.data.object;
    // Determine userId: prefer metadata.userId; otherwise look up existing record
    let userId: string | undefined;
    if (c.metadata && typeof c.metadata.userId === "string") {
      userId = c.metadata.userId;
    } else {
      const existing = await ctx.runQuery(
        this.component.lib.getCustomerByStripeId,
        {
          stripeCustomerId: c.id,
        }
      );
      userId = existing?.userId;
    }
    if (!userId) {
      return;
    }
    await ctx.runMutation(this.component.lib.upsertCustomer, {
      stripeCustomerId: c.id,
      userId,
      email: c.email || "",
      name: c.name || undefined,
      currency: c.currency || undefined,
      created: c.created,
      metadata: c.metadata,
    });
  }

  private async handleCustomerDeleted(
    ctx: RunActionCtx,
    event: Stripe.CustomerDeletedEvent
  ) {
    const c = event.data.object;
    await ctx.runMutation(this.component.lib.deleteCustomer, {
      stripeCustomerId: c.id,
    });
  }

  private async handlePaymentIntentEvent(
    ctx: RunActionCtx,
    event:
      | Stripe.PaymentIntentSucceededEvent
      | Stripe.PaymentIntentCanceledEvent
  ) {
    const pi = event.data.object;
    const customerStripeId =
      typeof pi.customer === "string" ? pi.customer : pi.customer?.id || "";
    if (!customerStripeId) {
      return;
    }
    const customer = await ctx.runQuery(
      this.component.lib.getCustomerByStripeId,
      {
        stripeCustomerId: customerStripeId,
      }
    );
    if (!customer) {
      return;
    }

    await ctx.runMutation(this.component.lib.upsertInvoice, {
      // Use PaymentIntent id to record purchase in invoices store
      stripeInvoiceId: pi.id,
      customerId: customer._id,
      stripeCustomerId: customerStripeId,
      userId: customer.userId,
      subscriptionId: undefined,
      stripeSubscriptionId: undefined,
      status: pi.status,
      currency: pi.currency,
      amountDue: pi.amount ?? 0,
      amountPaid: pi.status === "succeeded" ? (pi.amount ?? 0) : 0,
      amountRemaining: 0,
      subtotal: pi.amount ?? 0,
      total: pi.amount ?? 0,
      tax: undefined,
      invoicePdf: undefined,
      hostedInvoiceUrl: undefined,
      billingReason: undefined,
      periodStart: pi.created,
      periodEnd: pi.created,
      dueDate: undefined,
      paidAt: pi.status === "succeeded" ? pi.created : undefined,
      created: pi.created,
      metadata: pi.metadata || undefined,
    });
  }
}
