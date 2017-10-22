#!/bin/bash 

git submodule init
git config -f .gitmodules.public.brach master
git submodule update --remote
cd public
git pull origin master

