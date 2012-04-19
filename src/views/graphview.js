/// Graph (histogram) View
///
PivotViewer.Views.GraphView = PivotViewer.Views.TileBasedView.subClass({
	init: function () {
		this._super();
		var that = this;
		this.buckets = [];
		this.canvasHeightUIAdjusted = 0;

		//Event Handlers
		$.subscribe("/PivotViewer/Views/Canvas/Click", function (evt) {
			if (!that.isActive)
				return;

			var selectedItem = "";
			for (var i = 0; i < that.tiles.length; i++) {
				if (that.tiles[i].Contains(evt.x, evt.y)) {
					selectedItem = that.tiles[i].facetItem.Id;
					break;
				}
			}

			if (selectedItem.length > 0)
				$.publish("/PivotViewer/Views/Item/Selected", [selectedItem]);
			else {
				var bucketNumber = Math.floor(evt.x / that.columnWidth);
				$.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: that.sortFacet, Item: that.buckets[bucketNumber].startRange}]);
			}
		});

		$.subscribe("/PivotViewer/Views/Canvas/Hover", function (evt) {
			if (!that.isActive)
				return;
			$('.pv-viewarea-graphview-overlay-bucket').removeClass('graphview-bucket-hover');
			//determine bucket and select
			var bucketNumber = Math.floor((evt.x - that.offsetX) / that.columnWidth);
			var bucketDiv = $('#pv-viewarea-graphview-overlay-bucket-' + bucketNumber);
			bucketDiv.addClass('graphview-bucket-hover');
			//determine tile
			for (var i = 0; i < that.tiles.length; i++) {
				if (that.tiles[i].Contains(evt.x, evt.y))
					that.tiles[i].Selected(true);
				else
					that.tiles[i].Selected(false);
			}
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
		this.rowscols = null;
		this.bigCount = 0;
	},
	Filter: function (dzTiles, currentFilter, sortFacet) {
		var that = this;
		if (!Modernizr.canvas)
			return;

		Debug.Log('Graph View Filtered: ' + currentFilter.length);

		this.sortFacet = sortFacet;
		this.tiles = dzTiles;

		//var rowscols = GetRowsAndColumns(width, height, 1, currentFilter.length);

		//Sort
		this.tiles = dzTiles.sort(this.SortBy(this.sortFacet, false, function (a) {
			return a.toUpperCase()
		}));
		this.currentFilter = currentFilter;

		this.buckets = this.Bucketize(dzTiles, currentFilter, this.sortFacet);

		this.columnWidth = (this.width - this.offsetX) / this.buckets.length;
		this.canvasHeightUIAdjusted = this.height - 62;

		//Find biggest bucket to determine tile size, rows and cols
		//Also create UI elements
		var uiElements = [];
		for (var i = 0; i < this.buckets.length; i++) {
			var styleClass = i % 2 == 0 ? "graphview-bucket-dark" : "graphview-bucket-light";
			uiElements[i] = "<div class='pv-viewarea-graphview-overlay-bucket " + styleClass + "' id='pv-viewarea-graphview-overlay-bucket-" + i + "' style='width: " + (Math.floor(this.columnWidth) - 4) + "px; height:" + this.height + "px; left:" + ((i * this.columnWidth) - 2) + "px;'>";
			if (this.buckets[i].startRange == this.buckets[i].endRange)
				uiElements[i] += "<div class='pv-viewarea-graphview-overlay-buckettitle' style='top: " + (this.canvasHeightUIAdjusted + 4) + "px;'>" + this.buckets[i].startRange + "</div></div>";
			else
				uiElements[i] += "<div class='pv-viewarea-graphview-overlay-buckettitle' style='top: " + (this.canvasHeightUIAdjusted + 4) + "px;'>" + this.buckets[i].startRange + "<br/>to<br/>" + this.buckets[i].endRange + "</div></div>";

			if (this.bigCount < this.buckets[i].Ids.length) {
				this.bigCount = this.buckets[i].Ids.length;
			}
		}

		//remove previous elements
		var graphViewOverlay = $('.pv-viewarea-graphview-overlay');
		graphViewOverlay.css('left', this.offsetX + 'px');
		$('.pv-viewarea-graphview-overlay div').fadeOut('slow', function () { $(this).remove(); });
		graphViewOverlay.append(uiElements.join(''));
		$('.pv-viewarea-graphview-overlay div').fadeIn('slow');

		for (var i = 0; i < this.tiles.length; i++) {
			//setup tiles
			this.tiles[i].startx = this.tiles[i].x;
			this.tiles[i].starty = this.tiles[i].y;
			this.tiles[i].startwidth = this.tiles[i].width;
			this.tiles[i].startheight = this.tiles[i].height;

			var filterindex = $.inArray(this.tiles[i].facetItem.Id, currentFilter);
			//set outer location for all tiles not in the filter
			if (filterindex < 0) {
				SetOuterTileDestination(this.width, this.height, this.tiles[i]);
				this.tiles[i].start = Now();
				this.tiles[i].end = this.tiles[i].start + 1000;
			}
		}

		var pt2Timeout = currentFilter.length == this.tiles.length ? 0 : 500;
		//Delay pt2 animation
		setTimeout(function () {
			var renderWidth = that.width - that.offsetX;
			var renderHeight = that.height - that.offsetY;
			that.rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.canvasHeightUIAdjusted, that.ratio, that.bigCount);
			that.SetVisibleTileGraphPositions(that.rowscols, that.offsetX, that.offsetY, false, false);

		}, pt2Timeout);

		this.init = false;
	},
	GetUI: function () {
		if (Modernizr.canvas)
			return "<div class='pv-viewarea-graphview-overlay'></div>";
		else
			return "<div class='pv-viewpanel-unabletodisplay'><h2>Unfortunately this view is unavailable as your browser does not support this functionality.</h2>Please try again with one of the following supported browsers: IE 9+, Chrome 4+, Firefox 2+, Safari 3.1+, iOS Safari 3.2+, Opera 9+<br/><a href='http://caniuse.com/#feat=canvas'>http://caniuse.com/#feat=canvas</a></div>";
	},
	GetButtonImage: function () {
		return '../media/GraphView.png';
	},
	GetButtonImageSelected: function () {
		return '../media/GraphViewSelected.png';
	},
	GetViewName: function () {
		return 'Graph View';
	},
	/// Sets the tiles position based on the GetRowsAndColumns layout function
	SetVisibleTileGraphPositions: function (rowscols, offsetX, offsetY, initTiles, keepColsRows) {
		var columns = keepColsRows ? this.rowscols.Columns : rowscols.Columns;
		if (!keepColsRows)
			this.rowscols = rowscols;

		for (var i = 0; i < this.buckets.length; i++) {
			var currentColumn = 0;
			var currentRow = 0;
			for (var j = this.tiles.length - 1; j > -1; j -= 1) {
				if ($.inArray(this.tiles[j].facetItem.Id, this.buckets[i].Ids) >= 0) {

					if (initTiles) {
						//setup tile initial positions
						this.tiles[i].startx = this.tiles[i].x;
						this.tiles[i].starty = this.tiles[i].y;
						this.tiles[i].startwidth = this.tiles[i].width;
						this.tiles[i].startheight = this.tiles[i].height;
					}

					this.tiles[j].destinationwidth = rowscols.TileWidth;
					this.tiles[j].destinationheight = rowscols.TileHeight;
					this.tiles[j].destinationx = (i * this.columnWidth) + (currentColumn * rowscols.TileWidth) + offsetX;
					this.tiles[j].destinationy = this.canvasHeightUIAdjusted - rowscols.TileHeight - (currentRow * rowscols.TileHeight) + offsetY;
					this.tiles[j].start = Now();
					this.tiles[j].end = this.tiles[j].start + 1000;

					if (currentColumn == rowscols.Columns - 1) {
						currentColumn = 0;
						currentRow++;
					}
					else
						currentColumn++;
				}
			}
		}
	},
	//Groups into buckets based on first n chars
	Bucketize: function (dzTiles, filterList, orderBy) {
		var bkts = [];
		for (var i = 0; i < dzTiles.length; i++) {
			if ($.inArray(dzTiles[i].facetItem.Id, filterList) >= 0) {
				var hasValue = false;
				for (var j = 0; j < dzTiles[i].facetItem.Facets.length; j++) {
					if (dzTiles[i].facetItem.Facets[j].Name == orderBy && dzTiles[i].facetItem.Facets[j].FacetValues.length > 0) {
						var val = dzTiles[i].facetItem.Facets[j].FacetValues[0].Value;
						var found = false;
						for (var k = 0; k < bkts.length; k++) {
							if (bkts[k].startRange == val) {
								bkts[k].Ids.push(dzTiles[i].facetItem.Id);
								found = true;
							}
						}
						if (!found)
							bkts.push({ startRange: val, endRange: val, Ids: [dzTiles[i].facetItem.Id] });

						hasValue = true;
					}
				}
				//If not hasValue then add it as a (no info) item
				if (!hasValue) {
					var val = "(no info)";
					var found = false;
					for (var k = 0; k < bkts.length; k++) {
						if (bkts[k].startRange == val) {
							bkts[k].Ids.push(dzTiles[i].facetItem.Id);
							found = true;
						}
					}
					if (!found)
						bkts.push({ startRange: val, endRange: val, Ids: [dzTiles[i].facetItem.Id] });
				}
			}
		}

		var current = 0;
		while (bkts.length > 8) {
			if (current < bkts.length - 1) {
				bkts[current].endRange = bkts[current + 1].endRange;
				for (var i = 0; i < bkts[current + 1].Ids.length; i++) {
					bkts[current].Ids.push(bkts[current + 1].Ids[i]);
				}
				bkts.splice(current + 1, 1);
				current++;
			} else
				current = 0;
		}

		return bkts;
	}
});
