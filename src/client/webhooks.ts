import type { HttpRouter } from "convex/server";
import { httpActionGeneric } from "convex/server";
import type Stripe from "stripe";
import { type api, internal } from "../component/_generated/api.js";
import type { Id } from "../component/_generated/dataModel.js";
import type { RunActionCtx, UseApi } from "../shared.js";
import type { ProductConfig, WebhookConfig } from "./types.js";

/**
 * Webhook handling for the Stripe component
 */
export class WebhookHandler<Products extends Record<string, ProductConfig>> {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly products: Products;

  constructor(
    _component: UseApi<typeof api>,
    stripe: Stripe,
    webhookSecret: string,
    products: Products
  ) {
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
        await this.handleInvoiceEvent(ctx, event);
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

      case "price.created":
      case "price.updated":
        await this.handlePriceUpdate(ctx, event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutComplete(
    _ctx: RunActionCtx,
    event: Stripe.CheckoutSessionCompletedEvent
  ) {
    console.log("Checkout completed:", event.data.object.id);
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

    const customer = await ctx.runQuery(internal.lib.getCustomerByStripeId, {
      stripeId: customerStripeId,
    });

    if (!customer) {
      console.error("Customer not found for subscription:", subscription.id);
      return;
    }

    const firstItem = subscription.items.data[0];
    const priceStripeId = firstItem?.price.id;
    let priceId: Id<"prices"> | undefined;
    let productSlug: string | undefined;

    if (priceStripeId) {
      const price = await ctx.runQuery(internal.lib.getPriceByStripeId, {
        stripeId: priceStripeId,
      });
      priceId = price?._id;
      productSlug = price?.slug;
    }

    await ctx.runMutation(internal.lib.upsertSubscription, {
      stripeId: subscription.id,
      customerId: customer._id,
      customerStripeId,
      userId: customer.userId,
      status: subscription.status,
      priceId: priceId ?? undefined,
      priceStripeId,
      productSlug,
      currency: subscription.currency,
      currentPeriodStart: firstItem?.current_period_start ?? 0,
      currentPeriodEnd: firstItem?.current_period_end ?? 0,
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
    await ctx.runMutation(internal.lib.deleteSubscription, {
      stripeId: subscription.id,
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

    const customer = await ctx.runQuery(internal.lib.getCustomerByStripeId, {
      stripeId: customerStripeId,
    });

    if (!customer) {
      console.error("Customer not found for invoice:", invoice.id);
      return;
    }

    let subscriptionId: Id<"subscriptions"> | undefined;
    let subscriptionStripeId: string | undefined;

    if (invoice.parent?.subscription_details) {
      const subId = invoice.parent.subscription_details.subscription;
      subscriptionStripeId = typeof subId === "string" ? subId : subId?.id;

      if (subscriptionStripeId) {
        const subscription = await ctx.runQuery(
          internal.lib.getSubscriptionByStripeId,
          { stripeId: subscriptionStripeId }
        );
        subscriptionId = subscription?._id;
      }
    }

    await ctx.runMutation(internal.lib.upsertInvoice, {
      stripeId: invoice.id,
      customerId: customer._id,
      customerStripeId,
      userId: customer.userId,
      subscriptionId: subscriptionId ?? undefined,
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

  private async handleProductUpdate(
    ctx: RunActionCtx,
    event: Stripe.ProductCreatedEvent | Stripe.ProductUpdatedEvent
  ) {
    const product = event.data.object;
    const slug = Object.keys(this.products).find(
      (key) => this.products[key as keyof Products]?.productId === product.id
    );

    await ctx.runMutation(internal.lib.upsertProduct, {
      stripeId: product.id,
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

  private async handlePriceUpdate(
    ctx: RunActionCtx,
    event: Stripe.PriceCreatedEvent | Stripe.PriceUpdatedEvent
  ) {
    const price = event.data.object;
    const productStripeId =
      typeof price.product === "string" ? price.product : price.product.id;

    const product = await ctx.runQuery(internal.lib.getProductByStripeId, {
      stripeId: productStripeId,
    });

    if (!product) {
      console.error("Product not found for price:", price.id);
      return;
    }

    const priceSlug = product.slug
      ? `${product.slug}-${price.currency}-${price.recurring?.interval || "once"}`
      : undefined;

    await ctx.runMutation(internal.lib.upsertPrice, {
      stripeId: price.id,
      productId: product._id,
      productStripeId,
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
}
