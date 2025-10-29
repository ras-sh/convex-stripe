import { doc, typedV } from "convex-helpers/validators";
import schema from "../component/schema.js";

const vv = typedV(schema);

export const vStripeCustomer = doc(schema, "customers");
export const vStripeProduct = vv.doc("products");
export const vStripePrice = vv.doc("prices");
export const vStripeSubscription = vv.doc("subscriptions");
export const vStripeInvoice = vv.doc("invoices");
export const vStripePaymentMethod = vv.doc("paymentMethods");

export const vStripeCustomerId = vv.id("customers");
export const vStripeProductId = vv.id("products");
export const vStripePriceId = vv.id("prices");
export const vStripeSubscriptionId = vv.id("subscriptions");
export const vStripeInvoiceId = vv.id("invoices");
export const vStripePaymentMethodId = vv.id("paymentMethods");
