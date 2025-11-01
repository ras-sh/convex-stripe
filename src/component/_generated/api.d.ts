/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib from "../lib.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  lib: typeof lib;
}>;
export type Mounts = {
  lib: {
    // Queries
    getCustomerByUserId: FunctionReference<"query", "public", { userId: string }, any>;
    getCustomerByStripeId: FunctionReference<"query", "public", { stripeId: string }, any>;
    listActiveProducts: FunctionReference<"query", "public", Record<string, never>, any>;
    getProductBySlug: FunctionReference<"query", "public", { slug: string }, any>;
    getProductByStripeId: FunctionReference<"query", "public", { stripeId: string }, any>;
    getPricesForProduct: FunctionReference<"query", "public", { productId: string }, any>;
    getPriceBySlug: FunctionReference<"query", "public", { slug: string }, any>;
    getPriceByStripeId: FunctionReference<"query", "public", { stripeId: string }, any>;
    getCurrentSubscription: FunctionReference<"query", "public", { userId: string }, any>;
    listUserSubscriptions: FunctionReference<"query", "public", { userId: string }, any>;
    getSubscriptionByStripeId: FunctionReference<"query", "public", { stripeId: string }, any>;
    listUserInvoices: FunctionReference<"query", "public", { userId: string; limit?: number }, any>;

    // Mutations
    upsertCustomer: FunctionReference<"mutation", "public", any, string>;
    upsertProduct: FunctionReference<"mutation", "public", any, string>;
    upsertPrice: FunctionReference<"mutation", "public", any, string>;
    upsertSubscription: FunctionReference<"mutation", "public", any, string>;
    deleteSubscription: FunctionReference<"mutation", "public", { stripeId: string }, void>;
    upsertInvoice: FunctionReference<"mutation", "public", any, string>;
    deleteCustomer: FunctionReference<"mutation", "public", { stripeId: string }, void>;
    deactivateProduct: FunctionReference<"mutation", "public", { stripeId: string }, void>;
    deactivatePrice: FunctionReference<"mutation", "public", { stripeId: string }, void>;
  };
};
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
