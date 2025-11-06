import type { BetterAuthPlugin } from "better-auth";

/**
 * Database schema definitions for the organization features plugin
 */
export const organizationFeaturesSchema = {
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
      enabled: {
        type: "boolean",
        required: true,
      },
    },
    modelName: "feature",
  },
  organizationFeatures: {
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
    modelName: "organizationFeature",
  },
} satisfies BetterAuthPlugin["schema"];
