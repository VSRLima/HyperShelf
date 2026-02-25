"use client";

import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import RecommendationCard from "@/components/recommendation/card/RecommendationCard";
import type { RecommendationWithUser } from "@/components/recommendation/types/RecommendationWithUser.type";

export const dynamic = "force-dynamic";

export default function Home() {
  const PAGE_SIZE = 6;
  const { user, isLoaded } = useUser();
  const recommendations = useQuery(api.recommendations.getLatestPublic) as
    | RecommendationWithUser[]
    | undefined;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    if (!recommendations || recommendations.length === 0) {
      return 1;
    }
    return Math.ceil(recommendations.length / PAGE_SIZE);
  }, [recommendations]);

  const safePage = Math.min(currentPage, totalPages);

  const paginatedRecommendations = useMemo(() => {
    if (!recommendations) {
      return [];
    }

    const start = (safePage - 1) * PAGE_SIZE;
    return recommendations.slice(start, start + PAGE_SIZE);
  }, [recommendations, safePage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              HypeShelf
            </h1>
            <p className="text-slate-400 mt-1">
              Collect and share the stuff you&apos;re hyped about
            </p>
          </div>
          <div>
            {isLoaded && !user && (
              <Link
                href="/sign-in"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Sign in to add yours
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Latest Recommendations
          </h2>

          {recommendations === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-700/50 rounded-lg h-64 animate-pulse"
                />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">
                No recommendations yet. Be the first to add one!
              </p>
              {user && (
                <Link
                  href="/dashboard"
                  className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Add a Recommendation
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedRecommendations.map((rec) => (
                  <RecommendationCard key={rec._id} rec={rec} isPublic />
                ))}
              </div>

              {recommendations.length > PAGE_SIZE && (
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
      </main>
    </div>

  );
}
