import type { api } from "../component/_generated/api.js";
import type { RunQueryCtx, UseApi } from "../component/util.js";

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
}
