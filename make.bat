::   This file is part of the html5 pivotviewer project
:: 
::   Copyright (C) 2012-2014 OpenLink Software
:: 
::   This project is free software; you can redistribute it and/or modify it
::   under the terms of the GNU General Public License as published by the
::   Free Software Foundation; only version 2 of the License, dated June 1991.
::
::   This program is distributed in the hope that it will be useful, but
::   WITHOUT ANY WARRANTY; without even the implied warranty of
::   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
::   General Public License for more details.
::
::   You should have received a copy of the GNU General Public License along
::   with this program; if not, write to the Free Software Foundation, Inc.,
::   51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
::
::
::
::  Make pivotviewer.js on Windows and create the scripts folder
::
@echo off

type src\namespaces.js >> pivotviewer.js
type src\pubsub.js >> pivotviewer.js
type src\utils.js >> pivotviewer.js
type src\models.js >> pivotviewer.js
type src\collectionloader.js >> pivotviewer.js
type src\jsonloader.js >> pivotviewer.js
type src\views\ipivotviewerview.js >> pivotviewer.js
type src\views\tilebasedview.js >> pivotviewer.js
type src\views\dataview.js >> pivotviewer.js
type src\views\graphview.js >> pivotviewer.js
type src\views\gridview.js >> pivotviewer.js
type src\views\iimagecontroller.js >> pivotviewer.js
type src\views\LoadImageSetHelper.js >> pivotviewer.js
type src\views\mapview.js >> pivotviewer.js
type src\views\mapview2.js >> pivotviewer.js
type src\views\timeview.js >> pivotviewer.js
type src\views\tableview.js >> pivotviewer.js
type src\views\tilecontroller.js >> pivotviewer.js
type src\views\deepzoom.js >> pivotviewer.js
type src\views\simpleimage.js >> pivotviewer.js
type src\pivotviewer.js >> pivotviewer.js

copy pivotviewer.js pivotviewer.min.js

::
::  Make scripts folder
::
mkdir scripts
mkdir scripts\images
mkdir scripts\timeline_js
mkdir scripts\timeline_js\images
copy lib\leaflet\images\* scripts\images\
copy lib\wicket\wicket-arcgis.min.js scripts\
copy lib\wicket\wicket-gmap3.min.js scripts\
copy lib\wicket\wicket-leaflet.min.js scripts\
copy lib\simile-timeline\timeline_js\images\blue-circle.png scripts\timeline_js\images\
copy lib\simile-timeline\timeline_js\images\dark-red-circle.png scripts\timeline_js\images\

