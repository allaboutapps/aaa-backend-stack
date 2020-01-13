# No build here, only dev environment
FROM node:10
EXPOSE 8080

# Yes no maybe. This is strange. Although all default shells are bash and bash has been set as the shell for yarn/npm to use, 
# it still runs everything as /bin/sh for some weird reason. Let's make sure it doesn't. Naughty yarn. 
RUN rm /bin/sh \ 
    && ln -s /bin/bash /bin/sh

# We use ssmtp (provides a sendmail binary) to relay emails to servers (must be custom configured)
# https://blog.philippklaus.de/2011/03/set-up-sending-emails-on-a-local-system-by-transfering-it-to-a-smtp-relay-server-smarthost
# Configure by mounting /etc/ssmtp/ssmtp.conf
RUN apt-get update \
    && apt-get install -y ssmtp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install required system dependencies
# E.g.
# RUN set -e \
#     && apt-get update \
#     && apt-get install -y --no-install-recommends \
#     imagemagick \
#     && rm -rf /var/lib/apt/lists/*

# https://github.com/nodejs/docker-node/issues/661
# Remove the version of yarn that is coming with node:10 & Install latest yarn
RUN rm -f /usr/local/bin/yarn && \
    curl -o- -L https://yarnpkg.com/install.sh | bash && \
    chmod +x ~/.yarn/bin/yarn && \
    ln -s ~/.yarn/bin/yarn /usr/local/bin/yarn

# Comment int, if using psql cli in tests
# TESTS_ONLY: We need an psql client (any version, fuckit) to execute tests that utilize the psql cli
# RUN set -e \
#     && apt-get update \
#     && apt-get install -y --no-install-recommends \
#     postgresql-client \
#     && rm -rf /var/lib/apt/lists/*
