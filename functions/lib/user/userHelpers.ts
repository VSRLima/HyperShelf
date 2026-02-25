import type { Doc } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import type { Role } from "../../types/role";
import { RequestCtx } from "../recommendation/types/requestCtx.type";
import { Identity } from "./types/identity.type";
import { UserProfileUpdateArgs } from "./types/userProfileUpdateArgs.type";

export function buildProfilePatch(
  existingUser: Doc<"users">,
  args: UserProfileUpdateArgs,
): Partial<Pick<Doc<"users">, "name" | "user_profile">> | null {
  const nextName = args.name?.trim();
  const shouldPatchName = Boolean(nextName) && nextName !== existingUser.name;
  const shouldPatchProfile = args.userProfile !== undefined;

  if (!shouldPatchName && !shouldPatchProfile) {
    return null;
  }

  return {
    ...(shouldPatchName ? { name: nextName } : {}),
    ...(shouldPatchProfile ? { user_profile: args.userProfile } : {}),
  };
}

export async function requireIdentity(ctx: RequestCtx): Promise<Identity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}

export async function getUserByClerkId(
  ctx: RequestCtx,
  clerkId: string,
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_user_id", (queryBuilder) => queryBuilder.eq("id", clerkId))
    .first();
}

export async function getUserRoleByClerkId(
  ctx: RequestCtx,
  clerkId: string,
): Promise<Role> {
  const user = await getUserByClerkId(ctx, clerkId);
  return user?.role ?? "user";
}

export async function requireAdmin(ctx: RequestCtx): Promise<Identity> {
  const identity = await requireIdentity(ctx);
  const role = await getUserRoleByClerkId(ctx, identity.subject);

  if (role !== "admin") {
    throw new Error("Only admins can perform this action");
  }

  return identity;
}

export async function ensureUserForIdentity(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await requireIdentity(ctx);
  const existing = await getUserByClerkId(ctx, identity.subject);

  if (existing) {
    return existing;
  }

  const userId = await ctx.db.insert("users", {
    id: identity.subject,
    name: identity.name || "Anonymous",
    user_profile: identity.pictureUrl,
    role: "user",
  });

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}
