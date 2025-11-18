# @emplv/better-auth-feature-flags

A Better Auth plugin for managing feature flags for users and organizations. This plugin allows administrators to create, manage, and activate/deactivate features for users and organizations, while providing an easy way for users to check feature availability based on their active organization.

## Features

- **Feature Management**: Create, update, delete, activate and deactivate features globally
- **User/Organization-Specific Features**: Enable/disable features per user/organization
- **Feature Flag Logic**: Features are only enabled when both globally active AND explicitly enabled for the organization
- **TypeScript Support**: Full TypeScript support with comprehensive types

## Installation

```bash
npm install @emplv/better-auth-feature-flags
```

## Prerequisites

This plugin requires the following Better Auth plugins:

- `@better-auth/admin` - For admin role verification
- (optional) `@better-auth/organization` - For organization management

## Setup

### Server Configuration

Add the plugin to your Better Auth configuration:

```typescript
import { betterAuth } from "better-auth";
import { featureFlagsPlugin } from "@emplv/better-auth-feature-flags";

export const auth = betterAuth({
  plugins: [
    // ... other plugins
    featureFlagsPlugin(),
  ],
});
```

### Client Configuration

Add the client plugin to your auth client:

```typescript
import { createAuthClient } from "better-auth/client";
import { featureFlagsClientPlugin } from "@emplv/better-auth-feature-flags/client";

const authClient = createAuthClient({
  plugins: [
    // ... other plugins
    featureFlagsClientPlugin,
  ],
});
```

## Hooks

The plugin supports before and after hooks for all actions, allowing you to intercept, modify, or skip operations. Hooks are optional and can be configured when initializing the plugin.

### Hook Types

**Before Hooks** run before the action executes. They can:

- Modify the input data
- Skip the action entirely (return early with custom data)
- Return an error to stop execution

**After Hooks** run after the action completes. They can:

- Modify the result data
- Return an error to override the response

### Hook Context

All hooks receive a `HookContext` object containing:

- `session`: The current user session (or null if not authenticated)
- Additional context properties can be added as needed

### Available Hooks

All actions support hooks:

- `createFeature` - Before/after creating a feature
- `updateFeature` - Before/after updating a feature
- `deleteFeature` - Before/after deleting a feature
- `listFeatures` - Before/after listing features
- `toggleFeature` - Before/after toggling a feature
- `setFeatureFlag` - Before/after setting a feature flag
- `removeFeatureFlag` - Before/after removing a feature flag
- `getFeatureFlags` - Before/after getting feature flags
- `getAvailableFeatures` - Before/after getting available features

### Hook Return Types

**Before Hook Result:**

```typescript
interface BeforeHookResult<T = unknown> {
  data?: T; // Modified input data (optional)
  error?: {
    // Error to return (optional)
    message: string;
    status?: number;
  };
  skip?: boolean; // If true, skip the action and return data
}
```

**After Hook Result:**

```typescript
interface AfterHookResult<T = unknown> {
  data?: T; // Modified result data (optional)
  error?: {
    // Error to return (optional)
    message: string;
    status?: number;
  };
}
```

### Usage Examples

#### Basic Hook Example

```typescript
import { featureFlagsPlugin } from "@emplv/better-auth-feature-flags";

export const auth = betterAuth({
  plugins: [
    featureFlagsPlugin({
      hooks: {
        createFeature: {
          before: async (input, context) => {
            // Log the creation attempt
            console.log("Creating feature:", input.name);

            // Modify the input
            return {
              data: {
                ...input,
                description: input.description || "No description provided",
              },
            };
          },
          after: async (result, input, context) => {
            // Log successful creation
            if (result.data) {
              console.log("Feature created:", result.data.id);
            }

            // Return empty object to use original result
            return {};
          },
        },
      },
    }),
  ],
});
```

#### Skip Action Example

```typescript
featureFlagsPlugin({
  hooks: {
    deleteFeature: {
      before: async (featureId, context) => {
        // Prevent deletion of critical features
        if (featureId === "critical-feature-id") {
          return {
            skip: true,
            error: {
              message: "Cannot delete critical features",
              status: 403,
            },
          };
        }

        // Allow deletion
        return {};
      },
    },
  },
});
```

#### Modify Result Example

```typescript
featureFlagsPlugin({
  hooks: {
    getAvailableFeatures: {
      after: async (result, context) => {
        if (result.data) {
          // Add additional metadata to features
          const enhancedFeatures = result.data.map((feature) => ({
            ...feature,
            metadata: {
              fetchedAt: new Date().toISOString(),
            },
          }));

          return {
            data: enhancedFeatures,
          };
        }

        return {};
      },
    },
  },
});
```

#### Validation Example

```typescript
featureFlagsPlugin({
  hooks: {
    createFeature: {
      before: async (input, context) => {
        // Validate feature name format
        if (!/^[a-z0-9-]+$/.test(input.name)) {
          return {
            skip: true,
            error: {
              message:
                "Feature name must be lowercase alphanumeric with hyphens",
              status: 400,
            },
          };
        }

        // Continue with modified input
        return {
          data: {
            ...input,
            name: input.name.toLowerCase(),
          },
        };
      },
    },
  },
});
```

