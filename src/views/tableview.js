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

        $('.pv-viewpanel').append("<div style='visibility:hidden;position:relative;' id='pv-table-loader'><img src='images/loading.gif'></img></div>");
        $('#pv-table-loader').css('top', (this.height / 2) - 33 +'px');
        $('#pv-table-loader').css('left', (this.width / 2) - 43 +'px');
    },
    Filter: function (dzTiles, currentFilter, sortFacet, stringFacets, changingView, selectedItem) {
        var that = this;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Table View Filtered: ' + currentFilter.length);

        if (changingView) {
            $('.pv-viewarea-canvas').fadeOut();
            $('.pv-toolbarpanel-maplegend').fadeOut();
            $('.pv-mapview-legend').fadeOut();
            $('.pv-mapview-canvas').fadeOut();
            $('.pv-mapview2-canvas').fadeOut();
            $('.pv-timeview-canvas').fadeOut();
            $('.pv-toolbarpanel-sort').fadeIn();
            $('.pv-toolbarpanel-timelineselector').fadeOut();
            $('.pv-toolbarpanel-mapview').fadeOut();
            $('.pv-toolbarpanel-zoomslider').fadeOut();
            $('.pv-toolbarpanel-zoomcontrols').css('border-width', '0');
            $('#MAIN_BODY').css('overflow', 'auto');
            $('.pv-tableview-table').fadeIn(function(){
                if (selectedItem)
                    $.publish("/PivotViewer/Views/Item/Selected", [{id: selectedItem.Id, bkt: 0}]);
            });
        }

        this.tiles = dzTiles;
        this.currentFilter = currentFilter;

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
        return 'images/TableView.png';
    },
    GetButtonImageSelected: function () {
        return 'images/TableViewSelected.png';
    },
    GetViewName: function () {
        return 'Table View';
    },
    CellClick: function (columnId, cells) {
        Debug.Log('CellClick');
        if (columnId == 'pv-key') {
            // selected item name need to get the id and publish selected event 
            //var selectedItemName = cells[0].innerHTML;
            var selectedItemName = cells[0].textContent.trim();
            var selectedItemId = -1;

            for (var i = 0; i < this.tiles.length; i++) {
                if (this.tiles[i].facetItem.Name == selectedItemName) {
                    selectedItemId = this.tiles[i].facetItem.Id;
                    break;
                }
            }

            if (selectedItemId >= 0 && selectedItemId != this.selectedId) {
                this.selectedId = selectedItemId;
                $.publish("/PivotViewer/Views/Item/Selected", [{id: selectedItemId, bkt: 0}]);
            }
            else if (selectedItemId >= 0 && selectedItemId == this.selectedId) {
                this.selectedId = "";   
                $.publish("/PivotViewer/Views/Item/Selected", [{id: "", bkt: 0}]);
            }

        } else if (columnId == 'pv-facet'){
            var filter = [];

            if (this.selectedId == "" || this.selectedId == null )
                filter = this.currentFilter;
            else
                filter[0] = this.selectedId;

            if (this.selectedFacet == "" || this.selectedFacet == null) {
                //this.selectedFacet = cells[1].innerHTML;
                this. selectedFacet = cells[1].textContent.trim();
                this.CreateTable( filter, this.selectedFacet, this.sortKey );
            } else {
                this.selectedFacet = "";
                this.CreateTable( filter, "" );
            }
            $.publish("/PivotViewer/Views/Item/Updated", null);
        } else if (columnId == 'pv-value'){
            // filter on this value...
            $.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: cells[1].textContent.trim(), Item: cells[2].textContent.trim(), Values: null, ClearFacetFilters: true }]);
        }
    },
    CreateTable: function ( currentFilter, selectedFacet, sortKey, sortReverse ) {
        var that = this;
        var table = $('#pv-table');
        var showAllFacets = false; 
        var tableRows = new Array();
        var sortIndex = 0;
        table.empty();
        var sortImage;
        var offset;

        if (selectedFacet == null || selectedFacet == "" || typeof (selectedFacet) == undefined)
          showAllFacets = true;  
        $('.pv-tableview-table').css('height', this.height - 12 + 'px');
        $('.pv-tableview-table').css('width', this.width - 415 + 'px');

        if (sortReverse) {
            sortImage = "images/sort-up.png";
            //offset = +40;
        } else {
            sortImage = "images/sort-down.png";
            //offset = -40;
        }

        var oddOrEven = 'odd-row';
        var tableContent = "<table id='pv-table-data' style='color:#484848;'><tr class='pv-tableview-heading'><th id='pv-key' title='Sort on subject name'>Subject";
        if (sortKey == 'pv-key')
            tableContent += " <img style='position:relative;top:" + offset + "' src='" + sortImage + "'></img>";
        tableContent += "</th><th id='pv-facet' title='Sort on predicate name'>Predicate";
        if (sortKey == 'pv-facet')
            tableContent += " <img style='position:relative;top:" + offset + "' src='" + sortImage + "'></img>";
        tableContent += "</th><th id='pv-value' title='Sort on object'>Object";
        if (sortKey == 'pv-value')
            tableContent += " <img style='position:relative;top:" + offset + "' src='" + sortImage + "'></img>";
        tableContent += "</th></tr>";

        for (var i = 0; i < currentFilter.length; i++) {
            for (var j = 0; j < this.tiles.length; j++) {
                if (this.tiles[j].facetItem.Id == currentFilter[i]) {
                   var entity = this.tiles[j].facetItem.Name;
                   if ( showAllFacets || selectedFacet == 'Description') {
                      var sortKeyValue;
                      if (sortKey == 'pv-key')
                        sortKeyValue = entity;
                      else if (sortKey == 'pv-facet')
                        sortKeyValue = 'Description';
                      else if (sortKey == 'pv-value')
                        sortKeyValue = this.tiles[j].facetItem.Description;

                      // Only add a row for the Description if there is one
                      if (this.tiles[j].facetItem.Description) {
                          // Link out image if item has href
                          if (this.tiles[j].facetItem.Href) {
                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection' style='color:#009933;cursor:pointer'>" + entity + " " + "<a href=" + this.tiles[j].facetItem.Href.replace(/'/g, "%27") + " target=\"_blank\"><img style='cursor:default;' id='pv-linkout' title='Follow the link' title='Follow the link' src='images/goout.gif'></img></a></a></td><td id='pv-facet' title='Show only this predicate' style='color:#009933;cursor:pointer'>Description</td><td id='pv-value'>" + this.tiles[j].facetItem.Description + "</td></tr>"});
                          } else {
                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' class='tooltip' title='Toggle item selection'>" + entity + "</td><td id='pv-facet' title='Show only this predicate' style='color:#009933;cursor:pointer'>Description</td><td id='pv-value'>" + this.tiles[j].facetItem.Description + "</td></tr>"});
                          }
                   
                          oddOrEven = 'even-row';
                      }
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
                              if (this.IsFilterVisible (attribute)) {
                                  // Link out image if item has href
                                  if (this.tiles[j].facetItem.Href) {
                                      // Value is uri
                                      if (this.IsUri(value))
                                          tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection' style='color:#009933;cursor:pointer'>" + entity + " " + "<a href=" + this.tiles[j].facetItem.Href.replace(/'/g, "%27") + " target=\"_blank\"><img style='cursor:default;' id='pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td><td id='pv-facet'  title='Show only this predicate' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value' title='Filter on this value' style='color:#009933;cursor:pointer'>" + value + " " + "<a href=" + value + " target=\"_blank\"><img style='cursor:default;' id=pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td></tr>"});
                                      else
                                          tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection' style='color:#009933;cursor:pointer'>" + entity + " " + "<a href=" + this.tiles[j].facetItem.Href.replace(/'/g, "%27") + " target=\"_blank\"><img style='cursor:default;' id='pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td><td id='pv-facet'  title='Show only this predicate' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value' title='Filter on this value' style='color:#009933;cursor:pointer'>" + value + "</td></tr>"});
                                  } else {
                                      // Value is uri
                                      if (this.IsUri(value))
                                          tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection'>" + entity + "</td><td id='pv-facet'  title='Show only this predicate' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value' title='Filter on this value' style='color:#009933;cursor:pointer'>" + value + " " + "<a href=" + value + " target=\"_blank\"><img style='cursor:default;' id=pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td></tr>"});
                                      else
                                          tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection'>" + entity + "</td><td id='pv-facet'  title='Show only this predicate' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value'  title='Filter on this value' style='color:#009933;cursor:pointer'>" + value + "</td></tr>"});
                                  }
                             } else {
                                  // Link out image if item has href
                                  if (this.tiles[j].facetItem.Href) { 
                                      // Value is uri
                                      if (this.IsUri(value))
                                          tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection' style='color:#009933;cursor:pointer'>" + entity + " " + "<a href=" + this.tiles[j].facetItem.Href.replace(/'/g, "%27") + " target=\"_blank\"><img style='cursor:default;' id='pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td><td id='pv-facet' title='Show only this predicate' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value'><a href=" + value + ">" + value + "</a></td></tr>"});
                                       else
                                          tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection' style='color:#009933;cursor:pointer'>" + entity + " " + "<a href=" + this.tiles[j].facetItem.Href.replace(/'/g, "%27") + " target=\"_blank\"><img style='cursor:default;' id='pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td><td id='pv-facet' title='Show only this predicate' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value'>" + value + "</td></tr>"});
                                  } else {
                                      // Value is uri
                                      if (this.IsUri(value))
                                          tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Select this value'>" + entity + "</td><td id='pv-facet' title='Show only this predicate' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value'><a href" + value + ">" + value + "</a></td></tr>"});
                                       else
                                          tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Select this value'>" + entity + "</td><td id='pv-facet' title='Show only this predicate' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value'>" + value + "</td></tr>"});
                                 }
                             } 
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
                                  if (this.IsFilterVisible (attribute)) {
                                      // Link out image if item has href
                                      if (this.tiles[j].facetItem.Href) {
                                          // Value is uri
                                          if (this.IsUri(value))
                                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection' style='color:#009933;cursor:pointer'>" + entity + " " + "<a href=" + this.tiles[j].facetItem.Href.replace(/'/g, "%27") + " target=\"_blank\"><img style='cursor:default;' id='pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td><td id='pv-facet' title='Clear predicate selection' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value' class='tooltipinter 'title='Filter on this value' style='color:#009933;cursor:pointer'>" + value + " " + "<a href=" + value + " target=\"_blank\"><img style='cursor:default;' id=pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td></tr>"});
                                           else
                                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection' style='color:#009933;cursor:pointer'>" + entity + " " + "<a href=" + this.tiles[j].facetItem.Href.replace(/'/g, "%27") + " target=\"_blank\"><img style='cursor:default;' id='pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td><td id='pv-facet' title='Clear predicate selection' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value' title='Filter on this value' style='color:#009933;cursor:pointer'>" + value + "</td></tr>"});
                                      } else {
                                          // Value is uri
                                          if (this.IsUri(value))
                                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection'>" + entity + "</td><td id='pv-facet' class-'tooltipcustom' title='Clear predicate selection' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value' title='Filter on this value' style='color:#009933;cursor:pointer'>" + value + " " + "<a href=" + value + " target=\"_blank\"><img style='cursor:default;' id=pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td></tr>"});
                                           else
                                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection'>" + entity + "</td><td id='pv-facet' class-'tooltipcustom' title='Clear predicate selection' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value' title='Filter on this value' style='color:#009933;cursor:pointer'>" + value + "</td></tr>"});
                                    }
                               } else {
                                      // Link out image if item has href
                                      if (this.tiles[j].facetItem.Href) { 
                                          // Value is uri
                                          if (this.IsUri(value))
                                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Click the cell to select this item' style='color:#009933;cursor:pointer'>" + entity + " " + "<a href=" + this.tiles[j].facetItem.Href.replace(/'/g, "%27") + " target=\"_blank\"><img style='cursor:default;' id='pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td><td id='pv-facet' title='Clear predicate selection' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value'><a href=" + value + ">" + value + "</a></td></tr>"});
                                          else
                                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Click the cell to select this item' style='color:#009933;cursor:pointer'>" + entity + " " + "<a href=" + this.tiles[j].facetItem.Href.replace(/'/g, "%27") + " target=\"_blank\"><img style='cursor:default;' id='pv-linkout' title='Follow the link' src='images/goout.gif'></img></a></td><td id='pv-facet' title='Clear predicate selection' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value'>" + value + "</td></tr>"});
                                      } else {
                                          // Value is uri
                                          if (this.IsUri(value))
                                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection'>" + entity + "</td><td id='pv-facet' class-'tooltipcustom' title='Clear predicate selection' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value'><a href" + value + ">" + value + "</a></td></tr>"});
                                          else
                                              tableRows.push({key: sortKeyValue, value: "<tr class='pv-tableview-" + oddOrEven +"'><td id='pv-key' title='Toggle item selection'>" + entity + "</td><td id='pv-facet' class-'tooltipcustom' title='Clear predicate selection' style='color:#009933;cursor:pointer'>" + attribute + "</td><td id='pv-value'>" + value + "</td></tr>"});
                                   }
                               } 
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

        if (tableRows.length == 0) {
            if (showAllFacets == true) {
                var msg = '';
                msg = msg + 'There is not data to show about the selected items';
                $('.pv-wrapper').append("<div id=\"pv-dztable-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
                var t=setTimeout(function(){window.open("#pv-dztable-error","_self")},1000)
                return;
            } else
                this.CreateTable( currentFilter, "", sortKey, sortReverse )
        } else { 
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
            $('#pv-table-data').colResizable({disable:true});
            $('#pv-table-data').colResizable({disable:false});

            // Table view events
            $('.pv-tableview-heading').on('click', function (e) {
                $('#pv-table-loader').show();
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
                $('#pv-table-loader').fadeOut();
            }); 
            $('.pv-tableview-odd-row').on('click', function (e) {
                $('#pv-table-loader').show();
                var id = e.originalEvent.target.id;
                that.CellClick(id, e.currentTarget.cells );
                $('#pv-table-loader').fadeOut();
;
            }); 
            $('.pv-tableview-even-row').on('click', function (e) {
                $('#pv-table-loader').show();
                var id = e.originalEvent.target.id;
                that.CellClick(id, e.currentTarget.cells );
                $('#pv-table-loader').fadeOut();
            }); 
        }
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
    },
    IsUri: function (facetValue) {
      var stringVal = facetValue;
      var retValue = false;
      if (typeof(facetValue) == "string") {
          if (stringVal.substring(0, 5) == 'http:')
            retValue = true;
          if (stringVal.substring(0, 6) == 'https:')
            retValue = true;
      }
      return retValue;
    },
    SetSelectedFacet: function (facet) {
        this.selectedFacet = facet;
    },
    GetSelectedFacet: function () {
        return this.selectedFacet;
    }
});
