import type { Doc } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import {
  ensureUserForIdentity,
  requireAdmin,
  requireIdentity,
} from "../user/userHelpers";
import {
  canManageRecommendation,
  enrichRecommendationWithUser,
  isValidHttpLink,
} from "./recommendationHelpers";
import { RecommendationArgs } from "./types/recommendationArgs.type";
import { RecommendationsDeps } from "./types/recommendationDeps.type";
import { RequestCtx } from "./types/requestCtx.type";

const defaultDeps: RecommendationsDeps = {
  canManageRecommendation,
  enrichRecommendationWithUser,
  ensureUserForIdentity,
  isValidHttpLink,
  requireAdmin,
  requireIdentity,
};

export function buildRecommendationHandlers(deps: RecommendationsDeps = defaultDeps) {
  return {
    getLatestPublic: async (ctx: QueryCtx) => {
      const recs = await ctx.db.query("recommendations").order("desc").collect();
      return await Promise.all(
        recs.map((rec) => deps.enrichRecommendationWithUser(ctx, rec)),
      );
    },

    getAllRecommendations: async (
      ctx: QueryCtx,
      args: { genre?: string },
    ) => {
      await deps.requireIdentity(ctx);

      const genre = args.genre;
      const recs =
        genre && genre !== "all"
          ? await ctx.db
              .query("recommendations")
              .withIndex("by_genre", (queryBuilder) => queryBuilder.eq("genre", genre))
              .order("desc")
              .collect()
          : await ctx.db.query("recommendations").order("desc").collect();

      return await Promise.all(
        recs.map((rec) => deps.enrichRecommendationWithUser(ctx, rec)),
      );
    },

    addRecommendation: async (ctx: MutationCtx, args: RecommendationArgs) => {
      const user = await deps.ensureUserForIdentity(ctx);
      const link = args.link?.trim();

      if (link && !deps.isValidHttpLink(link)) {
        throw new Error("Please provide a valid http(s) link");
      }

      return await ctx.db.insert("recommendations", {
        userId: user._id,
        title: args.title.trim(),
        genre: args.genre,
        link,
        blurb: args.blurb.trim(),
        isStaffPick: false,
        createdAt: Date.now(),
      });
    },

    getRecommendationById: async (
      ctx: RequestCtx,
      args: { recId: Doc<"recommendations">["_id"] },
    ) => {
      const identity = await deps.requireIdentity(ctx);
      const rec = await ctx.db.get(args.recId);

      if (!rec) {
        throw new Error("Recommendation not found");
      }

      const { isAdmin, isOwner } = await deps.canManageRecommendation(
        ctx,
        identity.subject,
        rec,
      );
      if (!isAdmin && !isOwner) {
        throw new Error("Unauthorized");
      }

      return await deps.enrichRecommendationWithUser(ctx, rec);
    },

    updateRecommendation: async (
      ctx: MutationCtx,
      args: RecommendationArgs & { recId: Doc<"recommendations">["_id"] },
    ) => {
      const identity = await deps.requireIdentity(ctx);
      const rec = await ctx.db.get(args.recId);

      if (!rec) {
        throw new Error("Recommendation not found");
      }

      const { isAdmin, isOwner } = await deps.canManageRecommendation(
        ctx,
        identity.subject,
        rec,
      );
      if (!isAdmin && !isOwner) {
        throw new Error("Unauthorized");
      }

      const link = args.link?.trim();
      if (link && !deps.isValidHttpLink(link)) {
        throw new Error("Please provide a valid http(s) link");
      }

      await ctx.db.patch(args.recId, {
        title: args.title.trim(),
        genre: args.genre,
        link,
        blurb: args.blurb.trim(),
      });
    },

    deleteRecommendation: async (
      ctx: MutationCtx,
      args: { recId: Doc<"recommendations">["_id"] },
    ) => {
      const identity = await deps.requireIdentity(ctx);
      const rec = await ctx.db.get(args.recId);

      if (!rec) {
        throw new Error("Recommendation not found");
      }

      const { isAdmin, isOwner } = await deps.canManageRecommendation(
        ctx,
        identity.subject,
        rec,
      );
      if (!isAdmin && !isOwner) {
        throw new Error("Unauthorized");
      }

      await ctx.db.delete(args.recId);
    },

    markStaffPick: async (
      ctx: MutationCtx,
      args: { recId: Doc<"recommendations">["_id"] },
    ) => {
      await deps.requireAdmin(ctx);

      const rec = await ctx.db.get(args.recId);
      if (!rec) {
        throw new Error("Recommendation not found");
      }

      await ctx.db.patch(args.recId, {
        isStaffPick: !rec.isStaffPick,
      });
    },
  };
}
