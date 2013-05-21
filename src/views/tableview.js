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
        var selectedFacet = "";
        var selectedId = "";
        var sortKey = 'pv-key';
        var sortReverseEntity = true;
        var sortReverseAttribute = true;
        var sortReverseValue = true;
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
    Filter: function (dzTiles, currentFilter, sortFacet, stringFacets, changingView, selectedItem) {
        var that = this;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Table View Filtered: ' + currentFilter.length);

        if (changingView) {
            $('.pv-viewarea-canvas').fadeOut();
            $('.pv-tableview-table').fadeIn(function(){
                $.publish("/PivotViewer/Views/Item/Selected", [{id: selectedItem.Id, bkt: 0}]);
            });
        }

        this.tiles = dzTiles;
        this.currentFilter = currentFilter;

        this.selectedFacet = "";
        this.selectedId = "";
        this.sortReverseEntity = true;
        this.sortReverseAttribute = true;
        this.sortReverseValue = true;

        this.CreateTable ( currentFilter, this.selectedFacet );
        this.init = false;
    },
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
        if (sortKey == 'pv-key') {
        } else if (sortKey == 'pv-facet'){
        } else if (sortKey == 'pv-value'){
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
            var filter = [];

            if (this.selectedId == "" || this.selectedId == null )
                filter = this.currentFilter;
            else
                filter[0] = this.selectedId;

            if (this.selectedFacet == "") {
                this.selectedFacet = cells[1].innerHTML;
                this.CreateTable( filter, this.selectedFacet, this.sortKey );
            } else {
                this.selectedFacet = "";
                this.CreateTable( filter, "" );
            }
        } else if (columnId == 'pv-value'){
            // filter on this value...
            $.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: cells[1].innerHTML, Item: cells[2].innerHTML, Values: null, ClearFacetFilters: true }]);
        }
    },
    CreateTable: function ( currentFilter, selectedFacet, sortKey, sortReverse ) {
        var that = this;
        var table = $('#pv-table');
        var showAllFacets = false; 
        var tableRows = new Array();
        var sortIndex = 0;
        table.empty();

        if (selectedFacet == null || selectedFacet == "" || typeof (selectedFacet) == undefined)
          showAllFacets = true;  
        $('.pv-tableview-table').css('height', this.height - 12 + 'px');
        $('.pv-tableview-table').css('width', this.width - 415 + 'px');

        var oddOrEven = 'odd-row';
        var tableContent = "<table style='color:#484848;'><tr class='pv-tableview-heading'><th id='pv-key'>Key</th><th id='pv-facet'>Facet</th><th id='pv-value'>Value</th></tr>";

        for (var i = 0; i < currentFilter.length; i++) {
            for (var j = 0; j < this.tiles.length; j++) {
                if (this.tiles[j].facetItem.Id == currentFilter[i]) {
                   var entity = this.tiles[j].facetItem.Name;
                   if ( showAllFacets || selectedFacet == 'Description') {
                      //tableContent += "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>Description</td><td id='pv-value'>" + this.tiles[j].facetItem.Description + "</td></tr>";
                      var sortKeyValue;
                      if (sortKey == 'pv-key')
                        sortKeyValue = entity;
                      else if (sortKey == 'pv-facet')
                        sortKeyValue = 'Description';
                      else if (sortKey == 'pv-value')
                        sortKeyValue = this.tiles[j].facetItem.Description;

                      tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>Description</td><td id='pv-value'>" + this.tiles[j].facetItem.Description + "</td></tr>"});

                      oddOrEven = 'even-row';
                   }

                   if (oddOrEven == 'odd-row')
                      oddOrEven = 'even-row';
                   else
                       oddOrEven = 'odd-row';

                   if ( showAllFacets) {
                       for (k = 0; k < this.tiles[j].facetItem.Facets.length; k++){
                           var attribute = this.tiles[j].facetItem.Facets[k].Name;
                           for (l = 0; l < this.tiles[j].facetItem.Facets[k].FacetValues.length; l++) {
                              var value = this.tiles[j].facetItem.Facets[k].FacetValues[l].Value;

                              var sortKeyValue;
                              if (sortKey == 'pv-key')
                                sortKeyValue = entity;
                              else if (sortKey == 'pv-facet')
                                sortKeyValue = attribute;
                              else if (sortKey == 'pv-value')
                                sortKeyValue = value;

                              // Colour blue if in the filter
                              if (this.IsFilterVisible (attribute))
 
                                  //tableContent += "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>" + attribute + "</td><td id='pv-value' style='color:#36A3D8;cursor:pointer'>" + value + "</td></tr>";
                                  tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>" + attribute + "</td><td id='pv-value' style='color:#36A3D8;cursor:pointer'>" + value + "</td></tr>"});
                              else
                                  //tableContent += "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>" + attribute + "</td><td id='pv-value'>" + value + "</td></tr>";
                                  tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>" + attribute + "</td><td id='pv-value'>" + value + "</td></tr>"});
                           if (oddOrEven == 'odd-row')
                               oddOrEven = 'even-row';
                           else
                               oddOrEven = 'odd-row';
                           }
                       }
                   } else {
                       for (k = 0; k < this.tiles[j].facetItem.Facets.length; k++){
                           var attribute = this.tiles[j].facetItem.Facets[k].Name;
                           if (attribute == selectedFacet) {
                               for (l = 0; l < this.tiles[j].facetItem.Facets[k].FacetValues.length; l++) {
                                  var value = this.tiles[j].facetItem.Facets[k].FacetValues[l].Value;

                                  var sortKeyValue;
                                  if (sortKey == 'pv-key')
                                    sortKeyValue = entity;
                                  else if (sortKey == 'pv-facet')
                                    sortKeyValue = attribute;
                                  else if (sortKey == 'pv-value')
                                    sortKeyValue = value;

                                  // Colour blue if in the filter
                                  if (this.IsFilterVisible (attribute))
                                      //tableContent += "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>" + attribute + "</td><td id='pv-value' style='color:#36A3D8;cursor:pointer'>" + value + "</td></tr>";
                                      tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>" + attribute + "</td><td id='pv-value' style='color:#36A3D8;cursor:pointer'>" + value + "</td></tr>"});
                                  else
                                      //tableContent += "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>" + attribute + "</td><td id='pv-value'>" + value + "</td></tr>";
                                      tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key'>" + entity + "</td><td id='pv-facet'>" + attribute + "</td><td id='pv-value'>" + value + "</td></tr>"});
                               if (oddOrEven == 'odd-row')
                                   oddOrEven = 'even-row';
                               else
                                   oddOrEven = 'odd-row';
                               }
                               break;
                           }
                       }
                   }
               }
            }
        }

        tableRows.sort(function(a, b){
          if(a.key > b.key){
            return 1;
          }
          else if(a.key < b.key){
            return -1;
          } 
          return 0;
        });

        if (sortReverse)
          tableRows.reverse();

        for (var i = 0; i < tableRows.length; i++) {
           tableContent += tableRows[i].value;
        }

        tableContent += "</table>";
        table.append(tableContent);

        // Table view events
        $('.pv-tableview-heading').on('click', function (e) {
            var id = e.originalEvent.target.id;

            var filter = [];

            if (that.selectedId == "" || that.selectedId == null )
                filter = that.currentFilter;
            else
                filter[0] = that.selectedId;

            var sortReverse;
            if (id == 'pv-key') {
                if (that.sortReverseEntity)
                  sortReverse = false;
                else 
                  sortReverse = true;
                that.sortReverseEntity = sortReverse;
            } else if (id == 'pv-facet'){
                if (that.sortReverseAttribute)
                  sortReverse = false;
                else 
                  sortReverse = true;
                that.sortReverseAttribute = sortReverse;
            } else if (id == 'pv-value'){
                if (that.sortReverseValue)
                  sortReverse = false;
                else 
                  sortReverse = true;
                that.sortReverseValue = sortReverse;
            }

            that.sortKey = id;
            that.CreateTable (filter, that.selectedFacet, id, sortReverse);
            //that.SortTable(id);
        }); 
        $('.pv-tableview-odd-row').on('click', function (e) {
            var id = e.originalEvent.target.id;
            that.CellClick(id, e.currentTarget.cells );
        }); 
        $('.pv-tableview-even-row').on('click', function (e) {
            var id = e.originalEvent.target.id;
            that.CellClick(id, e.currentTarget.cells );
        }); 
    },
    Selected: function (itemId) {
        var filter = [];
        if (itemId == "" || itemId == null || typeof(itemId) == undefined ) {
            this.selectedId = "";
            this.CreateTable (this.currentFilter, this.selectedFacet);
        } else {
            filter[0] = itemId;
            this.selectedId = itemId;
            this.CreateTable (filter, this.selectedFacet);
        }
    },
    SetFacetCategories: function (collection) {
        this.categories = collection.FacetCategories;
    },
    IsFilterVisible: function (attribute) {
        var visible = null;

        for (i = 0; i < this.categories.length; i++) {
            if (this.categories[i].Name == attribute)
                visible = this.categories[i].IsFilterVisible;
        }

        if (visible != null)
            return visible;
        else
            return false;
    }
});
