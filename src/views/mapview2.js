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
//    Copyright (C) 2012-2021 OpenLink Software - http://www.openlinksw.com/
//
//  This software is licensed under the terms of the
//  GNU General Public License v2 (see COPYING)
//

///Map View
PivotViewer.Views.MapView2 = PivotViewer.Views.IPivotViewerView.subClass({
    init: function () {
        this._super();
        this.locCache = Array();
        this.locList = Array();
        this.inScopeLocList = Array();
        this.map; 
        this.markers = Array();
        this.overlay;
        this.overlayBaseImageUrl = "";
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
        this.geocodeService = "";
        this.geometryValue = "";
        this.areaValues = Array();
        this.areaObj;
        var that = this;
        this.buckets = [];
        this.icons = [];
        this.iconsSelected = [];
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
        this.map = new L.Map(document.getElementById('pv-map-canvas'));

	// create the tile layer with correct attribution
	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © OpenStreetMap contributors';
	this.osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});		

        // create the icon set
        var RedIcon = L.Icon.Default.extend({options: {iconUrl: 'scripts/images/Red.png' }});
        this.icons.push(RedIcon);
        var RedDotIcon = L.Icon.Default.extend({options: {iconUrl: 'scripts/images/RedDot.png' }});
        this.iconsSelected.push(RedDotIcon);
        var YellowIcon = L.Icon.Default.extend({options: {iconUrl: 'scripts/images/Yellow.png' }});
        this.icons.push(YellowIcon);
        var YellowDotIcon = L.Icon.Default.extend({options: {iconUrl: 'scripts/images/YellowDot.png' }});
        this.iconsSelected.push(YellowDotIcon);
        var GreenIcon = L.Icon.Default.extend({options: {iconUrl: 'scripts/images/DarkGreen.png' }});
        this.icons.push(GreenIcon);
        var GreenDotIcon = L.Icon.Default.extend({options: {iconUrl: 'scripts/images/DarkGreenDot.png' }});
        this.iconsSelected.push(GreenDotIcon);
        var BlueIcon = L.Icon.Default.extend({options: {iconUrl: 'scripts/images/Blue.png' }});
        this.icons.push(BlueIcon);
        var BlueDotIcon = L.Icon.Default.extend({options: {iconUrl: 'scripts/images/BlueDot.png' }});
        this.iconsSelected.push(BlueDotIcon);
        var PurpleIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/Purple.png' }});
        this.icons.push(PurpleIcon);
        var PurpleDotIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/PurpleDot.png' }});
        this.iconsSelected.push(PurpleDotIcon);
        var OrangeIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/Orange.png' }});
        this.icons.push(OrangeIcon);
        var OrangeDotIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/OrangeDot.png' }});
        this.iconsSelected.push(OrangeDotIcon);
        var PinkIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/Pink.png' }});
        this.icons.push(PinkIcon);
        var PinkDotIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/PinkDot.png' }});
        this.iconsSelected.push(PinkDotIcon);
        var SkyIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/Sky.png' }});
        this.icons.push(SkyIcon);
        var SkyDotIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/SkyDot.png' }});
        this.iconsSelected.push(SkyDotIcon);
        var LimeIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/Lime.png' }});
        this.icons.push(LimeIcon);
        var LimeDotIcon = L.Icon.Default.extend({options: { iconUrl: 'scripts/images/LimeDot.png' }});
        this.iconsSelected.push(LimeDotIcon);
    },
    Filter: function (dzTiles, currentFilter, sortFacet, stringFacets, changingView, selectedItem) { 
        var that = this;
        var g = 0;  //keeps track of the no. of geocode locations;
        if (!Modernizr.canvas)
            return;

        PivotViewer.Debug.Log('Map View Filtered: ' + currentFilter.length);

        if (changingView) {
            $('.pv-viewarea-canvas').fadeOut();
            $('.pv-tableview-table').fadeOut();
            $('.pv-mapview-canvas').fadeOut();
            $('.pv-timeview-canvas').fadeOut();
            $('.pv-toolbarpanel-sort').fadeIn();
            $('.pv-toolbarpanel-timelineselector').fadeOut();
            $('.pv-toolbarpanel-zoomslider').fadeOut();
            $('.pv-toolbarpanel-maplegend').fadeIn();
            if (!selectedItem)
                $('.pv-mapview-legend').show('slide', {direction: 'up'});
            $('.pv-toolbarpanel-zoomcontrols').css('border-width', '0');
            $('#MAIN_BODY').css('overflow', 'auto');
            $('.pv-mapview-canvas').fadeIn(function(){
                if (selectedItem)
                    $.publish("/PivotViewer/Views/Item/Selected", [{id: selectedItem.Id, bkt: 0}]);
            });
        }

        //Check for location information

        this.sortFacet = sortFacet;
        //this.tiles = dzTiles;
        this.currentFilter = currentFilter;
        this.selectedItemId = "";

        //Sort and bucketize so items can be grouped using coloured pins
        this.tiles = dzTiles.sort(this.SortBy(this.sortFacet, false, function (a) {
            return $.isNumeric(a) ? a : a.toUpperCase();
        }, stringFacets));

        this.buckets = this.Bucketize(dzTiles, currentFilter, this.sortFacet, stringFacets);

        //Empty the inScope item list
        this.inScopeLocList = [];        

        //Clear legend info in toolbar
        $('.pv-toolbarpanel-maplegend').empty();
        if (!changingView && !selectedItem) 
            $('.pv-mapview-legend').show('slide', {direction: 'up'});

        //Check for geometry facet
        //This should contain a geometry definition im WKT that applies to the whole collection
        //E.g. where a geometry filter has been applied
        var gotGeometry = false;
        for (var i = 0; i < currentFilter.length && !gotGeometry; i++) {
            for (var j = 0; j < this.tiles.length && !gotGeometry; j++) { 
                if (this.tiles[j].facetItem.Id == currentFilter[i]) {
                    for (k = 0; k < this.tiles[j].facetItem.Facets.length; k++) {
                        if (this.tiles[j].facetItem.Facets[k].Name.toUpperCase().indexOf("GEOMETRY") >= 0) {
                            //If multiple values just use the first one for now...
                            this.geometryValue = this.tiles[j].facetItem.Facets[k].FacetValues[0].Value;
                            gotGeometry = true;
                            break;
                        }
                    }
                }
            }
        }

        //Check for area facet
        //This should contain a geometry definition im WKT that applies to an individual item
        for (var i = 0; i < currentFilter.length; i++) {
            for (var j = 0; j < this.tiles.length; j++) { 
                if (this.tiles[j].facetItem.Id == currentFilter[i]) {
                    for (k = 0; k < this.tiles[j].facetItem.Facets.length; k++) {
                        if (this.tiles[j].facetItem.Facets[k].Name.toUpperCase().indexOf("AREA") >= 0) {
                            var areaValue = this.tiles[j].facetItem.Facets[k].FacetValues[0].Value;
                            this.areaValues.push({id: this.tiles[j].facetItem.Id, area: areaValue});
                            break;
                        }
                    }
                }
            }
        }

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
                            if (this.locList[c].loc.lat != 0 || this.locList[c].loc.lng != 0) 
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
                                    var newLoc = new L.LatLng(latitude, longitude);
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
                                    var newLoc = new L.LatLng(latitude, longitude);
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
                                           longitude = value.substring(7, value.indexOf(' ', 7));
                                           latitude  = value.substring(value.indexOf(' ', 7) + 1, value.indexOf(')', 7));
                                           if (latitude != "NaN" && longitude != "NaN") {
                                               var lat = parseFloat(latitude);
                                               var lon = parseFloat(longitude);
                                               if (!isNaN(lat) && ! isNaN(lon)) {
                                                   var newLoc = new L.LatLng(lat, lon);
                                                   this.locList.push({id: itemId, loc: newLoc, title: itemName});
                                                   this.inScopeLocList.push({id: itemId, loc: newLoc, title: itemName});
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
                                               var newLoc = new L.LatLng(lat, lon);
                                               this.locList.push({id: itemId, loc: newLoc, title: itemName});
                                               this.inScopeLocList.push({id: itemId, loc: newLoc, title: itemName});
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
                                                      if (newLoc) {
                                                          var lat = parseFloat(newLoc.lat);
                                                          var lng = parseFloat(newLoc.lng);
                                                          if (!isNaN(lat) && !isNaN(lng)) {
                                                              newLatLng = new L.LatLng(lat, lng);
                                                              // Add it to local cache
                                                              this.locCache.push({locName: geoLoc, loc: newLatLng});
                                                              this.locList.push({id: itemId, loc: newLatLng, title: itemName});
                                                              this.inScopeLocList.push({id: itemId, loc: newLatLng, title: itemName});
                                                              gotLocation = true;
                                                          }
                                                      }
                                                  }
                                                  if (!gotLocation) {
                                                      // Not in local or persistent cache so will have to use geocode service
                                                      // Add location to list for geocoding (will need to keep itemId name with it)
                                                      if (g < 1000) {//limiting the number of items to geocode at once to 1000 for now
                                                          var foundIt = false;
                                                          for (var gl = 0; gl < this.geocodeList.length; gl++) {
                                                              if (this.geocodeList[gl] == geoLoc) {
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
        return 'images/MapView.png';
    },
    GetButtonImageSelected: function () {
        return 'images/MapViewSelected.png';
    },
    GetViewName: function () { return 'Map View 2'; },
    MakeGeocodeCallBack: function(locName) {
        var that = this;
        if (this.geocodeService == "Google"){
            var geocodeCallBack = function(results, status) {
                var dummy = new L.LatLng(0, 0);
                var loc = dummy;
                
                if (status == google.maps.GeocoderStatus.OK) { 
                    var googleLoc = results[0].geometry.location;
                    var lat = googleLoc.lat();
                    var lon = googleLoc.lng();
                    if (lat && lon)
                      loc = new L.LatLng(lat, lon);
                }

                // Add to local cache
                that.locCache.push ({locName: locName, loc: loc});
       
                // Add to persistent cache
                if (this.localStorage) {
                    var newLoc = {
                        lat: loc.lat,
                        lng: loc.lng
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
                        if (loc.lat != 0 || loc.lng != 0)
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
        	    that.GetOverlay();
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
        } else {
            var geocodeCallBack = function(xml) {
                var dummy = new L.LatLng(0, 0);
                var loc = dummy;
                var results = $(xml).find("searchresults");
                var place = $(xml).find("place");
 
                if (place) {
                    var lat = $(place).attr("lat");
                    var lon = $(place).attr("lon");
                    if (lat && lon)
                      loc = new L.LatLng(lat, lon);
                }

                // Add to local cache
                that.locCache.push ({locName: locName, loc: loc});
       
                // Add to persistent cache
                if (this.localStorage) {
                    var newLoc = {
                        lat: loc.lat,
                        lng: loc.lng
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
                        if (loc.lat != 0 || loc.lng != 0)
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

        }
        return geocodeCallBack;
    },
    Geocode: function (locName, callbackFunction) {
        if (this.geocodeService == "Google"){
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode( {address: locName}, this.MakeGeocodeCallBack(locName));
        } else {
            var that = this;
            var nominatimUrl = "http://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(locName) + "&format=xml";
            $.ajax({
                type: "GET",
                url: nominatimUrl,
	        crossDomain: true,
                success: callbackFunction,
                error: function(jqXHR, textStatus, errorThrown) {
		    var state = {
			    endpoint:	this.url,
			    httpCode:	jqXHR.status,
			    status:	jqXHR.statusText,
			    message:	errorThrown,
			    response:	jqXHR.responseText,
		    }

		    var p = document.createElement('a');
		    p.href = this.url;

		    state.endpoint = p.protocol + '//' + p.host + p.pathname;

		    if (state.status === 'timeout') {
		      state.message = "Timeout loading collection document";
		    } else if (state.status === 'error') {
		      if (this.crossDomain && (p.hostname !== window.location.hostname)) {
			state.message = "Possible issue with CORS settings on the endpoint"
		      }
		    } 

		    //Display a message so the user knows something is wrong
		    var msg = '';
		    msg = msg + 'Error loading GeoCoding Data:<br><br><table>';
		    msg = msg + '<colgroup><col style="white-space:nowrap;"><col></colgroup>';
		    msg = msg + '<tr><td>Endpoint</td><td>' + state.endpoint + '</td></tr>';
		    msg = msg + '<tr><td>Status</td><td>' + state.httpCode + '</td></tr>';
		    msg = msg + '<tr><td>Error</td><td> ' + state.message  + '</td></tr>';
		    msg = msg + '<tr><td style="vertical-align:top">Details</td><td>' + state.response + '</td></tr>';
		    msg = msg + '</table><br>Pivot Viewer cannot continue until this problem is resolved<br>';
		    $('.pv-wrapper').append("<div id=\"pv-loading-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
		    var t=setTimeout(function(){window.open("#pv-loading-error","_self")},1000);
                }
            });
        }
    },
    GetLocationsFromNames: function () {
        var that = this;
        for (l = 0; l < this.itemsToGeocode.length; l ++) {
           var locName = this.itemsToGeocode[l].locName;
           this.Geocode(locName, this.MakeGeocodeCallBack(locName));
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
        var gotLoc = false;
        var gotBookmarkZoom = false;

        centreLat = parseFloat(this.mapCentreX);
        centreLng = parseFloat(this.mapCentreY);
        if (!isNaN(centreLat) && !isNaN(centreLng)) {
            centreLoc = new L.LatLng(centreLat, centreLng);
            gotLoc = true;
        }
        bookmarkZoom = parseInt(this.mapZoom);
        if (!isNaN(bookmarkZoom)) 
        {
            zoom = bookmarkZoom;
            gotBookmarkZoom = true;
        }

        // Currently map type not supported in this view
        //if (this.mapType && this.mapType != "")
        //    type = this.mapType;

        //this.map = new google.maps.Map(document.getElementById('pv-map-canvas'), mapOptions);
        //this.map = new L.Map(document.getElementById('pv-map-canvas'), { center: [0,0], zoom: 5 });
/*
        this.map = new L.Map(document.getElementById('pv-map-canvas'));

	// create the tile layer with correct attribution
	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © OpenStreetMap contributors';
	var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});		
*/

        if (gotLoc)
	    this.map.setView(centreLoc,zoom);
            //this.map.panTo(centreLoc);
        else
	    this.map.setView(new L.LatLng(0,0),zoom);

        if (this.selectedItemId) 
            this.CentreOnSelected (this.selectedItemId);

        //Add geometry to map using wicket library for reading WKT
        var geometryOK = true;
        var wkt = new Wkt.Wkt();
        try { // Catch any malformed WKT strings
            wkt.read(this.geometryValue);
        } catch (e1) {
            try {
                wkt.read(this.geometryValue.replace('\n', '').replace('\r', '').replace('\t', ''));
            } catch (e2) {
                if (e2.name === 'WKTError') {
                    PivotViewer.Debug.Log('Wicket could not understand the WKT string you entered. Check that you have parentheses balanced, and try removing tabs and newline characters.');
                    //return;
                    geometryOK = false;
                }
            }
        }
        if (geometryOK) {
            var obj = wkt.toObject(this.map.defaults);
            if (Wkt.isArray(obj)) {
                for (var o = 0; o < obj.length; o++) { 
                    this.map.addLayer(obj[o]);
                }
            } else 
                this.map.addLayer(obj);
        }

	this.map.addLayer(this.osm);

        // add map event listeners
        this.map.on('zoomend', function(e) {
            that.SetMapZoom(that.map.getZoom());
            $.publish("/PivotViewer/Views/Item/Updated", null);
            that.GetOverlay();
        } );
        this.map.on('moveend', function(e) {
            var centre = that.map.getCenter();
            that.SetMapCentreX(centre.lat);
            that.SetMapCentreY(centre.lng);
            $.publish("/PivotViewer/Views/Item/Updated", null);
            that.GetOverlay();
        } );

        this.CreateMarkers();
        if (!gotBookmarkZoom)
          this.RefitBounds();
        else
	  this.map.setView(centreLoc,zoom);
        this.GetOverlay();
        this.CreateLegend();
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
    SetGeocodeService: function (service) {
        this.geocodeService = service;
    },
    GetBucketNumber: function (id) {
        for (var i = 0; i < this.buckets.length; i++) {
            if ($.inArray(id, this.buckets[i].Ids) >= 0) 
                return i;
        }
        return 0;
    },
/*
    GetIconForSortValue: function (id) {
        var icon;
        for (var i = 0; i < this.buckets.length; i++) {
            if ($.inArray(id, this.buckets[i].Ids) >= 0) 
                icon = this.icons[i];
        }
        return icon;
    },
*/
    CreateMarkers: function () {
        var that = this;

        // First clear all markers
        for (var i = 0; i < this.markers.length; i++) {
            this.map.removeLayer(this.markers[i]);
            //this.markers[i].setMap(null);
        }
        this.markers = [];
/*
        var GreenIcon = L.Icon.Default.extend({
            options: {
            	    iconUrl: 'scripts/images/green-icon.png' 
            }
         });
        //var blueIcon = new L.Icon();
        var greenIcon = new GreenIcon();
*/

                //icon: blueIcon,
        for (i = 0; i < this.inScopeLocList.length; i++) {  
            var marker = new L.Marker(this.inScopeLocList[i].loc, {
                title: this.inScopeLocList[i].title,
            })
            this.map.addLayer(marker);

            // Set icon depending on value of the sort facet
            var bucket = this.GetBucketNumber(this.inScopeLocList[i].id);
            marker.setIcon(new this.icons[bucket]);

            if (this.inScopeLocList[i].id ==  this.selectedItemId) {
                marker.setIcon(new this.iconsSelected[bucket]);
                marker.setZIndexOffset(1000000000);
                $('.pv-toolbarpanel-maplegend').empty();
                $('.pv-toolbarpanel-maplegend').css( 'overflow', 'hidden');
                $('.pv-toolbarpanel-maplegend').css( 'text-overflow', 'ellipsis');
                var toolbarContent;
                toolbarContent = "<img style='height:15px;width:auto' src='" + marker._icon.src + "'></img>";
                if (that.buckets[bucket].startRange == that.buckets[bucket].endRange)
                  toolbarContent += that.buckets[bucket].startRange; 
                else
                  toolbarContent += that.buckets[bucket].startRange + " to " + that.buckets[bucket].endRange; 
                $('.pv-toolbarpanel-maplegend').append(toolbarContent);
            }

            //google.maps.event.addListener(marker, 'click', (function(marker, i) {
                        //marker.setIcon(blueIcon);
            marker.on('click', (function(marker, i) {
                return function() {
                    if (that.selectedItemId == that.inScopeLocList[i].id) {
                        var bucket = that.GetBucketNumber(that.inScopeLocList[i].id);
                        marker.setIcon(new that.icons[bucket]);
                        selectedTile = null;
                        that.selectedItemId = "";
                        that.RefitBounds();
        		that.GetOverlay();
                        $('.pv-toolbarpanel-maplegend').empty();
                        $('.pv-mapview-legend').show('slide', {direction: 'up'});
                        $.publish("/PivotViewer/Views/Update/GridSelection", [{selectedItem: that.selectedItemId,  selectedTile: selectedTile}]);
                    } else {
                        that.selectedItemId = that.inScopeLocList[i].id;
                        var bucket = that.GetBucketNumber(that.inScopeLocList[i].id);
                        for (var j = 0; j < that.tiles.length; j++) { 
                            if (that.tiles[j].facetItem.Id == that.selectedItemId) {
                                selectedTile = that.tiles[j];
                                $('.pv-toolbarpanel-maplegend').empty();
                                var toolbarContent;
                                toolbarContent = "<img style='height:15px;width:auto' src='" + marker._icon.src + "'></img>";
                                if (that.buckets[bucket].startRange == that.buckets[bucket].endRange)
                                  toolbarContent += that.buckets[bucket].startRange; 
                                else
                                  toolbarContent += that.buckets[bucket].startRange + " to " + that.buckets[bucket].endRange; 
                                $('.pv-toolbarpanel-maplegend').append(toolbarContent);
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
        //var bounds = new L.LatLngBounds();
        var bounds;
        var markerPos = [];

        if (this.markers.length > 0) {
            for (i = 0; i < this.markers.length; i++) {  
                //extend the bounds to include each marker's position
                //bounds.extend(this.markers[i].position);
                markerPos.push (this.markers[i].getLatLng());
            }
            bounds = new L.LatLngBounds(markerPos);
        
            //Seems to fix issue where map not actually loaded at this point
            this.map.invalidateSize();
            //now fit the map to the newly inclusive bounds
            this.map.fitBounds(bounds);
        }
    },
    GetOverlay: function () {
        // Get the boundary and use to get image to overlay
        var mapBounds = this.map.getBounds();
        var west = mapBounds.getWest();
        var east = mapBounds.getEast();
        var north = mapBounds.getNorth();
        var south = mapBounds.getSouth();
        var mapSize = this.map.getSize();
        var width = mapSize.x;
        var height = mapSize.y;
        if (this.overlayBaseImageUrl != "" && this.overlayBaseImageUrl != 0) {
          if (this.overlay && this.map.hasLayer(this.overlay)) 
              this.map.removeLayer(this.overlay);
          var overlayImageUrl = this.overlayBaseImageUrl+ "&bbox=" + west + "," + south + "," + east + "," + north + "&width=" + width + "&height=" + height ;
          this.overlay = new L.imageOverlay (overlayImageUrl, mapBounds, {opacity: 0.4});
          this.overlay.addTo(this.map);
        }
    },
    DrawArea: function (selectedItemId) {
        var areaValue;
        var areaWkt = new Wkt.Wkt();

        //clear existing area object
        if (this.areaObj)
          this.map.removeLayer(this.areaObj);
        for (var i = 0; i < this.areaValues.length; i++) {
           if (this.areaValues[i].id == selectedItemId) {
              areaValue = this.areaValues[i].area;
              break;
           }
        }
        if (areaValue) {
            var geometryOK = true;
            try { // Catch any malformed WKT strings
                areaWkt.read(areaValue);
            } catch (e1) {
                try {
                    areaWkt.read(areaValue.replace('\n', '').replace('\r', '').replace('\t', ''));
                } catch (e2) {
                    if (e2.name === 'WKTError') {
                        PivotViewer.Debug.Log('Wicket could not understand the WKT string you entered. Check that you have parentheses balanced, and try removing tabs and newline characters.');
                        //return;
                        geometryOK = false;
                    }
                }
            }
            if (geometryOK) {
                this.areaObj = areaWkt.toObject({color:'#990000',fillColor:'#EEFFCC',fillOpacity:0.6});
                if (Wkt.isArray(this.areaObj)) {
                    for (var o = 0; o < this.areaObj.length; o++) { 
                        this.map.addLayer(this.areaObj[o]);
                    }
                } else 
                    this.map.addLayer(this.areaObj);
            }
        }
    },
    RedrawMarkers: function (selectedItemId) {
        this.selectedItemId = selectedItemId;

        // First clear all markers
        for (var i = 0; i < this.markers.length; i++) {
            this.map.removeLayer(this.markers[i]);
            //this.markers[i].setMap(null);
        }
        this.markers = [];

        this.CreateMarkers();
        this.CentreOnSelected (selectedItemId);
        this.DrawArea(selectedItemId);
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
                if (this.locList[j].loc.lat != 0 && this.locList[j].loc.lng != 0)
                    this.map.panTo(this.locList[j].loc);
            }
        }
    },
    SetBookmark: function() {
        var centreLoc;
        var zoom = 8;
        //var type = google.maps.MapTypeId.ROADMAP;
        var gotLoc = false;

        centreLat = parseFloat(this.mapInitCentreX);
        centreLng = parseFloat(this.mapInitCentreY);
        if ((!isNaN(centreLat) && !isNaN(centreLng)) 
           && (centreLat != 0 && centreLng != 0)) {
            centreLoc = new L.LatLng(centreLat, centreLng);
            gotLoc = true;
        }
        bookmarkZoom = parseInt(this.mapInitZoom);
        if (!isNaN(bookmarkZoom)) 
            zoom = bookmarkZoom;

        //if (this.mapInitType && this.mapInitType != "")
        //    type = this.mapInitType;

        if (gotLoc)
            this.map.panTo(centreLoc);
        //this.map.setMapTypeId(type);
        this.map.setZoom(zoom);
    },
    SetOverlayBaseUrl: function(baseUrl) {
        this.overlayBaseImageUrl = baseUrl;
    },
    CreateLegend: function() {
        // Get width of the info panel (width of icon image = 30 )
        var width = $('.pv-mapview-legend').width() - 32;
        $('.pv-mapview-legend').empty();
        $('.pv-mapview-legend').append("<div class='pv-legend-heading' style='height:28px' title='" + this.sortFacet + "'>" + this.sortFacet + "</div>");
        var tableContent = "<table id='pv-legend-data' style='color:#484848;'>";
        for (var i = 0; i < this.buckets.length; i++) {
            var icon = new this.icons[i];
            tableContent += "<tr><td><img src='" + icon.options.iconUrl + "'></img></td>";
            if (this.buckets[i].startRange == this.buckets[i].endRange)
              tableContent += "<td><div style='overflow:hidden;white-space:nowrap;width:" + width + "px;text-overflow:ellipsis'>" + this.buckets[i].startRange + "</div></td></tr>"; 
            else
              tableContent += "<td><div style='overflow:hidden;white-space:nowrap;width:" + width + "px;text-overflow:ellipsis'>" + this.buckets[i].startRange + " to " + this.buckets[i].endRange + "</div></td></tr>"; 
        }
        tableContent +="</table>";
        $('.pv-mapview-legend').append(tableContent);
    },
    //Groups into buckets based on first n chars
    Bucketize: function (dzTiles, filterList, orderBy, stringFacets) {
        var bkts = [];
        for (var i = 0; i < dzTiles.length; i++) {
            if ($.inArray(dzTiles[i].facetItem.Id, filterList) >= 0) {
                var hasValue = false;
                for (var j = 0; j < dzTiles[i].facetItem.Facets.length; j++) {
                    if (dzTiles[i].facetItem.Facets[j].Name == orderBy && dzTiles[i].facetItem.Facets[j].FacetValues.length > 0) {

                        for (var m = 0; m < dzTiles[i].facetItem.Facets[j].FacetValues.length; m++) { 
                            var val = dzTiles[i].facetItem.Facets[j].FacetValues[m].Value;

                            var found = false;
                            for (var k = 0; k < bkts.length; k++) {
//this needs fixing to handle the whole range...
                                if (bkts[k].startRange == val) {
                                    // If item is not already in the bucket add it
                                    if ($.inArray(dzTiles[i].facetItem.Id, bkts[k].Ids) < 0)
                                        bkts[k].Ids.push(dzTiles[i].facetItem.Id);
                                    found = true;
                                }
                            }
                            if (!found)
                                bkts.push({ startRange: val, endRange: val, Ids: [dzTiles[i].facetItem.Id], Values: [val] });

                            hasValue = true;
                        }
                    }
                }
                //If not hasValue then add it as a (no info) item
                if (!hasValue) {
                    var val = "(no info)";
                    var found = false;
                    for (var k = 0; k < bkts.length; k++) {
                        if (bkts[k].startRange == val) {
                            bkts[k].Ids.push(dzTiles[i].facetItem.Id);
                            bkts[k].Values.push(val);
                            found = true;
                        }
                    }
                    if (!found)
                        bkts.push({ startRange: val, endRange: val, Ids: [dzTiles[i].facetItem.Id], Values: [val] });
                }
            }
        }

	// If orderBy is one of the string filters then only include buckets that are in the filter
	if ( stringFacets.length > 0 ) {
	    var sortIndex;
	    for ( var f = 0; f < stringFacets.length; f++ ) {
	        if ( stringFacets[f].facet == orderBy ) {
		    sortIndex = f;
		    break;
	        }
            }
	    if ( sortIndex != undefined  && sortIndex >= 0 ) {
	        var newBktsArray = [];
	        var filterValues = stringFacets[sortIndex].facetValue;
	        for ( var b = 0; b < bkts.length; b ++ ) {
		    var valueIndex = $.inArray(bkts[b].startRange, filterValues ); 
		    if (valueIndex >= 0 )
		        newBktsArray.push(bkts[b]);
	        }
	        bkts = newBktsArray;
	    }
	}

        var current = 0;
        while (bkts.length > 8) {
            if (current < bkts.length - 1) {
                bkts[current].endRange = bkts[current + 1].endRange;
                for (var i = 0; i < bkts[current + 1].Ids.length; i++) {
                    if ($.inArray(bkts[current+1].Ids[i], bkts[current].Ids) < 0) 
                        bkts[current].Ids.push(bkts[current + 1].Ids[i]);
                        if ($.inArray(bkts[current + 1].endRange, bkts[current].Values) < 0) 
                            bkts[current].Values.push(bkts[current + 1].endRange);
                }
                bkts.splice(current + 1, 1);
                current++;
            } else
                current = 0;
        }

        return bkts;
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
