import type { BetterAuthPlugin } from "better-auth";

/**
 * Database schema definitions for the feature flags plugin
 */
export const featureFlagsSchema = {
  features: {
    fields: {
      name: {
        type: "string",
        required: true,
        unique: true,
      },
      displayName: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      active: {
        type: "boolean",
        required: true,
      },
    },
    modelName: "feature",
  },
  featureFlags: {
    fields: {
      organizationId: {
        type: "string",
        required: true,
        references: {
          model: "organization",
          field: "id",
          onDelete: "cascade",
        },
      },
      featureId: {
        type: "string",
        required: true,
        references: {
          model: "feature",
          field: "id",
          onDelete: "cascade",
        },
      },
      enabled: {
        type: "boolean",
        required: true,
      },
    },
    modelName: "featureFlag",
  },
} satisfies BetterAuthPlugin["schema"];
