import type { BetterAuthClientPlugin } from "better-auth/client";
import type { BetterFetchOption } from "@better-fetch/fetch";
import type { featureFlagsPlugin } from "../server/plugin";
import type {
  CreateFeatureInput,
  UpdateFeatureInput,
  SetFeatureFlagInput,
  Feature,
  FeatureFlagWithDetails,
} from "./types";

export interface FeatureFlagsClientActions {
  /**
   * Create a new feature (admin only)
   */
  createFeature: (
    data: CreateFeatureInput,
    fetchOptions?: BetterFetchOption
  ) => Promise<{ data: Feature; error: null } | { data: null; error: unknown }>;

  /**
   * Update an existing feature (admin only)
   */
  updateFeature: (
    featureId: string,
    data: UpdateFeatureInput,
    fetchOptions?: BetterFetchOption
  ) => Promise<{ data: Feature; error: null } | { data: null; error: unknown }>;

  /**
   * List all features (admin only)
   */
  listFeatures: (
    fetchOptions?: BetterFetchOption
  ) => Promise<
    { data: Feature[]; error: null } | { data: null; error: unknown }
  >;

  /**
   * Delete a feature (admin only)
   */
  deleteFeature: (
    featureId: string,
    fetchOptions?: BetterFetchOption
  ) => Promise<
    { data: { success: boolean }; error: null } | { data: null; error: unknown }
  >;

  /**
   * Toggle a feature's global active state (admin only)
   */
  toggleFeature: (
    featureId: string,
    active: boolean,
    fetchOptions?: BetterFetchOption
  ) => Promise<{ data: Feature; error: null } | { data: null; error: unknown }>;

  /**
   * Enable or disable a feature flag for a specific organization (admin only)
   */
  setFeatureFlag: (
    organizationId: string,
    featureId: string,
    data: SetFeatureFlagInput,
    fetchOptions?: BetterFetchOption
  ) => Promise<
    | { data: FeatureFlagWithDetails; error: null }
    | { data: null; error: unknown }
  >;

  /**
   * Remove a feature flag from an organization (admin only)
   */
  removeFeatureFlag: (
    organizationId: string,
    featureId: string,
    fetchOptions?: BetterFetchOption
  ) => Promise<
    { data: { success: boolean }; error: null } | { data: null; error: unknown }
  >;

  /**
   * Get all enabled feature flags for a specific organization (members only)
   */
  getFeatureFlags: (
    organizationId: string,
    fetchOptions?: BetterFetchOption
  ) => Promise<
    | { data: FeatureFlagWithDetails[]; error: null }
    | { data: null; error: unknown }
  >;

  /**
   * Get all enabled feature flags for the current user's active organization
   */
  getAvailableFeatures: (
    fetchOptions?: BetterFetchOption
  ) => Promise<
    | { data: FeatureFlagWithDetails[]; error: null }
    | { data: null; error: unknown }
  >;
}

export const featureFlagsClientPlugin = {
  id: "organization-features",
  $InferServerPlugin: {} as ReturnType<typeof featureFlagsPlugin>,
  getActions: ($fetch) => {
    const actions: FeatureFlagsClientActions = {
      createFeature: async (data, fetchOptions) => {
        const res = (await $fetch("/organization-features/features", {
          method: "POST",
          body: data,
          ...fetchOptions,
        })) as { data: Feature; error: null } | { data: null; error: unknown };
        return res;
      },

      updateFeature: async (featureId, data, fetchOptions) => {
        const res = (await $fetch(
          `/organization-features/features/${featureId}`,
          {
            method: "PUT",
            body: data,
            ...fetchOptions,
          }
        )) as { data: Feature; error: null } | { data: null; error: unknown };
        return res;
      },

      listFeatures: async (fetchOptions) => {
        const res = (await $fetch("/organization-features/features", {
          method: "GET",
          ...fetchOptions,
        })) as
          | { data: Feature[]; error: null }
          | { data: null; error: unknown };
        return res;
      },

      deleteFeature: async (featureId, fetchOptions) => {
        const res = (await $fetch(
          `/organization-features/features/${featureId}`,
          {
            method: "DELETE",
            ...fetchOptions,
          }
        )) as
          | { data: { success: boolean }; error: null }
          | { data: null; error: unknown };
        return res;
      },

      toggleFeature: async (featureId, active, fetchOptions) => {
        const res = (await $fetch(
          `/organization-features/features/${featureId}/toggle`,
          {
            method: "POST",
            body: { active },
            ...fetchOptions,
          }
        )) as { data: Feature; error: null } | { data: null; error: unknown };
        return res;
      },

      setFeatureFlag: async (
        organizationId,
        featureId,
        data,
        fetchOptions
      ) => {
        const res = (await $fetch(
          `/organization-features/organizations/${organizationId}/features/${featureId}`,
          {
            method: "POST",
            body: data,
            ...fetchOptions,
          }
        )) as
          | { data: FeatureFlagWithDetails; error: null }
          | { data: null; error: unknown };
        return res;
      },

      removeFeatureFlag: async (
        organizationId,
        featureId,
        fetchOptions
      ) => {
        const res = (await $fetch(
          `/organization-features/organizations/${organizationId}/features/${featureId}`,
          {
            method: "DELETE",
            ...fetchOptions,
          }
        )) as
          | { data: { success: boolean }; error: null }
          | { data: null; error: unknown };
        return res;
      },

      getFeatureFlags: async (organizationId, fetchOptions) => {
        const res = (await $fetch(
          `/organization-features/organizations/${organizationId}/features`,
          {
            method: "GET",
            ...fetchOptions,
          }
        )) as
          | { data: FeatureFlagWithDetails[]; error: null }
          | { data: null; error: unknown };
        return res;
      },

      getAvailableFeatures: async (fetchOptions) => {
        const res = (await $fetch("/organization-features/features/available", {
          method: "GET",
          ...fetchOptions,
        })) as
          | { data: FeatureFlagWithDetails[]; error: null }
          | { data: null; error: unknown };

        return res;
      },
    };

    return actions;
  },
} satisfies BetterAuthClientPlugin;
