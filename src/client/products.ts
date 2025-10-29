import type Stripe from "stripe";
import { type api, internal } from "../component/_generated/api.js";
import type { RunActionCtx, RunQueryCtx, UseApi } from "../shared.js";
import type { ProductConfig } from "./types.js";

/**
 * Product and price-related methods for the Stripe component
 */
export class ProductMethods<Products extends Record<string, ProductConfig>> {
  private readonly component: UseApi<typeof api>;
  private readonly stripe: Stripe;
  private readonly products: Products;

  constructor(
    component: UseApi<typeof api>,
    stripe: Stripe,
    products: Products
  ) {
    this.component = component;
    this.stripe = stripe;
    this.products = products;
  }

  /**
   * List all active products
   */
  listActiveProducts(ctx: RunQueryCtx) {
    return ctx.runQuery(this.component.lib.listActiveProducts, {});
  }

  /**
   * Get configured products by slug
   */
  async getConfiguredProducts(ctx: RunQueryCtx) {
    const allProducts = await this.listActiveProducts(ctx);
    type Product = NonNullable<
      Awaited<ReturnType<typeof this.listActiveProducts>>[number]
    >;
    const result: Record<string, Product> = {};

    for (const [slug, config] of Object.entries(this.products)) {
      const product = allProducts.find((p) => p.stripeId === config.productId);
      if (product) {
        result[slug] = product;
      }
    }

    return result as Record<keyof Products, Product>;
  }

  /**
   * Get a product by slug
   */
  getProductBySlug(ctx: RunQueryCtx, { slug }: { slug: string }) {
    return ctx.runQuery(this.component.lib.getProductBySlug, { slug });
  }

  /**
   * Get prices for a product
   */
  async getPricesForProduct(
    ctx: RunQueryCtx,
    { productId }: { productId: string }
  ) {
    return ctx.runQuery(this.component.lib.getPricesForProduct, {
      productId,
    });
  }

  /**
   * Get a price by slug
   */
  getPriceBySlug(ctx: RunQueryCtx, { slug }: { slug: string }) {
    return ctx.runQuery(this.component.lib.getPriceBySlug, { slug });
  }

  /**
   * Sync products and prices from Stripe to Convex
   * Call this once after setting up the component to populate your product catalog
   */
  async syncProducts(ctx: RunActionCtx) {
    const products = await this.stripe.products.list({
      active: true,
      limit: 100,
    });

    for (const product of products.data) {
      // Find slug if this product is in the configured products
      const slug = Object.keys(this.products).find(
        (key) => this.products[key as keyof Products]?.productId === product.id
      );

      // Upsert product
      const productId = await ctx.runMutation(internal.lib.upsertProduct, {
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

      if (!productId) {
        continue;
      }

      // Fetch and upsert prices for this product
      const prices = await this.stripe.prices.list({
        product: product.id,
        limit: 100,
      });

      for (const price of prices.data) {
        // Generate price slug if we have a product slug
        const priceSlug = slug
          ? `${slug}-${price.currency}-${price.recurring?.interval || "once"}`
          : undefined;

        await ctx.runMutation(internal.lib.upsertPrice, {
          stripeId: price.id,
          productId,
          productStripeId: product.id,
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
  }
}
