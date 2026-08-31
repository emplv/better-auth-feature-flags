# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-08-31

### Changed

- **BREAKING (peer dep):** Bumped `better-auth` peer dependency from `^1.6.9` to `^1.7.2`.
- **BREAKING (client types/runtime):** Client actions are now namespaced under `features`
  in `getActions`, matching the documented `authClient.features.*` API. Calls are served by
  typed closures (correct HTTP methods) instead of better-auth's dynamic path proxy, and the
  flat root-level actions (`authClient.createFeature`, ...) no longer exist.
- `featureFlagsClientPlugin()` now returns the precise `FeatureFlagsClientPlugin` literal type
  instead of the widened `BetterAuthClientPlugin`. better-auth 1.7's client inference collapses
  every plugin's API to `never` when any plugin in the array is widened; with this release,
  `createAuthClient` infers `authClient.features.*` directly and consumer-side casts can be removed.
- `featureFlagsPlugin()` (server) likewise returns its literal type so `auth.api.*` endpoint
  inference works under better-auth 1.7.

### Removed

- The `declare module "better-auth/client"` augmentation of `BetterAuthClient`; the interface
  no longer exists in better-auth 1.7 and actions are now inferred without it.

### Notes

- `FeatureFlagsClientPlugin.getActions` is deliberately typed without its `$fetch` parameter:
  referencing `BetterFetch` in the public declaration ties it to this package's copy of
  `@better-fetch/fetch` and breaks assignability against the host app's copy.

## [0.2.0] — 2026-05-06

### Changed

- **BREAKING (peer dep):** Bumped `better-auth` peer dependency from `^1.4.13` to `^1.6.9`.
  Consumers must upgrade to `better-auth@1.6.9` (or any compatible 1.6.x release) before installing this version.

### Notes

- Plugin source uses only stable `better-auth` public API (`BetterAuthPlugin`, `createAuthEndpoint`,
  `sessionMiddleware`, `BetterAuthClientPlugin`); no internal-API changes were required.
- See [better-auth v1.5 release notes](https://github.com/better-auth/better-auth/releases/tag/v1.5.0)
  and [v1.6 release notes](https://github.com/better-auth/better-auth/releases/tag/v1.6.0)
  for upstream breaking changes consumers may need to address in their own apps
  (notably `freshAge` semantics and the `apiKey` plugin moving to `@better-auth/api-key`).
