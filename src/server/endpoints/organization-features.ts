import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import type {
  Feature,
  OrganizationFeature,
  OrganizationFeatureWithDetails,
  SetOrganizationFeatureInput,
} from "../../shared/types";
import type { OrganizationFeaturesHooks } from "../hooks";
import { runBeforeHook, runAfterHook } from "../hook-helpers";

/**
 * Endpoints for managing organization-specific feature settings
 */

export function createSetOrganizationFeatureEndpoint(
  hooks?: OrganizationFeaturesHooks
) {
  return createAuthEndpoint(
    "/organization-features/organizations/:id/features/:featureId",
    {
      method: "POST",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const organizationId = ctx.params.id;
      const featureId = ctx.params.featureId;
      const body = (await ctx.request?.json()) as SetOrganizationFeatureInput;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        hooks?.setOrganizationFeature?.before as any,
        organizationId,
        featureId,
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

      const inputData: SetOrganizationFeatureInput =
        (beforeResult.data as SetOrganizationFeatureInput | undefined) || body;

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

      if (!user || user.role !== "admin") {
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

      // Verify organization exists
      const organization: Record<"id", string> | null = await adapter.findOne({
        model: "organization",
        select: ["id"],
        where: [
          {
            field: "id",
            operator: "eq",
            value: organizationId,
          },
        ],
      });

      if (!organization) {
        return ctx.json({ error: "Organization not found" }, { status: 404 });
      }

      // Check if organization feature already exists
      const existingOrgFeature = await adapter.findOne({
        model: "organizationFeature",
        select: ["id", "enabled"],
        where: [
          {
            field: "organizationId",
            operator: "eq",
            value: organizationId,
          },
          {
            field: "featureId",
            operator: "eq",
            value: featureId,
          },
        ],
      });

      if (existingOrgFeature) {
        return ctx.json(
          { error: "Organization feature already exists" },
          { status: 409 }
        );
      }

      const orgFeature = await adapter.create({
        model: "organizationFeature",
        data: {
          organizationId,
          featureId,
          enabled: inputData.enabled,
        },
      });

      // Fetch feature details for response
      const featureDetails = await adapter.findOne({
        model: "feature",
        where: [{ field: "id", operator: "eq", value: featureId }],
      });

      const resultData: OrganizationFeatureWithDetails = {
        ...(orgFeature as OrganizationFeatureWithDetails),
        feature: featureDetails as Feature,
      };

      const result = { data: resultData, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        hooks?.setOrganizationFeature?.after as any,
        result,
        organizationId,
        featureId,
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

export function createRemoveOrganizationFeatureEndpoint(
  hooks?: OrganizationFeaturesHooks
) {
  return createAuthEndpoint(
    "/organization-features/organizations/:id/features/:featureId",
    {
      method: "DELETE",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const organizationId = ctx.params.id;
      const featureId = ctx.params.featureId;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        hooks?.removeOrganizationFeature?.before as any,
        organizationId,
        featureId,
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

      if (!user || user.role !== "admin") {
        return ctx.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        );
      }

      // Check if organization feature exists
      const existing: Record<"id", string> | null = await adapter.findOne({
        model: "organizationFeature",
        select: ["id"],
        where: [
          {
            field: "organizationId",
            operator: "eq",
            value: organizationId,
          },
          {
            field: "featureId",
            operator: "eq",
            value: featureId,
          },
        ],
      });

      if (!existing) {
        return ctx.json(
          { error: "Organization feature not found" },
          { status: 404 }
        );
      }

      // Delete organization feature
      await adapter.delete({
        model: "organizationFeature",
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
        hooks?.removeOrganizationFeature?.after as any,
        result,
        organizationId,
        featureId,
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

export function createGetOrganizationFeaturesEndpoint(
  hooks?: OrganizationFeaturesHooks
) {
  return createAuthEndpoint(
    "/organization-features/organizations/:id/features",
    {
      method: "GET",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const organizationId = ctx.params.id;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        hooks?.getOrganizationFeatures?.before as any,
        organizationId,
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

      // Verify user is member of organization
      const membership: Record<"id", string> | null = await adapter.findOne({
        model: "member",
        select: ["id"],
        where: [
          {
            field: "organizationId",
            operator: "eq",
            value: organizationId,
          },
          {
            field: "userId",
            operator: "eq",
            value: session.user.id,
          },
        ],
      });

      if (!membership) {
        return ctx.json(
          { error: "Forbidden: Not a member of this organization" },
          { status: 403 }
        );
      }

      // Get all enabled features for this organization
      const orgFeatures: OrganizationFeature[] = await adapter.findMany({
        model: "organizationFeature",
        where: [
          {
            field: "organizationId",
            operator: "eq",
            value: organizationId,
          },
          {
            field: "enabled",
            operator: "eq",
            value: true,
          },
        ],
      });

      // Get all features for the organization features
      const features: Feature[] = await adapter.findMany({
        model: "feature",
        where: [
          {
            field: "id",
            operator: "in",
            value: orgFeatures.map((of) => of.featureId),
          },
          {
            field: "active",
            operator: "eq",
            value: true,
          },
        ],
      });
      const featureMap = new Map(features.map((f) => [f.id, f]));

      // Combine organization features with their feature details
      const enabledFeatures: OrganizationFeatureWithDetails[] = orgFeatures
        .filter((of) => featureMap.has(of.featureId))
        .map((of) => ({
          id: of.id,
          organizationId: of.organizationId,
          featureId: of.featureId,
          enabled: of.enabled,
          createdAt: of.createdAt,
          updatedAt: of.updatedAt,
          feature: featureMap.get(of.featureId)!,
        }));

      const result = { data: enabledFeatures, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        hooks?.getOrganizationFeatures?.after as any,
        result,
        organizationId,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json({ data: afterResult.data || enabledFeatures });
    }
  );
}

export function createGetAvailableFeaturesEndpoint(
  hooks?: OrganizationFeaturesHooks
) {
  return createAuthEndpoint(
    "/organization-features/features/available",
    {
      method: "GET",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        hooks?.getAvailableFeatures?.before as any,
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

      // Get active organization from session context
      const activeOrganizationId = session.session.activeOrganizationId;

      if (!activeOrganizationId) {
        return ctx.json({ data: [] });
      }

      // Verify user is member of organization
      const membership: Record<"id", string> | null = await adapter.findOne({
        model: "member",
        select: ["id"],
        where: [
          {
            field: "organizationId",
            operator: "eq",
            value: activeOrganizationId,
          },
          {
            field: "userId",
            operator: "eq",
            value: session.user.id,
          },
        ],
      });

      if (!membership) {
        return ctx.json({ data: [] });
      }

      // Get all enabled features for this organization
      const orgFeatures: OrganizationFeature[] = await adapter.findMany({
        model: "organizationFeature",
        where: [
          {
            field: "organizationId",
            operator: "eq",
            value: activeOrganizationId,
          },
          {
            field: "enabled",
            operator: "eq",
            value: true,
          },
        ],
      });

      // Get all features for the organization features
      const featureIds = orgFeatures.map((of) => of.featureId);
      const features: Feature[] = await adapter.findMany({
        model: "feature",
        where: [
          {
            field: "id",
            operator: "in",
            value: featureIds,
          },
          {
            field: "enabled",
            operator: "eq",
            value: true,
          },
        ],
      });

      // Create a map for quick lookup
      const featureMap = new Map(features.map((f) => [f.id, f]));

      // Combine organization features with their feature details
      const enabledFeatures: OrganizationFeatureWithDetails[] = orgFeatures
        .filter((of) => featureMap.has(of.featureId))
        .map((of) => ({
          id: of.id,
          organizationId: of.organizationId,
          featureId: of.featureId,
          enabled: of.enabled,
          createdAt: of.createdAt,
          updatedAt: of.updatedAt,
          feature: featureMap.get(of.featureId)!,
        }));

      const result = { data: enabledFeatures, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        hooks?.getAvailableFeatures?.after as any,
        result,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json({ data: afterResult.data || enabledFeatures });
    }
  );
}
