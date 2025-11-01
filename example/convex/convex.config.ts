import stripe from "@ras-sh/convex-stripe/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(stripe);

export default app;
