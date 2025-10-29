import { typedV } from "convex-helpers/validators";
import schema from "../component/schema.js";

const vv = typedV(schema);

// Export validator for a todo ID
export const vTodoId = vv.id("todos");

// Export validator for a todo document (with system fields)
export const vTodo = vv.doc("todos");
