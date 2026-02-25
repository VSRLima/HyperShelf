import test from "node:test";
import assert from "node:assert/strict";
import { ConvexError } from "convex/values";
import { buildUserHandlers } from "../../functions/lib/user/userHandlers";
import type { Doc } from "../../functions/_generated/dataModel";

function makeUser(overrides: Partial<Doc<"users">> = {}): Doc<"users"> {
  return {
    _id: "user_doc_1" as Doc<"users">["_id"],
    _creationTime: Date.now(),
    id: "clerk_1",
    name: "Ada",
    user_profile: "https://example.com/ada.png",
    role: "user",
    ...overrides,
  };
}

function makeRecommendation(overrides: Partial<Doc<"recommendations">> = {}): Doc<"recommendations"> {
  return {
    _id: "rec_1" as Doc<"recommendations">["_id"],
    _creationTime: Date.now(),
    userId: "user_doc_1" as Doc<"recommendations">["userId"],
    title: "Rec",
    genre: "fantasy",
    link: "https://example.com/r",
    blurb: "Blurb",
    isStaffPick: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    buildProfilePatch: () => null,
    getUserByClerkId: async () => null,
    getUserRoleByClerkId: async () => "user" as const,
    requireAdmin: async () => ({ subject: "admin_clerk" }),
    ...overrides,
  };
}

function assertConvexCode(error: unknown, code: string): boolean {
  assert.ok(error instanceof ConvexError);
  const data = (error as { data?: { code?: string } }).data;
  assert.equal(data?.code, code);
  return true;
}

test("getUserRole returns default user when unauthenticated", async () => {
  let getRoleCalls = 0;
  const handlers = buildUserHandlers(
    makeDeps({
      getUserRoleByClerkId: async () => {
        getRoleCalls += 1;
        return "admin";
      },
    }) as never,
  );

  const ctx = {
    auth: {
      getUserIdentity: async () => null,
    },
  };

  const role = await handlers.getUserRole(ctx as never);
  assert.equal(role, "user");
  assert.equal(getRoleCalls, 0);
});

test("getUserRole returns looked-up role for authenticated user", async () => {
  let receivedClerkId: string | undefined;
  const handlers = buildUserHandlers(
    makeDeps({
      getUserRoleByClerkId: async (_ctx: unknown, clerkId: string) => {
        receivedClerkId = clerkId;
        return "admin";
      },
    }) as never,
  );

  const role = await handlers.getUserRole(
    {
      auth: {
        getUserIdentity: async () => ({ subject: "clerk_abc" }),
      },
    } as never,
  );

  assert.equal(receivedClerkId, "clerk_abc");
  assert.equal(role, "admin");
});

test("createUserIfNotExists inserts new user with trimmed name", async () => {
  let insertedTable: string | undefined;
  let insertedPayload: Record<string, unknown> | undefined;

  const handlers = buildUserHandlers(makeDeps() as never);
  const ctx = {
    db: {
      insert: async (table: string, payload: Record<string, unknown>) => {
        insertedTable = table;
        insertedPayload = payload;
      },
      patch: async () => undefined,
    },
  };

  await handlers.createUserIfNotExists(ctx as never, {
    userId: "clerk_new",
    name: "  Grace  ",
    userProfile: "https://example.com/grace.png",
  });

  assert.equal(insertedTable, "users");
  assert.deepEqual(insertedPayload, {
    id: "clerk_new",
    name: "Grace",
    user_profile: "https://example.com/grace.png",
    role: "user",
  });
});

test("createUserIfNotExists uses Anonymous when name is blank", async () => {
  let insertedPayload: Record<string, unknown> | undefined;

  const handlers = buildUserHandlers(makeDeps() as never);
  const ctx = {
    db: {
      insert: async (_table: string, payload: Record<string, unknown>) => {
        insertedPayload = payload;
      },
      patch: async () => undefined,
    },
  };

  await handlers.createUserIfNotExists(ctx as never, {
    userId: "clerk_new",
    name: "   ",
    userProfile: undefined,
  });

  assert.equal(insertedPayload?.name, "Anonymous");
});

test("createUserIfNotExists patches existing user when profile patch exists", async () => {
  const existing = makeUser({ _id: "user_existing" as Doc<"users">["_id"] });
  let patchedId: Doc<"users">["_id"] | undefined;
  let patchPayload: Record<string, unknown> | undefined;

  const handlers = buildUserHandlers(
    makeDeps({
      getUserByClerkId: async () => existing,
      buildProfilePatch: () => ({ name: "Updated" }),
    }) as never,
  );

  const ctx = {
    db: {
      insert: async () => undefined,
      patch: async (id: Doc<"users">["_id"], payload: Record<string, unknown>) => {
        patchedId = id;
        patchPayload = payload;
      },
    },
  };

  await handlers.createUserIfNotExists(ctx as never, {
    userId: "clerk_existing",
    name: "Updated",
  });

  assert.equal(patchedId, existing._id);
  assert.deepEqual(patchPayload, { name: "Updated" });
});

