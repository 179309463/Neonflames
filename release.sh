#!/bin/sh
rsync -vrt --copy-links --exclude .git --exclude release.sh ./* 29a.ch:/var/www/29a.ch/sandbox/2011/neonflames/
