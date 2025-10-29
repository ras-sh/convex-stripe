import type { api } from "../component/_generated/api.js";
import type {
  RunActionCtx,
  RunMutationCtx,
  RunQueryCtx,
  UseApi,
} from "../shared.js";
import type {
  ComponentOptions,
  CreateTodoData,
  UpdateTodoData,
} from "./types.js";

export class Component {
  component: UseApi<typeof api>;
  options?: ComponentOptions;

  constructor(component: UseApi<typeof api>, options?: ComponentOptions) {
    this.component = component;
    this.options = options;
  }

  // Queries
  async list(ctx: RunQueryCtx, completedOnly?: boolean) {
    const todos = await ctx.runQuery(this.component.lib.list, {
      completedOnly,
    });
    return todos;
  }

  async get(ctx: RunQueryCtx, id: string) {
    const todo = await ctx.runQuery(this.component.lib.get, { id });
    return todo;
  }

  // Mutations
  async create(ctx: RunMutationCtx, data: CreateTodoData) {
    const id = await ctx.runMutation(this.component.lib.create, {
      text: data.text,
    });
    return id;
  }

  async update(ctx: RunMutationCtx, data: UpdateTodoData) {
    await ctx.runMutation(this.component.lib.update, {
      id: data.id,
      text: data.text,
    });
  }

  async toggle(ctx: RunMutationCtx, id: string) {
    await ctx.runMutation(this.component.lib.toggle, { id });
  }

  async remove(ctx: RunMutationCtx, id: string) {
    await ctx.runMutation(this.component.lib.remove, { id });
  }

  // Actions
  async createWithValidation(ctx: RunActionCtx, text: string) {
    const result = await ctx.runAction(
      this.component.lib.createWithValidation,
      {
        text,
      }
    );
    return result;
  }
}

export type {
  ComponentOptions,
  CreateTodoData,
  Todo,
  UpdateTodoData,
} from "./types.js";
