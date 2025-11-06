import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import type {
  CreateFeatureInput,
  UpdateFeatureInput,
} from "../../shared/types";

/**
 * Admin-only endpoints for managing features
 */

export const createFeatureEndpoint = createAuthEndpoint(
  "/organization-features/features",
  {
    method: "POST",
    use: [sessionMiddleware],
  },
  async (ctx) => {
    const { adapter, session } = ctx.context;
    const body = (await ctx.request?.json()) as CreateFeatureInput;

    // Verify session has user
    if (!session?.user) {
      return ctx.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (requires admin plugin)
    // This will work if admin plugin is installed
    // adapter.findOne
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

    // Validate input
    if (!body.name || !body.displayName) {
      return ctx.json(
        { error: "name and displayName are required" },
        { status: 400 }
      );
    }

    // Check if feature with same name already exists
    const existing = await adapter.findOne({
      model: "feature",
      select: ["id"],
      where: [
        {
          field: "name",
          operator: "eq",
          value: body.name,
        },
      ],
    });

    if (existing) {
      return ctx.json(
        { error: "Feature with this name already exists" },
        { status: 409 }
      );
    }

    // Create feature (enabled by default)
    const feature = await adapter.create({
      model: "feature",
      data: {
        name: body.name,
        displayName: body.displayName,
        description: body.description || null,
        enabled: body.enabled ?? true,
      },
    });

    return ctx.json({ data: feature });
  }
);

export const listFeaturesEndpoint = createAuthEndpoint(
  "/organization-features/features",
  {
    method: "GET",
    use: [sessionMiddleware],
  },
  async (ctx) => {
    const { adapter, session } = ctx.context;

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

    const features = await adapter.findMany({
      model: "feature",
      sortBy: {
        field: "createdAt",
        direction: "desc",
      },
    });

    return ctx.json({ data: features });
  }
);

export const updateFeatureEndpoint = createAuthEndpoint(
  "/organization-features/features/:id",
  {
    method: "PUT",
    use: [sessionMiddleware],
  },
  async (ctx) => {
    const { adapter, session } = ctx.context;
    const featureId = ctx.params.id;
    const body = (await ctx.request?.json()) as UpdateFeatureInput;

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

    // Check if feature exists
    const existing = await adapter.findOne({
      model: "feature",
      select: ["id"],
      where: [
        {
          field: "id",
          operator: "eq",
          value: featureId,
        },
      ],
    });

    if (!existing) {
      return ctx.json({ error: "Feature not found" }, { status: 404 });
    }

    // Update feature
    const feature = await adapter.update({
      model: "feature",
      where: [
        {
          field: "id",
          operator: "eq",
          value: featureId,
        },
      ],
      update: {
        ...(body.displayName !== undefined && {
          displayName: body.displayName,
        }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
      },
    });

    return ctx.json({ data: feature });
  }
);

export const deleteFeatureEndpoint = createAuthEndpoint(
  "/organization-features/features/:id",
  {
    method: "DELETE",
    use: [sessionMiddleware],
  },
  async (ctx) => {
    const { adapter, session } = ctx.context;
    const featureId = ctx.params.id;

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

    // Check if feature exists
    const existing = await adapter.findOne({
      model: "feature",
      select: ["id"],
      where: [
        {
          field: "id",
          operator: "eq",
          value: featureId,
        },
      ],
    });

    if (!existing) {
      return ctx.json({ error: "Feature not found" }, { status: 404 });
    }

    // Delete feature (cascade will remove organizationFeatures)
    await adapter.delete({
      model: "feature",
      where: [
        {
          field: "id",
          operator: "eq",
          value: featureId,
        },
      ],
    });

    return ctx.json({ data: { success: true } });
  }
);

export const toggleFeatureEndpoint = createAuthEndpoint(
  "/organization-features/features/:id/toggle",
  {
    method: "POST",
    use: [sessionMiddleware],
  },
  async (ctx) => {
    const { adapter, session } = ctx.context;
    const featureId = ctx.params.id;
    const body = (await ctx.request?.json()) as { enabled: boolean };

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

    // Check if feature exists
    const existing = await adapter.findOne({
      model: "feature",
      select: ["id"],
      where: [
        {
          field: "id",
          operator: "eq",
          value: featureId,
        },
      ],
    });

    if (!existing) {
      return ctx.json({ error: "Feature not found" }, { status: 404 });
    }

    // Toggle feature enabled state
    const feature = await adapter.update({
      model: "feature",
      where: [
        {
          field: "id",
          operator: "eq",
          value: featureId,
        },
      ],
      update: {
        enabled: body.enabled,
      },
    });

    return ctx.json({ data: feature });
  }
);
