#
#  HTML5 PivotViewer
#
#  Original Code:
#    Copyright (C) 2011 LobsterPot Solutions - http://www.lobsterpot.com.au/
#    enquiries@lobsterpot.com.au
#
#  Enhancements:
#    Copyright (C) 2012-2014 OpenLink Software - http://www.openlinksw.com/
#
#  This software is licensed under the terms of the
#  GNU General Public License v2 (see COPYING)
#

GENERATED	= pivotviewer.min.js pivotviewer.js
CLEANFILES	= $(GENERATED) *.vad
BUILT_SOURCES	= $(GENERATED)

GEN		= $(SHELL) $(top_srcdir)/admin/generate

SOURCES		= \
	$(srcdir)/src/namespaces.js \
	$(srcdir)/src/pubsub.js \
	$(srcdir)/src/utils.js \
	$(srcdir)/src/models.js \
	$(srcdir)/src/collectionloader.js \
	$(srcdir)/src/jsonloader.js \
	$(srcdir)/src/views/ipivotviewerview.js \
	$(srcdir)/src/views/tilebasedview.js \
	$(srcdir)/src/views/dataview.js \
	$(srcdir)/src/views/graphview.js \
	$(srcdir)/src/views/gridview.js \
	$(srcdir)/src/views/iimagecontroller.js \
	$(srcdir)/src/views/LoadImageSetHelper.js \
	$(srcdir)/src/views/mapview.js \
	$(srcdir)/src/views/mapview2.js \
	$(srcdir)/src/views/timeview.js \
	$(srcdir)/src/views/tableview.js \
	$(srcdir)/src/views/tilecontroller.js \
	$(srcdir)/src/views/deepzoom.js \
	$(srcdir)/src/views/simpleimage.js \
	$(srcdir)/src/pivotviewer.js

vad_DATA = html5pivotviewer_dav.vad

GEN_VERSION := $(shell @top_srcdir@/gen_version.sh)

pivotviewer.js:  Makefile $(SOURCES)
	cat $(SOURCES) | sed -e 's#\@VERSION\@#$(GEN_VERSION)#' > $@


pivotviewer.min.js: pivotviewer.js
	@$(GEN) uglifyjs -o pivotviewer.min.js pivotviewer.js


html5pivotviewer_dav.vad: $(SOURCES) $(GENERATED) Makefile html5pivotviewer-sticker.xml
	@PYTHON@ $(top_srcdir)/vadpacker/vadpacker.py \
		-o html5pivotviewer_dav.vad \
		--var="VERSION=$(GEN_VERSION)" \
		$(srcdir)/html5pivotviewer-sticker.xml

# package the vadpacker from the submodule
# We include the full dir to also support the case when the dir is empty
EXTRA_DIST = \
	LICENSE \
	$(SOURCES) \
 	$(GENERATED) \
	*.html \
	admin/generate \
	autogen.sh \
	gen_version.sh \
	html5pivotviewer-sticker.xml \
	html5pivotviewer_dav.vad \
	images \
	lib \
	style/*.css \
	vadpacker \
	vsp/*.sql \
	vsp/*.vsp \
	vsp/*.vspx \
	vsp/scripts/*.js \
	vsp/skin/i/*.png \
	vsp/skin/ss/*.css

.PHONY: changeLog
changelog:
	git2cl > ChangeLog
