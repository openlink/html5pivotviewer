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

///Map View
PivotViewer.Views.MapView = PivotViewer.Views.IPivotViewerView.subClass({
    init: function () {
        this._super();
        this.locCache = Array();
        this.locList = Array();
        this.inScopeLocList = Array();
        this.map; 
        this.markers = Array();
        this.selectedItemId;
        this.geocodeList = Array();
        this.itemsToGeocode = Array();
        this.startGeocode;
        this.geocodeZero;
        this.mapInitZoom = "";
        this.mapInitType = "";
        this.mapInitCentreX = "";
        this.mapInitCentreY = "";
        this.mapZoom = "";
        this.mapType = "";
        this.mapCentreX = "";
        this.mapCentreY = "";
        this.applyBookmark = false;
        var that = this;
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
        // Check for local storage support
        if (Modernizr.localstorage)
            this.localStorage = true;
        else
            this.localStorage = false;
    },
    Filter: function (dzTiles, currentFilter, sortFacet, stringFacets, changingView, selectedItem) { 
        var that = this;
        var g = 0;  //keeps track of the no. of geocode locations;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Map View Filtered: ' + currentFilter.length);

        if (changingView) {
            $('.pv-viewarea-canvas').fadeOut();
            $('.pv-tableview-table').fadeOut();
            $('.pv-toolbarpanel-zoomslider').fadeOut();
            $('.pv-toolbarpanel-zoomcontrols').css('border-width', '0');
            $('.pv-mapview-canvas').fadeIn(function(){
                if (selectedItem)
                    $.publish("/PivotViewer/Views/Item/Selected", [{id: selectedItem.Id, bkt: 0}]);
            });
        }

        //Check for location information

        this.tiles = dzTiles;
        this.currentFilter = currentFilter;
        this.selectedItemId = "";

        //Empty the inScope item list
        this.inScopeLocList = [];        

        //Create a list of in scope locations
        for (var i = 0; i < currentFilter.length; i++) {
            for (var j = 0; j < this.tiles.length; j++) { 
                if (this.tiles[j].facetItem.Id == currentFilter[i]) {
                    //Tile is in scope
                    var latitude;
                    var longitude;
                    var gotLatitude = false;
                    var gotLongitude = false;
                    var gotLocation = false;
                    var inCache = false;
                    var itemId = this.tiles[j].facetItem.Id;
                    var itemName = this.tiles[j].facetItem.Name;

                    //Have we cached the item location?
                    for (var c = 0; c < this.locList.length; c ++) {
                        if (this.locList[c].id == itemId) {
                            if (this.locList[c].loc.lat() != 0 || this.locList[c].loc.lng() != 0) 
                                this.inScopeLocList.push(this.locList[c]);
                            inCache = true;
                            break;
                        }
                    }
             
                    if (!inCache) {
                        //First try to get co-ordinate information from the facets
                        for (k = 0; k < this.tiles[j].facetItem.Facets.length; k++) {
                            if (this.tiles[j].facetItem.Facets[k].Name.toUpperCase().indexOf("LATITUDE") >= 0) {
                                //If multiple values just use the first one for now...
                                var facetType = this.GetFacetCategoryType (this.tiles[j].facetItem.Facets[k].Name);
                                if (facetType == "String")
                                  latitude = parseFloat(this.tiles[j].facetItem.Facets[k].FacetValues[0].Value);
                                else if (facetType == "Number") 
                                  latitude = this.tiles[j].facetItem.Facets[k].FacetValues[0].Value;
                                else
                                  break;
                                gotLatitude = true;
                                if (gotLongitude) {
                                    var newLoc = new google.maps.LatLng(latitude, longitude);
                                    this.locList.push({id: itemId, loc: newLoc, title: itemName});
                                    this.inScopeLocList.push({id: itemId, loc: newLoc, title: itemName});
                                    gotLocation = true;
                                    break;
                                }
                            }
                            else if (this.tiles[j].facetItem.Facets[k].Name.toUpperCase().indexOf("LONGITUDE") >= 0) {
                                var facetType = this.GetFacetCategoryType (this.tiles[j].facetItem.Facets[k].Name);
                                if (facetType == "String")
                                  longitude = parseFloat(this.tiles[j].facetItem.Facets[k].FacetValues[0].Value);
                                else if (facetType == "Number") 
                                  longitude = this.tiles[j].facetItem.Facets[k].FacetValues[0].Value;
                                else
                                  break;
                                gotLongitude = true;
                                if (gotLatitude) {
                                    var newLoc = new google.maps.LatLng(latitude, longitude);
                                    this.locList.push({id: itemId, loc: newLoc, title: itemName});
                                    this.inScopeLocList.push({id: itemId, loc: newLoc, title: itemName});
                                    gotLocation = true;
                                    break;
                                }
                            }
                        }//loop through facets counter k
                        if (!gotLocation) {
                            //Look for specially named facet LOCATION
                            for (var f = 0; f < this.tiles[j].facetItem.Facets.length; f++) {
                               if (this.tiles[j].facetItem.Facets[f].Name.toUpperCase().indexOf("LOCATION") >= 0) {
                                   //go through the values 
                                   for (var v = 0; v < this.tiles[j].facetItem.Facets[f].FacetValues.length; v++) {
                                       var value = this.tiles[j].facetItem.Facets[f].FacetValues[v].Value;
                                       var invalidCoordinates = false;
                                  
                                       if (value.toUpperCase().indexOf("POINT(") == 0 ) {
                                           longitude = value.substring(6, value.indexOf(' ', 6) - 6);
                                           latitude = value.substring(value.indexOf(' ', 6) + 1, value.indexOf(')') - (value.indexOf(' ') + 1));
                                           if (latitude != "NaN" && longitude != "NaN") {
                                               var lat = parseFloat(latitude);
                                               var lon = parseFloat(logitude);
                                               if (!isNaN(lat) && ! isNaN(lon)) {
                                                   var newLoc = new google.maps.LatLng(lat, lon);
                                                   locList.push({id: itemId, loc: newLoc, title: itemName});
                                                   inScopeList.push({id: itemId, loc: newLoc, title: itemName});
                                                   gotLocation = true;
                                                   break;
                                               }
                                           } else
                                               invalidCoordinates = true;
                                       //at this point silverlight version checks for other stuff
                                       }  else if (value.indexOf(",") > -1 ) {
                                           //Could be a co-ordinate pair
                                           var lat = parseFloat(value.substring(0, value.indexOf(',')));
                                           var lon = parseFloat(value.substring(value.indexOf(',')));
                                           if (!isNaN(lat) && !isNaN(lon)) {
                                               //ok, have co-ordinate pair
                                               var newLoc = new google.maps.LatLng(lat, lon);
                                               locList.push({id: itemId, loc: newLoc, title: itemName});
                                               inScopeList.push({id: itemId, loc: newLoc, title: itemName});
                                               gotLocation = true;
                                               break;
                                           } else
                                               invalidCoordinates = true;
                                      }
                                      if (!invalidCoordinates) {
                                          //If we get here then we still have not got a location
                                          //So try geocoding a location name
                                  
                                          // Quick check - is the place more than 1 char long
                                          if (value.length > 1) {
                                              // Note: replace all _ with a space
                                              var geoLoc = value.replace('_', ' ').toUpperCase();
                                  
                                              // First add region and country to the location.
                                              for (var r = 0; r < this.tiles[j].facetItem.Facets.length; r++) {
                                                  if (this.tiles[j].facetItem.Facets[r].Name.toUpperCase().indexOf("REGION") >= 0) {
                                                      var region = this.tiles[j].facetItem.Facets[r].FacetValues[0].Value;
                                                      if (region.length > 1)
                                                          geoLoc = geoLoc + ", " + region.replace('_', ' ').toUpperCase();
                                                      break;
                                                  }
                                              }
                                  
                                              for (var s = 0; s < this.tiles[j].facetItem.Facets.length; s++) {
                                                  if (this.tiles[j].facetItem.Facets[s].Name.toUpperCase().indexOf("COUNTRY") >= 0) {
                                  
                                                      var country = this.tiles[j].facetItem.Facets[s].FacetValues[0].Value;
                                                      if (country.length > 1)
                                                          geoLoc = geoLoc + ", " + country.replace('_', ' ').toUpperCase();
                                                      break;
                                                  }
                                              }
                                  
                                              // Is it in the cache?
                                              for (var l = 0; l < this.locCache.length; l++) {
                                                  if (this.locCache[l].locName == geoLoc) {
                                  
                                                      this.locList.push({id: itemId, loc: this.locCache[l].loc, title: itemName});
                                                      this.inScopeLocList.push({id: itemId, loc: this.locCache[l].loc, title: itemName});
                                                      gotLocation = true;
                                                      break;
                                                  }
                                              }

                                              if (!gotLocation) {
                                                  // Now try the users persistent cache
                                                  if (this.localStorage) {
                                                      var newLatLng;
                                                      var newLoc = JSON.parse(localStorage.getItem(geoLoc));
                                                      var lat = parseFloat(newLoc.lat);
                                                      var lng = parseFloat(newLoc.lng);
                                                      if (!NaN(lat) && !NaN(lng)) {
                                                          newLatLng = new google.maps.LatLng(lat, lng);
                                                          // Add it to local cache
                                                          this.locCache.push({locName: geoLoc, loc: newLatLng});
                                                          this.locList.push({id: itemId, loc: newLatLng, title: itemName});
                                                          this.inScopeLocList.push({id: itemId, loc: newLatLng, title: itemName});
                                                          gotLocation = true;
                                                      }
                                                  }
                                                  if (!gotLocation) {
                                                      // Not in local or persistent cache so will have to use geocode service
                                                      // Add location to list for geocoding (will need to keep itemId name with it)
                                                      if (g < 1000) {//limiting the number of items to geocode at once to 1000 for now
                                                          var foundIt = false;
                                                          for (var g = 0; g < this.geocodeList.length; g++) {
                                                              if (this.geocodeList[g] == geoLoc) {
                                                                  foundIt = true;
                                                                  break;
                                                              }
                                                          }
                                                          if (!foundIt) {
                                                            this.geocodeList.push(geoLoc);
                                                            g++;
                                                          }
                                                          this.itemsToGeocode.push({id: itemId, locName: geoLoc, title:itemName});
                                                          gotLocation = true;
                                                          break;
                                                      }
                                                  } // Not in persistent geocode cache
                                              } // Not in in-memory geocode cache
                                          } //Location name longr than 1
                                       } //Not invalid co-ordinates 
                                   } //Go through location values v
                                   //Found a value in a location facet
                                   if (gotLocation)
                                       break;
                               }// Facet is LOCATION
                            } //loop through facets f
                        } //Not got co-ordinate - will need to geocode
                    } //Item i already has location 
                } //Tile j matches filter item i
            } //Tiles j
        } //Items in the filter i

        //Check that at least one in scope item has a location
        if (this.inScopeLocList.length == 0 && g == 0) {
            this.ShowMapError();
            return;
        } else if (g > 0 ){
            //Now do the geocoding
            this.GetLocationsFromNames();
        } //else {
            $('.pv-mapview-canvas').css('height', this.height - 12 + 'px');
            $('.pv-mapview-canvas').css('width', this.width - 415 + 'px');
            if (selectedItem)
                this.CreateMap(selectedItem.Id);
            else
                this.CreateMap("");
        //}
    },
    GetUI: function () { return ''; },
    GetButtonImage: function () {
        return 'Content/images/MapView.png';
    },
    GetButtonImageSelected: function () {
        return 'Content/images/MapViewSelected.png';
    },
    GetViewName: function () { return 'Map View'; },
    MakeGeocodeCallBack: function(locName) {
        var that = this;
        var geocodeCallBack = function(results, status) {
            var dummy = new google.maps.LatLng(0, 0);
            var loc = dummy;
            
            if (status == google.maps.GeocoderStatus.OK) 
                var loc = results[0].geometry.location;
            else 
                var loc = dummy;

            // Add to local cache
            that.locCache.push ({locName: locName, loc: loc});

            // Add to persistent cache
            if (this.localStorage) {
                var newLoc = {
                    lat: loc.lat(),
                    lng: loc.lng()
                };
                localStorage.setItem(locName, JSON.stringify(newLoc));
            }

            // Find items that have that location
            for (var i = 0; i < that.itemsToGeocode.length; i++ ) {
                var itemId = that.itemsToGeocode[i].id;
                var value = that.itemsToGeocode[i].locName;
                var title = that.itemsToGeocode[i].title;
                if (value == locName) {
                    that.locList.push({id: itemId, loc:loc, title: title});
                    if (loc.lat() != 0 || loc.lng() != 0)
                         that.inScopeLocList.push({id:itemId, loc:loc, title: title});
                }
            }

            var doneGeocoding = true;
            for (var g = 0; g < that.geocodeList.length; g++) {
                var value = that.geocodeList[g];
                var currentLocNotFound = true;
                for (var c = 0; c < that.locCache.length; c++) {
                    if (that.locCache[c].locName == value) {
                        currentLocNotFound = false;
                        break;
                    }
                }
                if (currentLocNotFound) {
                   doneGeocoding = false;
                   break;
               }
            }
            // If geocoding has taken more than 20 secs then try to set
            // the bookmark.  Otherwise, if the time taken is more than 
            // 2 secs make the pins we have so far
            var now = new Date();
            if ((now.getTime() - that.geocodeZero.getTime())/1000 > 20) {
                that.RedrawMarkers(that.selectedItemId);
                that.startGeocode = new Date();
            } else if ((now.getTime() - that.startGeocode.getTime())/1000 > 2) {
                that.RedrawMarkers(that.selectedItemId);
                that.RefitBounds();
                that.startGeocode = new Date();
            }

            // If the geocodeResults array is totally filled, make the pins.
            if (doneGeocoding || that.geocodeList.Count == 0)
            {
               //change cursor back ?
               that.geocodeList = [];
               if (that.inScopeLocList.Count == 0) {
                   this.ShowMapError();
                   return;
               } else {
                   that.CreateMap(that.selectedItemId);
                   if (that.applyBookmark) {
                       that.SetBookmark();
                       that.applyBookmark = false;
                   }
               }
           }
        }
        return geocodeCallBack;
    },
    GetLocationsFromNames: function () {
        var geocoder = new google.maps.Geocoder();
        var that = this;
        for (l = 0; l < this.itemsToGeocode.length; l ++) {
           var locName = this.itemsToGeocode[l].locName;
           geocoder.geocode( {address: locName}, this.MakeGeocodeCallBack(locName));
        }
        // Change cursor?
        this.startGeocode = new Date();
        this.startGeocode.setSeconds(this.startGeocode.getSeconds() + 2);
        this.geocodeZero = new Date();
    },
    CreateMap: function (selectedItemId) {
        var that = this;
        var centreLoc;
        var zoom = 8;
        var type = google.maps.MapTypeId.ROADMAP;
        var gotLoc = false;

        centreLat = parseFloat(this.mapCentreX);
        centreLng = parseFloat(this.mapCentreY);
        if (!isNaN(centreLat) && !isNaN(centreLng)) {
            centreLoc = new google.maps.LatLng(centreLat, centreLng);
            gotLoc = true;
        }
        bookmarkZoom = parseInt(this.mapZoom);
        if (!isNaN(bookmarkZoom)) 
            zoom = bookmarkZoom;

        if (this.mapType && this.mapType != "")
            type = this.mapType;

        //this.map = new google.maps.Map(document.getElementById('pv-map-canvas'), mapOptions);
        this.map = new google.maps.Map(document.getElementById('pv-map-canvas'));

        if (gotLoc)
            this.map.panTo(centreLoc);
        else if (this.selectedItemId) 
            this.CentreOnSelected (this.selectedItemId);

        this.map.setMapTypeId(type);
        this.map.setZoom(zoom);

        // add map event listeners
        google.maps.event.addListener( this.map, 'maptypeid_changed', function() { 
            that.SetMapType(that.map.getMapTypeId());
            $.publish("/PivotViewer/Views/Item/Updated", null);
        } );
        google.maps.event.addListener( this.map, 'zoom_changed', function() { 
            that.SetMapZoom(that.map.getZoom());
            $.publish("/PivotViewer/Views/Item/Updated", null);
        } );
        google.maps.event.addListener( this.map, 'center_changed', function() { 
            var centre = that.map.getCenter();
            that.SetMapCentreX(centre.lat());
            that.SetMapCentreY(centre.lng());
            $.publish("/PivotViewer/Views/Item/Updated", null);
        } );

        this.CreateMarkers();
        this.RefitBounds();
    },
    SetFacetCategories: function (collection) {
        this.categories = collection.FacetCategories;
    },
    GetFacetCategoryType: function (name) {
        for (i = 0; i < this.categories.length; i++) {
            if (this.categories[i].Name == name)
                return this.categories[i].Type;
        }
        // should never get here...
        return "not set";
    },
    CreateMarkers: function () {
        var that = this;

        // First clear all markers
        for (var i = 0; i < this.markers.length; i++) {
            this.markers[i].setMap(null);
        }
        this.markers = [];

        for (i = 0; i < this.inScopeLocList.length; i++) {  
            marker = new google.maps.Marker({
                position: this.inScopeLocList[i].loc,
                map: this.map,
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                title: this.inScopeLocList[i].title,
            });

            if (this.inScopeLocList[i].id ==  this.selectedItemId) {
                marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
                marker.setZIndex(1000000000);
            }

            google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {
                    if (that.selectedItemId == that.inScopeLocList[i].id) {
                        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
                        that.selectedItemId = "";
                        $.publish("/PivotViewer/Views/Update/GridSelection", [{selectedItem: that.selectedItemId,  selectedTile: selectedTile}]);
                    } else {
                        that.selectedItemId = that.inScopeLocList[i].id;
                        for (var j = 0; j < that.tiles.length; j++) { 
                            if (that.tiles[j].facetItem.Id == that.selectedItemId) {
                                selectedTile = that.tiles[j];
                                $.publish("/PivotViewer/Views/Update/GridSelection", [{selectedItem: that.selectedItemId,  selectedTile: selectedTile}]);
                                break;
                            }
                        }
                    }
                }
            })(marker, i));

            this.markers.push(marker);
        }
    },
    RefitBounds: function () {
        var bounds = new google.maps.LatLngBounds();

        for (i = 0; i < this.markers.length; i++) {  
            //extend the bounds to include each marker's position
            bounds.extend(this.markers[i].position);
        }

        //now fit the map to the newly inclusive bounds
        this.map.fitBounds(bounds);
        if (this.currentFilter.length == 1 && this.map.getZoom() > 15)
            this.map.setZoom(15);
    },
    RedrawMarkers: function (selectedItemId) {
        this.selectedItemId = selectedItemId;

        // First clear all markers
        for (var i = 0; i < this.markers.length; i++) {
            this.markers[i].setMap(null);
        }
        this.markers = [];

        this.CreateMarkers();
        this.CentreOnSelected (selectedItemId);
    },
    ShowMapError: function () {
        var msg = '';
        msg = msg + 'The current data selection does not contain any location information that can be shown on a map<br><br>';
        msg = msg + '<br>Choose a different view<br>';
        $('.pv-wrapper').append("<div id=\"pv-dzlocation-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
        var t=setTimeout(function(){window.open("#pv-dzlocation-error","_self")},1000)
        return;
    },
    GetMapCentreX: function () {
        return this.mapCentreX;
    },
    SetMapCentreX: function (centrex) {
        this.mapCentreX = centrex;
    },
    SetMapInitCentreX: function (centrex) {
        this.mapCentreX = centrex;
        this.mapInitCentreX = centrex;
    },
    GetMapCentreY: function () {
        return this.mapCentreY;
    },
    SetMapCentreY: function (centrey) {
        this.mapCentreY = centrey;
    },
    SetMapInitCentreY: function (centrey) {
        this.mapCentreY = centrey;
        this.mapInitCentreY = centrey;
    },
    GetMapType: function () {
        return this.mapType;
    },
    SetMapType: function (type) {
        this.mapType = type;
    },
    SetMapInitType: function (type) {
        this.mapType = type;
        this.mapInitType = type;
    },
    GetMapZoom: function () {
        return this.mapZoom;
    },
    SetMapZoom: function (zoom) {
        this.mapZoom = zoom;
    },
    SetMapInitZoom: function (zoom) {
        this.mapZoom = zoom;
        this.mapInitZoom = zoom;
    },
    CentreOnSelected: function (selectedItemId) {
        for (j = 0; j <  this.locList.length; j++) {
            if (this.locList[j].id == selectedItemId) {
                if (this.locList[j].loc.lat() != 0 && this.locList[j].loc.lng() != 0)
                    this.map.panTo(this.locList[j].loc);
            }
        }
    },
    SetBookmark: function() {
        var centreLoc;
        var zoom = 8;
        var type = google.maps.MapTypeId.ROADMAP;
        var gotLoc = false;

        centreLat = parseFloat(this.mapInitCentreX);
        centreLng = parseFloat(this.mapInitCentreY);
        if ((!isNaN(centreLat) && !isNaN(centreLng)) 
           && (centreLat != 0 && centreLng != 0)) {
            centreLoc = new google.maps.LatLng(centreLat, centreLng);
            gotLoc = true;
        }
        bookmarkZoom = parseInt(this.mapInitZoom);
        if (!isNaN(bookmarkZoom)) 
            zoom = bookmarkZoom;

        if (this.mapInitType && this.mapInitType != "")
            type = this.mapInitType;

        if (gotLoc)
            this.map.panTo(centreLoc);
        this.map.setMapTypeId(type);
        this.map.setZoom(zoom);
    },
});
