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

///Timeline View
PivotViewer.Views.TimeView = PivotViewer.Views.IPivotViewerView.subClass({
    init: function () {
        this._super();
        this.selectedItemId;
        this.timeFacets = [];
        this.timeline;
        this.selectedFacet = 0;
        this.default_showBubble = Timeline.OriginalEventPainter.prototype._showBubble;
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
    },
    Filter: function (dzTiles, currentFilter, sortFacet, stringFacets, changingView, selectedItem) { 
        var that = this;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Timeline View Filtered: ' + currentFilter.length);

        if (changingView) {
            $('.pv-viewarea-canvas').fadeOut();
            $('.pv-tableview-table').fadeOut();
            $('.pv-toolbarpanel-maplegend').fadeOut();
            $('.pv-mapview-legend').fadeOut();
            $('.pv-mapview-canvas').fadeOut();
            $('.pv-toolbarpanel-sort').fadeOut();
            $('.pv-toolbarpanel-zoomslider').fadeOut();
            $('.pv-toolbarpanel-maplegend').fadeOut();
            $('.pv-toolbarpanel-timelineselector').fadeIn();
            $('.pv-toolbarpanel-zoomcontrols').css('border-width', '0');
            $('.pv-timeview-canvas').fadeIn();
            $('.pv-timeview-canvas').fadeIn(function(){
                if (selectedItem)
                    $.publish("/PivotViewer/Views/Item/Selected", [{id: selectedItem.Id, bkt: 0}]);
     
            });
            $('#MAIN_BODY').css('overflow', 'hidden');
        }

        this.tiles = dzTiles;
        this.currentFilter = currentFilter;

        $('.pv-timeview-canvas').css('height', this.height - 12 + 'px');
        $('.pv-timeview-canvas').css('width', this.width - 415 + 'px');

        // create the events
        this.CreateEventsData();

        //Check that there is event data
        if (this.timeFacets.length == 0 || this.timeFacets[this.selectedFacet].eventsData.length == 0) {
            this.ShowTimeError();
            return;
        } 

        $('.pv-toolbarpanel-timelineselector').empty();
        var facetSelectControl = "<select id='pv-timeline-selectcontrol' style='width:126px'>";
        for (var facet = 0; facet < this.timeFacets.length; facet++) {
            if (facet == this.selectedFacet) 
                facetSelectControl += "<option selected='selected' value='" + this.timeFacets[facet].name + "'>" + this.timeFacets[facet].name + "</option>";
            else 
                facetSelectControl += "<option value='" + this.timeFacets[facet].name + "'>" + this.timeFacets[facet].name + "</option>";
        }
        facetSelectControl += "</select>";
        $('.pv-toolbarpanel-timelineselector').append(facetSelectControl);
        $('#pv-timeline-selectcontrol').change(function() {
           selectedFacetName = $('#pv-timeline-selectcontrol').val();
           for (var i = 0; i < that.timeFacets.length; i++) {
               if (that.timeFacets[i].name == selectedFacetName) {
                   that.selectedFacet = i;
                   break;
               }
           }
           that.RefreshView();
           // Centre on selected
           for (var j = 0; j < that.timeFacets[that.selectedFacet].eventsData.length; j++) {
               if (that.timeFacets[that.selectedFacet].eventsData[j]._id == that.selectedItemId) {
                   that.timeline.getBand(0).setCenterVisibleDate(that.timeFacets[that.selectedFacet].eventsData[j].getStart());
                   break;
               }
           }
            $.publish("/PivotViewer/Views/Item/Updated", null);
        });

        var eventSource = new Timeline.DefaultEventSource();
        var theme = Timeline.ClassicTheme.create();
        var selectedTile;
        Timeline.OriginalEventPainter.prototype._showBubble = function(x, y, evt) {
            if (that.selectedItemId == evt._id) {
                 that.Selected("");
                 $.publish("/PivotViewer/Views/Update/GridSelection", [{selectedItem: that.selectedItemId, selectedTile: selectedTile}]);
            } else {
                for (var i = 0; i < that.tiles.length; i++) {
                    if (that.tiles[i].facetItem.Id == evt._id) {
                        selectedTile = that.tiles[i];
                        $.publish("/PivotViewer/Views/Update/GridSelection", [{selectedItem: evt._id, selectedTile: selectedTile}]);
                        break;
                    }
                }
                //that.default_showBubble.apply(this, arguments);
            }
        }
        theme.autoWidth = false; // Set the Timeline's "width" automatically.

        var bandInfos = [
            Timeline.createBandInfo({
                eventSource:    eventSource,
                date:           this.timeFacets[this.selectedFacet].eventsData[0].getStart(),
                width:          "80%",
                intervalUnit:   this.timeFacets[this.selectedFacet].interval0,
                intervalPixels: 100,
                theme :theme
            }),
            Timeline.createBandInfo({
                overview:       true,
                date:           this.timeFacets[this.selectedFacet].eventsData[0].getStart(),
                eventSource:    eventSource,
                width:          "20%",
                intervalUnit:   this.timeFacets[this.selectedFacet].interval1,
                intervalPixels: 200,
                theme :theme
            })
        ];

        bandInfos[1].highlight = true;
        bandInfos[1].syncWith = 0;


        bandInfos[1].decorators = [
            new Timeline.SpanHighlightDecorator({
                inFront:    false,
                color:      "#FFC080",
                opacity:    30,
                startLabel: "Begin",
                endLabel:   "End",
                theme:      theme
            })
        ];


        this.timeline = Timeline.create($('.pv-timeview-canvas')[0], bandInfos, Timeline.HORIZONTAL);

        // show loading message
        this.timeline.showLoadingMessage();

        Timeline.loadJSON("timeline.json",
              function(json, url) { eventSource.loadJSON(json,url); });

        // dismiss loading message
        this.timeline.hideLoadingMessage();
        this.RefreshView();

        if (changingView && selectedItem) {
            for (var i = 0; i < this.timeFacets[this.selectedFacet].eventsData.length; i++) {
                if (this.timeFacets[this.selectedFacet].eventsData[i]._id == selectedItem.Id) {
                    this.timeline.getBand(0).setCenterVisibleDate(this.timeFacets[this.selectedFacet].eventsData[i].getStart());
                    break;
                }
            }
        }
    },
    GetUI: function () { return ''; },
    GetButtonImage: function () {
        return 'images/TimeView.png';
    },
    GetButtonImageSelected: function () {
        return 'images/TimeViewSelected.png';
    },
    GetViewName: function () { return 'Time View'; },
    CreateEventsData: function () { 
        // Empty the events array.
        this.timeFacets = [];

        for (var i = 0; i < this.categories.length; i++) {
            // Use first datetime category for the timeline data
            if (this.categories[i].Type == PivotViewer.Models.FacetType.DateTime) {
                var timeFacetName = this.categories[i].Name;
                if (this.categories[i].decadeBuckets.length > 3){
                    interval0 = Timeline.DateTime.YEAR;
                    interval1 = Timeline.DateTime.DECADE;
                } else if (this.categories[i].yearBuckets.length > 3){
                    interval0 = Timeline.DateTime.MONTH;
                    interval1 = Timeline.DateTime.YEAR;
                } else if (this.categories[i].monthBuckets.length > 3){
                    interval0 = Timeline.DateTime.DAY;
                    interval1 = Timeline.DateTime.MONTH;
                } else if (this.categories[i].dayBuckets.length > 3){
                    interval0 = Timeline.DateTime.HOUR;
                    interval1 = Timeline.DateTime.DAY;
                } else {
                    interval0 = Timeline.DateTime.DAY;
                    interval1 = Timeline.DateTime.MINUTE;
                }
                this.timeFacets.push({name: timeFacetName, interval0: interval0, interval1: interval1, eventsData: [] });
            }
        }
 
        // Create the events data for each time facet
        for (var facet = 0; facet < this.timeFacets.length; facet++) {
            for (var j = 0; j < this.currentFilter.length; j++) {
                for (var l = 0; l < this.tiles.length; l++) {
                    if (this.tiles[l].facetItem.Id == this.currentFilter[j]) {
                        //Tile is in scope
                        var timeValue = 0;
                        for (var k = 0; k < this.tiles[l].facetItem.Facets.length; k++) {
                           if (this.tiles[l].facetItem.Facets[k].Name == this.timeFacets[facet].name) {
                             timeValue = this.tiles[l].facetItem.Facets[k].FacetValues[0].Value;
                             break;
                           }
                        }
                        if (timeValue != 0){
                            var evt = new Timeline.DefaultEventSource.Event({
                                id: this.tiles[l].facetItem.Id,
                                start: new Date(timeValue),
                                isDuration: false,
                                text: this.tiles[l].facetItem.Name,
                                image: this.tiles[l]._images ? this.tiles[l]._images[0].attributes[0].value : null,
                                link: this.tiles[l].facetItem.Href,
                                caption: this.tiles[l].facetItem.Name,
                                description: this.tiles[l].facetItem.Description,
                             });
                             this.timeFacets[facet].eventsData.push(evt);         
                        } 
                    }
                }
            }
        }
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
    ShowTimeError: function () {
        var msg = '';
        msg = msg + 'The current data selection does not contain any information that can be shown on a timeline<br><br>';
        msg = msg + '<br>Choose a different view<br>';
        $('.pv-wrapper').append("<div id=\"pv-dzlocation-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
        var t=setTimeout(function(){window.open("#pv-dzlocation-error","_self")},1000)
        return;
    },
    RefreshView: function () {
        this.timeline.getBand(0).getEventSource().clear();
        this.timeline.getBand(0).getEventSource().addMany(this.timeFacets[this.selectedFacet].eventsData);
        this.timeline.paint();
    },
    Selected: function (selectedItemId) {
        this.selectedItemId = selectedItemId;

        // Centre on selected
        for (var i = 0; i < this.timeFacets[this.selectedFacet].eventsData.length; i++) {
            if (this.timeFacets[this.selectedFacet].eventsData[i]._id == this.selectedItemId) {
                this.timeline.getBand(0).setCenterVisibleDate(this.timeFacets[this.selectedFacet].eventsData[i].getStart());
                break;
            }
        }

        // Colour the markers
        for (var facet = 0; facet < this.timeFacets.length; facet++) {
            for (var item = 0; item < this.timeFacets[facet].eventsData.length; item++) {
                if (this.timeFacets[facet].eventsData[item]._id == this.selectedItemId) {
                    this.timeFacets[facet].eventsData[item]._icon = "scripts/timeline_js/images/dark-red-circle.png";
                } else 
                    this.timeFacets[facet].eventsData[item]._icon = "scripts/timeline_js/images/blue-circle.png";
            }
        }

        this.RefreshView();
    },
    SetSelectedFacet: function (facet) {
        if (!facet)
            this.selectedFacet = 0;
        else  
            this.selectedFacet = facet;
    },
    GetSelectedFacet: function () {
        return this.selectedFacet;
    }
});
