import { ensureUserForIdentity, requireAdmin, requireIdentity } from "../../user/userHelpers";
import { canManageRecommendation, enrichRecommendationWithUser, isValidHttpLink } from "../recommendationHelpers";

export type RecommendationsDeps = {
  canManageRecommendation: typeof canManageRecommendation;
  enrichRecommendationWithUser: typeof enrichRecommendationWithUser;
  ensureUserForIdentity: typeof ensureUserForIdentity;
  isValidHttpLink: typeof isValidHttpLink;
  requireAdmin: typeof requireAdmin;
  requireIdentity: typeof requireIdentity;
};