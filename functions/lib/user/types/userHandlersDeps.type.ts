import { buildProfilePatch, getUserByClerkId, getUserRoleByClerkId, requireAdmin } from "../userHelpers";

export type UserHandlersDeps = {
  buildProfilePatch: typeof buildProfilePatch;
  getUserByClerkId: typeof getUserByClerkId;
  getUserRoleByClerkId: typeof getUserRoleByClerkId;
  requireAdmin: typeof requireAdmin;
};