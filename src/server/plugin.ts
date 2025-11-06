import type { BetterAuthPlugin } from "better-auth";
import { organizationFeaturesSchema } from "./schema";
import {
  createFeatureEndpoint,
  listFeaturesEndpoint,
  updateFeatureEndpoint,
  deleteFeatureEndpoint,
  toggleFeatureEndpoint,
} from "./endpoints/features";
import {
  setOrganizationFeatureEndpoint,
  removeOrganizationFeatureEndpoint,
  getOrganizationFeaturesEndpoint,
  getAvailableFeaturesEndpoint,
} from "./endpoints/organization-features";

export interface OrganizationFeaturesPluginOptions {
  // Future plugin options can be added here
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
 * - The feature is globally available (features.enabled = true)
 * - AND the organization has the feature explicitly enabled (organizationFeatures.enabled = true)
 */
export const organizationFeaturesPlugin = (
  options?: OrganizationFeaturesPluginOptions
): BetterAuthPlugin => {
  return {
    id: "organization-features",
    schema: organizationFeaturesSchema,
    endpoints: {
      createFeature: createFeatureEndpoint,
      listFeatures: listFeaturesEndpoint,
      updateFeature: updateFeatureEndpoint,
      deleteFeature: deleteFeatureEndpoint,
      toggleFeature: toggleFeatureEndpoint,
      setOrganizationFeature: setOrganizationFeatureEndpoint,
      removeOrganizationFeature: removeOrganizationFeatureEndpoint,
      getOrganizationFeatures: getOrganizationFeaturesEndpoint,
      getAvailableFeatures: getAvailableFeaturesEndpoint,
    },
  } satisfies BetterAuthPlugin;
};

