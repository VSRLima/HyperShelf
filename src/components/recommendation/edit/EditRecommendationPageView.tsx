"use client";

import { useEffect, useState } from "react";
import type { SubmitEventHandler } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import {
  GENRE_OPTIONS,
  validateRecommendationInput,
  type RecommendationValidationErrors,
} from "@/lib/recommendationValidation";
import { Genre } from "@/components/shared/enums/genre";
import styles from "@/components/recommendation/edit/EditRecommendationPageView.module.css";
import { ClientError } from "@/lib/errors/types/ClientError.type";
import { getClientErrorMessage, logClientError } from "@/lib/errors/clientError";


export function EditRecommendationPageView() {
  const params = useParams<{ recId: string }>();
  const router = useRouter();
  const recId = params.recId as Id<"recommendations">;

  const recommendation = useQuery(api.recommendations.getRecommendationById, {
    recId,
  });
  const updateRecommendation = useMutation(api.recommendations.updateRecommendation);

  const [formData, setFormData] = useState({
    title: "",
    genre: Genre.Action,
    link: "",
    blurb: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RecommendationValidationErrors>({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!recommendation) {
      return;
    }
    setFormData({
      title: recommendation.title,
      genre: recommendation.genre as Genre,
      link: recommendation.link ?? "",
      blurb: recommendation.blurb,
    });
  }, [recommendation]);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setServerError("");

    const formErrors = validateRecommendationInput(formData);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRecommendation({
        recId,
        title: formData.title,
        genre: formData.genre,
        link: formData.link || undefined,
        blurb: formData.blurb,
      });
      router.push("/dashboard");
    } catch (error) {
      const clientError = error as ClientError;
      logClientError("EditRecommendationPageView.handleSubmit", clientError, {
        recId,
      });
      setServerError(getClientErrorMessage(clientError, "Failed to update recommendation."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (recommendation === undefined) {
    return <p className="text-slate-400">Loading recommendation...</p>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Edit Recommendation</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div>
          <label className={styles.label}>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`${styles.inputBase} ${errors.title ? styles.inputError : styles.inputOk}`}
          />
          {errors.title && <p className={styles.errorText}>{errors.title}</p>}
        </div>

        <div>
          <label className={styles.label}>Genre *</label>
          <select
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value as Genre })}
            className={`${styles.inputBase} ${errors.genre ? styles.inputError : styles.inputOk}`}
          >
            {GENRE_OPTIONS.map((genre) => (
              <option key={genre.value} value={genre.value} className="capitalize">
                {genre.label}
              </option>
            ))}
          </select>
          {errors.genre && <p className={styles.errorText}>{errors.genre}</p>}
        </div>

        <div>
          <label className={styles.label}>
            Link (optional)
          </label>
          <input
            type="url"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            className={`${styles.inputBase} ${errors.link ? styles.inputError : styles.inputOk}`}
          />
          {errors.link && <p className={styles.errorText}>{errors.link}</p>}
        </div>

        <div>
          <label className={styles.label}>Short Blurb *</label>
          <textarea
            value={formData.blurb}
            onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
            rows={4}
            className={`${styles.inputBase} ${styles.textarea} ${errors.blurb ? styles.inputError : styles.inputOk}`}
          />
          {errors.blurb && <p className={styles.errorText}>{errors.blurb}</p>}
        </div>

        {serverError && (
          <p className={styles.serverError}>
            {serverError}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.primaryButton}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className={styles.secondaryButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
