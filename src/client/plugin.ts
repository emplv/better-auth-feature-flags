import type { BetterAuthClientPlugin } from "better-auth/client";
import type { BetterFetchOption } from "@better-fetch/fetch";

import type {
  CreateFeatureInput,
  UpdateFeatureInput,
  SetFeatureFlagInput,
  Feature,
  FeatureFlagWithDetails,
} from "./types.js";

export interface FeatureFlagsClientActions {
  /**
   * Create a new feature (admin only)
   */
  createFeature: (
    data: CreateFeatureInput,
    fetchOptions?: BetterFetchOption
  ) => Promise<Feature | { data: null; error: unknown }>;

  /**
   * Update an existing feature (admin only)
   */
  updateFeature: (
    featureId: string,
    data: UpdateFeatureInput,
    fetchOptions?: BetterFetchOption
  ) => Promise<Feature | { data: null; error: unknown }>;

  /**
   * List all features (admin only)
   */
  listFeatures: (
    fetchOptions?: BetterFetchOption
  ) => Promise<Feature[] | { data: null; error: unknown }>;

  /**
   * Delete a feature (admin only)
   */
  deleteFeature: (
    featureId: string,
    fetchOptions?: BetterFetchOption
  ) => Promise<{ success: boolean } | { data: null; error: unknown }>;

  /**
   * Toggle a feature's global active state (admin only)
   */
  toggleFeature: (
    featureId: string,
    active: boolean,
    fetchOptions?: BetterFetchOption
  ) => Promise<Feature | { data: null; error: unknown }>;

  /**
   * Enable or disable a feature flag for a specific user/organization (admin only)
   */
  setFeatureFlag: (
    featureId: string,
    data: SetFeatureFlagInput,
    fetchOptions?: BetterFetchOption
  ) => Promise<FeatureFlagWithDetails | { data: null; error: unknown }>;

  /**
   * Remove a feature flag from an organization (admin only)
   */
  removeFeatureFlag: (
    featureId: string,
    featureFlagId: string,
    fetchOptions?: BetterFetchOption
  ) => Promise<{ success: boolean } | { data: null; error: unknown }>;

  /**
   * Get all enabled feature flags for a specific organization (members only)
   */
  getFeatureFlags: (
    fetchOptions?: BetterFetchOption
  ) => Promise<FeatureFlagWithDetails[] | { data: null; error: unknown }>;

  /**
   * Get all enabled feature flags for the current user's active organization
   */
  getAvailableFeatures: (
    fetchOptions?: BetterFetchOption
  ) => Promise<FeatureFlagWithDetails[] | { data: null; error: unknown }>;
}

export const featureFlagsClientPlugin = (): BetterAuthClientPlugin => ({
  id: "features",
  getActions: ($fetch): FeatureFlagsClientActions => {
    const actions: FeatureFlagsClientActions = {
      createFeature: async (data, fetchOptions) => {
        const res = (await $fetch("/features/create-feature", {
          method: "POST",
          body: data,
          ...fetchOptions,
        })) as Feature | { data: null; error: unknown };
        return res;
      },

      updateFeature: async (featureId, data, fetchOptions) => {
        const res = (await $fetch(`/features/update-feature/${featureId}`, {
          method: "PUT",
          body: data,
          ...fetchOptions,
        })) as Feature | { data: null; error: unknown };
        return res;
      },

      listFeatures: async (fetchOptions) => {
        const res = (await $fetch("/features/list-features", {
          method: "GET",
          ...fetchOptions,
        })) as Feature[] | { data: null; error: unknown };
        return res;
      },

      deleteFeature: async (featureId, fetchOptions) => {
        const res = (await $fetch(`/features/delete-feature/${featureId}`, {
          method: "DELETE",
          ...fetchOptions,
        })) as { success: boolean } | { data: null; error: unknown };
        return res;
      },

      toggleFeature: async (featureId, active, fetchOptions) => {
        const res = (await $fetch(`/features/toggle-feature/${featureId}`, {
          method: "POST",
          body: { active },
          ...fetchOptions,
        })) as Feature | { data: null; error: unknown };
        return res;
      },

      setFeatureFlag: async (featureId, data, fetchOptions) => {
        const res = (await $fetch(`/features/${featureId}/set-feature-flag`, {
          method: "POST",
          body: data,
          ...fetchOptions,
        })) as FeatureFlagWithDetails | { data: null; error: unknown };
        return res;
      },

      removeFeatureFlag: async (featureId, featureFlagId, fetchOptions) => {
        const res = (await $fetch(
          `/features/${featureId}/remove-feature-flag/${featureFlagId}`,
          {
            method: "DELETE",
            ...fetchOptions,
          }
        )) as { success: boolean } | { data: null; error: unknown };
        return res;
      },

      getFeatureFlags: async (fetchOptions) => {
        const res = (await $fetch(`/features/get-feature-flags`, {
          method: "GET",
          ...fetchOptions,
        })) as FeatureFlagWithDetails[] | { data: null; error: unknown };
        return res;
      },

      getAvailableFeatures: async (fetchOptions) => {
        const res = (await $fetch("/features/get-available-features", {
          method: "GET",
          ...fetchOptions,
        })) as FeatureFlagWithDetails[] | { data: null; error: unknown };

        return res;
      },
    };

    return actions;
  },
});
