import { httpRouter } from "convex/server";
import { stripe } from "./stripe";

const http = httpRouter();

stripe.registerRoutes(http, {
  path: "/stripe/webhook",
});

export default http;
