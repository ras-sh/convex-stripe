import { v } from "convex/values";
import { vTodo } from "../validators/index.js";
import { internal } from "./_generated/api.js";
import type { Doc, Id } from "./_generated/dataModel.js";
import {
  action,
  internalMutation,
  mutation,
  query,
} from "./_generated/server.js";

// Queries
export const list = query({
  args: {
    completedOnly: v.optional(v.boolean()),
  },
  returns: v.array(vTodo),
  handler: async (ctx, args): Promise<Doc<"todos">[]> => {
    const completedOnly = args.completedOnly;
    if (completedOnly !== undefined) {
      return await ctx.db
        .query("todos")
        .withIndex("by_completed", (q) => q.eq("isCompleted", completedOnly))
        .collect();
    }
    return await ctx.db.query("todos").collect();
  },
});

export const get = query({
  args: {
    id: v.id("todos"),
  },
  returns: v.union(vTodo, v.null()),
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

// Mutations
export const create = mutation({
  args: {
    text: v.string(),
  },
  returns: v.id("todos"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("todos", {
      text: args.text,
      isCompleted: false,
    });
    return id;
  },
});

// Internal mutation for use by actions
export const createInternal = internalMutation({
  args: {
    text: v.string(),
  },
  returns: v.id("todos"),
  handler: async (ctx, args): Promise<Id<"todos">> => {
    const id = await ctx.db.insert("todos", {
      text: args.text,
      isCompleted: false,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("todos"),
    text: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      text: args.text,
    });
    return null;
  },
});

export const toggle = mutation({
  args: {
    id: v.id("todos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) {
      throw new Error("Todo not found");
    }
    await ctx.db.patch(args.id, {
      isCompleted: !todo.isCompleted,
    });
    return null;
  },
});

export const remove = mutation({
  args: {
    id: v.id("todos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Actions
export const createWithValidation = action({
  args: {
    text: v.string(),
  },
  returns: v.object({
    id: v.id("todos"),
    isValid: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Example: validate text length (simulating external validation)
    const isValid = args.text.length >= 3 && args.text.length <= 200;

    if (!isValid) {
      throw new Error("Todo text must be between 3 and 200 characters");
    }

    // Call internal mutation to create todo
    const id = (await ctx.runMutation(internal.lib.createInternal, {
      text: args.text,
    })) as Id<"todos">;

    return {
      id,
      isValid: true,
      message: "Todo created successfully",
    };
  },
});
