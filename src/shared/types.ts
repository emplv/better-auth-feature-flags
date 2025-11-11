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
  organizationId: string;
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

export interface SetFeatureFlagInput {
  enabled: boolean;
}

export interface FeatureFlagWithDetails extends FeatureFlag {
  feature: Feature;
}

