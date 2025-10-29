import type { Infer } from "convex/values";
import type { vTodo } from "../validators/index.js";

export type ComponentOptions = {
  enabled?: boolean;
  maxItems?: number;
};

// Infer types from validators to avoid duplication
export type Todo = Infer<typeof vTodo>;

export type CreateTodoData = {
  text: string;
};

export type UpdateTodoData = {
  id: string;
  text: string;
};
