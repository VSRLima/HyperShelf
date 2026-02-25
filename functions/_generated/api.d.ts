/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_recommendation_recommendationHandlers from "../lib/recommendation/recommendationHandlers.js";
import type * as lib_recommendation_recommendationHelpers from "../lib/recommendation/recommendationHelpers.js";
import type * as lib_user_userHandlers from "../lib/user/userHandlers.js";
import type * as lib_user_userHelpers from "../lib/user/userHelpers.js";
import type * as recommendations from "../recommendations.js";
import type * as types_role from "../types/role.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "lib/recommendation/recommendationHandlers": typeof lib_recommendation_recommendationHandlers;
  "lib/recommendation/recommendationHelpers": typeof lib_recommendation_recommendationHelpers;
  "lib/user/userHandlers": typeof lib_user_userHandlers;
  "lib/user/userHelpers": typeof lib_user_userHelpers;
  recommendations: typeof recommendations;
  "types/role": typeof types_role;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
