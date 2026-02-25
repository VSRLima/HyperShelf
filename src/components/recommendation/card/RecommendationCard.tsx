"use client";

import { useState } from "react";
import { Star, Trash2, Link as LinkIcon, Pencil } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import RecommendationModal from "@/components/recommendation/modal/RecommendationModal";
import styles from "./RecommendationCard.module.css";
import { RecommendationCardProps } from "./types/RecommendationCardProps.type";

export default function RecommendationCard({
  rec,
  isPublic = false,
  onDelete,
  onEdit,
  onMarkStaffPick,
  isAdmin = false,
}: RecommendationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const isOwner = user?.id === rec.userClerkId;
  const canDelete = isAdmin || isOwner;
  const canEdit = canDelete;

  return (
    <>
      <div
        className={styles.card}
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
      {rec.isStaffPick && (
        <div className={styles.staffPickBadge}>
          <Star className="w-3 h-3" /> Staff Pick
        </div>
      )}

      <div className={styles.content}>
        <h3 className={styles.title}>
          {rec.title}
        </h3>
        <p className={styles.genreWrap}>
          <span className={styles.genreBadge}>
            {rec.genre}
          </span>
        </p>
        <p className={styles.blurb}>{rec.blurb}</p>

        {!isPublic && (
          <p className={styles.author}>
            By <span className={styles.authorName}>{rec.userName}</span>
          </p>
        )}

        {rec.link && (
          <a
            href={rec.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon className="w-3 h-3" /> View
          </a>
        )}
      </div>

      {!isPublic && (
        <div className={styles.actions}>
          {canDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={styles.deleteButton}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          {canEdit && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className={styles.editButton}
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
          {isAdmin && onMarkStaffPick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkStaffPick();
              }}
              className={styles.staffPickButton}
            >
              <Star className="w-4 h-4" />
              {rec.isStaffPick ? "Remove Pick" : "Staff Pick"}
            </button>
          )}
        </div>
      )}
      </div>

      {isModalOpen && (
        <RecommendationModal
          rec={rec}
          onClose={() => setIsModalOpen(false)}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
