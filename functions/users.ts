import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { buildUserHandlers } from "./lib/user/userHandlers";
import { roleValidator } from "./types/role";

const handlers = buildUserHandlers();

export const getUserRole = query({
  args: {},
  handler: handlers.getUserRole,
});

export const createUserIfNotExists = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    userProfile: v.optional(v.string()),
  },
  handler: handlers.createUserIfNotExists,
});

export const listUserRoles = query({
  args: {},
  handler: handlers.listUserRoles,
});

export const setUserRole = mutation({
  args: {
    targetClerkId: v.string(),
    role: roleValidator,
  },
  handler: handlers.setUserRole,
});

export const adminListUsersWithRecommendations = query({
  args: {},
  handler: handlers.adminListUsersWithRecommendations,
});

export const updateUserConfiguration = mutation({
  args: {
    targetClerkId: v.string(),
    role: roleValidator,
    name: v.optional(v.string()),
  },
  handler: handlers.updateUserConfiguration,
});
