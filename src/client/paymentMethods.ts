import type { api } from "../component/_generated/api.js";
import type { RunQueryCtx, UseApi } from "../shared.js";

/**
 * Payment method-related methods for the Stripe component
 */
export class PaymentMethodMethods {
  private readonly component: UseApi<typeof api>;

  constructor(component: UseApi<typeof api>) {
    this.component = component;
  }

  /**
   * List payment methods for a user
   */
  listUserPaymentMethods(ctx: RunQueryCtx, { userId }: { userId: string }) {
    return ctx.runQuery(this.component.lib.listUserPaymentMethods, {
      userId,
    });
  }
}
