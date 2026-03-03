import { query } from "./_generated/server";

export const listAllFacilities = query({
  args: {},
  handler: async (ctx) => {
    const facilities = await ctx.db.query("facilities").collect();
    return facilities;
  },
});

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    // Remove passwords for safety
    return users.map(({ password, ...user }) => user);
  },
});
