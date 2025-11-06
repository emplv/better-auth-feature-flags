/**
 * Shared types for the organization features plugin
 */

export interface Feature {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationFeature {
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
  enabled?: boolean;
}

export interface UpdateFeatureInput {
  displayName?: string;
  description?: string;
  enabled?: boolean;
}

export interface SetOrganizationFeatureInput {
  enabled: boolean;
}

export interface OrganizationFeatureWithDetails extends OrganizationFeature {
  feature: Feature;
}

