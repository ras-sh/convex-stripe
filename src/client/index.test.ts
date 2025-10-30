import { describe, expect, it } from "vitest";
import type { api } from "../component/_generated/api.js";
import type { UseApi } from "../shared.js";
import { StripeComponent } from "./index.js";

describe("StripeComponent", () => {
  it("constructs with minimal config", () => {
    const component = {} as unknown as UseApi<typeof api>;
    const stripe = {} as unknown as import("stripe").Stripe;

    const instance = new StripeComponent(component, {
      getUserInfo: async () => ({ userId: "user_1", email: "u@example.com" }),
      webhookSecret: "whsec_test",
      stripe,
      products: {},
    });

    expect(instance).toBeInstanceOf(StripeComponent);
    expect(typeof instance.api()).toBe("object");
  });
});
