import { query } from "./_generated/server";

// Internal helper to get the first user (for getUserInfo callback)
export const getUser = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("users").first(),
});
