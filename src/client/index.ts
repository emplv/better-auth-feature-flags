export { featureFlagsClientPlugin } from "./plugin.js";
export type { FeatureFlagsClientActions, FeatureFlagsClientPlugin } from "./plugin.js";
export type {
  Feature,
  FeatureFlag,
  FeatureFlagWithDetails,
  CreateFeatureInput,
  UpdateFeatureInput,
  SetFeatureFlagInput,
} from "./types.js";

// No module augmentation needed: since 1.7-compatible builds the plugin's
// actions are namespaced under `features` and inferred directly by
// `createAuthClient` (better-auth 1.7 removed the `BetterAuthClient`
// interface the old augmentation targeted).
