import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import type {
  Feature,
  FeatureFlag,
  FeatureFlagWithDetails,
  SetFeatureFlagInput,
} from "../../shared/types.js";
import { FeatureFlagsPluginOptions } from "../plugin.js";
import { runBeforeHook, runAfterHook } from "../hook-helpers.js";

/**
 * Endpoints for managing organization-specific feature flags
 */

export function createSetFeatureFlagEndpoint(
  options?: FeatureFlagsPluginOptions
) {
  return createAuthEndpoint(
    "/features/:featureId/set-feature-flag",
    {
      method: "POST",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const featureId = ctx.params.featureId;
      const body = (await ctx.request?.json()) as SetFeatureFlagInput;
      const hookContext = { session };
      let relationFieldName = "";
      let relationFieldValue = "";

      if ("userId" in body) {
        relationFieldName = "userId";
        relationFieldValue = body.userId;
      } else if (
        options?.allowOrganizationSpecificFeatureFlags &&
        "organizationId" in body
      ) {
        relationFieldName = "organizationId";
        relationFieldValue = body.organizationId;
      }

      if (!relationFieldName || !relationFieldValue) {
        return ctx.json({ error: "Invalid input" }, { status: 400 });
      }

      // Run before hook
      const beforeResult = await runBeforeHook(
        options?.hooks?.setFeatureFlag?.before as any,
        featureId,
        relationFieldName,
        relationFieldValue,
        body,
        hookContext
      );

      if (beforeResult.skip) {
        if (beforeResult.error) {
          return ctx.json(
            { error: beforeResult.error.message },
            { status: beforeResult.error.status || 400 }
          );
        }
        return ctx.json({ data: beforeResult.data });
      }

      const inputData: SetFeatureFlagInput =
        (beforeResult.data as SetFeatureFlagInput | undefined) || body;

      // Verify admin access
      if (!session?.user) {
        return ctx.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user: Record<"role", string> | null = await adapter.findOne({
        model: "user",
        where: [
          {
            field: "id",
            operator: "eq",
            value: session.user.id,
          },
        ],
        select: ["role"],
      });

      if (!user || user.role.includes("admin")) {
        return ctx.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        );
      }

      // Verify feature exists and is active
      const feature: Pick<Feature, "id" | "active"> | null =
        await adapter.findOne({
          model: "feature",
          select: ["id", "active"],
          where: [
            {
              field: "id",
              operator: "eq",
              value: featureId,
            },
          ],
        });

      if (!feature) {
        return ctx.json({ error: "Feature not found" }, { status: 404 });
      }

      if (!feature.active) {
        return ctx.json(
          { error: "Feature is not enabled globally" },
          { status: 400 }
        );
      }

      if (relationFieldName === "userId") {
        const user: Record<"id", string> | null = await adapter.findOne({
          model: "user",
          select: ["id"],
          where: [{ field: "id", operator: "eq", value: relationFieldValue }],
        });
        if (!user) {
          return ctx.json({ error: "User not found" }, { status: 404 });
        }
      } else {
        const organization: Record<"id", string> | null = await adapter.findOne(
          {
            model: "organization",
            select: ["id"],
            where: [{ field: "id", operator: "eq", value: relationFieldValue }],
          }
        );
        if (!organization) {
          return ctx.json({ error: "Organization not found" }, { status: 404 });
        }
      }

      // Check if feature flag already exists
      const existingFeatureFlag = await adapter.findOne({
        model: "featureFlag",
        select: ["id", "enabled"],
        where: [
          {
            field: relationFieldName,
            operator: "eq",
            value: relationFieldValue,
          },
          {
            field: "featureId",
            operator: "eq",
            value: featureId,
          },
        ],
      });

      if (existingFeatureFlag) {
        return ctx.json(
          { error: "Feature flag already exists" },
          { status: 409 }
        );
      }

      const featureFlag = await adapter.create({
        model: "featureFlag",
        data: {
          [relationFieldName]: relationFieldValue,
          featureId,
          enabled: inputData.enabled,
        },
      });

      // Fetch feature details for response
      const featureDetails = await adapter.findOne({
        model: "feature",
        where: [{ field: "id", operator: "eq", value: featureId }],
      });

      const resultData: FeatureFlagWithDetails = {
        ...(featureFlag as FeatureFlagWithDetails),
        feature: featureDetails as Feature,
      };

      const result = { data: resultData, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        options?.hooks?.setFeatureFlag?.after as any,
        result,
        featureId,
        relationFieldName,
        relationFieldValue,
        inputData,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json({ data: afterResult.data || resultData });
    }
  );
}

export function createRemoveFeatureFlagEndpoint(
  options?: FeatureFlagsPluginOptions
) {
  return createAuthEndpoint(
    "/features/:featureId/remove-feature-flag/:featureFlagId",
    {
      method: "DELETE",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const featureFlagId = ctx.params.featureFlagId;
      const featureId = ctx.params.featureId;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        options?.hooks?.removeFeatureFlag?.before as any,
        featureId,
        featureFlagId,
        hookContext
      );

      if (beforeResult.skip) {
        if (beforeResult.error) {
          return ctx.json(
            { error: beforeResult.error.message },
            { status: beforeResult.error.status || 400 }
          );
        }
        return ctx.json({ data: { success: true } });
      }

      // Verify admin access
      if (!session?.user) {
        return ctx.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user: Record<"role", string> | null = await adapter.findOne({
        model: "user",
        where: [
          {
            field: "id",
            operator: "eq",
            value: session.user.id,
          },
        ],
        select: ["role"],
      });

      if (!user || user.role.includes("admin")) {
        return ctx.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        );
      }

      // Check if feature flag exists
      const existing: Record<"id", string> | null = await adapter.findOne({
        model: "featureFlag",
        select: ["id"],
        where: [
          {
            field: "id",
            operator: "eq",
            value: featureFlagId,
          },
          {
            field: "featureId",
            operator: "eq",
            value: featureId,
          },
        ],
      });

      if (!existing) {
        return ctx.json({ error: "Feature flag not found" }, { status: 404 });
      }

      // Delete feature flag
      await adapter.delete({
        model: "featureFlag",
        where: [
          {
            field: "id",
            operator: "eq",
            value: existing.id,
          },
        ],
      });

      const result = { data: { success: true }, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        options?.hooks?.removeFeatureFlag?.after as any,
        result,
        featureId,
        featureFlagId,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json({ data: afterResult.data || { success: true } });
    }
  );
}

export function createGetFeatureFlagsEndpoint(
  options?: FeatureFlagsPluginOptions
) {
  return createAuthEndpoint(
    "/features/feature-flags",
    {
      method: "GET",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        options?.hooks?.getFeatureFlags?.before as any,
        hookContext
      );

      if (beforeResult.skip) {
        if (beforeResult.error) {
          return ctx.json(
            { error: beforeResult.error.message },
            { status: beforeResult.error.status || 400 }
          );
        }
        return ctx.json({ data: beforeResult.data || [] });
      }

      // Verify session
      if (!session?.user) {
        return ctx.json({ error: "Unauthorized" }, { status: 401 });
      }

      const where: any[] = [
        {
          field: "userId",
          operator: "eq",
          value: session.user.id,
        },
      ];

      if (session.session.activeOrganizationId) {
        where.push({
          field: "organizationId",
          operator: "eq",
          value: session.session.activeOrganizationId,
        });
      }

      // Get all enabled feature flags for this user / organization
      const featureFlags: FeatureFlag[] = await adapter.findMany({
        model: "featureFlag",
        where,
      });

      // Get all features for the feature flags
      const features: Feature[] = await adapter.findMany({
        model: "feature",
        where: [
          {
            field: "id",
            operator: "in",
            value: featureFlags.map((ff) => ff.featureId),
          },
          {
            field: "active",
            operator: "eq",
            value: true,
          },
        ],
      });
      const featureMap = new Map(features.map((f) => [f.id, f]));

      // Combine feature flags with their feature details
      const enabledFeatureFlags: FeatureFlagWithDetails[] = featureFlags
        .filter((ff) => featureMap.has(ff.featureId))
        .map((ff) => ({
          id: ff.id,
          userId: ff.userId,
          organizationId: ff.organizationId,
          featureId: ff.featureId,
          enabled: ff.enabled,
          createdAt: ff.createdAt,
          updatedAt: ff.updatedAt,
          feature: featureMap.get(ff.featureId)!,
        }));

      const result = { data: enabledFeatureFlags, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        options?.hooks?.getFeatureFlags?.after as any,
        result,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json({ data: afterResult.data || enabledFeatureFlags });
    }
  );
}
