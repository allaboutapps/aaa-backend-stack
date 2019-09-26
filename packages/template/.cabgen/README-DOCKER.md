# Docker README

> Heads up Mac Users: You will need to have Docker of Mac 17.07+ installed and set your Docker subnet to 10.0.10.0/24 (instead of the default 192.168.65.0/24 network)

## Docker Quickstart

Prerequisite: [Install Docker 17.07+ (Edge)](https://store.docker.com/editions/community/docker-ce-desktop-mac).

    # First start
    $ make create-aaa-backend-docker-setup # typically already done by create-aaa-backend
    $ make migrate
    $ make start

    # Delete the containers and DB volume
    $ make clean

    # Start the tests in Docker
    $ make test

    # Rebuild the Docker images
    $ make rebuild
    $ make rebuild-test

    # Cleanup: remove the containers and DB volume
    $ make clean


## Installing new packages

This is how you can install new npm packages:

* Get a shell in a running `service` container: `make ssh`
* Install the package with `yarn add <pkg>`

# Debugging

## Tests

Logging into the test database:

    # Start the test setup
    $ docker-compose -f docker-compose.test.yml up

    # Enter the postgres container
    $ docker exec -it templatenodehapi_postgres-test_1 /bin/bash

    # In the postgres container, enter psql
    root@63ad229826af:/# su -c psql postgres

Useful `psql` commands:

* list databases: `\l`
* connect to db: `\c <database>`
* list tables: `\dt`


# Findings

### FS Watcher

We will need a watcher for the tests soon, because starting Docker container for the tests takes a while.


### Postgres tmpfs

`tmpfs` on `/var/lib/postgresql/data` seems to make things even about 1-2s slower.
It can be enabled in the docker compose file with the following directive;

    tmpfs:
      - /var/lib/postgresql/data


### Image size

node:6 = 661 mb
template without psql: 910 mb
template with psql: 947 mb

`templatenodehapi_service                            latest              0f999e2469d2        4 days ago          947 MB`

multistage builds: only available starting Docker 17.05. Waiting for it...

---

# Migration to Docker

[Tutorial Base](http://jdlm.info/articles/2016/03/06/lessons-building-node-app-docker.html)
[@ Github](https://github.com/jdleesmiller/docker-chat-demo)
[Compose v2](https://medium.com/@giorgioto/docker-compose-yml-from-v1-to-v2-3c0f8bb7a48e#.cfvjn8evz)

# TODO

- Database permissions done right?

