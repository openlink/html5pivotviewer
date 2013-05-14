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
//    Copyright (C) 2012-2013 OpenLink Software - http://www.openlinksw.com/
//
//  This software is licensed under the terms of the
//  GNU General Public License v2 (see COPYING)
//

///
/// Table view
///
PivotViewer.Views.TableView = PivotViewer.Views.IPivotViewerView.subClass({
    init: function () {
        this._super();
        var that = this;
        var currentFilter;

/*
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
*/

/*
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
*/

/*
        $.subscribe("/PivotViewer/Views/Canvas/Zoom", function (evt) {
            if (!that.isActive)
                return;

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
*/

/*
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
*/
    },
    Setup: function (width, height, offsetX, offsetY, tileMaxRatio) {
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.currentWidth = this.width;
        this.currentHeight = this.height;
        this.currentOffsetX = this.offsetX;
        this.currentOffsetY = this.offsetY;
    },
    Filter: function (dzTiles, currentFilter, sortFacet, stringFacets) {
        var that = this;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Table View Filtered: ' + currentFilter.length);

        $('.pv-viewarea-canvas').fadeOut();
        $('.pv-tableview-table').fadeIn();

        this.tiles = dzTiles;
        this.currentFilter = currentFilter;

        this.CreateTable ( currentFilter );
        this.init = false;
    },
/*
        //Sort
        this.tiles = this.tiles.sort(this.SortBy(sortFacet, false, function (a) {
            return $.isNumeric(a) ? a : a.toUpperCase();
        }, stringFacets));
        this.currentFilter = currentFilter;

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
*/

    GetUI: function () {
        if (Modernizr.canvas)
            return "";
        else
            return "<div class='pv-viewpanel-unabletodisplay'><h2>Unfortunately this view is unavailable as your browser does not support this functionality.</h2>Please try again with one of the following supported browsers: IE 9+, Chrome 4+, Firefox 2+, Safari 3.1+, iOS Safari 3.2+, Opera 9+<br/><a href='http://caniuse.com/#feat=canvas'>http://caniuse.com/#feat=canvas</a></div>";
    },
    GetButtonImage: function () {
        return 'Content/images/TableView.png';
    },
    GetButtonImageSelected: function () {
        return 'Content/images/TableViewSelected.png';
    },
    GetViewName: function () {
        return 'Table View';
    },
    SortTable: function (sortKey) {
        Debug.Log('SortTable');
        if (columnId == 'pv-key') {
        } else if (columnId == 'pv-facet'){
        } else if (columnId == 'pv-value'){
        }
    },
    CellClick: function (columnId, cells) {
        Debug.Log('CellClick');
        if (columnId == 'pv-key') {
            // selected item name need to get the id and publish selected event 
            var selectedItemName = cells[0].innerHTML;
            var selectedItemId = -1;

            for (var i = 0; i < this.tiles.length; i++) {
                if (this.tiles[i].facetItem.Name == selectedItemName) {
                    selectedItemId = this.tiles[i].facetItem.Id;
                    break;
                }
            }

            if (selectedItemId > 0 && selectedItemId != this.selectedId) {
                this.selectedId = selectedItemId;
                $.publish("/PivotViewer/Views/Item/Selected", [{id: selectedItemId, bkt: 0}]);
            }
            else if (selectedItemId > 0 && selectedItemId == this.selectedId) {
                this.selectedId = "";   
                $.publish("/PivotViewer/Views/Item/Selected", [{id: "", bkt: 0}]);
            }

        } else if (columnId == 'pv-facet'){
          // what to do...
        } else if (columnId == 'pv-value'){
            // filter on this value...
            $.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: cells[1].innerHTML, Item: cells[2].innerHTML, Values: null, ClearFacetFilters: true }]);
        }
    },
    CreateTable: function ( currentFilter) {
        var that = this;
        var table = $('#pv-table');
        table.empty();

        $('.pv-tableview-table').css('height', this.height - 12 + 'px');
        $('.pv-tableview-table').css('width', this.width - 415 + 'px');

        var oddOrEven = 'odd-row';
        var tableContent = "<table><tr class='pv-tableview-heading'><th id='pv-key'>Key</th><th id='pv-facet'>Facet</th><th id='pv-value'>Value</th></tr>";

        for (var i = 0; i < currentFilter.length; i++) {
            for (var j = 0; j < this.tiles.length; j++) {
                if (this.tiles[j].facetItem.Id == currentFilter[i]) {
                   var entity = this.tiles[j].facetItem.Name;
                   tableContent += "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>Description</td><td id='pv-value'>" + this.tiles[j].facetItem.Description + "</td></tr>";
                   if (oddOrEven == 'odd-row')
                       oddOrEven = 'even-row';
                   else
                       oddOrEven = 'odd-row';
                   for (k = 0; k < this.tiles[j].facetItem.Facets.length; k++){
                       var attribute = this.tiles[j].facetItem.Facets[k].Name;
                       for (l = 0; l < this.tiles[j].facetItem.Facets[k].FacetValues.length; l++) {
                          var value = this.tiles[j].facetItem.Facets[k].FacetValues[l].Value;
                          tableContent += "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>" + attribute + "</td><td id='pv-value'>" + value + "</td></tr>";
                       if (oddOrEven == 'odd-row')
                           oddOrEven = 'even-row';
                       else
                           oddOrEven = 'odd-row';
                       }
                   }
               }
            }
        }

        tableContent += "</table>";
        table.append(tableContent);

        // Table view events
        $('.pv-tableview-heading').on('click', function (e) {
            var id = (typeof e.originalEvent.explicitOriginalTarget.id != 'undefined')  ? e.originalEvent.explicitOriginalTarget.id : e.originalEvent.explicitOriginalTarget.parentElement.id;

            that.SortTable(id);
        }); 
        $('.pv-tableview-odd-row').on('click', function (e) {
            var id = (typeof e.originalEvent.explicitOriginalTarget.id != 'undefined')  ? e.originalEvent.explicitOriginalTarget.id : e.originalEvent.explicitOriginalTarget.parentElement.id;
            that.CellClick(id, e.currentTarget.cells );
        }); 
        $('.pv-tableview-even-row').on('click', function (e) {
            var id = (typeof e.originalEvent.explicitOriginalTarget.id != 'undefined')  ? e.originalEvent.explicitOriginalTarget.id : e.originalEvent.explicitOriginalTarget.parentElement.id;
            that.CellClick(id, e.currentTarget.cells );
        }); 
    },
    Selected: function (itemId) {
        if (itemId == "" || itemId == null)
            this.CreateTable (this.currentFilter);
        else 
            this.CreateTable (itemId);
    }
});
