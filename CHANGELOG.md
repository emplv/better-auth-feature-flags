# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
