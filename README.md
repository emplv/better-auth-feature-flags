# @emplv/better-auth-organization-features

A Better Auth plugin for managing organization feature flags. This plugin allows administrators to create, manage, and enable/disable features for organizations, while providing an easy way for users to check feature availability based on their active organization.

## Features

- **Feature Management**: Create, update, and delete features globally
- **Organization-Specific Features**: Enable/disable features per organization
- **Feature Flag Logic**: Features are only enabled when both globally enabled AND explicitly enabled for the organization
- **TypeScript Support**: Full TypeScript support with comprehensive types

## Installation

```bash
npm install @emplv/better-auth-organization-features
```

## Prerequisites

This plugin requires the following Better Auth plugins:
- `@better-auth/organization` - For organization management
- `@better-auth/admin` - For admin role verification

## Setup

### Server Configuration

Add the plugin to your Better Auth configuration:

```typescript
import { betterAuth } from "better-auth";
import { organizationFeaturesPlugin } from "@emplv/better-auth-organization-features";

export const auth = betterAuth({
  plugins: [
    // ... other plugins
    organizationFeaturesPlugin(),
  ],
});
```

### Client Configuration

Add the client plugin to your auth client:

```typescript
import { createAuthClient } from "better-auth/client";
import { organizationFeaturesClientPlugin } from "@emplv/better-auth-organization-features/client";

const authClient = createAuthClient({
  plugins: [
    // ... other plugins
    organizationFeaturesClientPlugin,
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
- `setOrganizationFeature` - Before/after setting an organization feature
- `removeOrganizationFeature` - Before/after removing an organization feature
- `getOrganizationFeatures` - Before/after getting organization features
- `getAvailableFeatures` - Before/after getting available features

### Hook Return Types

**Before Hook Result:**
```typescript
interface BeforeHookResult<T = unknown> {
  data?: T;           // Modified input data (optional)
  error?: {           // Error to return (optional)
    message: string;
    status?: number;
  };
  skip?: boolean;     // If true, skip the action and return data
}
```

**After Hook Result:**
```typescript
interface AfterHookResult<T = unknown> {
  data?: T;           // Modified result data (optional)
  error?: {           // Error to return (optional)
    message: string;
    status?: number;
  };
}
```

### Usage Examples

#### Basic Hook Example

```typescript
import { organizationFeaturesPlugin } from "@emplv/better-auth-organization-features";

