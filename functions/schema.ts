import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { roleValidator } from "./types/role";

export default defineSchema({
  users: defineTable({
    id: v.string(),
    name: v.string(),
    user_profile: v.optional(v.string()),
    role: roleValidator,
  })
    .index("by_user_id", ["id"])
    .index("by_role", ["role"]),

  recommendations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    genre: v.string(),
    link: v.optional(v.string()),
    blurb: v.string(),
    isStaffPick: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_genre", ["genre"])
    .index("by_created", ["createdAt"]),
});
