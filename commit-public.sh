#!/bin/bash
hugo
cd public && git checkout master && git add --all && git commit -m "Publishing to cgk.sh" && git push origin master && cd -
