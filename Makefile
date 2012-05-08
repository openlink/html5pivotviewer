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
	src/views/loadimagesethelper.js \
	src/views/deepzoom.js \
	src/views/tilecontroller.js \
	src/pivotviewer.js \
	Makefile

%.min.js: %.js Makefile
	@rm -f $@
	uglifyjs $< > $@

%.js:
	cat $(filter %.js,$^) > $@