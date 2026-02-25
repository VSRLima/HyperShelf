import { Genre } from "@/components/shared/enums/genre";

export interface RecommendationInput {
  title: string;
  genre: Genre | string;
  link: string;
  blurb: string;
}