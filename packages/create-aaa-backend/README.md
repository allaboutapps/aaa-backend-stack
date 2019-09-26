# create-aaa-backend

CLI to setup a new aaa-backend project as defined in the private template package monorepo.

## Quickstart

1. Ensure that you have a fully working [node.js](https://nodejs.org/en/) ([LTS](https://github.com/nodejs/Release)) environment installed on your local system. Use [nvm](https://github.com/creationix/nvm) if you want to manage several local node.js versions.
    * (optional: vagrant) Install [VirtualBox](https://www.virtualbox.org/wiki/Downloads), [Vagrant](http://sourabhbajaj.com/mac-setup/Vagrant/README.html), [vagrant-vbguest](https://github.com/dotless-de/vagrant-vbguest) and [Ansible](http://docs.ansible.com/ansible/intro_installation.html#latest-releases-via-pip)
    * (optional: docker) The scaffolder will try to autobuild your project with docker if installed. Install [Docker 17.07+ (Edge)](https://store.docker.com/editions/community/docker-ce-desktop-mac).
        * (macOS only) Your Docker subnet must be set something different than `192.168.65.0/24`, as it covers our aaa internal network, e.g. `10.0.10.0/24`. See `Docker Toolbar > Preferences > Advanced > Docker subnet`.
2. Install the latest version of yarn@v1.x: `npm install -g yarn`
3. `npm install -g create-aaa-backend` OR `yarn global add create-aaa-backend`
4. Create a new project via: `create-aaa-backend scaffold`.
5. See `YOUR_PROJECT/README.md` for general project information.
6. See `YOUR_PROJECT/README-DOCKER.md` or `YOUR_PROJECT/README-VAGRANT.md` for more information on your dev environment.
7. See `YOUR_PROJECT/README-DEPLOYMENT.md` for information on deployment setup / scenarios.

## Local testing of this command inside the monorepo

`yarn create-aaa-backend-local-monorepo`