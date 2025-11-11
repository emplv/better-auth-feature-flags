import type { BetterAuthPlugin } from "better-auth";
import { featureFlagsSchema } from "./schema";
import {
  createCreateFeatureEndpoint,
  createListFeaturesEndpoint,
  createUpdateFeatureEndpoint,
  createDeleteFeatureEndpoint,
  createToggleFeatureEndpoint,
} from "./endpoints/features";
import {
  createSetFeatureFlagEndpoint,
  createRemoveFeatureFlagEndpoint,
  createGetFeatureFlagsEndpoint,
  createGetAvailableFeaturesEndpoint,
} from "./endpoints/feature-flags";
import type { FeatureFlagsHooks } from "./hooks";

export interface FeatureFlagsPluginOptions {
  /**
   * Hooks for intercepting and modifying behavior of all actions
   */
  hooks?: FeatureFlagsHooks;
}

/**
 * Better Auth plugin for managing organization feature flags
 *
 * This plugin allows administrators to:
 * - Create, update, and delete features
 * - Enable/disable features global availability for organizations
 * - Enable/disable features for specific organizations
 *
 * Features are only available to organizations when:
 * - The feature is globally available (features.active = true)
 * - AND the organization has the feature explicitly enabled (featureFlags.enabled = true)
 */
export const featureFlagsPlugin = (
  options?: FeatureFlagsPluginOptions
): BetterAuthPlugin => {
  const hooks = options?.hooks;

  return {
    id: "organization-features",
    schema: featureFlagsSchema,
    endpoints: {
      createFeature: createCreateFeatureEndpoint(hooks),
      listFeatures: createListFeaturesEndpoint(hooks),
      updateFeature: createUpdateFeatureEndpoint(hooks),
      deleteFeature: createDeleteFeatureEndpoint(hooks),
      toggleFeature: createToggleFeatureEndpoint(hooks),
      setFeatureFlag: createSetFeatureFlagEndpoint(hooks),
      removeFeatureFlag: createRemoveFeatureFlagEndpoint(hooks),
      getFeatureFlags: createGetFeatureFlagsEndpoint(hooks),
      getAvailableFeatures: createGetAvailableFeaturesEndpoint(hooks),
    },
  } satisfies BetterAuthPlugin;
};

