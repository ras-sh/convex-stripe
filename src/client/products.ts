import type { api } from "../component/_generated/api.js";
import type { RunActionCtx, RunQueryCtx, UseApi } from "../component/util.js";
import type { ProductConfig } from "./types.js";

/**
 * Product and price-related methods for the Stripe component
 */
export class ProductMethods<Products extends Record<string, ProductConfig>> {
  private readonly component: UseApi<typeof api>;
  private readonly products: Products;

  constructor(component: UseApi<typeof api>, products: Products) {
    this.component = component;
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
  async syncProducts(
    ctx: RunActionCtx,
    { stripeSecretKey }: { stripeSecretKey: string }
  ) {
    await ctx.runAction(this.component.lib.syncProducts, {
      stripeSecretKey,
    });
  }
}
