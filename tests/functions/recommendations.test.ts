import test from "node:test";
import assert from "node:assert/strict";
import { buildRecommendationHandlers } from "../../functions/lib/recommendation/recommendationHandlers";
import type { Doc } from "../../functions/_generated/dataModel";

function makeRecommendation(
  overrides: Partial<Doc<"recommendations">> = {},
): Doc<"recommendations"> {
  return {
    _id: "rec_1" as Doc<"recommendations">["_id"],
    _creationTime: Date.now(),
    userId: "user_doc_1" as Doc<"recommendations">["userId"],
    title: "Original",
    genre: "fantasy",
    link: "https://example.com/original",
    blurb: "Original blurb",
    isStaffPick: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    canManageRecommendation: async () => ({ isAdmin: false, isOwner: false }),
    enrichRecommendationWithUser: async (_ctx: unknown, rec: Doc<"recommendations">) => ({
      ...rec,
      userName: "User",
      userClerkId: "clerk_1",
      userProfile: "https://example.com/u.png",
    }),
    ensureUserForIdentity: async () => ({ _id: "user_doc_1" as Doc<"users">["_id"] }),
    isValidHttpLink: () => true,
    requireAdmin: async () => ({ subject: "admin" }),
    requireIdentity: async () => ({ subject: "clerk_1" }),
    ...overrides,
  };
}

test("getLatestPublic returns enriched recommendations in descending order", async () => {
  const recs = [makeRecommendation({ _id: "rec_1" as Doc<"recommendations">["_id"] }), makeRecommendation({ _id: "rec_2" as Doc<"recommendations">["_id"] })];
  let orderArg: string | undefined;
  let collectCalled = false;

  const deps = makeDeps({
    enrichRecommendationWithUser: async (_ctx: unknown, rec: Doc<"recommendations">) => ({
      ...rec,
      userName: `name-${rec._id}`,
    }),
  });
  const handlers = buildRecommendationHandlers(deps as never);

  const ctx = {
    db: {
      query: (tableName: string) => {
        assert.equal(tableName, "recommendations");
        return {
          order: (direction: string) => {
            orderArg = direction;
            return {
              collect: async () => {
                collectCalled = true;
                return recs;
              },
            };
          },
        };
      },
    },
  };

  const result = await handlers.getLatestPublic(ctx as never);
  assert.equal(orderArg, "desc");
  assert.equal(collectCalled, true);
  assert.equal(result.length, 2);
  assert.equal(result[0].userName, "name-rec_1");
});

test("getAllRecommendations throws when unauthenticated", async () => {
  const handlers = buildRecommendationHandlers(
    makeDeps({ requireIdentity: async () => {
      throw new Error("Unauthorized");
    } }) as never,
  );

  await assert.rejects(
    () => handlers.getAllRecommendations({} as never, {}),
    /Unauthorized/,
  );
});

test("getAllRecommendations uses by_genre index when genre filter is provided", async () => {
  const recs = [makeRecommendation()];
  let indexName: string | undefined;
  let eqField: string | undefined;
  let eqValue: string | undefined;
  let orderArg: string | undefined;

  const handlers = buildRecommendationHandlers(makeDeps() as never);
  const ctx = {
    db: {
      query: (tableName: string) => {
        assert.equal(tableName, "recommendations");
        return {
          withIndex: (
            receivedIndex: string,
            callback: (builder: { eq: (field: string, value: string) => void }) => void,
          ) => {
            indexName = receivedIndex;
            callback({
              eq: (field: string, value: string) => {
                eqField = field;
                eqValue = value;
              },
            });
            return {
              order: (direction: string) => {
                orderArg = direction;
                return {
                  collect: async () => recs,
                };
              },
            };
          },
        };
      },
    },
  };

  const result = await handlers.getAllRecommendations(ctx as never, { genre: "fantasy" });

  assert.equal(indexName, "by_genre");
  assert.equal(eqField, "genre");
  assert.equal(eqValue, "fantasy");
  assert.equal(orderArg, "desc");
  assert.equal(result.length, 1);
});

test("getAllRecommendations uses full list branch for all/undefined genre", async () => {
  const recs = [makeRecommendation({ _id: "rec_full" as Doc<"recommendations">["_id"] })];
  let collectCalls = 0;

  const handlers = buildRecommendationHandlers(makeDeps() as never);
  const ctx = {
    db: {
      query: () => ({
        order: () => ({
          collect: async () => {
            collectCalls += 1;
            return recs;
          },
        }),
      }),
    },
  };

  const allResult = await handlers.getAllRecommendations(ctx as never, { genre: "all" });
  const undefinedResult = await handlers.getAllRecommendations(ctx as never, {});

  assert.equal(collectCalls, 2);
  assert.equal(allResult.length, 1);
  assert.equal(undefinedResult.length, 1);
});

