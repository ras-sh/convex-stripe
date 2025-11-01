import type {
  Expand,
  FunctionHandle,
  FunctionReference,
  FunctionType,
  GenericActionCtx,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import type { GenericId } from "convex/values";
import type { api } from "./_generated/api.js";

export const omitSystemFields = <
  T extends { _id: string; _creationTime: number } | null | undefined,
>(
  doc: T
) => {
  if (!doc) {
    return doc;
  }
  const { _id, _creationTime, ...rest } = doc;
  return rest;
};

export type RunQueryCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};
export type RunMutationCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
  runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};
export type RunActionCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
  runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
  runAction: GenericActionCtx<GenericDataModel>["runAction"];
};

export type OpaqueIds<T> = T extends GenericId<infer _T>
  ? string
  : T extends FunctionHandle<FunctionType>
    ? string
    : T extends (infer U)[]
      ? OpaqueIds<U>[]
      : T extends object
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

export type ComponentApi = UseApi<typeof api>;
