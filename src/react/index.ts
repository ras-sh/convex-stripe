import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Todo } from "../client/types.js";

// Queries
export function useListTodos(args?: { completedOnly?: boolean }) {
  return useQuery(
    "component:lib:list" as unknown as FunctionReference<
      "query",
      "public",
      { completedOnly?: boolean },
      Todo[]
    >,
    args ?? {}
  );
}

export function useGetTodo(args: { id: string }) {
  return useQuery(
    "component:lib:get" as unknown as FunctionReference<
      "query",
      "public",
      { id: string },
      Todo | null
    >,
    args
  );
}

// Mutations
export function useCreateTodo() {
  return useMutation(
    "component:lib:create" as unknown as FunctionReference<
      "mutation",
      "public",
      { text: string },
      string
    >
  );
}

export function useUpdateTodo() {
  return useMutation(
    "component:lib:update" as unknown as FunctionReference<
      "mutation",
      "public",
      { id: string; text: string },
      null
    >
  );
}

export function useToggleTodo() {
  return useMutation(
    "component:lib:toggle" as unknown as FunctionReference<
      "mutation",
      "public",
      { id: string },
      null
    >
  );
}

export function useRemoveTodo() {
  return useMutation(
    "component:lib:remove" as unknown as FunctionReference<
      "mutation",
      "public",
      { id: string },
      null
    >
  );
}

// Actions
export function useCreateTodoWithValidation() {
  return useAction(
    "component:lib:createWithValidation" as unknown as FunctionReference<
      "action",
      "public",
      { text: string },
      { id: string; isValid: boolean; message: string }
    >
  );
}

export type {
  ComponentOptions,
  CreateTodoData,
  Todo,
  UpdateTodoData,
} from "../client/types.js";
