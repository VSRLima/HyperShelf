"use client";

import { useEffect } from "react";
import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import styles from "./RecommendationModal.module.css";
import { RecommendationModalProps } from "./types/RecommendationModalProps.type";

export default function RecommendationModal({
  rec,
  onClose,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: RecommendationModalProps) {
  const createdAt = new Date(rec.createdAt).toLocaleString();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`${rec.title} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.titleWrap}>
            <h3 className={styles.modalTitle}>{rec.title}</h3>
            {rec.link && (
              <a
                href={rec.link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkIconButton}
                aria-label="Open link in a new tab"
                title="Open link in a new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <div className={styles.headerActions}>
            {canDelete && onDelete && (
              <button
                className={`${styles.iconButton} ${styles.deleteIconButton}`}
                onClick={() => {
                  onDelete();
                }}
                aria-label="Delete recommendation"
                title="Delete recommendation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {canEdit && onEdit && (
              <button
                className={`${styles.iconButton} ${styles.editIconButton}`}
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                aria-label="Edit recommendation"
                title="Edit recommendation"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className={styles.modalClose}>
              Close
            </button>
          </div>
        </div>

        <div className={styles.modalMeta}>
          <span className={styles.genreBadge}>{rec.genre}</span>
          {rec.isStaffPick && (
            <span className={styles.modalStaffPick}>
              <Star className="w-3 h-3" /> Staff Pick
            </span>
          )}
        </div>

        <p className={styles.modalBlurb}>{rec.blurb}</p>

        <div className={styles.modalFooter}>
          <p className={styles.modalAuthor}>
            By <span className={styles.authorName}>{rec.userName}</span>
          </p>
          <p className={styles.modalDate}>Added {createdAt}</p>
        </div>
      </div>
    </div>
  );
}
