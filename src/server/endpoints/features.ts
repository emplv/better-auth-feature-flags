import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import type {
  CreateFeatureInput,
  UpdateFeatureInput,
} from "../../shared/types";
import type { OrganizationFeaturesHooks } from "../hooks";
import { runBeforeHook, runAfterHook } from "../hook-helpers";

/**
 * Admin-only endpoints for managing features
 */

export function createCreateFeatureEndpoint(hooks?: OrganizationFeaturesHooks) {
  return createAuthEndpoint(
    "/organization-features/features",
    {
      method: "POST",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const body = (await ctx.request?.json()) as CreateFeatureInput;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        hooks?.createFeature?.before as any,
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

      const inputData: CreateFeatureInput = (beforeResult.data as CreateFeatureInput | undefined) || body;

      // Verify session has user
      if (!session?.user) {
        return ctx.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user is admin
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
      if (!inputData.name || !inputData.displayName) {
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
            value: inputData.name,
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
          name: inputData.name,
          displayName: inputData.displayName,
          description: inputData.description || null,
          enabled: inputData.enabled ?? true,
        },
      });

      const result = { data: feature, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        hooks?.createFeature?.after as any,
        result,
        inputData,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json({ data: afterResult.data || feature });
    }
  );
}

export function createListFeaturesEndpoint(hooks?: OrganizationFeaturesHooks) {
  return createAuthEndpoint(
    "/organization-features/features",
    {
      method: "GET",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        hooks?.listFeatures?.before as any,
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

      const result = { data: features, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        hooks?.listFeatures?.after as any,
        result,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json({ data: afterResult.data || features });
    }
  );
}

export function createUpdateFeatureEndpoint(hooks?: OrganizationFeaturesHooks) {
  return createAuthEndpoint(
    "/organization-features/features/:id",
    {
      method: "PUT",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const featureId = ctx.params.id;
      const body = (await ctx.request?.json()) as UpdateFeatureInput;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        hooks?.updateFeature?.before as any,
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

      const inputData: UpdateFeatureInput = (beforeResult.data as UpdateFeatureInput | undefined) || body;

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
          ...(inputData.displayName !== undefined && {
            displayName: inputData.displayName,
          }),
          ...(inputData.description !== undefined && {
            description: inputData.description,
          }),
          ...(inputData.enabled !== undefined && { enabled: inputData.enabled }),
        },
      });

      const result = { data: feature, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        hooks?.updateFeature?.after as any,
        result,
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

      return ctx.json({ data: afterResult.data || feature });
    }
  );
}

export function createDeleteFeatureEndpoint(hooks?: OrganizationFeaturesHooks) {
  return createAuthEndpoint(
    "/organization-features/features/:id",
    {
      method: "DELETE",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const featureId = ctx.params.id;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        hooks?.deleteFeature?.before as any,
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

      const result = { data: { success: true }, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        hooks?.deleteFeature?.after as any,
        result,
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

export function createToggleFeatureEndpoint(hooks?: OrganizationFeaturesHooks) {
  return createAuthEndpoint(
    "/organization-features/features/:id/toggle",
    {
      method: "POST",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const featureId = ctx.params.id;
      const body = (await ctx.request?.json()) as { enabled: boolean };
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        hooks?.toggleFeature?.before as any,
        featureId,
        body.enabled,
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

      const enabled = beforeResult.data !== undefined ? beforeResult.data : body.enabled;

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
          enabled,
        },
      });

      const result = { data: feature, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        hooks?.toggleFeature?.after as any,
        result,
        featureId,
        enabled,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json({ data: afterResult.data || feature });
    }
  );
}
