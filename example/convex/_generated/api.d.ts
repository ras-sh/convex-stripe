/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as stripe from "../stripe.js";

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
  admin: typeof admin;
  auth: typeof auth;
  http: typeof http;
  stripe: typeof stripe;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  stripe: {
    lib: {
      deactivatePrice: FunctionReference<
        "mutation",
        "internal",
        { stripeId: string },
        any
      >;
      deactivateProduct: FunctionReference<
        "mutation",
        "internal",
        { stripeId: string },
        any
      >;
      deleteCustomer: FunctionReference<
        "mutation",
        "internal",
        { stripeId: string },
        any
      >;
      deleteSubscription: FunctionReference<
        "mutation",
        "internal",
        { stripeId: string },
        any
      >;
      getCurrentSubscription: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
      getCustomerByStripeId: FunctionReference<
        "query",
        "internal",
        { stripeId: string },
        any
      >;
      getCustomerByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
      getPriceBySlug: FunctionReference<
        "query",
        "internal",
        { slug: string },
        any
      >;
      getPriceByStripeId: FunctionReference<
        "query",
        "internal",
        { stripeId: string },
        any
      >;
      getPricesForProduct: FunctionReference<
        "query",
        "internal",
        { productId: string },
        any
      >;
      getProductBySlug: FunctionReference<
        "query",
        "internal",
        { slug: string },
        any
      >;
      getProductByStripeId: FunctionReference<
        "query",
        "internal",
        { stripeId: string },
        any
      >;
      getSubscriptionByStripeId: FunctionReference<
        "query",
        "internal",
        { stripeId: string },
        any
      >;
      listActiveProducts: FunctionReference<"query", "internal", {}, any>;
      listUserInvoices: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        any
      >;
      listUserSubscriptions: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
      upsertCustomer: FunctionReference<
        "mutation",
        "internal",
        {
          created: number;
          currency?: string;
          email: string;
          metadata?: Record<string, string>;
          name?: string;
          stripeId: string;
          userId: string;
        },
        any
      >;
      upsertInvoice: FunctionReference<
        "mutation",
        "internal",
        {
          amountDue: number;
          amountPaid: number;
          amountRemaining: number;
          billingReason?: string;
          created: number;
          currency: string;
          customerId: string;
          customerStripeId: string;
          dueDate?: number;
          hostedInvoiceUrl?: string;
          invoicePdf?: string;
          metadata?: Record<string, string>;
          paidAt?: number;
          periodEnd: number;
          periodStart: number;
          status: string;
          stripeId: string;
          subscriptionId?: string;
          subscriptionStripeId?: string;
          subtotal: number;
          tax?: number;
          total: number;
          userId: string;
        },
        any
      >;
      upsertPrice: FunctionReference<
        "mutation",
        "internal",
        {
          active: boolean;
          billingScheme?: string;
          created: number;
          currency: string;
          metadata?: Record<string, string>;
          productId: string;
          productStripeId: string;
          recurringInterval?: string;
          recurringIntervalCount?: number;
          slug?: string;
          stripeId: string;
          type: string;
          unitAmount?: number;
        },
        any
      >;
      upsertProduct: FunctionReference<
        "mutation",
        "internal",
        {
          active: boolean;
          created: number;
          description?: string;
          metadata?: Record<string, string>;
          name: string;
          slug?: string;
          stripeId: string;
          type?: string;
          updated: number;
        },
        any
      >;
      upsertSubscription: FunctionReference<
        "mutation",
        "internal",
        {
          cancelAtPeriodEnd: boolean;
          canceledAt?: number;
          created: number;
          currency: string;
          currentPeriodEnd: number;
          currentPeriodStart: number;
          customerId: string;
          customerStripeId: string;
          endedAt?: number;
          metadata?: Record<string, string>;
          priceId?: string;
          priceStripeId?: string;
          productSlug?: string;
          status: string;
          stripeId: string;
          trialEnd?: number;
          trialStart?: number;
          userId: string;
        },
        any
      >;
    };
  };
};
