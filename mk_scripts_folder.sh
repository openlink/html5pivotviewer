#!/bin/bash
#
#   This file is part of the html5 pivotviewer project
#
#   Copyright (C) 2012-2014 OpenLink Software
#
#   This project is free software; you can redistribute it and/or modify it
#   under the terms of the GNU General Public License as published by the
#   Free Software Foundation; only version 2 of the License, dated June 1991.
#
#   This program is distributed in the hope that it will be useful, but
#   WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
#   General Public License for more details.
#
#   You should have received a copy of the GNU General Public License along
#   with this program; if not, write to the Free Software Foundation, Inc.,
#   51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
#

#
#  Make scripts folder
#
mkdir scripts
mkdir scripts/images
mkdir scripts/timeline_js
mkdir scripts/timeline_js/images
cp lib/leaflet/images/* scripts/images/
cp lib/wicket/wicket-arcgis.min.js scripts/
cp lib/wicket/wicket-gmap3.min.js scripts/
cp lib/wicket/wicket-leaflet.min.js scripts/
cp lib/simile-timeline/timeline_js/images/blue-circle.png scripts/timeline_js/images/
cp lib/simile-timeline/timeline_js/images/dark-red-circle.png scripts/timeline_js/images/
exit 0
