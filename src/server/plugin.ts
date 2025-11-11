import type { BetterAuthPlugin } from "better-auth";
import { organizationFeaturesSchema } from "./schema";
import {
  createCreateFeatureEndpoint,
  createListFeaturesEndpoint,
  createUpdateFeatureEndpoint,
  createDeleteFeatureEndpoint,
  createToggleFeatureEndpoint,
} from "./endpoints/features";
import {
  createSetOrganizationFeatureEndpoint,
  createRemoveOrganizationFeatureEndpoint,
  createGetOrganizationFeaturesEndpoint,
  createGetAvailableFeaturesEndpoint,
} from "./endpoints/organization-features";
import type { OrganizationFeaturesHooks } from "./hooks";

export interface OrganizationFeaturesPluginOptions {
  /**
   * Hooks for intercepting and modifying behavior of all actions
   */
  hooks?: OrganizationFeaturesHooks;
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
 * - AND the organization has the feature explicitly enabled (organizationFeatures.enabled = true)
 */
export const organizationFeaturesPlugin = (
  options?: OrganizationFeaturesPluginOptions
): BetterAuthPlugin => {
  const hooks = options?.hooks;

  return {
    id: "organization-features",
    schema: organizationFeaturesSchema,
    endpoints: {
      createFeature: createCreateFeatureEndpoint(hooks),
      listFeatures: createListFeaturesEndpoint(hooks),
      updateFeature: createUpdateFeatureEndpoint(hooks),
      deleteFeature: createDeleteFeatureEndpoint(hooks),
      toggleFeature: createToggleFeatureEndpoint(hooks),
      setOrganizationFeature: createSetOrganizationFeatureEndpoint(hooks),
      removeOrganizationFeature: createRemoveOrganizationFeatureEndpoint(hooks),
      getOrganizationFeatures: createGetOrganizationFeaturesEndpoint(hooks),
      getAvailableFeatures: createGetAvailableFeaturesEndpoint(hooks),
    },
  } satisfies BetterAuthPlugin;
};