test("addRecommendation rejects invalid link", async () => {
  let insertCalled = false;

  const handlers = buildRecommendationHandlers(
    makeDeps({ isValidHttpLink: () => false }) as never,
  );
  const ctx = {
    db: {
      insert: async () => {
        insertCalled = true;
        return "id";
      },
    },
  };

  await assert.rejects(
    () =>
      handlers.addRecommendation(ctx as never, {
        title: "Title",
        genre: "fantasy",
        link: "bad-link",
        blurb: "Blurb",
      }),
    /Please provide a valid http\(s\) link/,
  );

  assert.equal(insertCalled, false);
});

test("addRecommendation inserts trimmed payload for valid input", async () => {
  let insertedTable: string | undefined;
  let insertedPayload: Record<string, unknown> | undefined;
  const originalNow = Date.now;
  Date.now = () => 123456;

  try {
    const handlers = buildRecommendationHandlers(makeDeps() as never);
    const ctx = {
      db: {
        insert: async (table: string, payload: Record<string, unknown>) => {
          insertedTable = table;
          insertedPayload = payload;
          return "rec_created";
        },
      },
    };

    const result = await handlers.addRecommendation(ctx as never, {
      title: "  New Title  ",
      genre: "mystery",
      link: "  https://example.com/new  ",
      blurb: "  New blurb  ",
    });

    assert.equal(result, "rec_created");
    assert.equal(insertedTable, "recommendations");
    assert.deepEqual(insertedPayload, {
      userId: "user_doc_1",
      title: "New Title",
      genre: "mystery",
      link: "https://example.com/new",
      blurb: "New blurb",
      isStaffPick: false,
      createdAt: 123456,
    });
  } finally {
    Date.now = originalNow;
  }
});

test("getRecommendationById throws when recommendation is missing", async () => {
  const handlers = buildRecommendationHandlers(makeDeps() as never);
  const ctx = {
    db: {
      get: async () => null,
    },
  };

  await assert.rejects(
    () => handlers.getRecommendationById(ctx as never, { recId: "rec_missing" as never }),
    /Recommendation not found/,
  );
});

test("getRecommendationById throws when actor cannot manage", async () => {
  const rec = makeRecommendation();
  const handlers = buildRecommendationHandlers(
    makeDeps({ canManageRecommendation: async () => ({ isAdmin: false, isOwner: false }) }) as never,
  );
  const ctx = {
    db: {
      get: async () => rec,
    },
  };

  await assert.rejects(
    () => handlers.getRecommendationById(ctx as never, { recId: rec._id }),
    /Unauthorized/,
  );
});

test("getRecommendationById returns enriched recommendation when authorized", async () => {
  const rec = makeRecommendation();
  const enriched = { ...rec, userName: "Owner", userClerkId: "clerk_owner" };

  const handlers = buildRecommendationHandlers(
    makeDeps({
      canManageRecommendation: async () => ({ isAdmin: true, isOwner: false }),
      enrichRecommendationWithUser: async () => enriched,
    }) as never,
  );
  const ctx = {
    db: {
      get: async () => rec,
    },
  };

  const result = await handlers.getRecommendationById(ctx as never, { recId: rec._id });
  assert.equal(result, enriched);
});

test("updateRecommendation throws when recommendation is missing", async () => {
  const handlers = buildRecommendationHandlers(makeDeps() as never);
  const ctx = {
    db: {
      get: async () => null,
      patch: async () => undefined,
    },
  };

  await assert.rejects(
    () =>
      handlers.updateRecommendation(ctx as never, {
        recId: "rec_missing" as never,
        title: "Title",
        genre: "genre",
        link: "https://example.com",
        blurb: "Blurb",
      }),
    /Recommendation not found/,
  );
});

test("updateRecommendation throws when actor is unauthorized", async () => {
  const rec = makeRecommendation();
  const handlers = buildRecommendationHandlers(
    makeDeps({ canManageRecommendation: async () => ({ isAdmin: false, isOwner: false }) }) as never,
  );
  const ctx = {
    db: {
      get: async () => rec,
      patch: async () => undefined,
    },
  };

  await assert.rejects(
    () =>
      handlers.updateRecommendation(ctx as never, {
        recId: rec._id,
        title: "Title",
        genre: "genre",
        link: "https://example.com",
        blurb: "Blurb",
      }),
    /Unauthorized/,
  );
});

