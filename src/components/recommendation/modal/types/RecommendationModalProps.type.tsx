import { RecommendationWithUser } from "@convex/lib/recommendation/types/recommendationWithUser.type";


export type RecommendationModalProps = {
  rec: RecommendationWithUser;
  onClose: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};
