PivotViewer.Views.TileBasedView = PivotViewer.Views.IPivotViewerView.subClass({
	OffsetTiles: function (offsetX, offsetY) {
		for (var i = 0; i < this.tiles.length; i++) {
			var filterindex = $.inArray(this.tiles[i].facetItem.Id, this.currentFilter);
			//set outer location for all tiles not in the filter
			if (filterindex >= 0) {
				this.tiles[i].destinationx += offsetX;
				this.tiles[i].destinationy += offsetY;
			}
		}
	},

	SetInitialTiles: function (dzTiles, canvasWidth, canvasHeight) {
		var initx = canvasWidth / 2;
		var inity = canvasHeight / 2;
		for (var i = 0; i < dzTiles.length; i++) {
			dzTiles[i].x = initx;
			dzTiles[i].y = inity;
			dzTiles[i].velocityx = 0;
			dzTiles[i].velocityy = 0;
			dzTiles[i].startx = initx;
			dzTiles[i].starty = inity;
			dzTiles[i].destinationx = 0;
			dzTiles[i].destinationy = 0;
			dzTiles[i].width = 1;
			dzTiles[i].height = 1;
		}
	},

	GetRowsAndColumns: function (canvasWidth, canvasHeight, tileRatio, tileCount) {
		// look into creating a series of calcs that will try multiple times changing the gap
		var gap = 0.7;
		var a = tileRatio * (tileCount - Math.pow(gap, 2));
		var b = (canvasHeight + (canvasWidth * tileRatio)) * gap;
		var c = -1 * (canvasHeight * canvasWidth);
		var tileWidth = ((-1 * b) + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		var tileHeight = Math.floor(tileWidth * tileRatio);
		var canvasRows = Math.ceil(canvasHeight / tileHeight);
		var canvasColumns = Math.floor(canvasWidth / tileWidth);
		return { Rows: canvasRows, Columns: canvasColumns, TileWidth: tileWidth, TileHeight: tileHeight };
	},

	SetOuterTileDestination: function (canvasWidth, canvasHeight, tile) {
		//http://mathworld.wolfram.com/Circle-LineIntersection.html
		//http://stackoverflow.com/questions/6091728/line-segment-circle-intersection
		//Get adjusted x and y
		// as x2 and y2 are the origin
		var dx = tile.x - (canvasWidth / 2);
		var dy = tile.y - (canvasHeight / 2);
		var M = dy / dx;
		var theta = Math.atan2(dy, dx)
		tile.destinationx = canvasWidth * Math.cos(theta) + (canvasWidth / 2);
		tile.destinationy = canvasHeight * Math.sin(theta) + (canvasHeight / 2);
	},

	//http://stackoverflow.com/questions/979256/how-to-sort-an-array-of-javascript-objects
	SortBy: function (field, reverse, primer) {

		var key = function (x) {
			if (primer) {
				for (var i = x.facetItem.Facets.length - 1; i > -1; i -= 1) {
					if (x.facetItem.Facets[i].Name == field && x.facetItem.Facets[i].FacetValues.length > 0)
						return primer(x.facetItem.Facets[i].FacetValues[0].Value);
				}
			}
			return null;
		};

		return function (a, b) {
			var A = key(a), B = key(b);
			return (A < B ? -1 : (A > B ? 1 : 0)) * [1, -1][+!!reverse];
		}
	}
});