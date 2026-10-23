# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-23

### Security
- Upgraded axios to 1.20.0 to fix the axios advisories published 2026-09-30: GHSA-m8m8-qj5v-23w3, GHSA-r4gj-5m52-g5wh, and GHSA-c29m-xwm3-cm6r.

### Changed
- Switched to semantic versioning, with the version taken from `package.json`.
- Docker Hub tags are now `v<version>` and `latest`, and every release gets a GitHub release/tag.
- CI builds on develop pushes and pull requests without publishing.
- Pinned the Docker base image to `node:24-alpine` (Node.js 24 LTS).
- Now use TypeScript 7, pnpm 12, and `@types/node` 24.

### Fixed
- `package.json` `main` now points to `dist/index.js`.

### Deprecated / Notes
- The old `v2.16` / `v2.16.N` Docker Hub tags are no longer updated. Users pinned to `:v2.16` should switch to `:v1.0.0` or `:latest`.

Plugin behaviour is unchanged from v2.16.27, including opt-in self-signed certificate support (`portainer_allow_self_signed`).

Releases before 1.0.0 were published only as `v2.16.N` Docker tags, without a changelog.

[Unreleased]: https://github.com/robkaandorp/drone-portainer/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/robkaandorp/drone-portainer/releases/tag/v1.0.0
