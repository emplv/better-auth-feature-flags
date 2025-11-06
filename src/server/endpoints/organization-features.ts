import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import type {
  Feature,
  OrganizationFeature,
  SetOrganizationFeatureInput,
} from "../../shared/types";

/**
 * Endpoints for managing organization-specific feature settings
 */

export const setOrganizationFeatureEndpoint = createAuthEndpoint(
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

    // Verify feature exists and is enabled
    const feature: Pick<Feature, "id" | "enabled"> | null =
      await adapter.findOne({
        model: "feature",
        select: ["id", "enabled"],
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

    if (!feature.enabled) {
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

    // Upsert organization feature

    // there is no upsert
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
        enabled: body.enabled,
      },
    });

    return ctx.json({ data: orgFeature });
  }
);

export const removeOrganizationFeatureEndpoint = createAuthEndpoint(
  "/organization-features/organizations/:id/features/:featureId",
  {
    method: "DELETE",
    use: [sessionMiddleware],
  },
  async (ctx) => {
    const { adapter, session } = ctx.context;
    const organizationId = ctx.params.id;
    const featureId = ctx.params.featureId;

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

    return ctx.json({ data: { success: true } });
  }
);

export const getOrganizationFeaturesEndpoint = createAuthEndpoint(
  "/organization-features/organizations/:id/features",
  {
    method: "GET",
    use: [sessionMiddleware],
  },
  async (ctx) => {
    const { adapter, session } = ctx.context;
    const organizationId = ctx.params.id;

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
    // Feature must be globally enabled AND organization feature must be enabled
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

    // Create a map for quick lookup
    const features: Feature[] = await adapter.findMany({
      model: "feature",
      where: [
        {
          field: "id",
          operator: "in",
          value: orgFeatures.map((of) => of.featureId),
        },
      ],
    });
    const featureMap = new Map(features.map((f) => [f.id, f]));

    // Combine organization features with their feature details
    const enabledFeatures = orgFeatures
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

    return ctx.json({ data: enabledFeatures });
  }
);

export const getAvailableFeaturesEndpoint = createAuthEndpoint(
  "/organization-features/features/available",
  {
    method: "GET",
    use: [sessionMiddleware],
  },
  async (ctx) => {
    const { adapter, session } = ctx.context;

    // Verify session
    if (!session?.user) {
      return ctx.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active organization from session context
    // This assumes the organization plugin sets activeOrganizationId in session
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
    const enabledFeatures = orgFeatures
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

    return ctx.json({ data: enabledFeatures });
  }
);
