/**
 * Hook types for feature flags plugin
 */

import type {
  Feature,
  FeatureFlagWithDetails,
  CreateFeatureInput,
  UpdateFeatureInput,
  SetFeatureFlagInput,
} from "../shared/types";

export interface HookContext {
  session: { user: { id: string } } | null;
  [key: string]: unknown;
}

export interface BeforeHookResult<T = unknown> {
  data?: T;
  error?: { message: string; status?: number };
  skip?: boolean;
}

export interface AfterHookResult<T = unknown> {
  data?: T;
  error?: { message: string; status?: number };
}

/**
 * Hook definitions for all actions
 */
export interface FeatureFlagsHooks {
  createFeature?: {
    before?: (
      input: CreateFeatureInput,
      context: HookContext
    ) =>
      | Promise<BeforeHookResult<CreateFeatureInput>>
      | BeforeHookResult<CreateFeatureInput>;
    after?: (
      result: { data: Feature; error: null } | { data: null; error: unknown },
      input: CreateFeatureInput,
      context: HookContext
    ) => Promise<AfterHookResult<Feature>> | AfterHookResult<Feature>;
  };

  updateFeature?: {
    before?: (
      featureId: string,
      input: UpdateFeatureInput,
      context: HookContext
    ) =>
      | Promise<BeforeHookResult<UpdateFeatureInput>>
      | BeforeHookResult<UpdateFeatureInput>;
    after?: (
      result: { data: Feature; error: null } | { data: null; error: unknown },
      featureId: string,
      input: UpdateFeatureInput,
      context: HookContext
    ) => Promise<AfterHookResult<Feature>> | AfterHookResult<Feature>;
  };

  deleteFeature?: {
    before?: (
      featureId: string,
      context: HookContext
    ) => Promise<BeforeHookResult> | BeforeHookResult;
    after?: (
      result:
        | { data: { success: boolean }; error: null }
        | { data: null; error: unknown },
      featureId: string,
      context: HookContext
    ) =>
      | Promise<AfterHookResult<{ success: boolean }>>
      | AfterHookResult<{ success: boolean }>;
  };

  listFeatures?: {
    before?: (
      context: HookContext
    ) => Promise<BeforeHookResult> | BeforeHookResult;
    after?: (
      result: { data: Feature[]; error: null } | { data: null; error: unknown },
      context: HookContext
    ) => Promise<AfterHookResult<Feature[]>> | AfterHookResult<Feature[]>;
  };

  toggleFeature?: {
    before?: (
      featureId: string,
      active: boolean,
      context: HookContext
    ) => Promise<BeforeHookResult<boolean>> | BeforeHookResult<boolean>;
    after?: (
      result: { data: Feature; error: null } | { data: null; error: unknown },
      featureId: string,
      active: boolean,
      context: HookContext
    ) => Promise<AfterHookResult<Feature>> | AfterHookResult<Feature>;
  };

  setFeatureFlag?: {
    before?: (
      organizationId: string,
      featureId: string,
      input: SetFeatureFlagInput,
      context: HookContext
    ) =>
      | Promise<BeforeHookResult<SetFeatureFlagInput>>
      | BeforeHookResult<SetFeatureFlagInput>;
    after?: (
      result:
        | { data: FeatureFlagWithDetails; error: null }
        | { data: null; error: unknown },
      organizationId: string,
      featureId: string,
      input: SetFeatureFlagInput,
      context: HookContext
    ) =>
      | Promise<AfterHookResult<FeatureFlagWithDetails>>
      | AfterHookResult<FeatureFlagWithDetails>;
  };

  removeFeatureFlag?: {
    before?: (
      organizationId: string,
      featureId: string,
      context: HookContext
    ) => Promise<BeforeHookResult> | BeforeHookResult;
    after?: (
      result:
        | { data: { success: boolean }; error: null }
        | { data: null; error: unknown },
      organizationId: string,
      featureId: string,
      context: HookContext
    ) =>
      | Promise<AfterHookResult<{ success: boolean }>>
      | AfterHookResult<{ success: boolean }>;
  };

  getFeatureFlags?: {
    before?: (
      organizationId: string,
      context: HookContext
    ) => Promise<BeforeHookResult> | BeforeHookResult;
    after?: (
      result:
        | { data: FeatureFlagWithDetails[]; error: null }
        | { data: null; error: unknown },
      organizationId: string,
      context: HookContext
    ) =>
      | Promise<AfterHookResult<FeatureFlagWithDetails[]>>
      | AfterHookResult<FeatureFlagWithDetails[]>;
  };

  getAvailableFeatures?: {
    before?: (
      context: HookContext
    ) => Promise<BeforeHookResult> | BeforeHookResult;
    after?: (
      result:
        | { data: FeatureFlagWithDetails[]; error: null }
        | { data: null; error: unknown },
      context: HookContext
    ) =>
      | Promise<AfterHookResult<FeatureFlagWithDetails[]>>
      | AfterHookResult<FeatureFlagWithDetails[]>;
  };
}
