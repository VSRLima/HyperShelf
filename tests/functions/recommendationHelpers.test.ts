import test from "node:test";
import assert from "node:assert/strict";
import {
  canManageRecommendation,
  enrichRecommendationWithUser,
  getRecommendationAccess,
  isValidHttpLink,
} from "../../functions/lib/recommendation/recommendationHelpers";
import type { Doc } from "../../functions/_generated/dataModel";

function makeRecommendation(
  overrides: Partial<Doc<"recommendations">> = {},
): Doc<"recommendations"> {
  return {
    _id: "rec_1" as Doc<"recommendations">["_id"],
    _creationTime: Date.now(),
    userId: "user_doc_1" as Doc<"recommendations">["userId"],
    title: "The Hobbit",
    genre: "fantasy",
    link: "https://example.com/hobbit",
    blurb: "A journey there and back again.",
    isStaffPick: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

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

test("isValidHttpLink accepts http and https links", () => {
  assert.equal(isValidHttpLink("http://example.com"), true);
  assert.equal(isValidHttpLink("https://example.com/path?x=1"), true);
  assert.equal(isValidHttpLink("HTTPS://example.com"), true);
});

test("isValidHttpLink rejects invalid and non-http links", () => {
  assert.equal(isValidHttpLink("ftp://example.com"), false);
  assert.equal(isValidHttpLink("javascript:alert(1)"), false);
  assert.equal(isValidHttpLink("/relative/path"), false);
  assert.equal(isValidHttpLink("not-a-link"), false);
});

test("getRecommendationAccess detects admin and owner correctly", () => {
  assert.deepEqual(getRecommendationAccess("admin", "owner_1", "actor_1"), {
    isAdmin: true,
    isOwner: false,
  });

  assert.deepEqual(getRecommendationAccess("user", "actor_2", "actor_2"), {
    isAdmin: false,
    isOwner: true,
  });

  assert.deepEqual(getRecommendationAccess("user", "owner_3", "actor_3"), {
    isAdmin: false,
    isOwner: false,
  });
});

test("getRecommendationAccess handles undefined role and owner", () => {
  assert.deepEqual(getRecommendationAccess(undefined, undefined, "actor_1"), {
    isAdmin: false,
    isOwner: false,
  });
});

test("enrichRecommendationWithUser includes user identity fields", async () => {
  const rec = makeRecommendation();
  const user = makeUser({ _id: rec.userId, id: "clerk_owner", name: "Owner" });

  let requestedId: Doc<"recommendations">["userId"] | undefined;
  const ctx = {
    db: {
      get: async (id: Doc<"recommendations">["userId"]) => {
        requestedId = id;
        return user;
      },
    },
  };

  const result = await enrichRecommendationWithUser(ctx as never, rec);

  assert.equal(requestedId, rec.userId);
  assert.deepEqual(result, {
    ...rec,
    userClerkId: "clerk_owner",
    userName: "Owner",
    userProfile: "https://example.com/ada.png",
  });
});

test("enrichRecommendationWithUser falls back when user record is missing", async () => {
  const rec = makeRecommendation();
  const ctx = {
    db: {
      get: async () => null,
    },
  };

  const result = await enrichRecommendationWithUser(ctx as never, rec);

  assert.deepEqual(result, {
    ...rec,
    userClerkId: undefined,
    userName: "Unknown",
    userProfile: undefined,
  });
});

test("canManageRecommendation returns admin access for admin actor", async () => {
  const rec = makeRecommendation();
  const actor = makeUser({ id: "clerk_admin", role: "admin" });
  const owner = makeUser({ _id: rec.userId, id: "clerk_owner" });

  let indexName: string | undefined;
  let eqField: string | undefined;
  let eqValue: string | undefined;
  let getArg: Doc<"recommendations">["userId"] | undefined;

  const ctx = {
    db: {
      query: (tableName: string) => {
        assert.equal(tableName, "users");
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
              first: async () => actor,
            };
          },
        };
      },
      get: async (id: Doc<"recommendations">["userId"]) => {
        getArg = id;
        return owner;
      },
    },
  };

  const result = await canManageRecommendation(ctx as never, "clerk_admin", rec);

  assert.equal(indexName, "by_user_id");
  assert.equal(eqField, "id");
  assert.equal(eqValue, "clerk_admin");
  assert.equal(getArg, rec.userId);
  assert.deepEqual(result, { isAdmin: true, isOwner: false });
});

test("canManageRecommendation returns owner access for non-admin owner", async () => {
  const rec = makeRecommendation();
  const actor = makeUser({ id: "clerk_owner", role: "user" });
  const owner = makeUser({ _id: rec.userId, id: "clerk_owner" });

  const ctx = {
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => actor,
        }),
      }),
      get: async () => owner,
    },
  };

  const result = await canManageRecommendation(ctx as never, "clerk_owner", rec);
  assert.deepEqual(result, { isAdmin: false, isOwner: true });
});

test("canManageRecommendation denies when actor or owner cannot be found", async () => {
  const rec = makeRecommendation();

  const ctx = {
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => null,
        }),
      }),
      get: async () => null,
    },
  };

  const result = await canManageRecommendation(ctx as never, "clerk_missing", rec);
  assert.deepEqual(result, { isAdmin: false, isOwner: false });
});
