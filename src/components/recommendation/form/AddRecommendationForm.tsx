"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import type { SubmitEventHandler } from "react";
import { CircleHelp } from "lucide-react";
import {
  GENRE_OPTIONS,
  validateRecommendationInput,
} from "@/lib/recommendationValidation";
import { Genre } from "@/components/shared/enums/genre";
import styles from "@/components/recommendation/form/AddRecommendationForm.module.css";
import { AddRecommendationFormProps } from "./types/AddRecommendationFormProps.type";
import { RecommendationValidationErrors } from "../types/RecommendationValidationErrors.type";
import { ClientError } from "@/lib/errors/types/ClientError.type";
import { getClientErrorMessage, logClientError } from "@/lib/errors/clientError";


export default function AddRecommendationForm({ onClose }: AddRecommendationFormProps) {
  const addRec = useMutation(api.recommendations.addRecommendation);

  const [formData, setFormData] = useState({
    title: "",
    genre: Genre.Action,
    link: "",
    blurb: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RecommendationValidationErrors>({});
  const [touched, setTouched] = useState<Record<keyof RecommendationValidationErrors, boolean>>({
    title: false,
    genre: false,
    link: false,
    blurb: false,
  });
  const [serverError, setServerError] = useState("");

  const validateSingleField = (
    field: keyof RecommendationValidationErrors,
    data = formData,
  ) => {
    const nextError = validateRecommendationInput(data)[field];
    setErrors((prev) => ({
      ...prev,
      [field]: nextError,
    }));
  };

  const markTouched = (field: keyof RecommendationValidationErrors) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleFieldBlur = (field: keyof RecommendationValidationErrors) => {
    markTouched(field);
    validateSingleField(field);
  };

  const updateField = (
    field: keyof typeof formData,
    value: string,
  ) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    if (touched[field]) {
      validateSingleField(field, nextData);
    }
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setServerError("");
    setTouched({
      title: true,
      genre: true,
      link: true,
      blurb: true,
    });

    const formErrors = validateRecommendationInput(formData);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addRec({
        title: formData.title,
        genre: formData.genre,
        link: formData.link || undefined,
        blurb: formData.blurb,
      });

      setFormData({ title: "", genre: Genre.Action, link: "", blurb: "" });
      setErrors({});
      setTouched({
        title: false,
        genre: false,
        link: false,
        blurb: false,
      });
      onClose();
    } catch (error) {
      const clientError = error as ClientError;
      logClientError("AddRecommendationForm.handleSubmit", clientError);
      setServerError(
        getClientErrorMessage(
          clientError,
          "Failed to add recommendation. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.stack}>
        <div>
          <label className={styles.label}>
            Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            onBlur={() => handleFieldBlur("title")}
            placeholder="e.g., Inception, Dune"
            className={`${styles.inputBase} ${errors.title ? styles.inputError : styles.inputOk}`}
          />
          {errors.title && <p className={styles.errorText}>{errors.title}</p>}
        </div>

        <div>
          <label className={styles.label}>
            Genre *
          </label>
          <select
            value={formData.genre}
            onChange={(e) => updateField("genre", e.target.value as Genre)}
            onBlur={() => handleFieldBlur("genre")}
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
            onChange={(e) => updateField("link", e.target.value)}
            onBlur={() => handleFieldBlur("link")}
            placeholder="https://..."
            className={`${styles.inputBase} ${errors.link ? styles.inputError : styles.inputOk}`}
          />
          {errors.link && <p className={styles.errorText}>{errors.link}</p>}
        </div>

        <div>
          <label className={styles.labelWithHelp}>
            <span>Short Blurb *</span>
            <span className={`${styles.helpWrap} group`}>
              <CircleHelp className={styles.helpIcon} />
              <span className={styles.helpTooltip}>
                Share why you recommend it in 1-2 sentences. Mention what stood
                out and who might enjoy it.
              </span>
            </span>
          </label>
          <textarea
            required
            value={formData.blurb}
            onChange={(e) => updateField("blurb", e.target.value)}
            onBlur={() => handleFieldBlur("blurb")}
            placeholder="Why you loved it..."
            rows={3}
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
            {isSubmitting ? "Adding..." : "Add Recommendation"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={styles.secondaryButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
