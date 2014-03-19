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

///
/// Grid view
///
PivotViewer.Views.GridView = PivotViewer.Views.TileBasedView.subClass({
    init: function () {
        this.Scale = 1;
        this._super();
        this.dontZoom = false;
        var that = this;
        //Event Handlers

        $.subscribe("/PivotViewer/Views/Canvas/Click", function (evt) {
            if (!that.isActive)
                return;

            var selectedItem = null;
            var selectedTile = null;
            for (var i = 0; i < that.tiles.length; i++) {
                var loc = that.tiles[i].Contains(evt.x, evt.y);
                if ( loc >= 0 ) {
                    selectedTile = that.tiles[i];
                    selectedItem = that.tiles[i].facetItem.Id;
                } else {
                    that.tiles[i].Selected(false);
                }
            }
	    that.handleSelection (selectedItem, selectedTile);
	});

        $.subscribe("/PivotViewer/Views/Canvas/Hover", function (evt) {
            if (!that.isActive || that.selected.length > 0)
                return;

            for (var i = 0; i < that.tiles.length; i++) {
                var loc = that.tiles[i].Contains(evt.x, evt.y); 
                if ( loc >= 0 )
                    that.tiles[i].Selected(true);
                else
                    that.tiles[i].Selected(false);
            }
        });

        $.subscribe("/PivotViewer/Views/Canvas/Zoom", function (evt) {
            if (!that.isActive)
                return;

            if (that.dontZoom) {
                that.dontZoom = false;
                return;
            }

            var oldScale = that.Scale;
            var preWidth = that.currentWidth;
            var preHeight = that.currentHeight;
            //Set the zoom time - the time it takes to zoom to the scale
            //if on a touch device where evt.scale != undefined then have no delay
            var zoomTime = evt.scale != undefined ? 0 : 1000;
                        
            if (evt.scale != undefined) {
                if (evt.scale >= 1)
                    that.Scale += (evt.scale - 1);
                else {
                    that.Scale -= evt.scale;
                    that.Scale = that.Scale < 1 ? 1 : that.Scale;
                }
            } else if (evt.delta != undefined)
                that.Scale = evt.delta == 0 ? 1 : (that.Scale + evt.delta - 1);

            if (that.Scale == NaN)
                that.Scale = 1;

            var newWidth = (that.width - that.offsetX) * that.Scale;
            var newHeight = (that.height - that.offsetY) * that.Scale;



            //if trying to zoom out too far, reset to min
            if (newWidth < that.width || that.Scale == 1) {
                that.currentOffsetX = that.offsetX;
                that.currentOffsetY = that.offsetY;
                that.currentWidth = that.width;
                that.currentHeight = that.height;
                that.Scale = 1;
                // Reset the slider to zero 
                that.dontZoom = true;
                $('.pv-toolbarpanel-zoomslider').slider('option', 'value', 0);
            } else {
                //adjust position to base scale - then scale out to new scale
                var scaledPositionX = ((evt.x - that.currentOffsetX) / oldScale) * that.Scale;
                var scaledPositionY = ((evt.y - that.currentOffsetY) / oldScale) * that.Scale;

                //Move the scaled position to the mouse location
                that.currentOffsetX = evt.x - scaledPositionX;
                that.currentOffsetY = evt.y - scaledPositionY;
                that.currentWidth = newWidth;
                that.currentHeight = newHeight;
            }

            var rowscols = that.GetRowsAndColumns(that.currentWidth - that.offsetX, that.currentHeight - that.offsetY, that.maxRatio, that.currentFilter.length);
            that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, zoomTime);

            //deselect tiles if zooming back to min size
            if (that.Scale == 1 && oldScale != 1) {
                for (var i = 0; i < that.tiles.length; i++) {
                    that.tiles[i].Selected(false);
                }
                that.selected = "";
                $.publish("/PivotViewer/Views/Item/Selected", [{id: that.selected, bkt: 0}]);
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
    Setup: function (width, height, offsetX, offsetY, tileMaxRatio) {
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.maxRatio = tileMaxRatio;
        this.currentWidth = this.width;
        this.currentHeight = this.height;
        this.currentOffsetX = this.offsetX;
        this.currentOffsetY = this.offsetY;
    },
    Filter: function (dzTiles, currentFilter, sortFacet, stringFacets, changingView, changeViewSelectedItem) {
        var that = this;
        var changingFromNonTileView = false;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Grid View Filtered: ' + currentFilter.length);

        this.changingView = false;
        if (changingView) {
            if ($('.pv-tableview-table').is(':visible')){
                changingFromNonTileView = true;
                $('.pv-tableview-table').fadeOut();
                //this.selected = changeViewSelectedItem;
                this.selected = "";
                $('.pv-toolbarpanel-zoomslider').fadeIn();
                $('.pv-toolbarpanel-zoomcontrols').css('border-width', '1px');
                $('.pv-viewarea-canvas').fadeIn(function(){
                    $.publish("/PivotViewer/Views/ChangeTo/Grid", [{Item: changeViewSelectedItem}]);
                });
            }
            if ($('.pv-mapview-canvas').is(':visible')){
                changingFromNonTileView = true;
                $('.pv-toolbarpanel-maplegend').fadeOut(400, function(){
                    $('.pv-toolbarpanel-zoomslider').fadeIn();
                    $('.pv-toolbarpanel-zoomcontrols').css('border-width', '1px');
                });
                $('.pv-mapview-legend').hide('slide', {direction: 'up'});
                $('.pv-mapview-canvas').fadeOut();
                this.selected = "";
                $('.pv-viewarea-canvas').fadeIn(function(){
                    $.publish("/PivotViewer/Views/ChangeTo/Grid", [{Item: changeViewSelectedItem}]);
                });
            }
            if ($('.pv-timeview-canvas').is(':visible')){
                changingFromNonTileView = true;
                $('.pv-timeview-canvas').fadeOut();
                this.selected = "";
                $('.pv-toolbarpanel-timelineselector').fadeOut();
                $('.pv-toolbarpanel-maplegend').fadeOut();
                $('.pv-toolbarpanel-sort').fadeIn();
                $('.pv-toolbarpanel-zoomslider').fadeIn();
                $('.pv-toolbarpanel-zoomcontrols').css('border-width', '1px');
                $('#MAIN_BODY').css('overflow', 'auto');
                $('.pv-viewarea-canvas').fadeIn(function(){
                    $.publish("/PivotViewer/Views/ChangeTo/Grid", [{Item: changeViewSelectedItem}]);
                });
            }
            if ($('.pv-mapview2-canvas').is(':visible')){
                changingFromNonTileView = true;
                $('.pv-mapview2-canvas').fadeOut();
                this.selected = "";
                $('.pv-toolbarpanel-zoomslider').fadeIn();
                $('.pv-toolbarpanel-zoomcontrols').css('border-width', '1px');
                $('.pv-viewarea-canvas').fadeIn(function(){
                    $.publish("/PivotViewer/Views/ChangeTo/Grid", [{Item: changeViewSelectedItem}]);
                });
            }
        }

        this.tiles = dzTiles;
        if (this.init) {
            this.SetInitialTiles(this.tiles, this.width, this.height);
        }

        // Clear all the multiple images that are used in the grid view
        for (var l = 0; l < this.tiles.length; l++) {
          while (this.tiles[l]._locations.length > 1) 
              this.tiles[l]._locations.pop();   
        }
        // Ensure any selected location is zero
        for (var i = 0; i < this.tiles.length; i++) {
            this.tiles[i].selectedLoc = 0;
        }

        //Sort
        this.tiles = this.tiles.sort(this.SortBy(sortFacet, false, function (a) {
            return $.isNumeric(a) ? a : a.toUpperCase();
        }, stringFacets));
        this.currentFilter = currentFilter;

        // Don't calculate positions if changing from table view with item already selected
        if (!changingFromNonTileView || (changeViewSelectedItem == "")) {
            var pt1Timeout = 0;
            //zoom out first
            Debug.Log("this.currentWidth: " + this.currentWidth + " this.width: " + this.width);
              var value = $('.pv-toolbarpanel-zoomslider').slider('option', 'value');
              if (value > 0) { 
                this.selected = selectedItem = "";
                //zoom out
                this.currentOffsetX = this.offsetX;
                this.currentOffsetY = this.offsetY;
                // Zoom using the slider event
                $('.pv-toolbarpanel-zoomslider').slider('option', 'value', 1);
                var rowscols = this.GetRowsAndColumns(this.currentWidth - this.offsetX, this.currentHeight - this.offsetY, this.maxRatio, this.tiles.length);
                var clearFilter = [];
                for (var i = 0; i < this.tiles.length; i++) {
                    this.tiles[i].origwidth = rowscols.TileHeight / this.tiles[i]._controller.GetRatio(this.tiles[i].facetItem.Img);
                    this.tiles[i].origheight = rowscols.TileHeight;
                    clearFilter.push(this.tiles[i].facetItem.Id);
                }
                this.SetVisibleTilePositions(rowscols, clearFilter, this.currentOffsetX, this.currentOffsetY, true, false, 1000);
                pt1Timeout = 1000;
            }
 
            setTimeout(function () {
                for (var i = 0; i < that.tiles.length; i++) {
                    //setup tiles
                    that.tiles[i]._locations[0].startx = that.tiles[i]._locations[0].x;
                    that.tiles[i]._locations[0].starty = that.tiles[i]._locations[0].y;
                    that.tiles[i].startwidth = that.tiles[i].width;
                    that.tiles[i].startheight = that.tiles[i].height;
 
                    var filterindex = $.inArray(that.tiles[i].facetItem.Id, currentFilter);
                    //set outer location for all tiles not in the filter
                    if (filterindex < 0) {
                        that.SetOuterTileDestination(that.width, that.height, that.tiles[i]);
                        that.tiles[i].start = PivotViewer.Utils.Now();
                        that.tiles[i].end = that.tiles[i].start + 1000;
                    }
                }
 
                // recalculate max width of images in filter
                that.maxRatio = that.tiles[0]._controller.GetRatio(that.tiles[0].facetItem.Img);
                for (var i = 0; i < that.tiles.length; i++) {
                    var filterindex = $.inArray(that.tiles[i].facetItem.Id, currentFilter);
                    if (filterindex >= 0) {
                        if (that.tiles[i]._controller.GetRatio(that.tiles[i].facetItem.Img) < that.maxRatio)
                            that.maxRatio = that.tiles[i]._controller.GetRatio(that.tiles[i].facetItem.Img);
                    }
                }
 
                var pt2Timeout = currentFilter.length == that.tiles.length ? 0 : 500;
                //Delay pt2 animation
                setTimeout(function () {
                    var rowscols = that.GetRowsAndColumns(that.width - that.offsetX, that.height - that.offsetY, that.maxRatio, that.currentFilter.length);
                    for (var i = 0; i < that.tiles.length; i++) {
                        that.tiles[i].origwidth = rowscols.TileHeight / that.tiles[i]._controller.GetRatio(that.tiles[i].facetItem.Img);
                        that.tiles[i].origheight = rowscols.TileHeight;
                    }
                    that.SetVisibleTilePositions(rowscols, that.currentFilter, that.offsetX, that.offsetY, false, false, 1000);
                }, pt2Timeout);
 
            }, pt1Timeout);
        }

        this.init = false;
    },
    GetUI: function () {
        if (Modernizr.canvas)
            return "";
        else
            return "<div class='pv-viewpanel-unabletodisplay'><h2>Unfortunately this view is unavailable as your browser does not support this functionality.</h2>Please try again with one of the following supported browsers: IE 9+, Chrome 4+, Firefox 2+, Safari 3.1+, iOS Safari 3.2+, Opera 9+<br/><a href='http://caniuse.com/#feat=canvas'>http://caniuse.com/#feat=canvas</a></div>";
    },
    GetButtonImage: function () {
        return 'images/GridView.png';
    },
    GetButtonImageSelected: function () {
        return 'images/GridViewSelected.png';
    },
    GetViewName: function () {
        return 'Grid View';
    },
    /// Sets the tiles position based on the GetRowsAndColumns layout function
    SetVisibleTilePositions: function (rowscols, filter, offsetX, offsetY, initTiles, keepColsRows, miliseconds) {
        //re-use previous columns
        var columns = (keepColsRows && this.rowscols)  ? this.rowscols.Columns : rowscols.Columns;
        if (!keepColsRows)
            this.rowscols = rowscols;

        var currentColumn = 0;
        var currentRow = 0;
        for (var i = 0; i < this.tiles.length; i++) {
            var filterindex = $.inArray(this.tiles[i].facetItem.Id, filter);
            if (filterindex >= 0) {
                if (initTiles) {
                    //setup tile initial positions
                    this.tiles[i]._locations[0].startx = this.tiles[i]._locations[0].x;
                    this.tiles[i]._locations[0].starty = this.tiles[i]._locations[0].y;
                    this.tiles[i].startwidth = this.tiles[i].width;
                    this.tiles[i].startheight = this.tiles[i].height;
                }

                //set destination positions
                this.tiles[i].destinationwidth = rowscols.TileMaxWidth;
                this.tiles[i].destinationheight = rowscols.TileHeight;
                this.tiles[i]._locations[0].destinationx = (currentColumn * rowscols.TileMaxWidth) + offsetX;
                this.tiles[i]._locations[0].destinationy = (currentRow * rowscols.TileHeight) + offsetY;
                this.tiles[i].start = PivotViewer.Utils.Now();
                this.tiles[i].end = this.tiles[i].start + miliseconds;
                if (currentColumn == columns - 1) {
                    currentColumn = 0;
                    currentRow++;
                }
                else
                    currentColumn++;
            }
        }
    },
    GetSelectedCol: function (tile) {
        var that = this;
        selectedCol = Math.round((tile._locations[0].x - that.currentOffsetX) / tile.width); 
        return selectedCol;
    },
    GetSelectedRow: function (tile) {
        var that = this;
        selectedRow = Math.round((tile._locations[0].y - that.currentOffsetY) / tile.height);
        return selectedRow;
    },
    /// Centres the selected tile
    CentreOnSelectedTile: function (selectedCol, selectedRow) {
        var that = this;
        var selectedTile; 
        for (var i = 0; i < that.tiles.length; i++) {
            if (that.tiles[i].IsSelected()) {
                selectedTile = that.tiles[i];   
                break;
            }
        }
        var rowscols = that.GetRowsAndColumns(that.currentWidth - that.offsetX, that.currentHeight - that.offsetY, that.maxRatio, that.currentFilter.length);

        that.currentOffsetX = ((rowscols.TileMaxWidth * selectedCol) * -1) + (that.width / 2) - (rowscols.TileMaxWidth / 2);
        that.currentOffsetY = ((rowscols.TileHeight * selectedRow) * -1) + (that.height / 2) - (rowscols.TileHeight / 2);
        that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, 1000);
    },
    handleSelection: function (selectedItem, selectedTile) {
        var that = this;
        var selectedCol = 0;
        var selectedRow = 0;
        var offsetX = 0, offsetY = 0;
 
        //First get the row and column of the selected tile
        if ( selectedItem != null && selectedTile !=null) {
            //determine row and column that tile is in in relation to the first tile
            selectedCol = Math.round((selectedTile._locations[0].x - that.currentOffsetX) / selectedTile.width);
            selectedRow = Math.round((selectedTile._locations[0].y - that.currentOffsetY) / selectedTile.height);
        }

        //Reset slider to zero before zooming ( do this before sorting the tile selection
        //because zooming to zero unselects everything...)
        if (selectedItem != null && that.selected != selectedItem) {
            if (that.selected == ""){
                var value = $('.pv-toolbarpanel-zoomslider').slider('option', 'value');
                if (value != 0)
                   $('.pv-toolbarpanel-zoomslider').slider('option', 'value', 0);
            }
        }

        if ( selectedItem != null && selectedTile !=null) {
            selectedTile.Selected(true);
            tileHeight = selectedTile.height;
            tileWidth = selectedTile.height / selectedTile._controller.GetRatio(selectedTile.facetItem.Img);
            tileOrigHeight = selectedTile.origheight;
            tileOrigWidth = selectedTile.origwidth;
            canvasHeight = selectedTile.context.canvas.height
            canvasWidth = selectedTile.context.canvas.width - ($('.pv-filterpanel').width() + $('.pv-infopanel').width());
        }

        //zoom in on selected tile
        if (selectedItem != null && that.selected != selectedItem) {
            // Find which is proportionally bigger, height or width
            if (tileHeight / canvasHeight > tileWidth/canvasWidth) 
                origProportion = tileOrigHeight / canvasHeight;
            else
                origProportion = tileOrigWidth / canvasWidth;
            //Get scaling factor so max tile dimension is about 60% total
            //Multiply by two as the zoomslider devides all scaling factors by 2
            scale = Math.round((0.75 / origProportion) * 2);

            // Zoom using the slider event
            if (that.selected == ""){
                var value = $('.pv-toolbarpanel-zoomslider').slider('option', 'value');
                value = scale; 
                $('.pv-toolbarpanel-zoomslider').slider('option', 'value', value);
            }
            that.selected = selectedItem;
            that.CentreOnSelectedTile(selectedCol, selectedRow);
        } else {
            that.selected = selectedItem = "";
            //zoom out
            that.currentOffsetX = that.offsetX;
            that.currentOffsetY = that.offsetY;
            // Zoom using the slider event
            var value = $('.pv-toolbarpanel-zoomslider').slider('option', 'value');
            value = 0;
            $('.pv-toolbarpanel-zoomslider').slider('option', 'value', value);
        }

        $.publish("/PivotViewer/Views/Item/Selected", [{id: selectedItem, bkt: 0}]);
    }
});
