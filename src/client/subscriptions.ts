import type Stripe from "stripe";
import type { api } from "../component/_generated/api.js";
import type { RunActionCtx, RunQueryCtx, UseApi } from "../component/util.js";
import type { StripeCustomer } from "../validators.js";
import type { ProductConfig, StripeConfig } from "./types.js";

type Customer = StripeCustomer;

/**
 * Subscription-related methods for the Stripe component
 */
export class SubscriptionMethods<
  Products extends Record<string, ProductConfig>,
> {
  private readonly component: UseApi<typeof api>;
  private readonly stripe: Stripe;
  private readonly config: StripeConfig<Products>;
  private readonly getCustomerByUserId: (
    ctx: RunQueryCtx,
    args: { userId: string }
  ) => Promise<Customer | null>;
  private readonly createCustomer: (
    ctx: RunActionCtx,
    args: { userId: string; email: string; name?: string }
  ) => Promise<Customer>;

  constructor(
    component: UseApi<typeof api>,
    stripe: Stripe,
    config: StripeConfig<Products>,
    getCustomerByUserId: (
      ctx: RunQueryCtx,
      args: { userId: string }
    ) => Promise<Customer | null>,
    createCustomer: (
      ctx: RunActionCtx,
      args: { userId: string; email: string; name?: string }
    ) => Promise<Customer>
  ) {
    this.component = component;
    this.stripe = stripe;
    this.config = config;
    this.getCustomerByUserId = getCustomerByUserId;
    this.createCustomer = createCustomer;
  }

  /**
   * Get the current active subscription for a user
   */
  async getCurrentSubscription(
    ctx: RunQueryCtx,
    { userId }: { userId: string }
  ) {
    const subscription = await ctx.runQuery(
      this.component.lib.getCurrentSubscription,
      { userId }
    );

    if (!subscription) {
      return null;
    }

    // Find the product slug if using configured products
    const productSlug = subscription.productSlug || undefined;

    return {
      ...subscription,
      productSlug,
    };
  }

  /**
   * List all subscriptions for a user
   */
  listUserSubscriptions(ctx: RunQueryCtx, { userId }: { userId: string }) {
    return ctx.runQuery(this.component.lib.listUserSubscriptions, {
      userId,
    });
  }

  /**
   * Generate a Stripe Checkout session URL
   */
  async generateCheckoutLink(
    ctx: RunActionCtx,
    {
      priceIds,
      successUrl,
      cancelUrl,
      mode = "subscription",
    }: {
      priceIds: string[];
      successUrl: string;
      cancelUrl: string;
      mode?: "subscription" | "payment";
    }
  ) {
    const { userId, email } = await this.config.getUserInfo(ctx);

    // Get or create customer
    let customer = await this.getCustomerByUserId(ctx, { userId });
    if (!customer) {
      customer = await this.createCustomer(ctx, { userId, email });
    }

    if (!customer) {
      throw new Error("Failed to create customer");
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customer.stripeId,
      mode,
      line_items: priceIds.map((priceId) => ({
        price: priceId,
        quantity: 1,
      })),
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }
    return { url: session.url };
  }

  /**
   * Generate a Stripe Billing Portal session URL
   */
  async generateBillingPortalLink(
    ctx: RunActionCtx,
    { returnUrl }: { returnUrl: string }
  ) {
    const { userId } = await this.config.getUserInfo(ctx);

    const customer = await this.getCustomerByUserId(ctx, { userId });
    if (!customer) {
      throw new Error("Customer not found");
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customer.stripeId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    ctx: RunActionCtx,
    { immediate = false }: { immediate?: boolean } = {}
  ) {
    const { userId } = await this.config.getUserInfo(ctx);

    const subscription = await this.getCurrentSubscription(ctx, { userId });
    if (!subscription) {
      throw new Error("No active subscription found");
    }

    if (immediate) {
      // Cancel immediately
      await this.stripe.subscriptions.cancel(subscription.stripeId);
    } else {
      // Cancel at period end
      await this.stripe.subscriptions.update(subscription.stripeId, {
        cancel_at_period_end: true,
      });
    }
  }

  /**
   * Sync all subscriptions from Stripe to Convex
   * This is useful when migrating from another system or backfilling data
   */
  async syncSubscriptions(
    ctx: RunActionCtx,
    { stripeSecretKey }: { stripeSecretKey: string }
  ) {
    await ctx.runAction(this.component.lib.syncSubscriptions, {
      stripeSecretKey,
    });
  }
}
