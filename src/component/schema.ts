import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const schema = defineSchema({
  todos: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }).index("by_completed", ["isCompleted"]),
});

export default schema;
