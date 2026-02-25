import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { buildRecommendationHandlers } from "./lib/recommendation/recommendationHandlers";

const handlers = buildRecommendationHandlers();

export const getLatestPublic = query({
  args: {},
  handler: handlers.getLatestPublic,
});

export const getAllRecommendations = query({
  args: {
    genre: v.optional(v.string()),
  },
  handler: handlers.getAllRecommendations,
});

export const addRecommendation = mutation({
  args: {
    title: v.string(),
    genre: v.string(),
    link: v.optional(v.string()),
    blurb: v.string(),
  },
  handler: handlers.addRecommendation,
});

export const getRecommendationById = query({
  args: {
    recId: v.id("recommendations"),
  },
  handler: handlers.getRecommendationById,
});

export const updateRecommendation = mutation({
  args: {
    recId: v.id("recommendations"),
    title: v.string(),
    genre: v.string(),
    link: v.optional(v.string()),
    blurb: v.string(),
  },
  handler: handlers.updateRecommendation,
});

export const deleteRecommendation = mutation({
  args: {
    recId: v.id("recommendations"),
  },
  handler: handlers.deleteRecommendation,
});

export const markStaffPick = mutation({
  args: {
    recId: v.id("recommendations"),
  },
  handler: handlers.markStaffPick,
});
