import {
  actionGeneric,
  type HttpRouter,
  internalActionGeneric,
  queryGeneric,
} from "convex/server";
import type Stripe from "stripe";
import type { ComponentApi } from "../component/util.js";
import {
  vCancelSubscriptionArgs,
  vGenerateBillingPortalLinkArgs,
  vGenerateCheckoutLinkArgs,
  vListUserInvoicesArgs,
} from "../validators.js";
import { CustomerMethods } from "./customers.js";
import { InvoiceMethods } from "./invoices.js";
import { ProductMethods } from "./products.js";
import { SubscriptionMethods } from "./subscriptions.js";
import type { ProductConfig, StripeConfig, WebhookConfig } from "./types.js";
import { WebhookHandler } from "./webhooks.js";

export type { ProductConfig, StripeConfig, WebhookConfig } from "./types.js";

/**
 * Main Stripe Component Class
 *
 * Usage:
 * ```ts
 * import { components } from "./_generated/api";
 * import { StripeComponent } from "@ras-sh/convex-stripe";
 * import Stripe from "stripe";
 *
 * const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 *   apiVersion: "2025-09-30.clover",
 * });
 *
 * export const stripe = new StripeComponent(components.stripe, {
 *   getUserInfo: async (ctx) => {
 *     const user = await getCurrentUser(ctx);
 *     return { userId: user._id, email: user.email };
 *   },
 *   products: {
 *     premiumMonthly: { productId: "prod_xxx", priceId: "price_xxx" }
 *   },
 *   stripe: stripeClient,
 *   webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
 * });
 * ```
 */
export class StripeComponent<
  Products extends Record<string, ProductConfig> = Record<
    string,
    ProductConfig
  >,
