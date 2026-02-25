import { v } from "convex/values";

export const ROLES = ["admin", "user"] as const;

export type Role = (typeof ROLES)[number];

export const roleValidator = v.union(v.literal("admin"), v.literal("user"));
