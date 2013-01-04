#
#  HTML5 PivotViewer
#
#  Original Code:
#    Copyright (C) 2011 LobsterPot Solutions - http://www.lobsterpot.com.au/
#    enquiries@lobsterpot.com.au
#
#  Enhancements:
#    Copyright (C) 2012-2013 OpenLink Software - http://www.openlinksw.com/
#
#  This software is licensed under the terms of the
#  GNU General Public License v2 (see COPYING)
#

all: pivotviewer.min.js

pivotviewer.js: \
	src/namespaces.js \
	src/pubsub.js \
	src/utils.js \
	src/models.js \
	src/collectionloader.js \
	src/views/ipivotviewerview.js \
	src/views/tilebasedview.js \
	src/views/gridview.js \
	src/views/graphview.js \
	src/views/iimagecontroller.js \
	src/views/LoadImageSetHelper.js \
	src/views/deepzoom.js \
	src/views/tilecontroller.js \
	src/pivotviewer.js \
	Makefile

%.min.js: %.js Makefile
	@rm -f $@
	uglifyjs $< > $@

VERSION:=$(shell ./gen_version.sh )

%.js:
	cat $(filter %.js,$^) | sed -e 's#@VERSION@#$(VERSION)#' > $@
