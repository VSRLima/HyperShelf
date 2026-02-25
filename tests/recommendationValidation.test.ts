import test from "node:test";
import assert from "node:assert/strict";
import { Genre } from "../src/components/shared/enums/genre";
import { validateRecommendationInput } from "../src/lib/recommendationValidation";

test("returns required-field errors for empty title/genre/blurb", () => {
  const errors = validateRecommendationInput({
    title: "   ",
    genre: "unknown",
    link: "",
    blurb: "   ",
  });

  assert.deepEqual(errors, {
    title: "Title is required.",
    genre: "Select a valid genre.",
    blurb: "Short blurb is required.",
  });
});

test("returns a link error only when a non-empty invalid URL is provided", () => {
  const errors = validateRecommendationInput({
    title: "Good title",
    genre: Genre.Action,
    link: "invalid-url",
    blurb: "This blurb is definitely long enough.",
  });

  assert.equal(errors.link, "Use a valid link starting with http:// or https://");
});

test("accepts a blank link and valid required fields", () => {
  const errors = validateRecommendationInput({
    title: "  Interstellar  ",
    genre: Genre.SciFi,
    link: "   ",
    blurb: "  Great pacing and visuals.  ",
  });

  assert.deepEqual(errors, {});
});

test("requires at least 10 non-whitespace blurb characters", () => {
  const errors = validateRecommendationInput({
    title: "Movie",
    genre: Genre.Drama,
    link: "https://example.com",
    blurb: "Too short",
  });

  assert.equal(errors.blurb, "Please add at least 10 characters.");
});
