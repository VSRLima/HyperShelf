import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import {
  buildProfilePatch,
  getUserByClerkId,
  getUserRoleByClerkId,
  requireAdmin,
} from "./userHelpers";
import { RequestCtx } from "../recommendation/types/requestCtx.type";
import { UserHandlersDeps } from "./types/userHandlersDeps.type";

const defaultDeps: UserHandlersDeps = {
  buildProfilePatch,
  getUserByClerkId,
  getUserRoleByClerkId,
  requireAdmin,
};

export function buildUserHandlers(deps: UserHandlersDeps = defaultDeps) {
  return {
    getUserRole: async (ctx: QueryCtx) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return "user";
      }
      return await deps.getUserRoleByClerkId(ctx, identity.subject);
    },

    createUserIfNotExists: async (
      ctx: MutationCtx,
      args: {
        userId: string;
        name?: string;
        userProfile?: string;
      },
    ) => {
      const existingUser = await deps.getUserByClerkId(ctx, args.userId);

      if (!existingUser) {
        await ctx.db.insert("users", {
          id: args.userId,
          name: args.name?.trim() || "Anonymous",
          user_profile: args.userProfile,
          role: "user",
        });
        return;
      }

      const patch = deps.buildProfilePatch(existingUser, args);
      if (patch) {
        await ctx.db.patch(existingUser._id, patch);
      }
    },

    listUserRoles: async (ctx: RequestCtx) => {
      await deps.requireAdmin(ctx);
      return await ctx.db.query("users").order("desc").collect();
    },

    setUserRole: async (
      ctx: MutationCtx,
      args: {
        targetClerkId: string;
        role: "admin" | "user";
      },
    ) => {
      const identity = await deps.requireAdmin(ctx);
      const existingUser = await deps.getUserByClerkId(ctx, args.targetClerkId);

      if (identity.subject === args.targetClerkId && args.role !== "admin") {
        throw new ConvexError({ code: "CANNOT_DEMOTE_SELF" });
      }

      if (existingUser) {
        await ctx.db.patch(existingUser._id, {
          role: args.role,
        });
        return existingUser._id;
      }

      return await ctx.db.insert("users", {
        id: args.targetClerkId,
        name: "Unknown user",
        user_profile: undefined,
        role: args.role,
      });
    },

    adminListUsersWithRecommendations: async (ctx: RequestCtx) => {
      await deps.requireAdmin(ctx);

      const users = await ctx.db.query("users").collect();
      const usersWithRecommendations = await Promise.all(
        users.map(async (user) => {
          const recommendations = await ctx.db
            .query("recommendations")
            .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", user._id))
            .order("desc")
            .collect();

          return {
            ...user,
            recommendationCount: recommendations.length,
            recommendations: recommendations.map((rec) => ({
              _id: rec._id,
              title: rec.title,
              genre: rec.genre,
              createdAt: rec.createdAt,
              isStaffPick: rec.isStaffPick,
            })),
          };
        }),
      );

      return usersWithRecommendations.sort(
        (a, b) => b.recommendationCount - a.recommendationCount,
      );
    },

    updateUserConfiguration: async (
      ctx: MutationCtx,
      args: {
        targetClerkId: string;
        role: "admin" | "user";
        name?: string;
      },
    ) => {
      const identity = await deps.requireAdmin(ctx);
      const existingUser = await deps.getUserByClerkId(ctx, args.targetClerkId);

      if (!existingUser) {
        throw new ConvexError({ code: "USER_NOT_FOUND" });
      }

      if (identity.subject === args.targetClerkId && args.role !== "admin") {
        throw new ConvexError({ code: "CANNOT_DEMOTE_SELF" });
      }

      const nextName = args.name?.trim();
      if (nextName !== undefined && nextName.length === 0) {
        throw new ConvexError({ code: "INVALID_NAME" });
      }

      await ctx.db.patch(existingUser._id, {
        role: args.role,
        ...(nextName !== undefined ? { name: nextName } : {}),
      });

      return existingUser._id;
    },
  };
}