#### Audit Logging Example

```typescript
featureFlagsPlugin({
  hooks: {
    setFeatureFlag: {
      after: async (result, organizationId, featureId, input, context) => {
        if (result.data && context.session?.user) {
          // Log the action to an audit system
          await auditLog.create({
            action: "setFeatureFlag",
            userId: context.session.user.id,
            organizationId,
            featureId,
            enabled: input.enabled,
            timestamp: new Date(),
          });
        }

        return {};
      },
    },
  },
});
```

### Hook Execution Flow

1. **Before Hook** executes

   - If `skip: true` is returned, the action is skipped and the hook's data/error is returned
   - If `data` is returned, it replaces the original input
   - If `error` is returned, execution stops and error is returned

2. **Action** executes with modified input (if any)

3. **After Hook** executes
   - If `data` is returned, it replaces the action's result
   - If `error` is returned, it overrides the result with an error

### Notes

- Hooks are **optional** - if not provided, actions execute normally
- Hooks are **async** - they can perform async operations (database queries, API calls, etc.)
- Hook errors take precedence - if a hook returns an error, it will be returned to the client
- Hook data modifications are type-safe - TypeScript will enforce correct types

## Database Schema

The plugin automatically creates two tables:

### `features` Table

- `id` (string, primary key)
- `name` (string, unique) - Feature identifier (e.g., "advanced-analytics")
- `displayName` (string) - Human-readable name
- `description` (string, nullable)
- `active` (boolean) - Global toggle
- `createdAt` (date)
- `updatedAt` (date)

### `featureFlags` Table

- `id` (string, primary key)
- `userId` (string?, foreign key) - References `user.id`
- `organizationId` (string?, foreign key) - References `organization.id` (conditionally added)
- `featureId` (string, foreign key) - References `feature.id`
- `enabled` (boolean) - Organization-specific toggle
- `createdAt` (date)
- `updatedAt` (date)

**Note**: Better Auth handles database migrations automatically. The tables will be created when you run your Better Auth setup.

## API Reference

### Server Endpoints

#### Admin Endpoints

All admin endpoints require authentication and admin role verification.

##### Create Feature

```http
POST /api/auth/features/create-feature
```

**Request Body:**

```typescript
{
  name: string;              // Unique feature identifier
  displayName: string;       // Human-readable name
  description?: string;      // Optional description
  active?: boolean;         // Defaults to true
}
```

**Response:**

```typescript
{
  data: Feature;
  error: null;
}
```

**Example:**

```typescript
const { data, error } = await authClient.features.createFeature({
  name: "advanced-analytics",
  displayName: "Advanced Analytics",
  description: "Enable advanced analytics dashboard",
  active: true,
});
```

##### Update Feature

```http
PUT /api/auth/features/update-feature/:id
```

**Request Body:**

```typescript
{
  displayName?: string;
  description?: string;
  active?: boolean;
}
```

**Response:**

```typescript
{
  data: Feature;
  error: null;
}
```

**Example:**

```typescript
const { data, error } = await authClient.features.updateFeature(
  "feature-id",
  {
    displayName: "Updated Name",
    active: false,
  }
);
```

##### List Features

```http
GET /api/auth/features/list-features
```

**Response:**

```typescript
{
  data: Feature[];
  error: null;
}
```

**Example:**

```typescript
const { data, error } = await authClient.features.listFeatures();
```

##### Delete Feature

```http
DELETE /api/auth/features/delete-feature/:id
```

**Response:**

```typescript
{
  data: {
    success: boolean;
  }
  error: null;
}
```

**Example:**

```typescript
const { data, error } = await authClient.features.deleteFeature(
  "feature-id"
);
```

**Note**: Deleting a feature will cascade and remove all organization feature associations.

##### Toggle Feature

```http
POST /api/auth/features/toggle-feature/:id
```

**Request Body:**

```typescript
{
  active: boolean;
}
```

**Response:**

```typescript
{
  data: Feature;
  error: null;
}
```

**Example:**

```typescript
const { data, error } = await authClient.features.toggleFeature(
  "feature-id",
  false
);
```

##### Set User/Organization Feature

Enable or disable a feature for a specific feature - either user or organization.

```http
POST /api/auth/features/:featureId/set-feature-flag
```

**Request Body:**

```typescript
{
  enabled: boolean;
  userId: string;
} | {
  enabled: boolean;
  organizationId: string;
}
```

**Response:**

```typescript
{
  data: FeatureFlag;
  error: null;
}
```

**Example:**

```typescript
const { data, error } = await authClient.features.setFeatureFlag(
  "feature-id",
  { enabled: true, userId: "user123" } || {
    enabled: true,
    organizationId: "org123",
  }
);
```

