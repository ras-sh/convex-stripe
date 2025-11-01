import type { api } from "../component/_generated/api.js";
import type { RunActionCtx, RunQueryCtx, UseApi } from "../component/util.js";

/**
 * Invoice-related methods for the Stripe component
 */
export class InvoiceMethods {
  private readonly component: UseApi<typeof api>;

  constructor(component: UseApi<typeof api>) {
    this.component = component;
  }

  /**
   * List invoices for a user
   */
  listUserInvoices(
    ctx: RunQueryCtx,
    { userId, limit }: { userId: string; limit?: number }
  ) {
    return ctx.runQuery(this.component.lib.listUserInvoices, {
      userId,
      limit,
    });
  }

  /**
   * Sync all invoices from Stripe to Convex
   * This is useful when migrating from another system or backfilling data
   */
  async syncInvoices(
    ctx: RunActionCtx,
    { stripeSecretKey }: { stripeSecretKey: string }
  ) {
    await ctx.runAction(this.component.lib.syncInvoices, {
      stripeSecretKey,
    });
  }
}