export const auth = betterAuth({
  plugins: [
    organizationFeaturesPlugin({
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
organizationFeaturesPlugin({
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
})
```

#### Modify Result Example

```typescript
organizationFeaturesPlugin({
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
})
```

#### Validation Example

```typescript
organizationFeaturesPlugin({
  hooks: {
    createFeature: {
      before: async (input, context) => {
        // Validate feature name format
        if (!/^[a-z0-9-]+$/.test(input.name)) {
          return {
            skip: true,
            error: {
              message: "Feature name must be lowercase alphanumeric with hyphens",
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
})
```

#### Audit Logging Example

```typescript
organizationFeaturesPlugin({
  hooks: {
    setOrganizationFeature: {
      after: async (result, organizationId, featureId, input, context) => {
        if (result.data && context.session?.user) {
          // Log the action to an audit system
          await auditLog.create({
            action: "setOrganizationFeature",
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
})
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
- `enabled` (boolean) - Global toggle
- `createdAt` (date)
- `updatedAt` (date)

### `organizationFeatures` Table

- `id` (string, primary key)
- `organizationId` (string, foreign key) - References `organization.id`
- `featureId` (string, foreign key) - References `feature.id`
- `enabled` (boolean) - Organization-specific toggle
- `createdAt` (date)
- `updatedAt` (date)

**Unique Constraint**: `(organizationId, featureId)`

**Note**: Better Auth handles database migrations automatically. The tables will be created when you run your Better Auth setup.

## API Reference

### Server Endpoints

#### Admin Endpoints

All admin endpoints require authentication and admin role verification.

##### Create Feature

```http
POST /api/auth/organization-features/features
```

**Request Body:**
```typescript
{
  name: string;              // Unique feature identifier
  displayName: string;       // Human-readable name
  description?: string;      // Optional description
  enabled?: boolean;         // Defaults to true
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
const { data, error } = await authClient.organizationFeatures.createFeature({
  name: "advanced-analytics",
  displayName: "Advanced Analytics",
  description: "Enable advanced analytics dashboard",
  enabled: true,
});
```

##### Update Feature

```http
PUT /api/auth/organization-features/features/:id
```

**Request Body:**
```typescript
{
  displayName?: string;
  description?: string;
  enabled?: boolean;
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
const { data, error } = await authClient.organizationFeatures.updateFeature(
  "feature-id",
  {
    displayName: "Updated Name",
    enabled: false,
  }
);
```

##### List Features

```http
GET /api/auth/organization-features/features
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
const { data, error } = await authClient.organizationFeatures.listFeatures();
```

##### Delete Feature

```http
DELETE /api/auth/organization-features/features/:id
```

**Response:**
```typescript
{
  data: { success: boolean };
  error: null;
}
```

**Example:**
```typescript
const { data, error } = await authClient.organizationFeatures.deleteFeature(
  "feature-id"
);
```

**Note**: Deleting a feature will cascade and remove all organization feature associations.

##### Toggle Feature

```http
POST /api/auth/organization-features/features/:id/toggle
```

**Request Body:**
```typescript
{
  enabled: boolean;
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
const { data, error } = await authClient.organizationFeatures.toggleFeature(
  "feature-id",
  false
);
```

##### Set Organization Feature

Enable or disable a feature for a specific organization.

```http
POST /api/auth/organization-features/organizations/:organizationId/features/:featureId
```

**Request Body:**
```typescript
{
  enabled: boolean;
}
```

**Response:**
```typescript
{
  data: OrganizationFeature;
  error: null;
}
```

**Example:**
```typescript
const { data, error } = await authClient.organizationFeatures.setOrganizationFeature(
  "org-id",
  "feature-id",
  { enabled: true }
);
```

**Note**: The feature must be globally enabled (`features.enabled = true`) before it can be enabled for an organization.

##### Remove Organization Feature

Remove a feature from an organization.

```http
DELETE /api/auth/organization-features/organizations/:organizationId/features/:featureId
```

**Response:**
```typescript
{
  data: { success: boolean };
  error: null;
}
```

**Example:**
```typescript
const { data, error } = await authClient.organizationFeatures.removeOrganizationFeature(
  "org-id",
  "feature-id"
);
```

#### User Endpoints

##### Get Organization Features

Get all enabled features for a specific organization (members only).

```http
GET /api/auth/organization-features/organizations/:organizationId/features
```

**Response:**
```typescript
{
  data: OrganizationFeatureWithDetails[];
  error: null;
}
```

**Example:**
```typescript
const { data, error } = await authClient.organizationFeatures.getOrganizationFeatures(
  "org-id"
);
```

##### Get Available Features

Get all enabled features for the current user's active organization.

```http
GET /api/auth/organization-features/features/available
```

**Response:**
```typescript
{
  data: OrganizationFeatureWithDetails[];
  error: null;
}
```

**Example:**
```typescript
const { data, error } = await authClient.organizationFeatures.getAvailableFeatures();
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
toggleFeature(featureId: string, enabled: boolean): Promise<{ data: Feature; error: null } | { data: null; error: unknown }>;

// Enable/disable feature for organization
setOrganizationFeature(
  organizationId: string,
  featureId: string,
  data: SetOrganizationFeatureInput
): Promise<{ data: OrganizationFeatureWithDetails; error: null } | { data: null; error: unknown }>;

// Remove feature from organization
removeOrganizationFeature(
  organizationId: string,
  featureId: string
): Promise<{ data: { success: boolean }; error: null } | { data: null; error: unknown }>;
```

### User Methods

```typescript
// Get features for specific organization
getOrganizationFeatures(organizationId: string): Promise<{ data: OrganizationFeatureWithDetails[]; error: null } | { data: null; error: unknown }>;

// Get available features for current active organization
getAvailableFeatures(): Promise<{ data: OrganizationFeatureWithDetails[]; error: null } | { data: null; error: unknown }>;
```

## Feature Flag Logic

A feature is enabled for an organization when **both** conditions are met:

1. **Global Feature Enabled**: `features.enabled = true`
2. **Organization Feature Enabled**: `organizationFeatures.enabled = true` (exists in `organizationFeatures` table)

If `features.enabled = false`, the feature is disabled for **all** organizations, regardless of organization-specific settings.

## Usage Examples

### Complete Example

```tsx
import { useEffect } from "react";
import { createAuthClient } from "better-auth/client";
import { organizationFeaturesClientPlugin, useFeatureFlag } from "@emplv/better-auth-organization-features/client";

const authClient = createAuthClient({
  plugins: [organizationFeaturesClientPlugin],
});

function App() {
  const { enabled } = useFeatureFlag("advanced-analytics");

  // Fetch available features on mount
  useEffect(() => {
    authClient.organizationFeatures.getAvailableFeatures();
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
  const { data: feature } = await authClient.organizationFeatures.createFeature({
    name: "new-feature",
    displayName: "New Feature",
    description: "A new feature",
  });

  if (!feature) return;

  // Enable it for an organization
  await authClient.organizationFeatures.setOrganizationFeature(
    "org-id",
    feature.id,
    { enabled: true }
  );
}
```

## TypeScript Types

```typescript
interface Feature {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationFeature {
  id: string;
  organizationId: string;
  featureId: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationFeatureWithDetails extends OrganizationFeature {
  feature: Feature;
}

interface CreateFeatureInput {
  name: string;
  displayName: string;
  description?: string;
  enabled?: boolean;
}

interface UpdateFeatureInput {
  displayName?: string;
  description?: string;
  enabled?: boolean;
}

interface SetOrganizationFeatureInput {
  enabled: boolean;
}
```

## Security

- **Admin Endpoints**: All admin endpoints require authentication and verify the user has admin role
- **Organization Endpoints**: Organization feature endpoints verify membership before allowing access
- **Feature Checks**: Feature availability checks respect organization context from the user session

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

