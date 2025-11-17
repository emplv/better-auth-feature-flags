import type { BetterAuthPlugin } from "better-auth";
import { createFeatureFlagsSchema } from "./schema.js";
import {
  createCreateFeatureEndpoint,
  createListFeaturesEndpoint,
  createUpdateFeatureEndpoint,
  createDeleteFeatureEndpoint,
  createToggleFeatureEndpoint,
  createGetAvailableFeaturesEndpoint,
} from "./endpoints/features.js";
import {
  createSetFeatureFlagEndpoint,
  createRemoveFeatureFlagEndpoint,
  createGetFeatureFlagsEndpoint,
} from "./endpoints/feature-flags.js";
import type { FeatureFlagsHooks } from "./hooks.js";

export interface FeatureFlagsPluginOptions {
  /**
   * Hooks for intercepting and modifying behavior of all actions
   */
  hooks?: FeatureFlagsHooks;
  /**
   * Allow for organization-specific feature flags
   */
  allowOrganizationSpecificFeatureFlags?: boolean;
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
  return {
    id: "features",
    schema: createFeatureFlagsSchema(options),
    endpoints: {
      createFeature: createCreateFeatureEndpoint(options),
      listFeatures: createListFeaturesEndpoint(options),
      updateFeature: createUpdateFeatureEndpoint(options),
      deleteFeature: createDeleteFeatureEndpoint(options),
      toggleFeature: createToggleFeatureEndpoint(options),
      getAvailableFeatures: createGetAvailableFeaturesEndpoint(options),
      setFeatureFlag: createSetFeatureFlagEndpoint(options),
      removeFeatureFlag: createRemoveFeatureFlagEndpoint(options),
      getFeatureFlags: createGetFeatureFlagsEndpoint(options),
    },
  } satisfies BetterAuthPlugin;
};
