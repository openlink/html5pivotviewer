/// Grid view
///
PivotViewer.Views.GridView = PivotViewer.Views.TileBasedView.subClass({
	init: function () {
		this._super();
		var that = this;
		//Event Handlers
		$.subscribe("/PivotViewer/Views/Canvas/Click", function (evt) {
			if (!that.isActive)
				return;

			var selectedItem = "";
			var selectedCol = 0;
			var selectedRow = 0;
			var offsetX = 0, offsetY = 0;
			for (var i = 0; i < that.tiles.length; i++) {
				if (that.tiles[i].Contains(evt.x, evt.y)) {
					selectedItem = that.tiles[i].facetItem.Id;
					//determine row and column that tile is in in relation to the first tile
					selectedCol = Math.round((that.tiles[i].x - that.currentOffsetX) / that.tiles[i].width); //Math.floor((that.tiles[i].x - that.tiles[0].x) / that.tiles[i].width);
					selectedRow = Math.round((that.tiles[i].y - that.currentOffsetY) / that.tiles[i].height);  //Math.floor((that.tiles[i].y - that.tiles[0].y) / that.tiles[i].height); //Math.floor((that.tiles[i].y - that.offsetY) / (that.tiles[i].height + 4));
					that.tiles[i].Selected(true);
					offsetX = that.tiles[i].x;
					offsetY = that.tiles[i].y;
				} else {
					that.tiles[i].Selected(false);
				}
			}
			//zoom in on selected tile
			if (selectedItem.length > 0 && that.selected != selectedItem) {
				that.selected = selectedItem;
				//set the max width and height
				if (that.width < that.height) {
					that.currentWidth = that.width * that.rowscols.Columns * 0.9; //0.9 to leave 10% space
					that.currentHeight = (that.height / that.width) * that.currentWidth;
				} else {
					that.currentHeight = that.height * that.rowscols.Rows * 0.9;
					that.currentWidth = (that.width / that.height) * that.currentHeight;
				}

				var rowscols = that.GetRowsAndColumns(that.currentWidth - that.offsetX, that.currentHeight - that.offsetY, that.ratio, that.currentFilter.length);

				that.currentOffsetX = ((rowscols.TileWidth * selectedCol) * -1) + (that.width / 2) - (rowscols.TileWidth / 2);
				that.currentOffsetY = ((rowscols.TileHeight * selectedRow) * -1) + (that.height / 2) - (rowscols.TileHeight / 2);

				//			that.currentOffsetX = offsetX;
				//			that.currentOffsetY = offsetY;

				that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, 1000);
			} else {
				that.selected = selectedItem = "";
				//zoom out
				that.currentOffsetX = that.offsetX;
				that.currentOffsetY = that.offsetY;
				that.currentWidth = that.width;
				that.currentHeight = that.height;
				var rowscols = that.GetRowsAndColumns(that.currentWidth - that.offsetX, that.currentHeight - that.offsetY, that.ratio, that.currentFilter.length);
				that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, 1000);
			}


			$.publish("/PivotViewer/Views/Item/Selected", [selectedItem]);
		});

		$.subscribe("/PivotViewer/Views/Canvas/Hover", function (evt) {
			if (!that.isActive || that.selected.length > 0)
				return;

			for (var i = 0; i < that.tiles.length; i++) {
				if (that.tiles[i].Contains(evt.x, evt.y))
					that.tiles[i].Selected(true);
				else
					that.tiles[i].Selected(false);
			}
		});

		$.subscribe("/PivotViewer/Views/Canvas/Zoom", function (evt) {
			if (!that.isActive)
				return;

			var preWidth = that.currentWidth;
			var preHeight = that.currentHeight;
			//150% zoom
			//var newWidth = that.currentWidth + ((that.currentWidth * 0.5) * (evt.delta >= 0 ? 1 : -1));

			if (evt.scale > 0)//that.prevScale < evt.scale)
				that.currentScale += Math.abs(evt.scale - that.prevScale);
			else
				that.currentScale -= Math.abs(that.prevScale - evt.scale);


			var newWidth = that.width;
			if (evt.scale != undefined)
				newWidth = that.width * (evt.scale + that.prevScale); //(evt.scale * that.currentScale);
			else if (evt.delta != undefined)
			// + delta = zoom in
				newWidth = that.currentWidth + ((that.currentWidth * 0.5) * (evt.delta >= 0 ? 1 : -1));
			else
				return;


			that.prevScale = evt.scale;

			//if trying to zoom out too far, reset to min
			if (newWidth < that.width) {
				that.currentOffsetX = that.offsetX;
				that.currentOffsetY = that.offsetY;
				that.currentWidth = that.width;
				that.currentHeight = that.height;
				that.prevScale = 0;
			}
			else {

				that.currentWidth = newWidth;
				//keep original ratio
				that.currentHeight = (preHeight / preWidth) * that.currentWidth;

				//if trying to zoom too far in, set to max
				if ((that.currentWidth / that.rowscols.Columns) > that.width) {
					that.currentWidth = that.width * that.rowscols.Columns;
					//keep height ratio
					that.currentHeight = (preHeight / preWidth) * that.currentWidth;
				}
				//if trying to zoom too far in, set to max height
				if ((that.currentHeight / that.rowscols.Rows) > that.height) {
					that.currentHeight = that.height * that.rowscols.Rows;
					//keep height ratio
					that.currentWidth = (preWidth / preHeight) * that.currentHeight;
				}

				//Work out the percentage of the total width evt.x
				//multiply that with the difference in width
				//add the offset
				that.currentOffsetX = ((((evt.x - that.offsetX) / that.width) * (that.currentWidth - that.width)) * -1) + that.offsetX;
				that.currentOffsetY = ((((evt.y - that.offsetY) / that.height) * (that.currentHeight - that.height)) * -1) + that.offsetY;


				//			if (evt.delta >= 0) {
				//				that.currentOffsetX = ((((evt.x - that.offsetX) / that.width) * (that.currentWidth - that.width)) * -1) + that.offsetX;
				//			} else {
				//				that.currentOffsetX = ((((evt.x - that.offsetX) / that.width) * (that.currentWidth - that.width)) * -1) + that.offsetX;
				//			}

				/*
				//The x and y offset is the difference is width, multiplied by the percentage of the mouse position to the width/height
				var mouseXPercent = Math.round(((evt.x - that.offsetX) / ((that.width - that.offsetX) / 10))) / 10;
				var mouseYPercent = Math.round(((evt.y - that.offsetY) / ((that.height - that.offsetY) / 10))) / 10;
				if (evt.delta >= 0) {
				that.currentOffsetX -= (that.width / 2) - evt.x;// (that.currentWidth - preWidth) * mouseXPercent;
				that.currentOffsetY -= (that.currentHeight - preHeight) * mouseYPercent;
				} else {
				that.currentOffsetX += (preWidth - that.currentWidth) * mouseXPercent;
				that.currentOffsetY += (preHeight - that.currentHeight) * mouseYPercent;
				}

				//bounds adjustment
				//LHS out
				if (that.currentOffsetX > that.offsetX)
				that.currentOffsetX = that.offsetX;
				//RHS out
				if ((that.currentOffsetX + that.currentWidth) < that.width)
				that.currentOffsetX = that.offsetX;
				//Top out
				if (that.currentOffsetY > that.offsetY)
				that.currentOffsetY = that.offsetY;
				//Bottom out
				if ((that.currentOffsetY + that.currentHeight) < that.height)
				that.currentOffsetY = that.offsetY;
				*/
			}

			var rowscols = that.GetRowsAndColumns(that.currentWidth - that.offsetX, that.currentHeight - that.offsetY, that.ratio, that.currentFilter.length);
			that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, 100);

			//deselect tiles if zooming out
			if (evt.delta < 0) {
				for (var i = 0; i < that.tiles.length; i++) {
					that.tiles[i].Selected(false);
				}
				that.selected = "";
				$.publish("/PivotViewer/Views/Item/Selected", [that.selected]);
			}
		});

		$.subscribe("/PivotViewer/Views/Canvas/Drag", function (evt) {
			var dragX = evt.x;
			var dragY = evt.y;
			var noChangeX = false, noChangeY = false;
			that.currentOffsetX += dragX;
			that.currentOffsetY += dragY;

			//LHS bounds check
			if (dragX > 0 && that.currentOffsetX > that.offsetX) {
				that.currentOffsetX -= dragX;
				noChangeX = true;
			}
			//Top bounds check
			if (dragY > 0 && that.currentOffsetY > that.offsetY) {
				that.currentOffsetY -= dragY;
				noChangeY = true;
			}
			//RHS bounds check
			//if the current offset is smaller than the default offset and the zoom scale == 1 then stop drag
			if (that.currentOffsetX < that.offsetX && that.currentWidth == that.width) {
				that.currentOffsetX -= dragX;
				noChangeX = true;
			}
			if (dragX < 0 && (that.currentOffsetX - that.offsetX) < -1 * (that.currentWidth - that.width)) {
				that.currentOffsetX -= dragX;
				noChangeX = true;
			}
			//bottom bounds check
			if (that.currentOffsetY < that.offsetY && that.currentHeight == that.height) {
				that.currentOffsetY -= dragY;
				noChangeY = true;
			}
			if (dragY < 0 && (that.currentOffsetY - that.offsetY) < -1 * (that.currentHeight - that.height)) {
				that.currentOffsetY -= dragY;
				noChangeY = true;
			}

			if (noChangeX && noChangeY)
				return;
			if (noChangeX)
				that.OffsetTiles(0, dragY);
			else if (noChangeY)
				that.OffsetTiles(dragX, 0);
			else
				that.OffsetTiles(dragX, dragY);
		});
	},
	Setup: function (width, height, offsetX, offsetY, tileRatio) {
		this.width = width;
		this.height = height;
		this.offsetX = offsetX;
		this.offsetY = offsetY;
		this.ratio = tileRatio;
		this.currentWidth = this.width;
		this.currentHeight = this.height;
		this.currentOffsetX = this.offsetX;
		this.currentOffsetY = this.offsetY;
	},
	Filter: function (dzTiles, currentFilter, sortFacet) {
		var that = this;
		if (!Modernizr.canvas)
			return;

		Debug.Log('Grid View Filtered: ' + currentFilter.length);

		this.tiles = dzTiles;
		if (this.init) {
			this.SetInitialTiles(this.tiles, this.width, this.height);
		}

		//Sort
		this.tiles = this.tiles.sort(this.SortBy(sortFacet, false, function (a) {
			return a.toUpperCase()
		}));
		this.currentFilter = currentFilter;

		var pt1Timeout = 0;
		//zoom out first
		Debug.Log("this.currentWidth: " + this.currentWidth + " this.width: " + this.width);
		if (this.currentWidth != this.width && !this.init) {
			this.selected = selectedItem = "";
			//zoom out
			this.currentOffsetX = this.offsetX;
			this.currentOffsetY = this.offsetY;
			this.currentWidth = this.width;
			this.currentHeight = this.height;
			var rowscols = this.GetRowsAndColumns(this.currentWidth - this.offsetX, this.currentHeight - this.offsetY, this.ratio, this.tiles.length);
			var clearFilter = [];
			for (var i = 0; i < this.tiles.length; i++) {
				clearFilter.push(this.tiles[i].facetItem.Id);
			}
			this.SetVisibleTilePositions(rowscols, clearFilter, this.currentOffsetX, this.currentOffsetY, true, false, 1000);
			pt1Timeout = 1000;
		}

		setTimeout(function () {
			for (var i = 0; i < that.tiles.length; i++) {
				//setup tiles
				that.tiles[i].startx = that.tiles[i].x;
				that.tiles[i].starty = that.tiles[i].y;
				that.tiles[i].startwidth = that.tiles[i].width;
				that.tiles[i].startheight = that.tiles[i].height;

				var filterindex = $.inArray(that.tiles[i].facetItem.Id, currentFilter);
				//set outer location for all tiles not in the filter
				if (filterindex < 0) {
					that.SetOuterTileDestination(that.width, that.height, that.tiles[i]);
					that.tiles[i].start = Now();
					that.tiles[i].end = that.tiles[i].start + 1000;
				}
			}

			var pt2Timeout = currentFilter.length == that.tiles.length ? 0 : 500;
			//Delay pt2 animation
			setTimeout(function () {
				var rowscols = that.GetRowsAndColumns(that.width - that.offsetX, that.height - that.offsetY, that.ratio, that.currentFilter.length);
				that.SetVisibleTilePositions(rowscols, that.currentFilter, that.offsetX, that.offsetY, false, false, 1000);
			}, pt2Timeout);

		}, pt1Timeout);

		this.init = false;
	},
	GetUI: function () {
		if (Modernizr.canvas)
			return "";
		else
			return "<div class='pv-viewpanel-unabletodisplay'><h2>Unfortunately this view is unavailable as your browser does not support this functionality.</h2>Please try again with one of the following supported browsers: IE 9+, Chrome 4+, Firefox 2+, Safari 3.1+, iOS Safari 3.2+, Opera 9+<br/><a href='http://caniuse.com/#feat=canvas'>http://caniuse.com/#feat=canvas</a></div>";
	},
	GetButtonImage: function () {
		return '../media/GridView.png';
	},
	GetButtonImageSelected: function () {
		return '../media/GridViewSelected.png';
	},
	GetViewName: function () {
		return 'Grid View';
	},
	/// Sets the tiles position based on the GetRowsAndColumns layout function
	SetVisibleTilePositions: function (rowscols, filter, offsetX, offsetY, initTiles, keepColsRows, miliseconds) {
		//re-use previous columns
		var columns = keepColsRows ? this.rowscols.Columns : rowscols.Columns;
		if (!keepColsRows)
			this.rowscols = rowscols;

		var currentColumn = 0;
		var currentRow = 0;
		for (var i = 0; i < this.tiles.length; i++) {
			var filterindex = $.inArray(this.tiles[i].facetItem.Id, filter);
			if (filterindex >= 0) {
				if (initTiles) {
					//setup tile initial positions
					this.tiles[i].startx = this.tiles[i].x;
					this.tiles[i].starty = this.tiles[i].y;
					this.tiles[i].startwidth = this.tiles[i].width;
					this.tiles[i].startheight = this.tiles[i].height;
				}

				//set destination positions
				this.tiles[i].destinationwidth = rowscols.TileWidth;
				this.tiles[i].destinationheight = rowscols.TileHeight;
				this.tiles[i].destinationx = (currentColumn * rowscols.TileWidth) + offsetX;
				this.tiles[i].destinationy = (currentRow * rowscols.TileHeight) + offsetY;
				this.tiles[i].start = Now();
				this.tiles[i].end = this.tiles[i].start + miliseconds;
				if (currentColumn == columns - 1) {
					currentColumn = 0;
					currentRow++;
				}
				else
					currentColumn++;
			}
		}
	}
});
