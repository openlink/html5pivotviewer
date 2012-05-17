///
/// Graph (histogram) View
///
PivotViewer.Views.GraphView = PivotViewer.Views.TileBasedView.subClass({
    init: function () {
        this._super();
        var that = this;
        this.buckets = [];
        this.Scale = 1;
        this.canvasHeightUIAdjusted = 0;

        //Event Handlers
        $.subscribe("/PivotViewer/Views/Canvas/Click", function (evt) {
            if (!that.isActive)
                return;

            var selectedItem = null;
            var selectedCol = 0;
            var selectedRow = 0;
            var found = false;
            for (var i = 0; i < that.tiles.length; i++) {
                if (that.tiles[i].Contains(evt.x, evt.y)) {
                    selectedItem = that.tiles[i].facetItem.Id;
                    //determine row and column that tile is in in relation to the first tile
                    selectedCol = that.tiles[i].x;
                    selectedRow = that.tiles[i].y;
                    that.tiles[i].Selected(true);
                    offsetX = that.tiles[i].x;
                    offsetY = that.tiles[i].y;
                    found = true;
                } else {
                    that.tiles[i].Selected(false);
                }
            }


            //zoom in on selected tile
            if (selectedItem != null && that.selected != selectedItem) {
                that.selected = selectedItem;

                if (that.width < that.height) {
                    var newWidth = that.width * that.rowscols.Columns * 0.9; //0.9 to leave 10% space
                    var newHeight = (that.canvasHeightUIAdjusted / that.width) * newWidth;
                } else {
                    var newHeight = that.canvasHeightUIAdjusted * that.rowscols.Rows * 0.9;
                    var newWidth = (that.width / that.canvasHeightUIAdjusted) * newHeight;
                }

                var scaleY = newHeight / that.canvasHeightUIAdjusted;
                var scaleX = newWidth / (that.width - that.offsetX);
                that.columnWidth = newWidth / that.buckets.length;

                var rowscols = that.GetRowsAndColumns(that.columnWidth, newHeight, that.ratio, that.bigCount);

                that.currentOffsetX = -((selectedCol - that.offsetX) * scaleX) + (that.width / 2) - (rowscols.TileWidth / 2);

                var rowNumber = Math.ceil((that.canvasHeightUIAdjusted - selectedRow) / that.rowscols.TileHeight);
                that.currentOffsetY = 31 + (rowscols.TileHeight * (rowNumber - 1));

                that.SetVisibleTileGraphPositions(rowscols, that.currentOffsetX, that.currentOffsetY, true, true);
                $('.pv-viewarea-graphview-overlay div').fadeOut('slow');
            } else {
                that.selected = selectedItem = null;
                //zoom out
                that.currentOffsetX = that.offsetX;
                that.currentOffsetY = that.offsetY;
                that.currentWidth = that.width;
                that.currentHeight = that.height - 62;

                that.columnWidth = (that.width - that.offsetX) / that.buckets.length;

                var rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.currentHeight, that.ratio, that.bigCount);
                that.SetVisibleTileGraphPositions(rowscols, that.offsetX, that.offsetY, true, true);
                $('.pv-viewarea-graphview-overlay div').fadeIn('slow');
            }


            $.publish("/PivotViewer/Views/Item/Selected", [selectedItem]);
            if (!found) {
                var bucketNumber = Math.floor((evt.x - that.offsetX) / that.columnWidth);
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

        $.subscribe("/PivotViewer/Views/Canvas/Zoom", function (evt) {
            if (!that.isActive)
                return;

            var oldScale = that.Scale;
            var preWidth = that.currentWidth;
            var preHeight = that.currentHeight;
            //Set the zoom time - the time it takes to zoom to the scale
            //if on a touch device where ect.scale != undefined then have no delay
            var zoomTime = evt.scale != undefined ? 0 : 1000;

            if (evt.scale != undefined) {
                if (evt.scale >= 1)
                    that.Scale += (evt.scale - 1);
                else {
                    that.Scale -= evt.scale;
                    that.Scale = that.Scale < 1 ? 1 : that.Scale;
                }
            } else if (evt.delta != undefined)
                that.Scale = evt.delta > 0 ? that.Scale / 0.7 : that.Scale * 0.7; //evt.delta > 0 ? that.Scale / evt.delta : that.Scale * Math.abs(evt.delta);

            if (that.Scale == NaN)
                that.Scale = 1;

            var newWidth = (that.width - that.offsetX) * that.Scale;
            var newHeight = (that.height - that.offsetY - 62) * that.Scale;



            //if trying to zoom out too far, reset to min
            if (newWidth < that.width || that.Scale == 1) {
                that.currentOffsetX = that.offsetX;
                that.currentOffsetY = that.offsetY;
                that.currentWidth = that.width - that.offsetX;
                that.currentHeight = that.height - that.offsetY - 62;
                that.columnWidth = (that.width - that.offsetX) / that.buckets.length;
                that.Scale = 1;
                $('.pv-viewarea-graphview-overlay div').fadeIn('slow');
            } else {
                
                //adjust position to base scale - then scale out to new scale
                //Move the scaled position to the mouse location
                that.currentOffsetX = evt.x - (((evt.x - that.currentOffsetX) / oldScale) * that.Scale);
                //Work out the scaled position of evt.y and then calc the difference between the actual evt.y
                //Still needs a slight tweak as there is something still offsetting it slightly
                that.currentOffsetY = ((that.canvasHeightUIAdjusted - evt.y + that.offsetY) * that.Scale) - (that.canvasHeightUIAdjusted + that.offsetY - evt.y); // newHeight - scaledPositionY; //((that.canvasHeightUIAdjusted - evt.y) * that.Scale) - scaledPositionY;
                that.currentWidth = newWidth;
                that.currentHeight = newHeight;
                that.columnWidth = newWidth / that.buckets.length;
                $('.pv-viewarea-graphview-overlay div').fadeOut('slow');
            }

            var rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.currentHeight, that.ratio, that.bigCount);
            that.SetVisibleTileGraphPositions(rowscols, that.currentOffsetX, that.currentOffsetY, true, true);

            //deselect tiles if zooming out
            if (evt.delta < 0) {
                for (var i = 0; i < that.tiles.length; i++) {
                    that.tiles[i].Selected(false);
                }
                that.selected = null;
                $.publish("/PivotViewer/Views/Item/Selected", [that.selected]);
            }
        });

        $.subscribe("/PivotViewer/Views/Canvas/Drag", function (evt) {
            if (!that.isActive)
                return;

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
            if (dragY > 0 && (that.currentOffsetY + that.canvasHeightUIAdjusted) > that.currentHeight + that.offsetY) {
                that.currentOffsetY -= dragY;
                noChangeY = true;
            }
            //RHS bounds check
            //if the current offset is smaller than the default offset and the zoom scale == 1 then stop drag
            if (that.currentOffsetX < that.offsetX && that.currentWidth == that.width) {
                that.currentOffsetX -= dragX;
                noChangeX = true;
            }
            if (dragX < 0 && (that.currentOffsetX) < -1 * (that.currentWidth - that.width)) {
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

        //Sort
        this.tiles = dzTiles.sort(this.SortBy(this.sortFacet, false, function (a) {
            return $.isNumeric(a) ? a : a.toUpperCase();
        }));
        this.currentFilter = currentFilter;

        this.buckets = this.Bucketize(dzTiles, currentFilter, this.sortFacet);

        this.columnWidth = (this.width - this.offsetX) / this.buckets.length;
        this.canvasHeightUIAdjusted = this.height - 62;

        //Find biggest bucket to determine tile size, rows and cols
        //Also create UI elements
        var uiElements = [];
        this.bigCount = 0;
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
                this.SetOuterTileDestination(this.width, this.height, this.tiles[i]);
                this.tiles[i].start = PivotViewer.Utils.Now();
                this.tiles[i].end = this.tiles[i].start + 1000;
            }
        }

        var pt2Timeout = currentFilter.length == this.tiles.length ? 0 : 500;
        //Delay pt2 animation
        setTimeout(function () {
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
        return 'Content/images/GraphView.png';
    },
    GetButtonImageSelected: function () {
        return 'Content/images/GraphViewSelected.png';
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
            for (var j = 0, _jLen = this.tiles.length; j < _jLen; j++) {
                if ($.inArray(this.tiles[j].facetItem.Id, this.buckets[i].Ids) >= 0) {

                    if (initTiles) {
                        //setup tile initial positions
                        this.tiles[j].startx = this.tiles[j].x;
                        this.tiles[j].starty = this.tiles[j].y;
                        this.tiles[j].startwidth = this.tiles[j].width;
                        this.tiles[j].startheight = this.tiles[j].height;
                    }

                    this.tiles[j].destinationwidth = rowscols.TileWidth;
                    this.tiles[j].destinationheight = rowscols.TileHeight;
                    this.tiles[j].destinationx = (i * this.columnWidth) + (currentColumn * rowscols.TileWidth) + offsetX;
                    this.tiles[j].destinationy = this.canvasHeightUIAdjusted - rowscols.TileHeight - (currentRow * rowscols.TileHeight) + offsetY;
                    this.tiles[j].start = PivotViewer.Utils.Now();
                    this.tiles[j].end = this.tiles[j].start + 1000;

                    if (currentColumn == columns - 1) {
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