test("createUserIfNotExists does not patch when buildProfilePatch returns null", async () => {
  const existing = makeUser();
  let patchCalls = 0;

  const handlers = buildUserHandlers(
    makeDeps({
      getUserByClerkId: async () => existing,
      buildProfilePatch: () => null,
    }) as never,
  );

  const ctx = {
    db: {
      insert: async () => undefined,
      patch: async () => {
        patchCalls += 1;
      },
    },
  };

  await handlers.createUserIfNotExists(ctx as never, {
    userId: "clerk_existing",
    name: "Ada",
  });

  assert.equal(patchCalls, 0);
});

test("listUserRoles enforces admin and returns users in desc order", async () => {
  const users = [makeUser({ id: "clerk_2" }), makeUser({ id: "clerk_1" })];
  let requireAdminCalls = 0;
  let orderArg: string | undefined;

  const handlers = buildUserHandlers(
    makeDeps({
      requireAdmin: async () => {
        requireAdminCalls += 1;
        return { subject: "admin" };
      },
    }) as never,
  );

  const ctx = {
    db: {
      query: (table: string) => {
        assert.equal(table, "users");
        return {
          order: (direction: string) => {
            orderArg = direction;
            return {
              collect: async () => users,
            };
          },
        };
      },
    },
  };

  const result = await handlers.listUserRoles(ctx as never);
  assert.equal(requireAdminCalls, 1);
  assert.equal(orderArg, "desc");
  assert.equal(result, users);
});

test("listUserRoles propagates requireAdmin failures", async () => {
  const handlers = buildUserHandlers(
    makeDeps({
      requireAdmin: async () => {
        throw new Error("Only admins can perform this action");
      },
    }) as never,
  );

  await assert.rejects(
    () => handlers.listUserRoles({} as never),
    /Only admins can perform this action/,
  );
});

test("setUserRole blocks self-demotion", async () => {
  const handlers = buildUserHandlers(
    makeDeps({
      requireAdmin: async () => ({ subject: "clerk_admin" }),
      getUserByClerkId: async () => makeUser({ id: "clerk_admin", role: "admin" }),
    }) as never,
  );

  await assert.rejects(
    () =>
      handlers.setUserRole(
        { db: { patch: async () => undefined, insert: async () => "id" } } as never,
        { targetClerkId: "clerk_admin", role: "user" },
      ),
    (error) => assertConvexCode(error, "CANNOT_DEMOTE_SELF"),
  );
});

test("setUserRole patches existing user role", async () => {
  const existing = makeUser({ _id: "user_2" as Doc<"users">["_id"] });
  let patchedId: Doc<"users">["_id"] | undefined;
  let patchPayload: Record<string, unknown> | undefined;

  const handlers = buildUserHandlers(
    makeDeps({ getUserByClerkId: async () => existing }) as never,
  );
  const ctx = {
    db: {
      patch: async (id: Doc<"users">["_id"], payload: Record<string, unknown>) => {
        patchedId = id;
        patchPayload = payload;
      },
      insert: async () => "unused",
    },
  };

  const result = await handlers.setUserRole(ctx as never, {
    targetClerkId: "clerk_2",
    role: "admin",
  });

  assert.equal(result, existing._id);
  assert.equal(patchedId, existing._id);
  assert.deepEqual(patchPayload, { role: "admin" });
});

test("setUserRole inserts unknown user when target does not exist", async () => {
  let insertedPayload: Record<string, unknown> | undefined;
  const handlers = buildUserHandlers(makeDeps() as never);
  const ctx = {
    db: {
      patch: async () => undefined,
      insert: async (_table: string, payload: Record<string, unknown>) => {
        insertedPayload = payload;
        return "new_user_id";
      },
    },
  };

  const result = await handlers.setUserRole(ctx as never, {
    targetClerkId: "clerk_missing",
    role: "user",
  });

  assert.equal(result, "new_user_id");
  assert.deepEqual(insertedPayload, {
    id: "clerk_missing",
    name: "Unknown user",
    user_profile: undefined,
    role: "user",
  });
});

