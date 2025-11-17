import type { BetterAuthPlugin } from "better-auth";
import { FeatureFlagsPluginOptions } from "./plugin";

/**
 * Database schema definitions for the feature flags plugin
 */
export const createFeatureFlagsSchema = (options?: FeatureFlagsPluginOptions) =>
  ({
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
        userId: {
          type: "string",
          required: false,
          references: {
            model: "user",
            field: "id",
            onDelete: "cascade",
          },
        },
        ...(options?.allowOrganizationSpecificFeatureFlags
          ? [
              {
                organizationId: {
                  type: "string",
                  required: false,
                  references: {
                    model: "organization",
                    field: "id",
                    onDelete: "cascade",
                  },
                },
              },
            ]
          : []),
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
  } as unknown as BetterAuthPlugin["schema"]);
