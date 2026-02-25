"use client";

import { RedirectToSignIn, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const userRole = useQuery(
    api.users.getUserRole,
    isSignedIn ? {} : "skip",
  );
  const isAdmin = userRole === "admin";

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              HypeShelf
            </h1>
            <p className="text-slate-400 mt-1">Your Recommendations</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-slate-300 font-medium transition"
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="text-slate-400 hover:text-slate-300 font-medium transition"
              >
                Admin
              </Link>
            )}
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-300 font-medium transition"
            >
              ← Back to Home
            </Link>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
