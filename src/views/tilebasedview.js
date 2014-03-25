//
//  HTML5 PivotViewer
//
//  Collection loader interface - used so that different types of data sources can be used
//
//  Original Code:
//    Copyright (C) 2011 LobsterPot Solutions - http://www.lobsterpot.com.au/
//    enquiries@lobsterpot.com.au
//
//  Enhancements:
//    Copyright (C) 2012-2014 OpenLink Software - http://www.openlinksw.com/
//
//  This software is licensed under the terms of the
//  GNU General Public License v2 (see COPYING)
//

PivotViewer.Views.TileBasedView = PivotViewer.Views.IPivotViewerView.subClass({
	OffsetTiles: function (offsetX, offsetY) {
		for (var i = 0; i < this.tiles.length; i++) {
			var filterindex = $.inArray(this.tiles[i].facetItem.Id, this.currentFilter);
			//set outer location for all tiles not in the filter
			if (filterindex >= 0) {
                               this.tiles[i]._locations[0].destinationx += offsetX;
                               this.tiles[i]._locations[0].destinationy += offsetY;
			}
		}
	},

	SetInitialTiles: function (dzTiles, canvasWidth, canvasHeight) {
		var initx = canvasWidth / 2;
		var inity = canvasHeight / 2;
		for (var i = 0; i < dzTiles.length; i++) {
			dzTiles[i]._locations[0].x = initx;
			dzTiles[i]._locations[0].y = inity;
			dzTiles[i].velocityx = 0;
			dzTiles[i].velocityy = 0;
			dzTiles[i]._locations[0].startx = initx;
			dzTiles[i]._locations[0].starty = inity;
			dzTiles[i]._locations[0].destinationx = 0;
			dzTiles[i]._locations[0].destinationy = 0;
			dzTiles[i].width = 1;
			dzTiles[i].height = 1;
		}
	},

	GetRowsAndColumns: function (canvasWidth, canvasHeight, tileMaxRatio, tileCount) {
		// look into creating a series of calcs that will try multiple times changing the gap
		var gap = 0.7;
		var a = tileMaxRatio * (tileCount - Math.pow(gap, 2));
		var b = (canvasHeight + (canvasWidth * tileMaxRatio)) * gap;
		var c = -1 * (canvasHeight * canvasWidth);
		var tileMaxWidth = ((-1 * b) + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		var tileHeight = Math.floor(tileMaxWidth * tileMaxRatio);
		var canvasRows = Math.ceil(canvasHeight / tileHeight);
		var canvasColumns = Math.floor(canvasWidth / tileMaxWidth);
                var paddingX = canvasWidth - (canvasColumns * tileMaxWidth);
		return { Rows: canvasRows, Columns: canvasColumns, TileMaxWidth: tileMaxWidth, TileHeight: tileHeight, PaddingX : paddingX };
	},

	SetOuterTileDestination: function (canvasWidth, canvasHeight, tile) {
		//http://mathworld.wolfram.com/Circle-LineIntersection.html
		//http://stackoverflow.com/questions/6091728/line-segment-circle-intersection
		//Get adjusted x and y
		// as x2 and y2 are the origin
		var dx = tile._locations[0].x - (canvasWidth / 2);
		var dy = tile._locations[0].y - (canvasHeight / 2);
		var M = dy / dx;
		var theta = Math.atan2(dy, dx)
		tile._locations[0].destinationx = canvasWidth * Math.cos(theta) + (canvasWidth / 2);
		tile._locations[0].destinationy = canvasHeight * Math.sin(theta) + (canvasHeight / 2);
	},

	//http://stackoverflow.com/questions/979256/how-to-sort-an-array-of-javascript-objects
	SortBy: function (field, reverse, primer, filterValues) {

		var key = function (x, filterValues) {
			if (primer) {
				for (var i = x.facetItem.Facets.length - 1; i > -1; i -= 1) {
					if (x.facetItem.Facets[i].Name == field && x.facetItem.Facets[i].FacetValues.length > 0) {
                                            // If a numeric value could check if value is within filter 
                                            // bounds but will have been done already
                                            if ($.isNumeric(x.facetItem.Facets[i].FacetValues[0].Value) )
					            return primer(x.facetItem.Facets[i].FacetValues[0].Value);
                                            // If a string facet then could have a number of values.  Only
                                            // sort on values in the filter 
                                            else {                      
                                                for (var j = 0; j < x.facetItem.Facets[i].FacetValues.length; j++) {
                                                    // Has a filter been set? If so, and it is the same facet as the sort
                                                    // then sort on the items in the filter where possible (otherwise just 
                                                    // use the first value.?
                                                    if (filterValues.length > 0) {
                                                        for (var k = 0; k < filterValues.length; k++) {
                                                            if (filterValues[k].facet == field) {
                                                                 for (var l = 0; l < filterValues[k].facetValue.length; l++) {
                                                                     if ( x.facetItem.Facets[i].FacetValues[j].Value == filterValues[k].facetValue[l]) {  
					                                 return primer(x.facetItem.Facets[i].FacetValues[j].Value);
                                                                     }
                                                                 }
                                                             } 
                                                        }
                                                    } 
                                                }
                                                return primer(x.facetItem.Facets[i].FacetValues[0].Value);
                                            }
                                        }
				}
			}
			return null;
		};

		return function (a, b) {
			var A = key(a, filterValues), B = key(b, filterValues);
			return (A < B ? -1 : (A > B ? 1 : 0)) * [1, -1][+!!reverse];
		}
	}
});
