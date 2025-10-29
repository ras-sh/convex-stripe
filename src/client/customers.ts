import type Stripe from "stripe";
import { type api, internal } from "../component/_generated/api.js";
import type { RunActionCtx, RunQueryCtx, UseApi } from "../shared.js";

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
  getCustomerByUserId(ctx: RunQueryCtx, { userId }: { userId: string }) {
    return ctx.runQuery(this.component.lib.getCustomerByUserId, { userId });
  }

  /**
   * Create a Stripe customer and store in Convex
   */
  async createCustomer(
    ctx: RunActionCtx,
    { userId, email, name }: { userId: string; email: string; name?: string }
  ) {
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
    await ctx.runMutation(internal.lib.upsertCustomer, {
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
