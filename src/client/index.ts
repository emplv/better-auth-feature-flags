export { featureFlagsClientPlugin } from "./plugin.js";
export type { FeatureFlagsClientActions } from "./plugin.js";
export type {
  Feature,
  FeatureFlag,
  FeatureFlagWithDetails,
  CreateFeatureInput,
  UpdateFeatureInput,
  SetFeatureFlagInput,
} from "./types.js";

// Module augmentation to ensure TypeScript recognizes authClient.features
import type { FeatureFlagsClientActions } from "./plugin.js";

declare module "better-auth/client" {
  interface BetterAuthClient {
    features: FeatureFlagsClientActions;
  }
}
