#!/bin/sh
rsync -vrt --copy-links --exclude node_modules --exclude .git --exclude release.sh ./* x.29a.ch:/var/www/29a.ch/sandbox/2011/neonflames2/
