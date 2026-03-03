// convex/payments/test.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const test = mutation({
  args: {},
  handler: async () => {
    return { message: "Payment functions are working!" };
  },
});
