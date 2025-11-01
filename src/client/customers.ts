import type Stripe from "stripe";
import type { api } from "../component/_generated/api.js";
import type { RunActionCtx, RunQueryCtx, UseApi } from "../component/util.js";
import type { StripeCustomer } from "../validators.js";

/**
 * Customer-related methods for the Stripe component
 */
export class CustomerMethods {
  private readonly component: UseApi<typeof api>;
  private readonly stripe: Stripe;

  constructor(component: UseApi<typeof api>, stripe: Stripe) {
    this.component = component;
    this.stripe = stripe;
  }

  /**
   * Get a customer by user ID
   */
  async getCustomerByUserId(
    ctx: RunQueryCtx,
    { userId }: { userId: string }
  ): Promise<StripeCustomer | null> {
    return (await ctx.runQuery(this.component.lib.getCustomerByUserId, {
      userId,
    })) as StripeCustomer | null;
  }

  /**
   * Create a Stripe customer and store in Convex
   */
  async createCustomer(
    ctx: RunActionCtx,
    { userId, email, name }: { userId: string; email: string; name?: string }
  ): Promise<StripeCustomer> {
    // Check if customer already exists
    const existing = await this.getCustomerByUserId(ctx, { userId });
    if (existing) {
      return existing;
    }

    // Create in Stripe
    const stripeCustomer = await this.stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });

    // Store in Convex
    await ctx.runMutation(this.component.lib.upsertCustomer, {
      stripeId: stripeCustomer.id,
      userId,
      email: stripeCustomer.email || email,
      name: stripeCustomer.name || name,
      currency: stripeCustomer.currency || undefined,
      created: stripeCustomer.created,
      metadata: stripeCustomer.metadata,
    });

    const customer = await this.getCustomerByUserId(ctx, { userId });
    if (!customer) {
      throw new Error("Failed to create customer");
    }
    return customer;
  }
}
