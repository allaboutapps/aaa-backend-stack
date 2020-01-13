# Docker README

> Heads up Mac Users: You will need to have Docker of Mac 17.07+ installed and set your Docker subnet to 10.0.10.0/24 (instead of the default 192.168.65.0/24 network)

## Docker Quickstart

Prerequisite: [Install Docker 17.07+ (Edge)](https://store.docker.com/editions/community/docker-ce-desktop-mac).

    # Start into docker container similar to vagrant vm
    $ yarn docker:up

    # Stop containers similar to vagrant vm
    $ yarn docker:halt

    # Destroy containers, images and volumes similar to vagrant vm
    $ yarn docker:destroy

    
## Installing new packages

Workk inside container same as you would in a vagrant vm

# Debugging

## Tests

Logging into the test database:

Connect to your running local db via localhost:5432 using your favourite db client

# Findings

*TODO: Update this section! Probably deprecated*

### Postgres tmpfs

`tmpfs` on `/var/lib/postgresql/data` seems to make things even about 1-2s slower.
It can be enabled in the docker compose file with the following directive;

    tmpfs:
      - /var/lib/postgresql/data


multistage builds: only available starting Docker 17.05. Waiting for it...

---

# Migration to Docker

[Tutorial Base](http://jdlm.info/articles/2016/03/06/lessons-building-node-app-docker.html)
[@ Github](https://github.com/jdleesmiller/docker-chat-demo)
[Compose v2](https://medium.com/@giorgioto/docker-compose-yml-from-v1-to-v2-3c0f8bb7a48e#.cfvjn8evz)

# TODO

- Database permissions done right?

