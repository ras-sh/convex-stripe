import type Stripe from "stripe";

/**
 * Utility functions for converting Stripe objects to Convex document format
 * These handle the type mismatches between Stripe's typed SDK and actual API responses
 */

/**
 * Safely extract metadata, converting null to undefined
 */
export function extractMetadata(
  metadata: Stripe.Metadata | null | undefined
): Record<string, string> | undefined {
  return metadata || undefined;
}

/**
 * Extract subscription period fields from Stripe subscription
 * Period fields are on the subscription items, not the subscription itself
 */
export function extractSubscriptionPeriod(subscription: Stripe.Subscription): {
  currentPeriodStart: number;
  currentPeriodEnd: number;
} {
  const firstItem = subscription.items.data[0];
  return {
    currentPeriodStart: firstItem?.current_period_start ?? 0,
    currentPeriodEnd: firstItem?.current_period_end ?? 0,
  };
}