> {
  readonly stripe: Stripe;
  readonly products: Products;
  readonly component: ComponentApi;
  private readonly config: StripeConfig<Products>;
  private readonly stripeSecretKey: string;
  private readonly webhookSecret: string;

  // Method groups
  private readonly customerMethods: CustomerMethods;
  private readonly productMethods: ProductMethods<Products>;
  private readonly subscriptionMethods: SubscriptionMethods<Products>;
  private readonly invoiceMethods: InvoiceMethods;
  private readonly webhookHandler: WebhookHandler<Products>;

  constructor(component: ComponentApi, config: StripeConfig<Products>) {
    this.component = component;
    this.config = config;
    this.products = config.products ?? ({} as Products);
    this.stripeSecretKey = config.stripeSecretKey;
    this.webhookSecret = config.webhookSecret;
    this.stripe = config.stripe;

    // Initialize method groups
    this.customerMethods = new CustomerMethods(this.component, this.stripe);
    this.productMethods = new ProductMethods(this.component, this.products);
    this.subscriptionMethods = new SubscriptionMethods(
      this.component,
      this.stripe,
      this.config,
      this.customerMethods.getCustomerByUserId.bind(this.customerMethods),
      this.customerMethods.createCustomer.bind(this.customerMethods)
    );
    this.invoiceMethods = new InvoiceMethods(this.component);
    this.webhookHandler = new WebhookHandler(
      this.component,
      this.stripe,
      this.webhookSecret,
      this.products
    );
  }

  // ===== CUSTOMER METHODS =====

  getCustomerByUserId(
    ...args: Parameters<CustomerMethods["getCustomerByUserId"]>
  ) {
    return this.customerMethods.getCustomerByUserId(...args);
  }

  createCustomer(...args: Parameters<CustomerMethods["createCustomer"]>) {
    return this.customerMethods.createCustomer(...args);
  }

  // ===== PRODUCT & PRICE METHODS =====

  listActiveProducts(
    ...args: Parameters<ProductMethods<Products>["listActiveProducts"]>
  ) {
    return this.productMethods.listActiveProducts(...args);
  }

  getConfiguredProducts(
    ...args: Parameters<ProductMethods<Products>["getConfiguredProducts"]>
  ) {
    return this.productMethods.getConfiguredProducts(...args);
  }

  getProductBySlug(
    ...args: Parameters<ProductMethods<Products>["getProductBySlug"]>
  ) {
    return this.productMethods.getProductBySlug(...args);
  }

  getPricesForProduct(
    ...args: Parameters<ProductMethods<Products>["getPricesForProduct"]>
  ) {
    return this.productMethods.getPricesForProduct(...args);
  }

  getPriceBySlug(
    ...args: Parameters<ProductMethods<Products>["getPriceBySlug"]>
  ) {
    return this.productMethods.getPriceBySlug(...args);
  }

  syncProducts(ctx: Parameters<ProductMethods<Products>["syncProducts"]>[0]) {
    return this.productMethods.syncProducts(ctx, {
      stripeSecretKey: this.stripeSecretKey,
    });
  }

  // ===== CUSTOMER SYNC METHODS =====

  syncCustomers(ctx: Parameters<CustomerMethods["syncCustomers"]>[0]) {
    return this.customerMethods.syncCustomers(ctx, {
      stripeSecretKey: this.stripeSecretKey,
    });
  }

  // ===== SUBSCRIPTION METHODS =====

  getCurrentSubscription(
    ...args: Parameters<SubscriptionMethods<Products>["getCurrentSubscription"]>
  ) {
    return this.subscriptionMethods.getCurrentSubscription(...args);
  }

  listUserSubscriptions(
    ...args: Parameters<SubscriptionMethods<Products>["listUserSubscriptions"]>
  ) {
    return this.subscriptionMethods.listUserSubscriptions(...args);
  }

  generateCheckoutLink(
    ...args: Parameters<SubscriptionMethods<Products>["generateCheckoutLink"]>
  ) {
    return this.subscriptionMethods.generateCheckoutLink(...args);
  }

  generateBillingPortalLink(
    ...args: Parameters<
      SubscriptionMethods<Products>["generateBillingPortalLink"]
    >
  ) {
    return this.subscriptionMethods.generateBillingPortalLink(...args);
  }

  cancelSubscription(
    ...args: Parameters<SubscriptionMethods<Products>["cancelSubscription"]>
  ) {
    return this.subscriptionMethods.cancelSubscription(...args);
  }

  syncSubscriptions(
    ctx: Parameters<SubscriptionMethods<Products>["syncSubscriptions"]>[0]
  ) {
    return this.subscriptionMethods.syncSubscriptions(ctx, {
      stripeSecretKey: this.stripeSecretKey,
    });
  }

  // ===== INVOICE METHODS =====

  listUserInvoices(...args: Parameters<InvoiceMethods["listUserInvoices"]>) {
    return this.invoiceMethods.listUserInvoices(...args);
  }

  syncInvoices(ctx: Parameters<InvoiceMethods["syncInvoices"]>[0]) {
    return this.invoiceMethods.syncInvoices(ctx, {
      stripeSecretKey: this.stripeSecretKey,
    });
  }

  // ===== SYNC ALL METHOD =====

  /**
   * Sync all data from Stripe to Convex
   * This syncs products, prices, customers, subscriptions, and invoices
   * Useful when migrating from another Stripe integration
   */
  async syncAll(ctx: Parameters<typeof this.syncProducts>[0]) {
    await ctx.runAction(this.component.lib.syncAll, {
      stripeSecretKey: this.stripeSecretKey,
    });
  }

  // ===== PUBLIC API =====

  /**
   * Returns the public API that can be called from the frontend
   * Sync functions are internal and can only be called from backend code
   *
   * Usage:
   * ```ts
   * export const {
   *   getCurrentSubscription,
   *   listUserSubscriptions,
   *   getConfiguredProducts,
   *   listUserInvoices,
   *   generateCheckoutLink,
   *   generateBillingPortalLink,
   *   cancelSubscription,
   *   syncAll,
   *   syncProducts,
   *   syncCustomers,
   *   syncSubscriptions,
   *   syncInvoices,
   * } = stripe.api();
   * ```
   */
  api() {
    return {
      // Queries
      getCurrentSubscription: queryGeneric({
        args: {},
        handler: async (ctx) => {
          const { userId } = await this.config.getUserInfo(ctx);
          return await this.getCurrentSubscription(ctx, { userId });
        },
      }),

      listUserSubscriptions: queryGeneric({
        args: {},
        handler: async (ctx) => {
          const { userId } = await this.config.getUserInfo(ctx);
          return await this.listUserSubscriptions(ctx, { userId });
        },
      }),

      listActiveProducts: queryGeneric({
        args: {},
        handler: async (ctx) => await this.listActiveProducts(ctx),
      }),

      getConfiguredProducts: queryGeneric({
        args: {},
        handler: async (ctx) => await this.getConfiguredProducts(ctx),
      }),

      listUserInvoices: queryGeneric({
        args: vListUserInvoicesArgs.fields,
        handler: async (ctx, args) => {
          const { userId } = await this.config.getUserInfo(ctx);
          return await this.listUserInvoices(ctx, {
            userId,
            limit: args.limit,
          });
        },
      }),

      // Actions
      generateCheckoutLink: actionGeneric({
        args: vGenerateCheckoutLinkArgs.fields,
        handler: async (ctx, args) =>
          await this.generateCheckoutLink(ctx, args),
      }),

      generateBillingPortalLink: actionGeneric({
        args: vGenerateBillingPortalLinkArgs.fields,
        handler: async (ctx, args) =>
          await this.generateBillingPortalLink(ctx, args),
      }),

      cancelSubscription: actionGeneric({
        args: vCancelSubscriptionArgs.fields,
        handler: async (ctx, args) =>
          await this.cancelSubscription(ctx, {
            immediate: args.immediate,
          }),
      }),

      // Internal Actions (Sync)
      syncAll: internalActionGeneric({
        handler: (ctx, _args) => this.syncAll(ctx),
      }),

      syncProducts: internalActionGeneric({
        handler: (ctx, _args) => this.syncProducts(ctx),
      }),

      syncCustomers: internalActionGeneric({
        handler: (ctx, _args) => this.syncCustomers(ctx),
      }),

      syncSubscriptions: internalActionGeneric({
        handler: (ctx, _args) => this.syncSubscriptions(ctx),
      }),

      syncInvoices: internalActionGeneric({
        handler: (ctx, _args) => this.syncInvoices(ctx),
      }),
    };
  }

  // ===== WEBHOOK REGISTRATION =====

  /**
   * Register webhook routes on your HTTP router
   */
  registerRoutes(http: HttpRouter, config?: WebhookConfig) {
    this.webhookHandler.registerRoutes(http, config);
  }
}

// Export the class as default and named export
export default StripeComponent;