test("adminListUsersWithRecommendations returns mapped/sorted results", async () => {
  const userA = makeUser({ _id: "user_a" as Doc<"users">["_id"], id: "clerk_a" });
  const userB = makeUser({ _id: "user_b" as Doc<"users">["_id"], id: "clerk_b" });
  const byUser: Record<string, Doc<"recommendations">[]> = {
    user_a: [
      makeRecommendation({ _id: "rec_1" as Doc<"recommendations">["_id"], userId: userA._id }),
      makeRecommendation({ _id: "rec_2" as Doc<"recommendations">["_id"], userId: userA._id }),
    ],
    user_b: [
      makeRecommendation({ _id: "rec_3" as Doc<"recommendations">["_id"], userId: userB._id }),
    ],
  };

  let byUserIndexCalls = 0;
  const handlers = buildUserHandlers(makeDeps() as never);

  const ctx = {
    db: {
      query: (table: string) => {
        if (table === "users") {
          return {
            collect: async () => [userB, userA],
          };
        }

        assert.equal(table, "recommendations");
        return {
          withIndex: (
            indexName: string,
            callback: (builder: { eq: (field: string, value: string) => void }) => void,
          ) => {
            assert.equal(indexName, "by_user");
            let requestedUserId = "";
            callback({
              eq: (field: string, value: string) => {
                assert.equal(field, "userId");
                requestedUserId = value;
                byUserIndexCalls += 1;
              },
            });

            return {
              order: (direction: string) => {
                assert.equal(direction, "desc");
                return {
                  collect: async () => byUser[requestedUserId] ?? [],
                };
              },
            };
          },
        };
      },
    },
  };

  const result = await handlers.adminListUsersWithRecommendations(ctx as never);

  assert.equal(byUserIndexCalls, 2);
  assert.equal(result.length, 2);
  assert.equal(result[0]._id, userA._id);
  assert.equal(result[0].recommendationCount, 2);
  assert.equal(result[0].recommendations[0].title, "Rec");
  assert.equal("link" in result[0].recommendations[0], false);
  assert.equal(result[1]._id, userB._id);
  assert.equal(result[1].recommendationCount, 1);
});

test("updateUserConfiguration throws USER_NOT_FOUND when target is missing", async () => {
  const handlers = buildUserHandlers(makeDeps() as never);

  await assert.rejects(
    () =>
      handlers.updateUserConfiguration(
        { db: { patch: async () => undefined } } as never,
        { targetClerkId: "missing", role: "user" },
      ),
    (error) => assertConvexCode(error, "USER_NOT_FOUND"),
  );
});

test("updateUserConfiguration blocks self-demotion", async () => {
  const existing = makeUser({ id: "clerk_admin", role: "admin" });
  const handlers = buildUserHandlers(
    makeDeps({
      requireAdmin: async () => ({ subject: "clerk_admin" }),
      getUserByClerkId: async () => existing,
    }) as never,
  );

  await assert.rejects(
    () =>
      handlers.updateUserConfiguration(
        { db: { patch: async () => undefined } } as never,
        { targetClerkId: "clerk_admin", role: "user" },
      ),
    (error) => assertConvexCode(error, "CANNOT_DEMOTE_SELF"),
  );
});

test("updateUserConfiguration rejects blank trimmed name", async () => {
  const existing = makeUser();
  const handlers = buildUserHandlers(
    makeDeps({ getUserByClerkId: async () => existing }) as never,
  );

  await assert.rejects(
    () =>
      handlers.updateUserConfiguration(
        { db: { patch: async () => undefined } } as never,
        { targetClerkId: existing.id, role: "admin", name: "   " },
      ),
    (error) => assertConvexCode(error, "INVALID_NAME"),
  );
});

test("updateUserConfiguration patches role and trimmed name", async () => {
  const existing = makeUser({ _id: "user_edit" as Doc<"users">["_id"], id: "clerk_edit" });
  let patchedId: Doc<"users">["_id"] | undefined;
  let patchPayload: Record<string, unknown> | undefined;

  const handlers = buildUserHandlers(
    makeDeps({ getUserByClerkId: async () => existing }) as never,
  );
  const ctx = {
    db: {
      patch: async (id: Doc<"users">["_id"], payload: Record<string, unknown>) => {
        patchedId = id;
        patchPayload = payload;
      },
    },
  };

  const result = await handlers.updateUserConfiguration(ctx as never, {
    targetClerkId: existing.id,
    role: "admin",
    name: "  New Name  ",
  });

  assert.equal(result, existing._id);
  assert.equal(patchedId, existing._id);
  assert.deepEqual(patchPayload, {
    role: "admin",
    name: "New Name",
  });
});

test("updateUserConfiguration patches role only when name is undefined", async () => {
  const existing = makeUser({ _id: "user_edit_2" as Doc<"users">["_id"], id: "clerk_edit_2" });
  let patchPayload: Record<string, unknown> | undefined;

  const handlers = buildUserHandlers(
    makeDeps({ getUserByClerkId: async () => existing }) as never,
  );

  await handlers.updateUserConfiguration(
    {
      db: {
        patch: async (_id: Doc<"users">["_id"], payload: Record<string, unknown>) => {
          patchPayload = payload;
        },
      },
    } as never,
    {
      targetClerkId: existing.id,
      role: "user",
    },
  );

  assert.deepEqual(patchPayload, { role: "user" });
});
