import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProfilePatch,
  ensureUserForIdentity,
  getUserByClerkId,
  getUserRoleByClerkId,
  requireAdmin,
  requireIdentity,
} from "../../functions/lib/user/userHelpers";
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

test("buildProfilePatch returns null when nothing changed", () => {
  const existingUser = makeUser();

  const patch = buildProfilePatch(existingUser, {
    name: "Ada",
  });

  assert.equal(patch, null);
});

test("buildProfilePatch returns null for blank trimmed name without profile input", () => {
  const existingUser = makeUser();

  const patch = buildProfilePatch(existingUser, {
    name: "   ",
  });

  assert.equal(patch, null);
});

test("buildProfilePatch returns changed name and profile fields", () => {
  const existingUser = makeUser();

  const patch = buildProfilePatch(existingUser, {
    name: "  Grace  ",
    userProfile: "https://example.com/grace.png",
  });

  assert.deepEqual(patch, {
    name: "Grace",
    user_profile: "https://example.com/grace.png",
  });
});

test("buildProfilePatch can set profile field to empty string", () => {
  const existingUser = makeUser();

  const patch = buildProfilePatch(existingUser, {
    userProfile: "",
  });

  assert.deepEqual(patch, { user_profile: "" });
});

test("getUserByClerkId uses by_user_id index", async () => {
  let indexName: string | undefined;
  let eqField: string | undefined;
  let eqValue: string | undefined;

  const expectedUser = makeUser({
    _id: "user_doc_2" as Doc<"users">["_id"],
    id: "clerk_2",
    name: "User",
  });

  const ctx = {
    db: {
      query: (tableName: string) => {
        assert.equal(tableName, "users");
        return {
          withIndex: (
            receivedIndexName: string,
            callback: (queryBuilder: { eq: (field: string, value: string) => void }) => void,
          ) => {
            indexName = receivedIndexName;
            callback({
              eq: (field: string, value: string) => {
                eqField = field;
                eqValue = value;
              },
            });
            return {
              first: async () => expectedUser,
            };
          },
        };
      },
    },
  };

  const result = await getUserByClerkId(ctx as never, "clerk_2");
  assert.equal(indexName, "by_user_id");
  assert.equal(eqField, "id");
  assert.equal(eqValue, "clerk_2");
  assert.equal(result, expectedUser);
});

test("requireIdentity returns identity when authenticated", async () => {
  const identity = { subject: "clerk_1", name: "Ada", pictureUrl: "https://example.com/ada.png" };
  const ctx = {
    auth: {
      getUserIdentity: async () => identity,
    },
  };

  const result = await requireIdentity(ctx as never);
  assert.equal(result, identity);
});

test("requireIdentity throws when unauthenticated", async () => {
  const ctx = {
    auth: {
      getUserIdentity: async () => null,
    },
  };

  await assert.rejects(() => requireIdentity(ctx as never), /Unauthorized/);
});

test("getUserRoleByClerkId returns stored role", async () => {
  const ctx = {
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => makeUser({ role: "admin" }),
        }),
      }),
    },
  };

  const role = await getUserRoleByClerkId(ctx as never, "clerk_1");
  assert.equal(role, "admin");
});

test("getUserRoleByClerkId defaults to user when missing", async () => {
  const ctx = {
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => null,
        }),
      }),
    },
  };

  const role = await getUserRoleByClerkId(ctx as never, "missing");
  assert.equal(role, "user");
});

test("requireAdmin returns identity for admin", async () => {
  const identity = { subject: "clerk_admin", name: "Admin", pictureUrl: "https://example.com/admin.png" };
  const ctx = {
    auth: {
      getUserIdentity: async () => identity,
    },
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => makeUser({ id: "clerk_admin", role: "admin" }),
        }),
      }),
    },
  };

  const result = await requireAdmin(ctx as never);
  assert.equal(result, identity);
});

test("requireAdmin throws for non-admin users", async () => {
  const identity = { subject: "clerk_user", name: "User", pictureUrl: "https://example.com/user.png" };
  const ctx = {
    auth: {
      getUserIdentity: async () => identity,
    },
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => makeUser({ id: "clerk_user", role: "user" }),
        }),
      }),
    },
  };

  await assert.rejects(() => requireAdmin(ctx as never), /Only admins can perform this action/);
});

test("ensureUserForIdentity returns existing user when present", async () => {
  let insertCalls = 0;
  const existing = makeUser({ id: "clerk_existing" });
  const ctx = {
    auth: {
      getUserIdentity: async () => ({
        subject: "clerk_existing",
        name: "Existing",
        pictureUrl: "https://example.com/existing.png",
      }),
    },
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => existing,
        }),
      }),
      insert: async () => {
        insertCalls += 1;
        return "new_user";
      },
      get: async () => null,
    },
  };

  const result = await ensureUserForIdentity(ctx as never);
  assert.equal(result, existing);
  assert.equal(insertCalls, 0);
});

test("ensureUserForIdentity inserts and fetches new user", async () => {
  let insertedTable: string | undefined;
  let insertedPayload: Record<string, unknown> | undefined;
  let fetchedId: string | undefined;

  const createdUser = makeUser({ id: "clerk_new", name: "New User" });

  const ctx = {
    auth: {
      getUserIdentity: async () => ({
        subject: "clerk_new",
        name: "New User",
        pictureUrl: "https://example.com/new.png",
      }),
    },
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => null,
        }),
      }),
      insert: async (table: string, payload: Record<string, unknown>) => {
        insertedTable = table;
        insertedPayload = payload;
        return "new_user_id";
      },
      get: async (id: string) => {
        fetchedId = id;
        return createdUser;
      },
    },
  };

  const result = await ensureUserForIdentity(ctx as never);
  assert.equal(insertedTable, "users");
  assert.deepEqual(insertedPayload, {
    id: "clerk_new",
    name: "New User",
    user_profile: "https://example.com/new.png",
    role: "user",
  });
  assert.equal(fetchedId, "new_user_id");
  assert.equal(result, createdUser);
});

test("ensureUserForIdentity falls back to Anonymous name", async () => {
  let insertedPayload: Record<string, unknown> | undefined;

  const createdUser = makeUser({ id: "clerk_anon", name: "Anonymous" });

  const ctx = {
    auth: {
      getUserIdentity: async () => ({
        subject: "clerk_anon",
        name: null,
        pictureUrl: undefined,
      }),
    },
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => null,
        }),
      }),
      insert: async (_table: string, payload: Record<string, unknown>) => {
        insertedPayload = payload;
        return "anon_id";
      },
      get: async () => createdUser,
    },
  };

  const result = await ensureUserForIdentity(ctx as never);
  assert.deepEqual(insertedPayload, {
    id: "clerk_anon",
    name: "Anonymous",
    user_profile: undefined,
    role: "user",
  });
  assert.equal(result, createdUser);
});

test("ensureUserForIdentity throws when created user cannot be fetched", async () => {
  const ctx = {
    auth: {
      getUserIdentity: async () => ({
        subject: "clerk_new",
        name: "New User",
        pictureUrl: "https://example.com/new.png",
      }),
    },
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => null,
        }),
      }),
      insert: async () => "new_user_id",
      get: async () => null,
    },
  };

  await assert.rejects(() => ensureUserForIdentity(ctx as never), /Failed to create user/);
});
