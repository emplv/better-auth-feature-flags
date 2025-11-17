/**
 * Shared types for the features plugin
 */

export interface Feature {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlag {
  id: string;
  userId?: string;
  organizationId?: string;
  featureId: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureInput {
  name: string;
  displayName: string;
  description?: string;
  active?: boolean;
}

export interface UpdateFeatureInput {
  displayName?: string;
  description?: string;
  active?: boolean;
}

export type SetFeatureFlagInput =
  | {
      enabled: boolean;
      userId: string;
    }
  | {
      enabled: boolean;
      organizationId: string;
    };

export interface FeatureFlagWithDetails extends FeatureFlag {
  feature: Feature;
}
