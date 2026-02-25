"use client";

import { useMemo, useState } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import RecommendationCard from "@/components/recommendation/card/RecommendationCard";
import ConfirmDialog from "@/components/shared/confirm_dialog/ConfirmDialog";
import AddRecommendationForm from "@/components/recommendation/form/AddRecommendationForm";
import { useRouter } from "next/navigation";
import { GENRES } from "@/components/shared/enums/genre";
import { RecommendationWithUser } from "@convex/lib/recommendation/types/recommendationWithUser.type";


export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const PAGE_SIZE = 6;
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<RecommendationWithUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const recommendations = useQuery(
    api.recommendations.getAllRecommendations,
    isSignedIn
      ? { genre: selectedGenre === "all" ? undefined : selectedGenre }
      : "skip",
  );

  const userRole = useQuery(
    api.users.getUserRole,
    isSignedIn ? {} : "skip",
  );

  const deleteRec = useMutation(api.recommendations.deleteRecommendation);
  const markStaffPick = useMutation(api.recommendations.markStaffPick);

  const isAdmin = userRole === "admin";
  const typedRecommendations = recommendations as RecommendationWithUser[] | undefined;

  const totalPages = useMemo(() => {
    if (!typedRecommendations || typedRecommendations.length === 0) {
      return 1;
    }
    return Math.ceil(typedRecommendations.length / PAGE_SIZE);
  }, [typedRecommendations]);
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRecommendations = useMemo(() => {
    if (!typedRecommendations) {
      return [];
    }

    const start = (safePage - 1) * PAGE_SIZE;
    return typedRecommendations.slice(start, start + PAGE_SIZE);
  }, [safePage, typedRecommendations]);

  if (!isLoaded) {
    return <div className="min-h-[30vh]" />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const openDeleteConfirmation = (rec: RecommendationWithUser) => {
    setPendingDelete(rec);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRec({
        recId: pendingDelete._id as Id<"recommendations">,
      });
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkStaffPick = (recId: Id<"recommendations">) => {
    markStaffPick({
      recId,
    });
  };

  return (
    <div>
      {/* Add Recommendation Section */}
      <div className="mb-8">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          {showForm ? "Cancel" : "+ Add Recommendation"}
        </button>
        {showForm && <AddRecommendationForm onClose={() => setShowForm(false)} />}
      </div>

      {/* Filter and List */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">All Recommendations</h2>

        <div className="mb-6">
          <label className="text-white font-semibold mb-2 block">Filter by Genre:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedGenre("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedGenre === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              All
            </button>
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  setSelectedGenre(genre);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                  selectedGenre === genre
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {typedRecommendations === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-700/50 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : typedRecommendations.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400">
              No recommendations in this category yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec._id}
                  rec={rec}
                  onDelete={() => openDeleteConfirmation(rec)}
                  onEdit={() => router.push(`/dashboard/recommendations/${rec._id}/edit`)}
                  onMarkStaffPick={() => handleMarkStaffPick(rec._id)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>

            {typedRecommendations.length > PAGE_SIZE && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(safePage - 1, 1))}
                  disabled={safePage === 1}
                  className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-300">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(safePage + 1, totalPages))}
                  disabled={safePage === totalPages}
                  className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete recommendation?"
          message={`This will permanently delete "${pendingDelete.title}". This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Keep"
          isConfirming={isDeleting}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => {
            if (!isDeleting) {
              setPendingDelete(null);
            }
          }}
        />
      )}
    </div>
  );
}
