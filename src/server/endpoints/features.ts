import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import type {
  Feature,
  CreateFeatureInput,
  UpdateFeatureInput,
} from "../../shared/types.js";
import { FeatureFlagsPluginOptions } from "../plugin.js";
import { runBeforeHook, runAfterHook } from "../hook-helpers.js";

/**
 * Admin-only endpoints for managing features
 */

export function createCreateFeatureEndpoint(
  options?: FeatureFlagsPluginOptions
) {
  return createAuthEndpoint(
    "/features/create-feature",
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
        options?.hooks?.createFeature?.before as any,
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

      const inputData: CreateFeatureInput =
        (beforeResult.data as CreateFeatureInput | undefined) || body;

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

      if (!user || !user.role.includes("admin")) {
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
          active: inputData.active ?? true,
        },
      });

      const result = { data: feature, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        options?.hooks?.createFeature?.after as any,
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

      return ctx.json(afterResult.data || feature);
    }
  );
}

export function createListFeaturesEndpoint(
  options?: FeatureFlagsPluginOptions
) {
  return createAuthEndpoint(
    "/features/list-features",
    {
      method: "GET",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        options?.hooks?.listFeatures?.before as any,
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

      if (!user || !user.role.includes("admin")) {
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
        options?.hooks?.listFeatures?.after as any,
        result,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json(afterResult.data || features);
    }
  );
}

export function createUpdateFeatureEndpoint(
  options?: FeatureFlagsPluginOptions
) {
  return createAuthEndpoint(
    "/features/update-feature/:id",
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
        options?.hooks?.updateFeature?.before as any,
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

      const inputData: UpdateFeatureInput =
        (beforeResult.data as UpdateFeatureInput | undefined) || body;

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

      if (!user || !user.role.includes("admin")) {
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
          ...(inputData.active !== undefined && { active: inputData.active }),
        },
      });

      const result = { data: feature, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        options?.hooks?.updateFeature?.after as any,
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

      return ctx.json((afterResult.data || feature) as Feature);
    }
  );
}

export function createDeleteFeatureEndpoint(
  options?: FeatureFlagsPluginOptions
) {
  return createAuthEndpoint(
    "/features/delete-feature/:id",
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
        options?.hooks?.deleteFeature?.before as any,
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

      if (!user || !user.role.includes("admin")) {
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

      // Delete feature (cascade will remove feature flags)
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
        options?.hooks?.deleteFeature?.after as any,
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

      return ctx.json(afterResult.data || { success: true });
    }
  );
}

export function createToggleFeatureEndpoint(
  options?: FeatureFlagsPluginOptions
) {
  return createAuthEndpoint(
    "/features/toggle-feature/:id",
    {
      method: "POST",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const featureId = ctx.params.id;
      const body = (await ctx.request?.json()) as { active: boolean };
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        options?.hooks?.toggleFeature?.before as any,
        featureId,
        body.active,
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

      const active =
        beforeResult.data !== undefined ? beforeResult.data : body.active;

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

      if (!user || !user.role.includes("admin")) {
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

      // Toggle feature active state
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
          active,
        },
      });

      const result = { data: feature, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        options?.hooks?.toggleFeature?.after as any,
        result,
        featureId,
        active,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json((afterResult.data || feature) as Feature);
    }
  );
}

export function createGetAvailableFeaturesEndpoint(
  options?: FeatureFlagsPluginOptions
) {
  return createAuthEndpoint(
    "/features/get-available-features",
    {
      method: "GET",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { adapter, session } = ctx.context;
      const hookContext = { session };

      // Run before hook
      const beforeResult = await runBeforeHook(
        options?.hooks?.getAvailableFeatures?.before as any,
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

      // Get all features for the feature flags
      const features: Feature[] = await adapter.findMany({
        model: "feature",
        where: [
          {
            field: "active",
            operator: "eq",
            value: true,
          },
        ],
      });

      const result = { data: features, error: null };

      // Run after hook
      const afterResult = await runAfterHook(
        options?.hooks?.getAvailableFeatures?.after as any,
        result,
        hookContext
      );

      if (afterResult.error) {
        return ctx.json(
          { error: afterResult.error.message },
          { status: afterResult.error.status || 500 }
        );
      }

      return ctx.json(afterResult.data || features);
    }
  );
}
