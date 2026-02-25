import { Doc } from "@convex/_generated/dataModel";

export type RecommendationWithUser = Doc<"recommendations"> & {
  userClerkId?: string;
  userName: string;
  userProfile?: string;
};
