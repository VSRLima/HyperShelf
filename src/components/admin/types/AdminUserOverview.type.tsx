import { Role } from "@convex/types/role";
import { AdminRecommendationSummary } from "./AdminRecommendationSummary.type";

export type AdminUserOverview = {
  _id: string;
  id: string;
  name: string;
  user_profile?: string;
  role: Role;
  recommendationCount: number;
  recommendations: AdminRecommendationSummary[];
};