**Note**: The feature must be globally active (`features.active = true`) before it can be enabled for a user or an organization.

##### Remove User/Organization Feature

Remove a feature from an organization.

```http
DELETE /api/auth/features/:featureId/remove-feature-flag/:featureFlagId
```

**Response:**

```typescript
{
  data: {
    success: boolean;
  }
  error: null;
}
```

**Example:**

```typescript
const { data, error } = await authClient.features.removeFeatureFlag(
  "feature-id"
  "feature-flag-id",
);
```

#### User Endpoints

##### Get User/Organization Features

Get all enabled features for a specific organization (members only).

```http
GET /api/auth/features/feature-flags/
```

**Response:**

```typescript
{
  data: FeatureFlagWithDetails[];
  error: null;
}
```

**Example:**

```typescript
const { data, error } = await authClient.features.getFeatureFlags();
```

##### Get Available Features

Get all active features for the current user's active organization.

```http
GET /api/auth/features/available-features
```

**Response:**

```typescript
{
  data: Feature[];
  error: null;
}
```

**Example:**

```typescript
const { data, error } = await authClient.features.getAvailableFeatures();
```

## Client Methods

### Admin Methods

```typescript
// Create a feature
createFeature(data: CreateFeatureInput): Promise<{ data: Feature; error: null } | { data: null; error: unknown }>;

// Update a feature
updateFeature(featureId: string, data: UpdateFeatureInput): Promise<{ data: Feature; error: null } | { data: null; error: unknown }>;

// List all features
listFeatures(): Promise<{ data: Feature[]; error: null } | { data: null; error: unknown }>;

// Delete a feature
deleteFeature(featureId: string): Promise<{ data: { success: boolean }; error: null } | { data: null; error: unknown }>;

// Toggle feature global state
toggleFeature(featureId: string, active: boolean): Promise<{ data: Feature; error: null } | { data: null; error: unknown }>;

// Enable/disable feature for organization
setFeatureFlag(
  userIdOrOrganizationId: string,
  featureId: string,
  data: SetFeatureFlagInput
): Promise<{ data: FeatureFlagWithDetails; error: null } | { data: null; error: unknown }>;

// Remove feature from organization
removeFeatureFlag(
  featureFlagId: string,
  featureId: string
): Promise<{ data: { success: boolean }; error: null } | { data: null; error: unknown }>;
```

### User Methods

```typescript
// Get features for specific organization
getFeatureFlags(organizationId: string): Promise<{ data: FeatureFlagWithDetails[]; error: null } | { data: null; error: unknown }>;

// Get available features for current active organization
getAvailableFeatures(): Promise<{ data: FeatureFlagWithDetails[]; error: null } | { data: null; error: unknown }>;
```

## Feature Flag Logic

A feature is enabled for an organization when **both** conditions are met:

1. **Global Feature Active**: `features.active = true`
2. **Feature Flag Enabled**: `featureFlags.enabled = true` (exists in `featureFlags` table)

If `features.active = false`, the feature is disabled for **all** users/organizations, regardless of organization-specific settings.

## Usage Examples

### Complete Example

```tsx
import { useEffect } from "react";
import { createAuthClient } from "better-auth/client";
import {
  featureFlagsClientPlugin,
  useFeatureFlag,
} from "@emplv/better-auth-feature-flags/client";

const authClient = createAuthClient({
  plugins: [featureFlagsClientPlugin],
});

function App() {
  const { enabled } = useFeatureFlag("advanced-analytics");

  // Fetch available features on mount
  useEffect(() => {
    authClient.features.getAvailableFeatures();
  }, []);

  return (
    <div>
      {enabled && <AdvancedAnalytics />}
      <OtherContent />
    </div>
  );
}
```

### Admin Feature Management

```tsx
import { authClient } from "./auth-client";

async function createAndEnableFeature() {
  // Create a new feature
  const { data: feature } = await authClient.features.createFeature({
    name: "new-feature",
    displayName: "New Feature",
    description: "A new feature",
  });

  if (!feature) return;

  // Enable it for an organization
  await authClient.features.setFeatureFlag("user-or-org-id", feature.id, {
    active: true,
  });
}
```

## TypeScript Types

```typescript
interface Feature {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FeatureFlag {
  id: string;
  userId?: string;
  organizationId?: string;
  featureId: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FeatureFlagWithDetails extends FeatureFlag {
  feature: Feature;
}

interface CreateFeatureInput {
  name: string;
  displayName: string;
  description?: string;
  active?: boolean;
}

interface UpdateFeatureInput {
  displayName?: string;
  description?: string;
  active?: boolean;
}

type SetFeatureFlagInput =
  | {
      enabled: boolean;
      userId: string;
    }
  | {
      enabled: boolean;
      organizationId: string;
    };
```

## Security

- **Admin Endpoints**: All admin endpoints require authentication and verify the user has admin role
- **Feature Checks**: Feature availability checks respect organization context from the user session

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
