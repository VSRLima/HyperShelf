import { RecommendationInput } from "@/components/recommendation/types/RecommendationInput.type";
import { GENRES, GENRE_OPTIONS } from "../components/shared/enums/genre";
import type { Genre } from "../components/shared/enums/genre";
import { isValidHttpUrl } from "./validators/url";
import { RecommendationValidationErrors } from "@/components/recommendation/types/RecommendationValidationErrors.type";


export function validateRecommendationInput(
  input: RecommendationInput,
): RecommendationValidationErrors {
  const errors: RecommendationValidationErrors = {};

  if (!input.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!GENRES.includes(input.genre as Genre)) {
    errors.genre = "Select a valid genre.";
  }

  const link = input.link.trim();
  if (link && !isValidHttpUrl(link)) {
    errors.link = "Use a valid link starting with http:// or https://";
  }

  if (!input.blurb.trim()) {
    errors.blurb = "Short blurb is required.";
  } else if (input.blurb.trim().length < 10) {
    errors.blurb = "Please add at least 10 characters.";
  }

  return errors;
}

export type { RecommendationInput, RecommendationValidationErrors };
export { GENRES, GENRE_OPTIONS };
