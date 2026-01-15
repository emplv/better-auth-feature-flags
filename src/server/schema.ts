import type { BetterAuthPlugin } from "better-auth";
import { FeatureFlagsPluginOptions } from "./plugin.js";

/**
 * Database schema definitions for the feature flags plugin
 */
export const createFeatureFlagsSchema = (
  options?: FeatureFlagsPluginOptions
): BetterAuthPlugin["schema"] => {
  const schema: BetterAuthPlugin["schema"] = {
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
        createdAt: {
          type: "date",
          defaultValue: Date.now(),
        },
        updatedAt: {
          type: "date",
          required: false,
        },
      },
      modelName: "feature",
    },
    featureFlags: {
      fields: {
        userId: {
          type: "string",
          required: false,
          references: {
            model: "user",
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
        createdAt: {
          type: "date",
          required: true,
          defaultValue: Date,
        },
        updatedAt: {
          type: "date",
          required: false,
        },
      },
      modelName: "featureFlag",
    },
  };

  if (options?.allowOrganizationSpecificFeatureFlags) {
    schema.featureFlags.fields.organizationId = {
      type: "string",
      required: false,
      references: {
        model: "organization",
        field: "id",
        onDelete: "cascade",
      },
    };
  }
  return schema;
};
