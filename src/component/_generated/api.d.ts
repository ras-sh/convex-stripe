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
    getCustomerByUserId: FunctionReference<"query", "internal", { userId: string }, any>;
    getCustomerByStripeId: FunctionReference<"query", "internal", { stripeId: string }, any>;
    listActiveProducts: FunctionReference<"query", "internal", Record<string, never>, any>;
    getProductBySlug: FunctionReference<"query", "internal", { slug: string }, any>;
    getProductByStripeId: FunctionReference<"query", "internal", { stripeId: string }, any>;
    getPricesForProduct: FunctionReference<"query", "internal", { productId: string }, any>;
    getPriceBySlug: FunctionReference<"query", "internal", { slug: string }, any>;
    getPriceByStripeId: FunctionReference<"query", "internal", { stripeId: string }, any>;
    getCurrentSubscription: FunctionReference<"query", "internal", { userId: string }, any>;
    listUserSubscriptions: FunctionReference<"query", "internal", { userId: string }, any>;
    getSubscriptionByStripeId: FunctionReference<"query", "internal", { stripeId: string }, any>;
    listUserInvoices: FunctionReference<"query", "internal", { userId: string; limit?: number }, any>;
    listUserPaymentMethods: FunctionReference<"query", "internal", { userId: string }, any>;

    // Mutations
    upsertCustomer: FunctionReference<"mutation", "internal", any, string>;
    upsertProduct: FunctionReference<"mutation", "internal", any, string>;
    upsertPrice: FunctionReference<"mutation", "internal", any, string>;
    upsertSubscription: FunctionReference<"mutation", "internal", any, string>;
    deleteSubscription: FunctionReference<"mutation", "internal", { stripeId: string }, void>;
    upsertInvoice: FunctionReference<"mutation", "internal", any, string>;
    upsertPaymentMethod: FunctionReference<"mutation", "internal", any, string>;
    deletePaymentMethod: FunctionReference<"mutation", "internal", { stripeId: string }, void>;
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
