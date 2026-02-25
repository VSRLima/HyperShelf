import type { Doc } from "../../_generated/dataModel";
import { getUserByClerkId } from "../user/userHelpers";
import type { Role } from "../../types/role";
import { RequestCtx } from "./types/requestCtx.type";
import { RecommendationWithUser } from "./types/recommendationWithUser.type";

export function isValidHttpLink(link: string): boolean {
  try {
    const parsedUrl = new URL(link);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export function getRecommendationAccess(
  actorRole: Role | undefined,
  ownerClerkId: string | undefined,
  actorClerkId: string,
) {
  const isAdmin = actorRole === "admin";
  const isOwner = ownerClerkId === actorClerkId;
  return { isAdmin, isOwner };
}

export async function enrichRecommendationWithUser(
  ctx: RequestCtx,
  rec: Doc<"recommendations">,
): Promise<RecommendationWithUser> {
  const user = await ctx.db.get(rec.userId);

  return {
    ...rec,
    userClerkId: user?.id,
    userName: user?.name ?? "Unknown",
    userProfile: user?.user_profile,
  };
}

export async function canManageRecommendation(
  ctx: RequestCtx,
  clerkId: string,
  rec: Doc<"recommendations">,
) {
  const actor = await getUserByClerkId(ctx, clerkId);
  const owner = await ctx.db.get(rec.userId);
  return getRecommendationAccess(actor?.role, owner?.id, clerkId);
}
