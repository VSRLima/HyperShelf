export enum Genre {
  Action = "action",
  Comedy = "comedy",
  Drama = "drama",
  Horror = "horror",
  SciFi = "sci-fi",
  Thriller = "thriller",
}

export const GENRES: Genre[] = Object.values(Genre);

export function formatGenreLabel(genre: Genre): string {
  return genre.charAt(0).toUpperCase() + genre.slice(1);
}

export const GENRE_OPTIONS = GENRES.map((genre) => ({
  value: genre,
  label: formatGenreLabel(genre),
}));
