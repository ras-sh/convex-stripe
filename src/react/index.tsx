import { useAction, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import React from "react";

/**
 * Stripe API context
 */
type StripeAPI = {
  getCurrentSubscription: FunctionReference<"query">;
  listUserSubscriptions: FunctionReference<"query">;
  listActiveProducts: FunctionReference<"query">;
  getConfiguredProducts: FunctionReference<"query">;
  listUserInvoices: FunctionReference<"query">;
  listUserPaymentMethods: FunctionReference<"query">;
  generateCheckoutLink: FunctionReference<"action">;
  generateBillingPortalLink: FunctionReference<"action">;
  cancelSubscription: FunctionReference<"action">;
};

const StripeContext = React.createContext<StripeAPI | null>(null);

/**
 * Provider component for Stripe API
 *
 * @example
 * ```tsx
 * import { StripeProvider } from "@ras-sh/convex-stripe/react";
 * import { api } from "../convex/_generated/api";
 *
 * function App() {
 *   return (
 *     <ConvexProvider client={convex}>
 *       <StripeProvider api={api.stripe}>
 *         <YourApp />
 *       </StripeProvider>
 *     </ConvexProvider>
 *   );
 * }
 * ```
 */
export function StripeProvider({
  api,
  children,
}: {
  api: StripeAPI;
  children: React.ReactNode;
}) {
  return (
    <StripeContext.Provider value={api}>{children}</StripeContext.Provider>
  );
}

/**
 * Hook to get the Stripe API from context
 * @internal
 */
function useStripeAPI() {
  const api = React.useContext(StripeContext);
  if (!api) {
    throw new Error("useStripeAPI must be used within a StripeProvider");
  }
  return api;
}

// ===== QUERY HOOKS =====

/**
 * Get the current active subscription for the logged-in user
 *
 * @example
 * ```tsx
 * const subscription = useCurrentSubscription();
 * if (subscription?.status === "active") {
 *   // User has active subscription
 * }
 * ```
 */
export function useCurrentSubscription() {
  const api = useStripeAPI();
  return useQuery(api.getCurrentSubscription);
}

/**
 * List all subscriptions (active and past) for the logged-in user
 *
 * @example
 * ```tsx
 * const subscriptions = useUserSubscriptions();
 * ```
 */
export function useUserSubscriptions() {
  const api = useStripeAPI();
  return useQuery(api.listUserSubscriptions);
}

/**
 * List all active products from Stripe
 *
 * @example
 * ```tsx
 * const products = useActiveProducts();
 * ```
 */
export function useActiveProducts() {
  const api = useStripeAPI();
  return useQuery(api.listActiveProducts);
}

/**
 * Get products configured with slugs
 *
 * @example
 * ```tsx
 * const products = useConfiguredProducts();
 * // { premiumMonthly: {...}, premiumYearly: {...} }
 * ```
 */
export function useConfiguredProducts() {
  const api = useStripeAPI();
  return useQuery(api.getConfiguredProducts);
}

/**
 * List invoices for the logged-in user
 *
 * @example
 * ```tsx
 * const invoices = useUserInvoices({ limit: 10 });
 * ```
 */
export function useUserInvoices(args?: { limit?: number }) {
  const api = useStripeAPI();
  return useQuery(api.listUserInvoices, args);
}

/**
 * List payment methods for the logged-in user
 *
 * @example
 * ```tsx
 * const paymentMethods = useUserPaymentMethods();
 * ```
 */
export function useUserPaymentMethods() {
  const api = useStripeAPI();
  return useQuery(api.listUserPaymentMethods);
}

// ===== ACTION HOOKS =====

/**
 * Generate a Stripe Checkout session URL
 *
 * @example
 * ```tsx
 * const generateCheckout = useGenerateCheckoutLink();
 *
 * const handleUpgrade = async () => {
 *   const { url } = await generateCheckout({
 *     priceIds: ["price_xxxxx"],
 *     successUrl: `${window.location.origin}/success`,
 *     cancelUrl: `${window.location.origin}/pricing`,
 *     mode: "subscription",
 *   });
 *   window.location.href = url;
 * };
 * ```
 */
export function useGenerateCheckoutLink() {
  const api = useStripeAPI();
  return useAction(api.generateCheckoutLink);
}

/**
 * Generate a Stripe Billing Portal session URL
 *
 * @example
 * ```tsx
 * const generatePortal = useGenerateBillingPortalLink();
 *
 * const handleManageBilling = async () => {
 *   const { url } = await generatePortal({
 *     returnUrl: window.location.href,
 *   });
 *   window.location.href = url;
 * };
 * ```
 */
export function useGenerateBillingPortalLink() {
  const api = useStripeAPI();
  return useAction(api.generateBillingPortalLink);
}

/**
 * Cancel the user's subscription
 *
 * @example
 * ```tsx
 * const cancelSubscription = useCancelSubscription();
 *
 * const handleCancel = async () => {
 *   await cancelSubscription({ immediate: false }); // Cancel at period end
 * };
 * ```
 */
export function useCancelSubscription() {
  const api = useStripeAPI();
  return useAction(api.cancelSubscription);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format currency amounts
 *
 * @example
 * ```tsx
 * formatCurrency(1999, "usd") // "$19.99"
 * ```
 */
export function formatCurrency(amountInCents: number, currency: string) {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Format dates
 *
 * @example
 * ```tsx
 * formatDate(subscription.currentPeriodEnd) // "Jan 15, 2024"
 * ```
 */
export function formatDate(
  timestamp: number,
  options?: Intl.DateTimeFormatOptions
) {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", options);
}

/**
 * Check if a subscription is active
 *
 * @example
 * ```tsx
 * const isActive = isSubscriptionActive(subscription?.status);
 * ```
 */
export function isSubscriptionActive(status?: string) {
  return status === "active" || status === "trialing";
}

/**
 * Hook that combines subscription data with formatted values
 *
 * @example
 * ```tsx
 * const subscription = useSubscription();
 * // {
 * //   data: {...},
 * //   isActive: true,
 * //   periodEndDate: "Jan 15, 2024",
 * //   isTrialing: false,
 * //   isCanceling: false
 * // }
 * ```
 */
export function useSubscription() {
  const subscription = useCurrentSubscription();

  return React.useMemo(() => {
    if (!subscription) {
      return null;
    }

    const isActive = isSubscriptionActive(subscription.status);

    return {
      data: subscription,
      isActive,
      periodEndDate: formatDate(subscription.currentPeriodEnd),
      periodStartDate: formatDate(subscription.currentPeriodStart),
      isTrialing: subscription.status === "trialing",
      isCanceling: subscription.cancelAtPeriodEnd,
      trialEndDate: subscription.trialEnd
        ? formatDate(subscription.trialEnd)
        : null,
    };
  }, [subscription]);
}
