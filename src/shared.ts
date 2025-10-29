import type {
  Expand,
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { type GenericId, type Infer, type Value, v } from "convex/values";

export const vSharedConfig = v.object({
  enabled: v.boolean(),
  maxItems: v.optional(v.number()),
});

export type SharedConfig = Infer<typeof vSharedConfig>;

export const DEFAULT_MAX_ITEMS = 100;

export function validateName(name: string): boolean {
  return name.length > 0 && name.length <= 255;
}

export type RunQueryCtx = {
  runQuery: <Query extends FunctionReference<"query", "internal">>(
    query: Query,
    args: FunctionArgs<Query>
  ) => Promise<FunctionReturnType<Query>>;
};

export type RunMutationCtx = RunQueryCtx & {
  runMutation: <Mutation extends FunctionReference<"mutation", "internal">>(
    mutation: Mutation,
    args: FunctionArgs<Mutation>
  ) => Promise<FunctionReturnType<Mutation>>;
};

export type RunActionCtx = RunMutationCtx & {
  runAction: <Action extends FunctionReference<"action", "internal">>(
    action: Action,
    args: FunctionArgs<Action>
  ) => Promise<FunctionReturnType<Action>>;
};

export type OpaqueIds<T> = T extends GenericId<string>
  ? string
  : T extends (infer U)[]
    ? OpaqueIds<U>[]
    : T extends Record<string, Value | undefined>
      ? { [K in keyof T]: OpaqueIds<T[K]> }
      : T;

export type UseApi<API> = Expand<{
  [mod in keyof API]: API[mod] extends FunctionReference<
    infer FType,
    "public",
    infer FArgs,
    infer FReturnType,
    infer FComponentPath
  >
    ? FunctionReference<
        FType,
        "internal",
        OpaqueIds<FArgs>,
        OpaqueIds<FReturnType>,
        FComponentPath
      >
    : UseApi<API[mod]>;
}>;
