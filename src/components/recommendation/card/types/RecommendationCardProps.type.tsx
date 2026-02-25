import { RecommendationWithUser } from "@convex/lib/recommendation/types/recommendationWithUser.type";


export type RecommendationCardProps = {
  rec: RecommendationWithUser;
  isPublic?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onMarkStaffPick?: () => void;
  isAdmin?: boolean;
};