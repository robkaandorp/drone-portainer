# Copilot instructions for drone-portainer

## Build, test, and lint commands
- Install dependencies: `pnpm install --frozen-lockfile` (matches Docker build) or `pnpm install`.
- Build: `pnpm run build` (runs `tsc` and outputs to `dist/`).
- Test suite: no test runner/scripts are configured in this repository.
- Run a single test: not available (no test framework is configured yet).
- Lint: no lint script/tooling is configured in this repository.

## High-level architecture
- This repository is a Drone plugin that deploys a compose stack to Portainer; the runtime logic is centered in `src/index.ts` and compiles to `dist/index.js`.
- The runtime flow is sequential: authenticate to Portainer (`/auth`) -> resolve endpoint by name (`/endpoints`) -> validate registry (`/registries`) -> pull configured image -> create or update stack.
- Stack mode depends on `PLUGIN_STANDALONE`: swarm mode reads swarm ID and filters stacks by swarm; standalone mode skips swarm lookups.
- Compose content is read from a file in the workspace (default `docker-compose.yml`) and submitted as string content to Portainer create/update APIs.
- Container packaging uses a multi-stage Dockerfile: build with pnpm + TypeScript in `builder`, then run `node /app/dist/index.js` in a slim runtime stage.
- GitHub Actions workflow `.github/workflows/docker-image.yml` builds on develop pushes and pull requests without publishing; master pushes publish Docker Hub tags `v<version>` and `latest` and create a GitHub release. The version comes from `package.json` and must be plain MAJOR.MINOR.PATCH semver.

## Key repository conventions
- Drone plugin settings are consumed through `PLUGIN_*` environment variables; keep this contract when adding settings.
- `PLUGIN_PORTAINER_ALLOW_SELF_SIGNED` (and `PORTAINER_ALLOW_SELF_SIGNED` outside Drone) is an opt-in escape hatch for self-signed Portainer HTTPS certificates and should remain disabled by default.
- The compose file is expected in repo root and can use `$imageName` and `$stackName`; these are injected automatically, along with `$imageTag`.
- Optional compose environment values come from `PLUGIN_COMPOSE_ENVIRONMENT` as a JSON object string and are appended to the default environment entries.
- Endpoint selection uses endpoint name (`PLUGIN_ENDPOINT`), not endpoint ID; stack selection also resolves by stack name.
- Registry pre-check is required: the configured registry URL must already exist in Portainer, and only the single configured image is pre-pulled by this plugin.
- Stack operations always send `Prune: true`; update requests set `PullImage` based on `PLUGIN_FORCE_PULL`.