test("updateRecommendation rejects invalid trimmed link", async () => {
  const rec = makeRecommendation();
  let patchCalled = false;

  const handlers = buildRecommendationHandlers(
    makeDeps({
      canManageRecommendation: async () => ({ isAdmin: true, isOwner: false }),
      isValidHttpLink: () => false,
    }) as never,
  );
  const ctx = {
    db: {
      get: async () => rec,
      patch: async () => {
        patchCalled = true;
      },
    },
  };

  await assert.rejects(
    () =>
      handlers.updateRecommendation(ctx as never, {
        recId: rec._id,
        title: "Title",
        genre: "genre",
        link: " bad-link ",
        blurb: "Blurb",
      }),
    /Please provide a valid http\(s\) link/,
  );

  assert.equal(patchCalled, false);
});

test("updateRecommendation patches trimmed fields when authorized", async () => {
  const rec = makeRecommendation();
  let patchedId: Doc<"recommendations">["_id"] | undefined;
  let patchPayload: Record<string, unknown> | undefined;

  const handlers = buildRecommendationHandlers(
    makeDeps({ canManageRecommendation: async () => ({ isAdmin: false, isOwner: true }) }) as never,
  );
  const ctx = {
    db: {
      get: async () => rec,
      patch: async (id: Doc<"recommendations">["_id"], payload: Record<string, unknown>) => {
        patchedId = id;
        patchPayload = payload;
      },
    },
  };

  await handlers.updateRecommendation(ctx as never, {
    recId: rec._id,
    title: "  Updated Title  ",
    genre: "sci-fi",
    link: "  https://example.com/updated  ",
    blurb: "  Updated blurb  ",
  });

  assert.equal(patchedId, rec._id);
  assert.deepEqual(patchPayload, {
    title: "Updated Title",
    genre: "sci-fi",
    link: "https://example.com/updated",
    blurb: "Updated blurb",
  });
});

test("deleteRecommendation throws when recommendation is missing", async () => {
  const handlers = buildRecommendationHandlers(makeDeps() as never);
  const ctx = {
    db: {
      get: async () => null,
      delete: async () => undefined,
    },
  };

  await assert.rejects(
    () => handlers.deleteRecommendation(ctx as never, { recId: "missing" as never }),
    /Recommendation not found/,
  );
});

test("deleteRecommendation throws when unauthorized", async () => {
  const rec = makeRecommendation();
  const handlers = buildRecommendationHandlers(
    makeDeps({ canManageRecommendation: async () => ({ isAdmin: false, isOwner: false }) }) as never,
  );
  const ctx = {
    db: {
      get: async () => rec,
      delete: async () => undefined,
    },
  };

  await assert.rejects(
    () => handlers.deleteRecommendation(ctx as never, { recId: rec._id }),
    /Unauthorized/,
  );
});

test("deleteRecommendation deletes when owner/admin", async () => {
  const rec = makeRecommendation();
  let deletedId: Doc<"recommendations">["_id"] | undefined;

  const handlers = buildRecommendationHandlers(
    makeDeps({ canManageRecommendation: async () => ({ isAdmin: true, isOwner: false }) }) as never,
  );
  const ctx = {
    db: {
      get: async () => rec,
      delete: async (id: Doc<"recommendations">["_id"]) => {
        deletedId = id;
      },
    },
  };

  await handlers.deleteRecommendation(ctx as never, { recId: rec._id });
  assert.equal(deletedId, rec._id);
});

test("markStaffPick requires existing recommendation", async () => {
  const handlers = buildRecommendationHandlers(makeDeps() as never);
  const ctx = {
    db: {
      get: async () => null,
      patch: async () => undefined,
    },
  };

  await assert.rejects(
    () => handlers.markStaffPick(ctx as never, { recId: "missing" as never }),
    /Recommendation not found/,
  );
});

test("markStaffPick toggles staff pick flag", async () => {
  const rec = makeRecommendation({ isStaffPick: true });
  let patchedId: Doc<"recommendations">["_id"] | undefined;
  let patchPayload: Record<string, unknown> | undefined;
  let requireAdminCalls = 0;

  const handlers = buildRecommendationHandlers(
    makeDeps({
      requireAdmin: async () => {
        requireAdminCalls += 1;
        return { subject: "admin" };
      },
    }) as never,
  );
  const ctx = {
    db: {
      get: async () => rec,
      patch: async (id: Doc<"recommendations">["_id"], payload: Record<string, unknown>) => {
        patchedId = id;
        patchPayload = payload;
      },
    },
  };

  await handlers.markStaffPick(ctx as never, { recId: rec._id });

  assert.equal(requireAdminCalls, 1);
  assert.equal(patchedId, rec._id);
  assert.deepEqual(patchPayload, { isStaffPick: false });
});
