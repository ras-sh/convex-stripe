import type Stripe from "stripe";
import type { api } from "../component/_generated/api.js";
import type { RunActionCtx, RunQueryCtx, UseApi } from "../component/util.js";
import { extractMetadata } from "./stripeUtils.js";

/**
 * Invoice-related methods for the Stripe component
 */
export class InvoiceMethods {
  private readonly component: UseApi<typeof api>;
  private readonly stripe: Stripe;

  constructor(component: UseApi<typeof api>, stripe: Stripe) {
    this.component = component;
    this.stripe = stripe;
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
  async syncInvoices(ctx: RunActionCtx) {
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const invoices = await this.stripe.invoices.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const invoice of invoices.data) {
        // Get the customer from Convex
        const customer = await ctx.runQuery(
          this.component.lib.getCustomerByStripeId,
          { stripeId: invoice.customer as string }
        );

        if (!customer) {
          // Skip invoices for customers not in our system
          continue;
        }

        // Subscriptions aren't linked in invoices from the typed API
        // Webhooks will handle linking invoices to subscriptions
        const subscriptionId: string | undefined = undefined;
        const subscriptionStripeId: string | undefined = undefined;

        // Upsert invoice
        await ctx.runMutation(this.component.lib.upsertInvoice, {
          stripeId: invoice.id,
          customerId: customer._id,
          customerStripeId: invoice.customer as string,
          userId: customer.userId,
          subscriptionId,
          subscriptionStripeId,
          status: invoice.status || "draft",
          currency: invoice.currency,
          amountDue: invoice.amount_due,
          amountPaid: invoice.amount_paid,
          amountRemaining: invoice.amount_remaining,
          subtotal: invoice.subtotal,
          total: invoice.total,
          tax: undefined, // Tax is calculated from line items, not stored directly
          invoicePdf: invoice.invoice_pdf || undefined,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          billingReason: invoice.billing_reason || undefined,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
          dueDate: invoice.due_date || undefined,
          paidAt: invoice.status_transitions?.paid_at || undefined,
          created: invoice.created,
          metadata: extractMetadata(invoice.metadata),
        });
      }

      hasMore = invoices.has_more;
      if (hasMore && invoices.data.length > 0) {
        startingAfter = invoices.data[invoices.data.length - 1]?.id;
      }
    }
  }
}
