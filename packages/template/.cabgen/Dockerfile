FROM node:8
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

# Setup /app/ with current code
WORKDIR /app

# https://github.com/nodejs/docker-node/issues/661
# Remove the version of yarn that is coming with node:8 & Install latest yarn
RUN rm -f /usr/local/bin/yarn && \
    curl -o- -L https://yarnpkg.com/install.sh | bash && \
    chmod +x ~/.yarn/bin/yarn && \
    ln -s ~/.yarn/bin/yarn /usr/local/bin/yarn

# First only copy the package.json, yarn.lock, .yarnrc files + install all deps WITHOUT executing any scripts
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
#COPY .yarnrc /app/.yarnrc -> not needed anymore, now that we are in public registry
# `--production=false` is required since the default node image sets `NODE_ENV production`, which causes yarn to not install any devDependencies
RUN yarn install --pure-lockfile --production=false 

# Now copy the project sources, link, and build project
COPY tsconfig.json /app/tsconfig.json
COPY ./src /app/src
RUN yarn tsc

# Finally copy in all workspace files
COPY . /app/

# All done. This is the start command:
CMD ["node", "build/api/index.js"]
