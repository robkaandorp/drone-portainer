# drone-portainer

> Drone portainer plugin to update a portainer stack with a docker compose file.

[![Docker Image CI](https://github.com/robkaandorp/drone-portainer/actions/workflows/docker-image.yml/badge.svg)](https://github.com/robkaandorp/drone-portainer/actions/workflows/docker-image.yml)

## Version history

| Version | Remark                                                                                  |
| ------- | --------------------------------------------------------------------------------------- |
| v2.16   | Maintenance release. Works with at least portainer v2.14 and v2.16, but others as well. |

## Usage

This image can be used as a drone plugin to deploy a compose file to portainer. For example:

``` yaml
---
kind: pipeline
type: docker
name: default

- name: deploy
  image: robkaandorp/drone-portainer
  settings:
    portainer_url: http://<ip or hostname>:9000
    portainer_username:
      from_secret: portainer_username
    portainer_password:
      from_secret: portainer_password
    endpoint: primary # The endpoint name in portainer, most of the time this is 'primary' or 'local'.
    registry: <URL of private registry>
    image: example/example-image
    image_tag: ${DRONE_COMMIT_BRANCH}-${DRONE_BUILD_NUMBER}
    stack_name: example-stack
    standalone: false
    compose_environment:
      from_secret: compose_environment
```

The compose file should be named `docker-compose.yml` and be placed in the root of the workspace.
The stack wil be created when it does not exist and updated if it does exist. Example of compose file:

``` yaml
version: "3.5"

services:

  example-service:
    image: $imageName
    restart: always
    ports:
      - 8080:8080
```

The `$imageName` and `$stackName` environment is already set and need not be supplied through `compose_environment`.

The plugin will pull the image before applying the compose file. If it needs to be pulled from a private
registry, the registry and authentication should be configured in portainer. The limitation is you can only 
supply one image in the settings. The compose file can specify more images, but the others will not be pulled
automatically by portainer (at the time of this writing).

The `compose_environment` can be used to supply environment settings to the stack. This is optional. It should be in
the form of a json object:

``` yaml
    compose_environment:
      key1: value1
      key2: value2
```

When setting the `compose_environment` from a secret, use json notation in the secret:

``` json
{
    "key1": "value1",
    "key2": "value2"
}
```

If you are using portainer without swarm, set the standalone option to `true`. By default, drone is using the swarm version.
