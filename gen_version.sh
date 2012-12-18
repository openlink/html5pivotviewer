#!/bin/bash

#
#  Generate version number
#
git describe --tags --long --always | sed -e 's/-/./' -e 's/-g/-/g'

exit 0
