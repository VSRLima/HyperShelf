"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import styles from "@/components/admin/AdminPageView.module.css";
import { AdminUserOverview } from "./types/AdminUserOverview.type";
import { ClientError } from "@/lib/errors/types/ClientError.type";
import { getClientSafeErrorMessage, logClientError } from "@/lib/errors/clientError";
import { Role } from "@convex/types/role";


export function AdminPageView() {
  const PAGE_SIZE = 5;
  const userRole = useQuery(api.users.getUserRole, {});
  const users = useQuery(
    api.users.adminListUsersWithRecommendations,
    userRole === "admin" ? {} : "skip",
  ) as AdminUserOverview[] | undefined;
  const updateUserConfiguration = useMutation(api.users.updateUserConfiguration);

  const [drafts, setDrafts] = useState<Record<string, { name: string; role: Role }>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openRecommendationsByUser, setOpenRecommendationsByUser] = useState<Record<string, boolean>>({});

  const totalPages = useMemo(() => {
    if (!users || users.length === 0) {
      return 1;
    }

    return Math.ceil(users.length / PAGE_SIZE);
  }, [users]);
  const safePage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    if (!users) {
      return [];
    }

    const start = (safePage - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [safePage, users]);

  const getDraft = (user: AdminUserOverview) => {
    return drafts[user.id] ?? { name: user.name, role: user.role };
  };

  const updateDraft = (
    user: AdminUserOverview,
    values: { name?: string; role?: Role },
  ) => {
    setDrafts((prev) => {
      const current = prev[user.id] ?? { name: user.name, role: user.role };
      return {
        ...prev,
        [user.id]: {
          name: values.name ?? current.name,
          role: values.role ?? current.role,
        },
      };
    });
  };

  const handleSaveUser = async (user: AdminUserOverview) => {
    const draft = getDraft(user);

    setMessage("");
    setError("");
    setSavingUserId(user.id);

    try {
      await updateUserConfiguration({
        targetClerkId: user.id,
        role: draft.role,
        name: draft.name,
      });
      setMessage(`Updated ${user.name}.`);
    } catch (err) {
      const clientError = err as ClientError;
      logClientError("AdminPageView.handleSaveUser", clientError, {
        targetClerkId: user.id,
        role: draft.role,
      });
      setError(
        getClientSafeErrorMessage(
          clientError,
          "We couldn't save this user configuration. Please try again.",
        ),
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const isRecommendationsOpen = (user: AdminUserOverview) =>
    openRecommendationsByUser[user.id] ?? false;

  const toggleRecommendations = (user: AdminUserOverview) => {
    setOpenRecommendationsByUser((prev) => ({
      ...prev,
      [user.id]: !(prev[user.id] ?? false),
    }));
  };

  if (userRole === undefined) {
    return <p className={styles.loading}>Checking permissions...</p>;
  }

  if (userRole !== "admin") {
    return (
      <div className={styles.accessDenied}>
        Admin access required.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div>
        <h2 className={styles.title}>Admin Console</h2>
        <p className={styles.subtitle}>
          Manage users and review everything they have already recommended.
        </p>
      </div>

      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {users === undefined ? (
        <p className={styles.loading}>Loading users...</p>
      ) : users.length === 0 ? (
        <p className={styles.loading}>No users found.</p>
      ) : (
        <>
          <div className={styles.userGrid}>
            {paginatedUsers.map((user) => {
              const draft = getDraft(user);
              const hasChanges = draft.name !== user.name || draft.role !== user.role;

              return (
                <section key={user._id} className={styles.userCard}>
                  <header className={styles.userHeader}>
                    <div className={styles.userIdentity}>
                      {user.user_profile ? (
                        <Image
                          src={user.user_profile}
                          alt={user.name}
                          width={40}
                          height={40}
                          className={styles.avatar}
                        />
                      ) : (
                        <div className={styles.avatarFallback}>{user.name.charAt(0).toUpperCase()}</div>
                      )}
                      <div>
                        <h3 className={styles.userName}>{user.name}</h3>
                      </div>
                    </div>

                    <span className={styles.countBadge}>
                      {user.recommendationCount} recommendation{user.recommendationCount === 1 ? "" : "s"}
                    </span>
                  </header>

                  <div className={styles.configSection}>
                    <h4 className={styles.sectionTitle}>Configuration</h4>
                    <div className={styles.configGrid}>
                      <div>
                        <label className={styles.label}>Name</label>
                        <input
                          type="text"
                          className={styles.inputBase}
                          value={draft.name}
                          onChange={(e) => updateDraft(user, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={styles.label}>Role</label>
                        <select
                          className={styles.inputBase}
                          value={draft.role}
                          onChange={(e) => updateDraft(user, { role: e.target.value as Role })}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={() => handleSaveUser(user)}
                      disabled={!hasChanges || savingUserId === user.id}
                    >
                      {savingUserId === user.id ? "Saving..." : "Save Changes"}
                    </button>
                  </div>

                  <div className={styles.recommendationsSection}>
                    <button
                      type="button"
                      className={styles.recommendationsToggle}
                      onClick={() => toggleRecommendations(user)}
                      aria-expanded={isRecommendationsOpen(user)}
                    >
                      <span className={styles.sectionTitle}>Created Recommendations</span>
                      <span className={styles.toggleText}>
                        {isRecommendationsOpen(user) ? "Hide" : "Show"}
                      </span>
                    </button>

                    {isRecommendationsOpen(user) && (
                      <>
                        {user.recommendations.length === 0 ? (
                          <p className={styles.emptyState}>No recommendations yet.</p>
                        ) : (
                          <ul className={styles.recommendationList}>
                            {user.recommendations.map((rec) => (
                              <li key={rec._id} className={styles.recommendationItem}>
                                <div>
                                  <p className={styles.recTitle}>{rec.title}</p>
                                  <p className={styles.recMeta}>
                                    {rec.genre} · {new Date(rec.createdAt).toLocaleDateString()}
                                    {rec.isStaffPick ? " · Staff Pick" : ""}
                                  </p>
                                </div>
                                <Link
                                  href={`/dashboard/recommendations/${rec._id}/edit`}
                                  className={styles.recLink}
                                >
                                  Edit
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {users.length > PAGE_SIZE && (
            <div className={styles.paginationRow}>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(safePage - 1, 1))}
                disabled={safePage === 1}
                className={styles.paginationButton}
              >
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(safePage + 1, totalPages))}
                disabled={safePage === totalPages}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
