# Vagrant README

## Vagrant Quickstart

Prerequisites, install these on your dev machine:

1. [VirtualBox](https://www.virtualbox.org/wiki/Downloads)
2. [Vagrant](http://sourabhbajaj.com/mac-setup/Vagrant/README.html)
3. [Ansible](http://docs.ansible.com/ansible/intro_installation.html#latest-releases-via-pip)

``` bash
# The Vagrant VM will automatically be provisioned with Ansible (see ansible/provision.yaml)
local$ vagrant up

# SSH into provisioned VM
local$ vagrant ssh

# Go to project dir and install dependencies + build
vagrant$ cd /vagrant
vagrant$ yarn

# Test (runs migrations + fixtures automatically)
vagrant$ yarn test  # execute test suite

# Start
vagrant$ yarn db migrate
vagrant$ yarn start  # starts the server
```

For more information, see `README-VAGRANT.md`.

### Vagrant plugins

Install these to make your life easier:  
* [vagrant-vbguest](https://github.com/dotless-de/vagrant-vbguest): Automatically install guest additions

### Vagrant lifecycle

``` bash
local$ vagrant up
local$ vagrant status # show local vm status
local$ vagrant global-status # show global vm statuses of all machines
local$ vagrant destroy # destroy the local default vm
```

See http://docs.vagrantup.com/v2/getting-started/teardown.html