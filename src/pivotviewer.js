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

///PivotViewer jQuery extension
(function ($) {
    var _views = [],
        _facetItemTotals = [], //used to store the counts of all the string facets - used when resetting the filters
        _facetNumericItemTotals = [], //used to store the counts of all the numeric facets - used when resetting the filters
        _facetDateTimeItemTotals = [], //used to store the counts of all the datetime facets - used when resetting the filters
        _wordWheelItems = [], //used for quick access to search values
	_stringFacets = [],
	_numericFacets = [],
        _currentView = 0,
        _loadingInterval,
        _tileController,
        _tiles = [],
        _filterItems = [],
        _selectedItem = "",
        _selectedItemBkt = 0,
        _initSelectedItem = "",
        _initTableFacet = "",
        _handledInitSettings = false,
        _changeToTileViewSelectedItem = "",
        _currentSort = "",
        _imageController,
        _mouseDrag = null,
        _mouseMove = null,
        _viewerState = { View: null, Facet: null, Filters: [] },
        _self = null,
        _nameMapping = {},
        PivotCollection = new PivotViewer.Models.Collection();

    var methods = {
        init: function (options) {
            _self = this;
            _self.addClass('pv-wrapper');
            InitPreloader();

            //Collection loader
            if (options.Loader == undefined)
                throw "Collection loader is undefined.";
            if (options.Loader instanceof PivotViewer.Models.Loaders.ICollectionLoader)
                options.Loader.LoadCollection(PivotCollection);
            else
                throw "Collection loader does not inherit from PivotViewer.Models.Loaders.ICollectionLoader.";

            //Image controller
            if (options.ImageController == undefined)
                _imageController = new PivotViewer.Views.DeepZoomImageController();
            else if (!options.ImageController instanceof PivotViewer.Views.IImageController)
                throw "Image Controller does not inherit from PivotViewer.Views.IImageController.";
            else
                _imageController = options.ImageController;

            //ViewerState
            //http://i2.silverlight.net/content/pivotviewer/developer-info/api/html/P_System_Windows_Pivot_PivotViewer_ViewerState.htm
            if (options.ViewerState != undefined) {
                var splitVS = options.ViewerState.split('&');
                for (var i = 0, _iLen = splitVS.length; i < _iLen; i++) {
                    var splitItem = splitVS[i].split('=');
                    if (splitItem.length == 2) {
                        //Selected view
                        if (splitItem[0] == '$view$')
                            _viewerState.View = parseInt(splitItem[1]) - 1;
                        //Sorted by
                        else if (splitItem[0] == '$facet0$')
                            _viewerState.Facet = PivotViewer.Utils.EscapeItemId(splitItem[1]);
                        //Selected Item
                        else if (splitItem[0] == '$selection$')
                            _viewerState.Selection = PivotViewer.Utils.EscapeItemId(splitItem[1]);
                        //Table Selected Facet
                        else if (splitItem[0] == '$tableFacet$')
                            _viewerState.TableFacet = PivotViewer.Utils.EscapeItemId(splitItem[1]);
                        //Filters
                        else {
                            var filter = { Facet: splitItem[0], Predicates: [] };
                            var filters = splitItem[1].split('_');
                            for (var j = 0, _jLen = filters.length; j < _jLen; j++) {
                                //var pred = filters[j].split('.');
                                if (filters[j].indexOf('.') > 0) {
                                    var pred = filters[j].substring(0, filters[j].indexOf('.'));
                                    var value = filters[j].substring(filters[j].indexOf('.') + 1);
                                    //if (pred.length == 2)
                                    filter.Predicates.push({ Operator: pred, Value: value });
                                }
                            }
                            _viewerState.Filters.push(filter);
                        }
                    }
                }
            }
        },
        show: function () {
            Debug.Log('Show');
        },
        hide: function () {
            Debug.Log('Hide');
        }
    };

    InitPreloader = function () {
        //http://gifmake.com/
        _self.append("<div class='pv-loading'><img src='Content/images/loading.gif' alt='Loading' /><span>Loading...</span></div>");
        $('.pv-loading').css('top', ($('.pv-wrapper').height() / 2) - 33 + 'px');
        $('.pv-loading').css('left', ($('.pv-wrapper').width() / 2) - 43 + 'px');
    };

    InitTileCollection = function () {
        InitUI();
        //init DZ Controller
        var baseCollectionPath = PivotCollection.ImageBase;
        if (!(baseCollectionPath.indexOf('http', 0) >= 0 || baseCollectionPath.indexOf('www.', 0) >= 0))
            baseCollectionPath = PivotCollection.CXMLBase.substring(0, PivotCollection.CXMLBase.lastIndexOf('/') + 1) + baseCollectionPath;
        var canvasContext = $('.pv-viewarea-canvas')[0].getContext("2d");

        //Init Tile Controller and start animation loop
        _tileController = new PivotViewer.Views.TileController(_imageController);
        _tiles = _tileController.initTiles(PivotCollection.Items, baseCollectionPath, canvasContext);
        //Init image controller
        _imageController.Setup(baseCollectionPath.replace("\\", "/"));
    };

    InitPivotViewer = function () {
        CreateFacetList();
        CreateViews();
        AttachEventHandlers();

        //loading completed
        $('.pv-loading').remove();

        //Apply ViewerState filters
        ApplyViewerState();
        _initSelectedItem = GetItem(_viewerState.Selection);
        _initTableFacet = _viewerState.TableFacet;

        //Set the width for displaying breadcrumbs as we now know the control sizes 
        //Hardcoding the value for the width of the viewcontrols images (124=21*4) as the webkit browsers 
        //do not know the size of the images at this point.
        var controlsWidth = $('.pv-toolbarpanel').innerWidth() - ($('.pv-toolbarpanel-brandimage').outerWidth(true) +25 + $('.pv-toolbarpanel-name').outerWidth(true) + $('.pv-toolbarpanel-zoomcontrols').outerWidth(true) + 124 + $('.pv-toolbarpanel-sortcontrols').outerWidth(true));

        $('.pv-toolbarpanel-facetbreadcrumb').css('width', controlsWidth + 'px');

        //select first view
        if (_viewerState.View != null)
            SelectView(_viewerState.View, true);
        else
            SelectView(0, true);

        //Begin tile animation
        var id = (_initSelectedItem && _initSelectedItem.Id) ? _initSelectedItem.Id : "";
        _tileController.BeginAnimation(true, id);
    };

    InitUI = function () {
        //toolbar
        var toolbarPanel = "<div class='pv-toolbarpanel'>";

        var brandImage = PivotCollection.BrandImage;
        if (brandImage.length > 0)
            toolbarPanel += "<img class='pv-toolbarpanel-brandimage' src='" + brandImage + "'></img>";
        toolbarPanel += "<span class='pv-toolbarpanel-name'>" + PivotCollection.CollectionName + "</span>";
        toolbarPanel += "<div class='pv-toolbarpanel-facetbreadcrumb'></div>";
        toolbarPanel += "<div class='pv-toolbarpanel-zoomcontrols'><div class='pv-toolbarpanel-zoomslider'></div></div>";
        toolbarPanel += "<div class='pv-toolbarpanel-viewcontrols'></div>";
        toolbarPanel += "<div class='pv-toolbarpanel-sortcontrols'></div>";
        toolbarPanel += "</div>";
        _self.append(toolbarPanel);

        //setup zoom slider
        var thatRef = 0;
        $('.pv-toolbarpanel-zoomslider').slider({
            max: 100,
            change: function (event, ui) {
                var val = ui.value - thatRef;
                //Find canvas centre
                centreX = $('.pv-viewarea-canvas').width() / 2;
                centreY = $('.pv-viewarea-canvas').height() / 2;
                $.publish("/PivotViewer/Views/Canvas/Zoom", [{ x: centreX, y: centreY, delta: 0.5 * val}]);
                thatRef = ui.value;
            }
        });

        //main panel
        _self.append("<div class='pv-mainpanel'></div>");
        var mainPanelHeight = $('.pv-wrapper').height() - $('.pv-toolbarpanel').height() - 6;
        $('.pv-mainpanel').css('height', mainPanelHeight + 'px');
        $('.pv-mainpanel').append("<div class='pv-filterpanel'></div>");
        $('.pv-mainpanel').append("<div class='pv-viewpanel'><canvas class='pv-viewarea-canvas' width='" + _self.width() + "' height='" + mainPanelHeight + "px'></canvas></div>");
        $('.pv-mainpanel').append("<div class='pv-infopanel'></div>");
 
        //add grid for tableview to the mainpanel
        $('.pv-viewpanel').append("<div class='pv-tableview-table' id='pv-table'></div>");

        //add canvas for map to the mainpanel
        $('.pv-viewpanel').append("<div class='pv-mapview-canvas' id='pv-map-canvas'></div>");

        //filter panel
        var filterPanel = $('.pv-filterpanel');
        filterPanel.append("<div class='pv-filterpanel-clearall'>Clear All</div>")
            .append("<input class='pv-filterpanel-search' type='text' placeholder='Search...' /><div class='pv-filterpanel-search-autocomplete'></div>")
            .css('height', mainPanelHeight - 13 + 'px');
        if (navigator.userAgent.match(/iPad/i) != null)
            $('.pv-filterpanel-search').css('width', filterPanel.width() - 10 + 'px');
        else
            $('.pv-filterpanel-search').css('width', filterPanel.width() - 2 + 'px');
        $('.pv-filterpanel-search-autocomplete')
            .css('width', filterPanel.width() - 8 + 'px')
            .hide();
        //view panel
        //$('.pv-viewpanel').css('left', $('.pv-filterpanel').width() + 28 + 'px');
        //info panel
        var infoPanel = $('.pv-infopanel');
        infoPanel.css('left', (($('.pv-mainpanel').offset().left + $('.pv-mainpanel').width()) - 205) + 'px')
            .css('height', mainPanelHeight - 28 + 'px');
        infoPanel.append("<div class='pv-infopanel-controls'></div>");
        $('.pv-infopanel-controls').append("<div><div class='pv-infopanel-controls-navleft'></div><div class='pv-infopanel-controls-navleftdisabled'></div><div class='pv-infopanel-controls-navbar'></div><div class='pv-infopanel-controls-navright'></div><div class='pv-infopanel-controls-navrightdisabled'></div></div>");
        $('.pv-infopanel-controls-navleftdisabled').hide();
        $('.pv-infopanel-controls-navrightdisabled').hide();
        infoPanel.append("<div class='pv-infopanel-heading'></div>");
        infoPanel.append("<div class='pv-infopanel-details'></div>");
        if (PivotCollection.MaxRelatedLinks > 0) {
            infoPanel.append("<div class='pv-infopanel-related'></div>");
        }
        if (PivotCollection.CopyrightName != "") {
            infoPanel.append("<div class='pv-infopanel-copyright'><a href=\"" + PivotCollection.CopyrightHref + "\" target=\"_blank\">" + PivotCollection.CopyrightName + "</a></div>");
        }
        infoPanel.hide();
    };

    //Creates facet list for the filter panel
    //Adds the facets into the filter select list
    CreateFacetList = function () {
        //build list of all facets - used to get id references of all facet items and store the counts
        for (var i = 0; i < PivotCollection.Items.length; i++) {
            var currentItem = PivotCollection.Items[i];

            //Go through Facet Categories to get properties
            for (var m = 0; m < PivotCollection.FacetCategories.length; m++) {
                var currentFacetCategory = PivotCollection.FacetCategories[m];

                //Add to the facet panel
                if (currentFacetCategory.IsFilterVisible) {
                    var hasValue = false;

                    //Get values                    
                    for (var j = 0, _jLen = currentItem.Facets.length; j < _jLen; j++) {
                        var currentItemFacet = currentItem.Facets[j];
                        //If the facet is found then add it's values to the list
                        if (currentItemFacet.Name == currentFacetCategory.Name) {
                            for (var k = 0; k < currentItemFacet.FacetValues.length; k++) {
                                if (currentFacetCategory.Type == PivotViewer.Models.FacetType.String ||
                                    currentFacetCategory.Type == PivotViewer.Models.FacetType.Link) {
                                    var found = false;
                                    var itemId = "pv-facet-item-" + CleanName(currentItemFacet.Name) + "__" + CleanName(currentItemFacet.FacetValues[k].Value);
                                    for (var n = _facetItemTotals.length - 1; n > -1; n -= 1) {
                                        if (_facetItemTotals[n].itemId == itemId) {
                                            _facetItemTotals[n].count += 1;
                                            found = true;
                                            break;
                                        }
                                    }

                                    if (!found)
                                        _facetItemTotals.push({ itemId: itemId, itemValue: currentItemFacet.FacetValues[k].Value, facet: currentItemFacet.Name, count: 1 });
                                }
                                else if (currentFacetCategory.Type == PivotViewer.Models.FacetType.Number) {
                                    //collect all the numbers to update the histogram
                                    var numFound = false;
                                    for (var n = 0; n < _facetNumericItemTotals.length; n++) {
                                        if (_facetNumericItemTotals[n].Facet == currentItem.Facets[j].Name) {
                                            _facetNumericItemTotals[n].Values.push(currentItemFacet.FacetValues[k].Value);
                                            numFound = true;
                                            break;
                                        }
                                    }
                                    if (!numFound)
                                        _facetNumericItemTotals.push({ Facet: currentItemFacet.Name, Values: [currentItemFacet.FacetValues[k].Value] });
                                }
                                else if (currentFacetCategory.Type == PivotViewer.Models.FacetType.DateTime) {
                                    //collect all the DateTime types
                                    var dateTimeFound = false;
                                    var itemId = "pv-facet-item-" + CleanName(currentItemFacet.Name) + "__" + CleanName(currentItemFacet.FacetValues[k].Value);
                                    for (var n = 0; n < _facetDateTimeItemTotals.length; n++) {
                                        if (_facetDateTimeItemTotals[n].itemId == itemId) {
                                            _facetDateTimeItemTotals[n].count += 1;
                                            dateTimeFound = true;
                                            break;
                                        }
                                    }
                                    if (!dateTimeFound)
                                        _facetDateTimeItemTotals.push({ itemId: itemId, itemValue: currentItemFacet.FacetValues[k].Value, facet: currentItemFacet.Name, count: 1 });
                                }
                            }
                            hasValue = true;
                        }
                    }

                    if (!hasValue) {
                        //Create (no info) value
                        var found = false;
                        var itemId = "pv-facet-item-" + CleanName(currentFacetCategory.Name) + "__" + CleanName("(no info)");
                        for (var n = _facetItemTotals.length - 1; n > -1; n -= 1) {
                            if (_facetItemTotals[n].itemId == itemId) {
                                _facetItemTotals[n].count += 1;
                                found = true;
                                break;
                            }
                        }

                        if (!found)
                            _facetItemTotals.push({ itemId: itemId, itemValue: "(no info)", facet: currentFacetCategory.Name, count: 1 });
                    }
                }
                //Add to the word wheel cache array
                if (currentFacetCategory.IsWordWheelVisible) {
                    //Get values                    
                    for (var j = 0, _jLen = currentItem.Facets.length; j < _jLen; j++) {
                        var currentItemFacet = currentItem.Facets[j];
                        //If the facet is found then add it's values to the list
                        if (currentItemFacet.Name == currentFacetCategory.Name) {
                            for (var k = 0; k < currentItemFacet.FacetValues.length; k++) {
                                if (currentFacetCategory.Type == PivotViewer.Models.FacetType.String) {
                                    _wordWheelItems.push({ Facet: currentItemFacet.Name, Value: currentItemFacet.FacetValues[k].Value });
                                }
                            }
                        }
                    }
                }
            }
        }

        var facets = ["<div class='pv-filterpanel-accordion'>"];
        var sort = [];
        for (var i = 0; i < PivotCollection.FacetCategories.length; i++) {
            if (PivotCollection.FacetCategories[i].IsFilterVisible) {
                facets[i + 1] = "<h3><a href='#' title=" + PivotCollection.FacetCategories[i].Name + ">";
                facets[i + 1] += PivotCollection.FacetCategories[i].Name;
                facets[i + 1] += "</a><div class='pv-filterpanel-accordion-heading-clear' facetType='" + PivotCollection.FacetCategories[i].Type + "'>&nbsp;</div></h3>";
                facets[i + 1] += "<div style='height:30%' id='pv-cat-" + CleanName(PivotCollection.FacetCategories[i].Name) + "'>";

                //Create facet controls
                if (PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.DateTime ) {
                    facets[i + 1] += CreateDateTimeFacet(PivotCollection.FacetCategories[i].Name);
		}
                else if (PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.String ||
                         PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.Link) {
                    //Sort
                    if (PivotCollection.FacetCategories[i].CustomSort != undefined || PivotCollection.FacetCategories[i].CustomSort != null)
                        facets[i + 1] += "<span class='pv-filterpanel-accordion-facet-sort' customSort='" + PivotCollection.FacetCategories[i].CustomSort.Name + "'>Sort: " + PivotCollection.FacetCategories[i].CustomSort.Name + "</span>";
                    else
                        facets[i + 1] += "<span class='pv-filterpanel-accordion-facet-sort'>Sort: A-Z</span>";
                    facets[i + 1] += CreateStringFacet(PivotCollection.FacetCategories[i].Name);
                }
                else if (PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.Number)
                    facets[i + 1] += "<div id='pv-filterpanel-category-numberitem-" + CleanName(PivotCollection.FacetCategories[i].Name) + "'></div>";

                facets[i + 1] += "</div>";
                //Add to sort
                sort[i] = "<option value='" + CleanName(PivotCollection.FacetCategories[i].Name) + "' label='" + PivotCollection.FacetCategories[i].Name + "'>" + PivotCollection.FacetCategories[i].Name + "</option>";
            }
        }
        facets[facets.length] = "</div>";
        $(".pv-filterpanel").append(facets.join(''));
        //Default sorts
        for (var i = 0; i < PivotCollection.FacetCategories.length; i++) {
            if (PivotCollection.FacetCategories[i].IsFilterVisible)
                SortFacetItems(PivotCollection.FacetCategories[i].Name);
        }
	// Minus an extra 25 to leave room for the version number to be added underneath
        $(".pv-filterpanel-accordion").css('height', ($(".pv-filterpanel").height() - $(".pv-filterpanel-search").height() - 75) + "px");
        $(".pv-filterpanel-accordion").accordion({
        });
        $('.pv-toolbarpanel-sortcontrols').append('<select class="pv-toolbarpanel-sort">' + sort.join('') + '</select>');

        //setup numeric facets
        for (var i = 0; i < _facetNumericItemTotals.length; i++)
            CreateNumberFacet(CleanName(_facetNumericItemTotals[i].Facet), _facetNumericItemTotals[i].Values);
    };

    /// Create the individual controls for the facet
    CreateDateTimeFacet = function (facetName) {
        var facetControls = ["<ul class='pv-filterpanel-accordion-facet-list'>"];
        for (var i = 0; i < _facetDateTimeItemTotals.length; i++) {
            if (_facetDateTimeItemTotals[i].facet == facetName) {
                facetControls[i + 1] = "<li class='pv-filterpanel-accordion-facet-list-item'  id='" + _facetDateTimeItemTotals[i].itemId + "'>";
                facetControls[i + 1] += "<input itemvalue='" + CleanName(_facetDateTimeItemTotals[i].itemValue) + "' itemfacet='" + CleanName(facetName) + "' class='pv-facet-facetitem' type='checkbox' />"
                facetControls[i + 1] += "<span class='pv-facet-facetitem-label' title='" + _facetDateTimeItemTotals[i].itemValue + "'>" + _facetDateTimeItemTotals[i].itemValue + "</span>";
                facetControls[i + 1] += "<span class='pv-facet-facetitem-count'>0</span>"
                facetControls[i + 1] += "</li>";
            }
        }
        facetControls[facetControls.length] = "</ul>";
        return facetControls.join('');
    };

    CreateStringFacet = function (facetName) {
        var facetControls = ["<ul class='pv-filterpanel-accordion-facet-list'>"];
        for (var i = 0; i < _facetItemTotals.length; i++) {
            if (_facetItemTotals[i].facet == facetName) {
                facetControls[i + 1] = "<li class='pv-filterpanel-accordion-facet-list-item'  id='" + _facetItemTotals[i].itemId + "'>";
                facetControls[i + 1] += "<input itemvalue='" + CleanName(_facetItemTotals[i].itemValue) + "' itemfacet='" + CleanName(facetName) + "' class='pv-facet-facetitem' type='checkbox' />"
                facetControls[i + 1] += "<span class='pv-facet-facetitem-label' title='" + _facetItemTotals[i].itemValue + "'>" + _facetItemTotals[i].itemValue + "</span>";
                facetControls[i + 1] += "<span class='pv-facet-facetitem-count'>0</span>"
                facetControls[i + 1] += "</li>";
            }
        }
        facetControls[facetControls.length] = "</ul>";
        return facetControls.join('');
    };

    CreateNumberFacet = function (facetName, facetValues) {
        //histogram dimensions
        var w = 165, h = 80;

        var chartWrapper = $("#pv-filterpanel-category-numberitem-" + PivotViewer.Utils.EscapeMetaChars(facetName));
        chartWrapper.empty();
        chartWrapper.append("<span class='pv-filterpanel-numericslider-range-val'>&nbsp;</span>");
        var chart = "<svg class='pv-filterpanel-accordion-facet-chart' width='" + w + "' height='" + h + "'>";

        //Create histogram
        var histogram = PivotViewer.Utils.Histogram(facetValues);
        //work out column width based on chart width
        var columnWidth = (0.5 + (w / histogram.BinCount)) | 0;
        //get the largest count from the histogram. This is used to scale the heights
        var maxCount = 0;
        for (var k = 0, _kLen = histogram.Histogram.length; k < _kLen; k++)
            maxCount = maxCount < histogram.Histogram[k].length ? histogram.Histogram[k].length : maxCount;
        //draw the bars
        for (var k = 0, _kLen = histogram.Histogram.length; k < _kLen; k++) {
            var barHeight = (0.5 + (h / (maxCount / histogram.Histogram[k].length))) | 0;
            var barX = (0.5 + (columnWidth * k)) | 0;
            chart += "<rect x='" + barX + "' y='" + (h - barHeight) + "' width='" + columnWidth + "' height='" + barHeight + "'></rect>";
        }
        chartWrapper.append(chart + "</svg>");
        //add the extra controls
        var p = $("#pv-filterpanel-category-numberitem-" + PivotViewer.Utils.EscapeMetaChars(facetName));
        p.append('</span><div id="pv-filterpanel-numericslider-' + facetName + '" class="pv-filterpanel-numericslider"></div><span class="pv-filterpanel-numericslider-range-min">' + histogram.Min + '</span><span class="pv-filterpanel-numericslider-range-max">' + histogram.Max + '</span>');
        var s = $('#pv-filterpanel-numericslider-' + PivotViewer.Utils.EscapeMetaChars(facetName));
        s.slider({
            range: true,
            min: histogram.Min,
            max: histogram.Max,
            values: [histogram.Min, histogram.Max],
            slide: function (event, ui) {
                $(this).parent().find('.pv-filterpanel-numericslider-range-val').text(ui.values[0] + " - " + ui.values[1]);
            },
            stop: function (event, ui) {
                var thisWrapped = $(this);
                var thisMin = thisWrapped.slider('option', 'min'),
                            thisMax = thisWrapped.slider('option', 'max');
                if (ui.values[0] > thisMin || ui.values[1] < thisMax)
                    thisWrapped.parent().parent().prev().find('.pv-filterpanel-accordion-heading-clear').css('visibility', 'visible');
                else if (ui.values[0] == thisMin && ui.values[1] == thisMax)
                    thisWrapped.parent().parent().prev().find('.pv-filterpanel-accordion-heading-clear').css('visibility', 'hidden');
                FilterCollection(false);
            }
        });
    };

    /// Creates and initialises the views - including plug-in views
    /// Init shared canvas
    CreateViews = function () {

        var viewPanel = $('.pv-viewpanel');
        var width = _self.width();
        var height = $('.pv-mainpanel').height();
        var offsetX = $('.pv-filterpanel').width() + 18;
        var offsetY = 4;

        //Create instances of all the views
        _views.push(new PivotViewer.Views.GridView());
        _views.push(new PivotViewer.Views.GraphView());
        _views.push(new PivotViewer.Views.TableView());
        _views.push(new PivotViewer.Views.MapView());

        //init the views interfaces
        for (var i = 0; i < _views.length; i++) {
            try {
                if (_views[i] instanceof PivotViewer.Views.IPivotViewerView) {
                    _views[i].Setup(width, height, offsetX, offsetY, _tileController.GetMaxTileRatio());
                    viewPanel.append("<div class='pv-viewpanel-view' id='pv-viewpanel-view-" + i + "'>" + _views[i].GetUI() + "</div>");
                    $('.pv-toolbarpanel-viewcontrols').append("<div class='pv-toolbarpanel-view' id='pv-toolbarpanel-view-" + i + "' title='" + _views[i].GetViewName() + "'><img id='pv-viewpanel-view-" + i + "-image' src='" + _views[i].GetButtonImage() + "' alt='" + _views[i].GetViewName() + "' /></div>");
                } else {
                    var msg = '';
                    msg = msg + 'View does not inherit from PivotViewer.Views.IPivotViewerView<br>';
                    $('.pv-wrapper').append("<div id=\"pv-view-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
                    window.open("#pv-view-error","_self")
                }
            } catch (ex) { alert(ex.Message); }
        }

       // The table and the map view needs to know about the facet categories
       _views[2].SetFacetCategories(PivotCollection);
       _views[3].SetFacetCategories(PivotCollection);

    };

    /// Set the current view
    SelectView = function (viewNumber, init) {
        //Deselect all views
        for (var i = 0; i < _views.length; i++) {
            if (viewNumber != i) {
                $('#pv-viewpanel-view-' + i + '-image').attr('src', _views[i].GetButtonImage());
                _views[i].Deactivate();
                _views[i].init = false;
            }
        }
        $('#pv-viewpanel-view-' + viewNumber + '-image').attr('src', _views[viewNumber].GetButtonImageSelected());
        if (_currentView == 1 && (viewNumber == 2 || viewNumber == 3)) {
            // Move tiles back to grid positions - helps with maintaining selected item 
            // when changing views
            _views[0].Activate();
            _views[0].init = init;
            _currentView = 0;
            FilterCollection(true);
        }
        _views[viewNumber].Activate();
        _views[viewNumber].init = init;

        _currentView = viewNumber;
        if (viewNumber == 1) {
          $.publish("/PivotViewer/Views/Item/Selected", [{id: "", bkt: 0}]);
          _selectedItem = "";
        }
        FilterCollection(true);
    };

    ///Sorts the facet items based on a specific sort type
    SortFacetItems = function (facetName) {
        //get facets
        var facetList = $("#pv-cat-" + PivotViewer.Utils.EscapeMetaChars(CleanName(facetName)) + " ul");
        var sortType = facetList.prev().text().replace("Sort: ", "");
        var facetItems = facetList.children("li").get();
        if (sortType == "A-Z") {
            facetItems.sort(function (a, b) {
                var compA = $(a).children().first().attr("itemvalue");
                var compB = $(b).children().first().attr("itemvalue");
                return (compA < compB) ? 1 : (compA > compB) ? -1 : 0;
            });
        } else if (sortType == "Quantity") {
            facetItems.sort(function (a, b) {
                var compA = parseInt($(a).children(".pv-facet-facetitem-count").text());
                var compB = parseInt($(b).children(".pv-facet-facetitem-count").text());
                return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
            });
        } else {
            var facet = PivotCollection.GetFacetCategoryByName(facetName);
            if (facet.CustomSort != undefined) {
                var sortList = [];
                for (var i = facet.CustomSort.SortValues.length - 1; i > -1; i -= 1) {
                    for (var j = 0; j < facetItems.length; j++) {
                        if (facet.CustomSort.SortValues[i] == $(facetItems[j]).children(".pv-facet-facetitem-label").text()) {
                            sortList.push(facetItems[j]);
                            found = true;
                        }
                    }
                }
                facetItems = sortList;
            }
        }
        for (var i = 0; i < facetItems.length; i++) {
            facetList.prepend(facetItems[i]);
        }
    };

    //Facet: splitItem[0], Operator: filter[0], Value: filter[1]
    //Applies the filters and sorted facet from the viewer state
    ApplyViewerState = function () {
        //Sort
        if (_viewerState.Facet != null) {
            $('.pv-toolbarpanel-sort option[value=' + CleanName(_viewerState.Facet) + ']').prop('selected', 'selected');
	    _currentSort = $('.pv-toolbarpanel-sort :selected').attr('label');
            Debug.Log('current sort ' + _currentSort );
	}

        //Filters
        for (var i = 0, _iLen = _viewerState.Filters.length; i < _iLen; i++) {
            for (var j = 0, _jLen = _viewerState.Filters[i].Predicates.length; j < _jLen; j++) {
                var operator = _viewerState.Filters[i].Predicates[j].Operator;
                if (operator == "GT" || operator == "GE" || operator == "LT" || operator == "LE") {
                    var s = $('#pv-filterpanel-numericslider-' + CleanName(_viewerState.Filters[i].Facet));
                    var intvalue = parseFloat(_viewerState.Filters[i].Predicates[j].Value);
                    switch (operator) {
                        case "GT":
                            s.slider("values", 0, intvalue + 1);
                            break;
                        case "GE":
                            s.slider("values", 0, intvalue);
                            break;
                        case "LT":
                            s.slider("values", 1, intvalue - 1);
                            break;
                        case "LE":
                            s.slider("values", 1, intvalue);
                            break;
                    }
                    s.parent().find('.pv-filterpanel-numericslider-range-val').text(s.slider("values", 0) + " - " + s.slider("values", 1));
                    s.parent().parent().prev().find('.pv-filterpanel-accordion-heading-clear').css('visibility', 'visible');
                } else if (operator == "EQ") {
                    //String facet
                    SelectStringFacetItem(
                        CleanName(_viewerState.Filters[i].Facet),
                        CleanName(_viewerState.Filters[i].Predicates[j].Value)
                    );
                } else if (operator == "NT") {
                    //No Info string facet
                    SelectStringFacetItem(
                        CleanName(_viewerState.Filters[i].Facet),
                        "_no_info_"
                    );
                }
            }
        }
    };

    //Selects a string facet
    SelectStringFacetItem = function (facet, value) {
        var cb = $('.pv-facet-facetitem[itemfacet="' + facet + '"][itemvalue="' + value + '"]');
        cb.prop('checked', true);
        cb.parent().parent().parent().prev().find('.pv-filterpanel-accordion-heading-clear').css('visibility', 'visible');
    };

    /// Filters the collection of items and updates the views
    FilterCollection = function (changingView) {
        var filterItems = [];
        var foundItemsCount = [];
        var selectedFacets = [];
        var sort = $('.pv-toolbarpanel-sort option:selected').attr('label');
        Debug.Log('sort ' + sort );

        //Filter String facet items
        var checked = $('.pv-facet-facetitem:checked');

        //Turn off clear all button
        $('.pv-filterpanel-clearall').css('visibility', 'hidden');

        //Filter String facet items
        //create an array of selected facets and values to compare to all items.
        var stringFacets = [];
        for (var i = 0; i < checked.length; i++) {
            var facet = _nameMapping[$(checked[i]).attr('itemfacet')];
            var facetValue = _nameMapping[$(checked[i]).attr('itemvalue')];

            var found = false;
            for (var j = 0; j < stringFacets.length; j++) {
                if (stringFacets[j].facet == facet) {
                    stringFacets[j].facetValue.push(facetValue);
                    found = true;
                }
            }
            if (!found)
                stringFacets.push({ facet: facet, facetValue: [facetValue] });

            //Add to selected facets list - this is then used to filter the facet list counts
            if ($.inArray(facet, selectedFacets) < 0)
                selectedFacets.push(facet);
        }

        //Numeric facet items. Find all numeric types that have been filtered
        var numericFacets = [];
        for (var i = 0, _iLen = PivotCollection.FacetCategories.length; i < _iLen; i++) {
            if (PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.Number) {
                var numbFacet = $('#pv-filterpanel-category-numberitem-' + CleanName(PivotCollection.FacetCategories[i].Name));
                var sldr = $(numbFacet).find('.pv-filterpanel-numericslider');
                if (sldr.length > 0) {
                    var range = sldr.slider("values");
                    var rangeMax = sldr.slider('option', 'max'), rangeMin = sldr.slider('option', 'min');
                    if (range[0] != rangeMin || range[1] != rangeMax) {
                        var facet = PivotCollection.FacetCategories[i].Name;
                        numericFacets.push({ facet: facet, selectedMin: range[0], selectedMax: range[1], rangeMin: rangeMin, rangeMax: rangeMax });
                        //Add to selected facets list - this is then used to filter the facet list counts
                        if ($.inArray(facet, selectedFacets) < 0)
                            selectedFacets.push(facet);
                    }
                }
            }
        }

        //Find matching facet values in items
        for (var i = 0, _iLen = PivotCollection.Items.length; i < _iLen; i++) {
            var foundCount = 0;

            //Look for ("no info") in string filters
            //Go through all filters facets 
            for (var k = 0, _kLen = stringFacets.length; k < _kLen; k++) {
                //Look for value matching "(no info)"
                for (var n = 0, _nLen = stringFacets[k].facetValue.length; n < _nLen; n++) {
                    if (stringFacets[k].facetValue[n] == "(no info)") {
                        // See if facet is defined for the item
                        var definedForItem = false;
                        for (var j = 0, _jLen = PivotCollection.Items[i].Facets.length; j < _jLen; j++) {
                            if (PivotCollection.Items[i].Facets[j].Name == stringFacets[k].facet){
                                //Facet is defined for that item
                                definedForItem = true;
                            }
                        }
                        //Tried all of the items facets
                        // Matches ("no info")
                        if (definedForItem == false)
                            foundCount++;
                    }
                }
            }

            for (var j = 0, _jLen = PivotCollection.Items[i].Facets.length; j < _jLen; j++) {
                //String facets
                for (var k = 0, _kLen = stringFacets.length; k < _kLen; k++) {
                    var valueFoundForFacet = 0;

                    if (PivotCollection.Items[i].Facets[j].Name == stringFacets[k].facet) {
                        for (var m = 0, _mLen = PivotCollection.Items[i].Facets[j].FacetValues.length; m < _mLen; m++) {
                            for (var n = 0, _nLen = stringFacets[k].facetValue.length; n < _nLen; n++) {
                                if (PivotCollection.Items[i].Facets[j].FacetValues[m].Value == stringFacets[k].facetValue[n])
                                    valueFoundForFacet++;
                            }
                        }
                    }
                    // Handles the posibility that and item might match several values of one facet
                    if (valueFoundForFacet > 0 )
                      foundCount++;
                }
            }

            //if the item was not in the string filters then exit early
            if (foundCount != stringFacets.length)
                continue;

            //Look for ("no info") in numeric filters
            //Go through all filters facets 
            for (var k = 0, _kLen = numericFacets.length; k < _kLen; k++) {
                //Look for value matching "(no info)"
                    if (numericFacets[k].selectedMin == "(no info)") {
                        // See if facet is defined for the item
                        var definedForItem = false;
                        for (var j = 0, _jLen = PivotCollection.Items[i].Facets.length; j < _jLen; j++) {
                            if (PivotCollection.Items[i].Facets[j].Name == numericFacets[k].facet){
                                //Facet is defined for that item
                                definedForItem = true;
                            }
                        }
                        //Tried all of the items facets
                        // Matches ("no info")
                        if (definedForItem == false)
                            foundCount++;
                    }
            }

            for (var j = 0, _jLen = PivotCollection.Items[i].Facets.length; j < _jLen; j++) {
                //Numeric facets
                for (var k = 0, _kLen = numericFacets.length; k < _kLen; k++) {
                    if (PivotCollection.Items[i].Facets[j].Name == numericFacets[k].facet) {
                        for (var m = 0, _mLen = PivotCollection.Items[i].Facets[j].FacetValues.length; m < _mLen; m++) {
                            var parsed = parseFloat(PivotCollection.Items[i].Facets[j].FacetValues[m].Value);
                            if (!isNaN(parsed) && parsed >= numericFacets[k].selectedMin && parsed <= numericFacets[k].selectedMax)
                                foundCount++;
                        }
                    }
                }
            }

            if (foundCount != (stringFacets.length + numericFacets.length))
                continue;

            //Date facets - currently handled like strings

            //Item is in all filters
            filterItems.push(PivotCollection.Items[i].Id);

            if ((stringFacets.length + numericFacets.length) > 0)
                $('.pv-filterpanel-clearall').css('visibility', 'visible');
        }

	// Tidy this up
	_numericFacets = numericFacets;
	_stringFacets = stringFacets;

        $('.pv-viewpanel-view').hide();
        $('#pv-viewpanel-view-' + _currentView).show();
        //Filter the facet counts and remove empty facets
        FilterFacets(filterItems, selectedFacets);

        //Update breadcrumb
        UpdateBreadcrumbNavigation(stringFacets, numericFacets);

        //Filter view
        _tileController.SetCircularEasingBoth();
        if (!_handledInitSettings){
            if (_currentView == 2) { 
                _views[_currentView].SetSelectedFacet(_initTableFacet);
                _views[_currentView].Filter(_tiles, filterItems, sort, stringFacets, changingView, _initSelectedItem);
            } else 
                _views[_currentView].Filter(_tiles, filterItems, sort, stringFacets, changingView, _selectedItem);
            _handledInitSettings = true;
        }
        else {
            _views[_currentView].Filter(_tiles, filterItems, sort, stringFacets, changingView, _selectedItem);
            if ((_currentView == 2 || _currentView == 3) && !changingView) { 
                _views[0].Filter(_tiles, filterItems, sort, stringFacets, false, "");
            }
        }

        // Maintain a list of items in the filter in sort order.
        var sortedFilter = [];
        // More compicated for the graphview...
        if (_views[_currentView].GetViewName() == 'Graph View')
           sortedFilter = _views[_currentView].GetSortedFilter();
        else {
            for (var i = 0; i < _views[_currentView].tiles.length; i++) {
                var filterindex = $.inArray(_views[_currentView].tiles[i].facetItem.Id, filterItems);
                if (filterindex >= 0) {
                    var obj = new Object ();
                    obj.Id = _views[_currentView].tiles[i].facetItem.Id;
                    obj.Bucket = 0;
                    sortedFilter.push(obj);
                }
            }
        }
        _filterItems = sortedFilter;

	// Update the bookmark
        UpdateBookmark ();

        DeselectInfoPanel();
    };

    /// Filters the facet panel items and updates the counts
    FilterFacets = function (filterItems, selectedFacets) {
        //if all the items are visible then update all
        if (filterItems.length == PivotCollection.Items.length) {
            //DateTime facets
            for (var i = _facetDateTimeItemTotals.length - 1; i > -1; i -= 1) {
                var item = $('#' + PivotViewer.Utils.EscapeMetaChars(_facetDateTimeItemTotals[i].itemId));
                item.show();
                item.find('span').last().text(_facetDateTimeItemTotals[i].count);
            }
            //String facets
            for (var i = _facetItemTotals.length - 1; i > -1; i -= 1) {
                var item = $('#' + PivotViewer.Utils.EscapeMetaChars(_facetItemTotals[i].itemId));
                item.show();
                item.find('span').last().text(_facetItemTotals[i].count);
            }
            //Numeric facets
            //re-create the histograms
            for (var i = 0; i < _facetNumericItemTotals.length; i++)
                CreateNumberFacet(CleanName(_facetNumericItemTotals[i].Facet), _facetNumericItemTotals[i].Values);
            return;
        }

        var filterList = []; //used for string facets
        var numericFilterList = []; //used for number facets
//jch to do
	var dateTimeFilterList = []; //used for datetime facets

        //Create list of items to display
        for (var i = filterItems.length - 1; i > -1; i -= 1) {
            var item = PivotCollection.GetItemById(filterItems[i]);
            for (var m = 0; m < PivotCollection.FacetCategories.length; m++) {
                if (PivotCollection.FacetCategories[m].IsFilterVisible) {
                    //If it's a visible filter then determine if it has a value
                    var hasValue = false;
                    for (var j = item.Facets.length - 1; j > -1; j -= 1) {
                        if (item.Facets[j].Name == PivotCollection.FacetCategories[m].Name) {
                            //If not in the selected facet list then determine count
                            if ($.inArray(item.Facets[j].Name, selectedFacets) < 0) {
                                var facetCategory = PivotCollection.GetFacetCategoryByName(item.Facets[j].Name);
                                if (facetCategory.IsFilterVisible) {
                                    for (var k = item.Facets[j].FacetValues.length - 1; k > -1; k -= 1) {
                                        //String Facets
                                        if (facetCategory.Type == PivotViewer.Models.FacetType.String) {
                                            var filteredItem = { item: '#' + PivotViewer.Utils.EscapeMetaChars('pv-facet-item-' + CleanName(item.Facets[j].Name) + '__' + CleanName(item.Facets[j].FacetValues[k].Value)), count: 1 };
                                            var found = false;
                                            for (var n = filterList.length - 1; n > -1; n -= 1) {
                                                if (filterList[n].item == filteredItem.item) {
                                                    filterList[n].count += 1;
                                                    found = true;
                                                    break;
                                                }
                                            }
                                            if (!found)
                                                filterList.push(filteredItem);
                                        }
                                        else if (facetCategory.Type == PivotViewer.Models.FacetType.Number) {
                                            //collect all the numbers to update the histogram
                                            var numFound = false;
                                            for (var n = 0; n < numericFilterList.length; n++) {
                                                if (numericFilterList[n].Facet == item.Facets[j].Name) {
                                                    numericFilterList[n].Values.push(item.Facets[j].FacetValues[k].Value);
                                                    numFound = true;
                                                    break;
                                                }
                                            }
                                            if (!numFound)
                                                numericFilterList.push({ Facet: item.Facets[j].Name, Values: [item.Facets[j].FacetValues[k].Value] });
                                        }
                                    }
                                }
                            }
                            hasValue = true;
                        }
                    }

                    if (!hasValue) {
                        //increment count for (no info)
                        var filteredItem = { item: '#' + PivotViewer.Utils.EscapeMetaChars('pv-facet-item-' + CleanName(PivotCollection.FacetCategories[m].Name) + '__' + CleanName('(no info)')), count: 1 };
                        var found = false;
                        for (var n = filterList.length - 1; n > -1; n -= 1) {
                            if (filterList[n].item == filteredItem.item) {
                                filterList[n].count += 1;
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                            filterList.push(filteredItem);
                    }
                }
            }
        }

        //String facets
        //iterate over all facet items to set it's visibility and count
        for (var i = _facetItemTotals.length - 1; i > -1; i -= 1) {
            if ($.inArray(_facetItemTotals[i].facet, selectedFacets) < 0) {
                //loop over all and hide those not in filterList	
                var found = false;
                for (var j = filterList.length - 1; j > -1; j -= 1) {
                    if (filterList[j].item == _facetItemTotals[i].itemId) {
                        found = true;
                        break;
                    }
                }
                if (!found)
                    $('#' + PivotViewer.Utils.EscapeMetaChars(_facetItemTotals[i].itemId)).hide();
            } else {
                //Set count for selected facets
                $('#' + PivotViewer.Utils.EscapeMetaChars(_facetItemTotals[i].itemId)).find('span').last().text(_facetItemTotals[i].count);
            }
        }

        //display relevant items
        for (var i = filterList.length - 1; i > -1; i -= 1) {
            var facetItem = $(filterList[i].item);
            if (facetItem.length > 0) {
                facetItem.show();
                var itemCount = facetItem.find('span').last();
                itemCount.text(filterList[i].count);
            }
        }

        //Numeric facets
        //re-create the histograms
        for (var i = 0; i < numericFilterList.length; i++)
            CreateNumberFacet(CleanName(numericFilterList[i].Facet), numericFilterList[i].Values);
    };

    UpdateBreadcrumbNavigation = function (stringFacets, numericFacets) {
        var bc = $('.pv-toolbarpanel-facetbreadcrumb');
        bc.empty();

        if (stringFacets.length == 0 && numericFacets.length == 0)
            return;

        var bcItems = "|";
        for (var i = 0, _iLen = stringFacets.length; i < _iLen; i++) {
            bcItems += "<span class='pv-toolbarpanel-facetbreadcrumb-facet'>" + stringFacets[i].facet + ":</span><span class='pv-toolbarpanel-facetbreadcrumb-values'>"
            bcItems += stringFacets[i].facetValue.join(', ');
            bcItems += "</span><span class='pv-toolbarpanel-facetbreadcrumb-separator'>&gt;</span>";
        }

        for (var i = 0, _iLen = numericFacets.length; i < _iLen; i++) {
            bcItems += "<span class='pv-toolbarpanel-facetbreadcrumb-facet'>" + numericFacets[i].facet + ":</span><span class='pv-toolbarpanel-facetbreadcrumb-values'>"
            if (numericFacets[i].selectedMin == numericFacets[i].rangeMin)
                bcItems += "Under " + numericFacets[i].selectedMax;
            else if (numericFacets[i].selectedMax == numericFacets[i].rangeMax)
                bcItems += "Over " + numericFacets[i].selectedMin;
            else
                bcItems += numericFacets[i].selectedMin + " - " + numericFacets[i].selectedMax;
            bcItems += "</span><span class='pv-toolbarpanel-facetbreadcrumb-separator'>&gt;</span>";
        }

        bc.append(bcItems);
    };

    DeselectInfoPanel = function () {
        //de-select details
        $('.pv-infopanel').fadeOut();
        $('.pv-infopanel-heading').empty();
        $('.pv-infopanel-details').empty();
    };

    /// Gets the all the items who have a facet value == value
    GetItemIds = function (facetName, value) {
        var foundId = [];
        for (var i = 0; i < PivotCollection.Items.length; i++) {
            var found = false;
            for (var j = 0; j < PivotCollection.Items[i].Facets.length; j++) {
                if (PivotCollection.Items[i].Facets[j].Name == facetName) {
                    for (var k = 0; k < PivotCollection.Items[i].Facets[j].FacetValues.length; k++) {
                        if (value == PivotCollection.Items[i].Facets[j].FacetValues[k].Value)
                            foundId.push(PivotCollection.Items[i].Id);
                    }
                    found = true;
                }
            }
            if (!found && value == "(no info)") {
                foundId.push(PivotCollection.Items[i].Id);
            }
        }
        return foundId;
    };

    GetItem = function (itemId) {
        for (var i = 0; i < PivotCollection.Items.length; i++) {
            if (PivotCollection.Items[i].Id == itemId)
                return PivotCollection.Items[i];
        }
        return null;
    };

    UpdateBookmark = function ()
        {
            // CurrentViewerState
            var currentViewerState = "#";

            // Add the ViewerState fragment
	    // Add view
	    var viewNum = _currentView + 1;
	    currentViewerState += "$view$=" + viewNum;
	    // Add sort facet
	    if ( _currentSort )
	    	currentViewerState += "&$facet0$=" + _currentSort;
	    // Add selection
	    if ( _selectedItem )
	    	currentViewerState += "&$selection$=" + _selectedItem.Id;
            // Handle bookmark params for specific views
            if (_currentView == 2)
                if (_views[_currentView].GetSelectedFacet())
	    	  currentViewerState += "&$tableFacet$=" + _views[_currentView].GetSelectedFacet();
	    // Add filters and create title
            var title = PivotCollection.CollectionName;
            if (_numericFacets.length + _stringFacets.length > 0)
                title = title + " | ";

	    if (_stringFacets.length > 0 ) {
		for ( i = 0; i < _stringFacets.length; i++ ) {
			for ( j = 0; j < _stringFacets[i].facetValue.length; j++ ) {
	        	    currentViewerState += "&";
			    currentViewerState += _stringFacets[i].facet;
			    currentViewerState += "=EQ." + _stringFacets[i].facetValue[j];
			}
			title += _stringFacets[i].facet + ": ";
			title += _stringFacets[i].facetValue.join(', ');;
			if ( i < _stringFacets.length - 1)
			    title += " > "
	        }
	    }
	    if (_numericFacets.length > 0 ) {
		for ( i = 0; i < _numericFacets.length; i++ ) {
	        	currentViewerState += "&";
			currentViewerState += _numericFacets[i].facet;
			title += _numericFacets[i].facet + ": ";
			if (_numericFacets[i].selectedMin == _numericFacets[i].rangeMin) {
			    currentViewerState += "=LE." + _numericFacets[i].selectedMax;
			    title += "Under " + _numericFacets[i].selectedMax;
			} else if (_numericFacets[i].selectedMax == _numericFacets[i].rangeMax) {
			    currentViewerState += "=GE." + _numericFacets[i].selectedMin;
			    title += "Over " + _numericFacets[i].selectedMin;
			} else {
			    currentViewerState += "=GE." + _numericFacets[i].selectedMin + "_LE." + _numericFacets[i].selectedMax;
			    title += "Between " + _numericFacets[i].selectedMin + " and " + _numericFacets[i].selectedMax;
			}
			if ( i < _numericFacets.length - 1)
			    title += " > "
	        }
	    }

            // Permalink bookmarks can be enabled by implementing a function 
            // SetBookmark(bookmark string, title string)  
            if ( typeof (SetBookmark) != undefined && typeof(SetBookmark) === "function") { 
                SetBookmark( PivotCollection.CXMLBaseNoProxy, currentViewerState, title);
            }
        };

    CleanName = function (uncleanName) {
        name = uncleanName.replace(/[^\w]/gi, '_');
        _nameMapping[name] = uncleanName;      
        return name;
    }

    //Events
    //Collection loading complete
    $.subscribe("/PivotViewer/Models/Collection/Loaded", function (event) {
        InitTileCollection();
    });

    //Image Collection loading complete
    $.subscribe("/PivotViewer/ImageController/Collection/Loaded", function (event) {
        InitPivotViewer();
        var filterPanel = $('.pv-filterpanel');
        filterPanel.append("<div class='pv-filterpanel-version'><a href=\"#pv-open-version\">About HTHL5 PivotViewer</a></div>");
        filterPanel.append("<div id=\"pv-open-version\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>Version: " + $(PivotViewer)[0].Version + "</p><p>The sources are available on <a href=\"https://github.com/openlink/html5pivotviewer\" target=\"_blank\">github</a></p></div></div>");
    });

    //Item selected - show the info panel
    $.subscribe("/PivotViewer/Views/Item/Selected", function (evt) {

        if (evt.id === undefined || evt.id === null || evt.id === "") {
            DeselectInfoPanel();
            _selectedItem = "";
            if (_currentView == 2)
                _views[_currentView].Selected(_selectedItem.Id); 
	    // Update the bookmark
            UpdateBookmark ();
            return;
        }

        //if (evt.length > 0) {
        var selectedItem = GetItem(evt.id);
        if (selectedItem != null) {
            var alternate = true;
            $('.pv-infopanel-heading').empty();
            $('.pv-infopanel-heading').append("<a href=\"" + selectedItem.Href + "\" target=\"_blank\">" + selectedItem.Name + "</a></div>");
            var infopanelDetails = $('.pv-infopanel-details');
            infopanelDetails.empty();
            if (selectedItem.Description != undefined && selectedItem.Description.length > 0) {
                infopanelDetails.append("<div class='pv-infopanel-detail-description' style='height:100px;'>" + selectedItem.Description + "</div><div class='pv-infopanel-detail-description-more'>More</div>");
            }
            // nav arrows...
            if (selectedItem.Id == _filterItems[0].Id && selectedItem == _filterItems[_filterItems.length - 1]) {
                $('.pv-infopanel-controls-navright').hide();
                $('.pv-infopanel-controls-navrightdisabled').show();
                $('.pv-infopanel-controls-navleft').hide();
                $('.pv-infopanel-controls-navleftdisabled').show();
            } else if (selectedItem.Id == _filterItems[0].Id) {
                $('.pv-infopanel-controls-navleft').hide();
                $('.pv-infopanel-controls-navleftdisabled').show();
                $('.pv-infopanel-controls-navright').show();
                $('.pv-infopanel-controls-navrightdisabled').hide();
            } else if (selectedItem.Id == _filterItems[_filterItems.length - 1].Id) {
                $('.pv-infopanel-controls-navright').hide();
                $('.pv-infopanel-controls-navrightdisabled').show();
                $('.pv-infopanel-controls-navleft').show();
                $('.pv-infopanel-controls-navleftdisabled').hide();
            } else {
                $('.pv-infopanel-controls-navright').show();
                $('.pv-infopanel-controls-navrightdisabled').hide();
                $('.pv-infopanel-controls-navleft').show();
                $('.pv-infopanel-controls-navleftdisabled').hide();
            }

            var detailDOM = [];
            var detailDOMIndex = 0;
            for (var i = 0; i < selectedItem.Facets.length; i++) {
                //check for IsMetaDataVisible
                var IsMetaDataVisible = false;
                var IsFilterVisible = false;
                for (var j = 0; j < PivotCollection.FacetCategories.length; j++) {
                    if (PivotCollection.FacetCategories[j].Name == selectedItem.Facets[i].Name && PivotCollection.FacetCategories[j].IsMetaDataVisible) {
                        IsMetaDataVisible = true;
                        IsFilterVisible = PivotCollection.FacetCategories[j].IsFilterVisible;
                        break;
                    }
                }

                if (IsMetaDataVisible) {
                    detailDOM[detailDOMIndex] = "<div class='pv-infopanel-detail " + (alternate ? "detail-dark" : "detail-light") + "'><div class='pv-infopanel-detail-item detail-item-title' pv-detail-item-title='" + selectedItem.Facets[i].Name + "'>" + selectedItem.Facets[i].Name + "</div>";
                    for (var j = 0; j < selectedItem.Facets[i].FacetValues.length; j++) {
                        detailDOM[detailDOMIndex] += "<div pv-detail-item-value='" + selectedItem.Facets[i].FacetValues[j].Value + "' class='pv-infopanel-detail-item detail-item-value" + (IsFilterVisible ? " detail-item-value-filter" : "") + "'>";
                        if (selectedItem.Facets[i].FacetValues[j].Href != null)
                            detailDOM[detailDOMIndex] += "<a class='detail-item-link' href='" + selectedItem.Facets[i].FacetValues[j].Href + "'>" + selectedItem.Facets[i].FacetValues[j].Value + "</a>";
                        else
                            detailDOM[detailDOMIndex] += selectedItem.Facets[i].FacetValues[j].Value;
                        detailDOM[detailDOMIndex] += "</div>";
                    }
                    detailDOM[detailDOMIndex] += "</div>";
                    detailDOMIndex++;
                    alternate = !alternate;
                }
            }
            if (selectedItem.Links.length > 0) {
                $('.pv-infopanel-related').empty();
                for (var k = 0; k < selectedItem.Links.length; k++) {
                    $('.pv-infopanel-related').append("<a href='" + selectedItem.Links[k].Href + "'>" + selectedItem.Links[k].Name + "</a><br>");
                }
            }
            infopanelDetails.append(detailDOM.join(''));
            $('.pv-infopanel').fadeIn();
            infopanelDetails.css('height', ($('.pv-infopanel').height() - ($('.pv-infopanel-controls').height() + $('.pv-infopanel-heading').height() + $('.pv-infopanel-copyright').height() + $('.pv-infopanel-related').height()) - 20) + 'px');
            _selectedItem = selectedItem;
            _selectedItemBkt = evt.bkt;

            if (_currentView == 2)
                _views[_currentView].Selected(_selectedItem.Id); 
            if (_currentView == 3) 
                _views[_currentView].RedrawMarkers(_selectedItem.Id); 

	    // Update the bookmark
            UpdateBookmark ();

            return;
        }

    });

    //Filter the facet list
    $.subscribe("/PivotViewer/Views/Item/Filtered", function (evt) {
        if (evt == undefined || evt == null)
            return;

        // If the facet used for the sort is the same as the facet that the filter is 
        // changing on then clear all the other values?
        // This is only the case when comming from drill down in the graph view.
        if (evt.ClearFacetFilters == true) {
            for (var i = 0, _iLen = PivotCollection.FacetCategories.length; i < _iLen; i++) {
                if (PivotCollection.FacetCategories[i].Name == evt.Facet && 
                    (PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.String ||
                    PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.DateTime)) {
                    var checkedValues = $('.pv-facet-facetitem[itemfacet="' + CleanName(evt.Facet) + '"]')
                    for (var j = 0; j < checkedValues.length; j++) {
                        $(checkedValues[j]).prop('checked', false);
                    }
                }
            }
        }

        for (var i = 0, _iLen = PivotCollection.FacetCategories.length; i < _iLen; i++) {
            if (PivotCollection.FacetCategories[i].Name == evt.Facet && 
                (PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.String ||
                PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.DateTime)) {

                if (evt.Values) {
	            for ( var j = 0; j < evt.Values.length; j++) {
                        var cb = $(PivotViewer.Utils.EscapeMetaChars("#pv-facet-item-" + CleanName(evt.Facet) + "__" + CleanName(evt.Values[j])) + " input");
                        cb.prop('checked', true);
                        FacetItemClick(cb[0]);
                    }
                } else {
                    var cb = $(PivotViewer.Utils.EscapeMetaChars("#pv-facet-item-" + CleanName(evt.Facet) + "__" + CleanName(evt.Item)) + " input");
                    cb.prop('checked', true);
                    FacetItemClick(cb[0]);
                }
            }
            if (PivotCollection.FacetCategories[i].Name == evt.Facet && 
                PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.Number) {
                var s = $('#pv-filterpanel-numericslider-' + PivotViewer.Utils.EscapeMetaChars(evt.Facet));
                FacetSliderDrag(s, evt.Item, evt.MaxRange);
            }
        }
    });

    //Trigger a bookmark update
    $.subscribe("/PivotViewer/Views/Item/Updated", function () {
        UpdateBookmark ();
    });
 
    //Changing to grid view
    $.subscribe("/PivotViewer/Views/ChangeTo/Grid", function (evt) {
        var selectedTile = "";
        for ( t = 0; t < _tiles.length; t ++ ) {
            if (_tiles[t].facetItem == evt.Item) {
               selectedTile = _tiles[t];
               break;
            }
        }
        if (selectedTile)
             $.publish("/PivotViewer/Views/Canvas/Click", [{ x: selectedTile._locations[selectedTile.selectedLoc].destinationx + selectedTile.destinationwidth/2, y: selectedTile._locations[selectedTile.selectedLoc].destinationy + selectedTile.destinationheight/2}]);
    });

    $.subscribe("/PivotViewer/Views/Update/GridSelection", function (evt) {
        _views[0].handleSelection(evt.selectedItem, evt.selectedTile); 
    });

    AttachEventHandlers = function () {
        //Event Handlers
        //View click
        $('.pv-toolbarpanel-view').on('click', function (e) {
            var viewId = this.id.substring(this.id.lastIndexOf('-') + 1, this.id.length);
            if (viewId != null)
                SelectView(parseInt(viewId), false);
        });
        //Sort change
        $('.pv-toolbarpanel-sort').on('change', function (e) {
	    _currentSort = $('.pv-toolbarpanel-sort option:selected').attr('label');
            Debug.Log('sort change _currentSort ' + _currentSort );
            FilterCollection(false);
        });
        //Facet sort
        $('.pv-filterpanel-accordion-facet-sort').on('click', function (e) {
            var sortDiv = $(this);
            var sortText = sortDiv.text();
            var facetName = sortDiv.parent().prev().children('a').text();
            var customSort = sortDiv.attr("customSort");
            if (sortText == "Sort: A-Z")
                $(this).text("Sort: Quantity");
            else if (sortText == "Sort: Quantity" && customSort == undefined)
                $(this).text("Sort: A-Z");
            else if (sortText == "Sort: Quantity")
                $(this).text("Sort: " + customSort);
            else
                $(this).text("Sort: A-Z");

            SortFacetItems(facetName);
        });
        //Facet item checkbox click
        $('.pv-facet-facetitem').on('click', function (e) {
            FacetItemClick(this);
        });
        //Facet item label click
        $('.pv-facet-facetitem-label').on('click', function (e) {
            var cb = $(this).prev();
            var checked = $(this.parentElement.parentElement).find(':checked');

            if (cb.prop('checked') == true && checked.length <= 1)
                cb.prop('checked', false);
            else
                cb.prop('checked', true);

            for (var i = checked.length - 1; i > -1; i -= 1) {
                if (checked[i].getAttribute('itemvalue') != cb[0].getAttribute('itemvalue'))
                    checked[i].checked = false;
            }
            FacetItemClick(cb[0]);
        });
        //Facet clear all click
        $('.pv-filterpanel-clearall').on('click', function (e) {
            //deselect all String Facets
            var checked = $('.pv-facet-facetitem:checked');
            for (var i = 0; i < checked.length; i++) {
                $(checked[i]).prop('checked', false);
            }
            //Reset all Numeric Facets
            var sliders = $('.pv-filterpanel-numericslider');
            for (var i = 0; i < sliders.length; i++) {
                var slider = $(sliders[i]);
                var thisMin = slider.slider('option', 'min'),
                    thisMax = slider.slider('option', 'max');
                slider.slider('values', 0, thisMin);
                slider.slider('values', 1, thisMax);
                slider.prev().prev().html('&nbsp;');
            }
            //Clear search box
            $('.pv-filterpanel-search').val('');
            //turn off clear buttons
            $('.pv-filterpanel-accordion-heading-clear').css('visibility', 'hidden');
            FilterCollection(false);
        });
        //Facet clear click
        $('.pv-filterpanel-accordion-heading-clear').on('click', function (e) {
            //Get facet type
            var facetType = this.attributes['facetType'].value;
	    if (facetType == "DateTime") {
                //get selected items in current group
                var checked = $(this.parentElement).next().find('.pv-facet-facetitem:checked');
                for (var i = 0; i < checked.length; i++) {
                    $(checked[i]).prop('checked', false);
                }
            } else if (facetType == "String") {
                //get selected items in current group
                var checked = $(this.parentElement).next().find('.pv-facet-facetitem:checked');
                for (var i = 0; i < checked.length; i++) {
                    $(checked[i]).prop('checked', false);
                }
            } else if (facetType == "Number") {
                //reset range
                var slider = $(this.parentElement).next().find('.pv-filterpanel-numericslider');
                var thisMin = slider.slider('option', 'min'),
                    thisMax = slider.slider('option', 'max');
                slider.slider('values', 0, thisMin);
                slider.slider('values', 1, thisMax);
                slider.prev().prev().html('&nbsp;');
            }
            FilterCollection(false);
            $(this).css('visibility', 'hidden');
        });
        //Numeric facet type slider drag
        $('.ui-slider-range').on('mousedown', function (e) {
            //drag it
        });
        //Info panel
        $('.pv-infopanel-details').on('click', '.detail-item-value-filter', function (e) {
            $.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: $(this).parent().children().attr('pv-detail-item-title'), Item: this.getAttribute('pv-detail-item-value'), Values: null, ClearFacetFilters: true }]);
            return false;
        });
        $('.pv-infopanel-details').on('click', '.pv-infopanel-detail-description-more', function (e) {
            var that = $(this);
            var details = $(this).prev();
            if (that.text() == "More") {
                details.css('height', '');
                $(this).text('Less');
            } else {
                details.css('height', '100px');
                $(this).text('More');
            }
        });
        $('.pv-infopanel-controls-navleft').on('click', function (e) {
          for (var i = 0; i < _filterItems.length; i++) {
              if (_filterItems[i].Id == _selectedItem.Id && _filterItems[i].Bucket == _selectedItemBkt){
                  if (i >= 0)
                      $.publish("/PivotViewer/Views/Item/Selected", [{id: _filterItems[i - 1].Id, bkt: _filterItems[i - 1].Bucket}]);
                      //jch need to move the images
                      if (_currentView == 0 || _currentView == 1) { 
                          for (var j = 0; j < _tiles.length; j++) {
                              if (_tiles[j].facetItem.Id == _filterItems[i - 1].Id) {
                                    _tiles[j].Selected(true);
                                    selectedCol = _views[_currentView].GetSelectedCol(_tiles[j], _filterItems[i - 1].Bucket);
                                    selectedRow = _views[_currentView].GetSelectedRow(_tiles[j], _filterItems[i - 1].Bucket);
                                    _views[_currentView].CentreOnSelectedTile(selectedCol, selectedRow);
                              } else {
                                    _tiles[j].Selected(false);
                              }
                          }
                      }
                  break;
              }
          }
        });
        $('.pv-infopanel-controls-navright').on('click', function (e) {
          for (var i = 0; i < _filterItems.length; i++) {
              if (_filterItems[i].Id == _selectedItem.Id && _filterItems[i].Bucket == _selectedItemBkt){
                  if (i < _filterItems.length) {
                      $.publish("/PivotViewer/Views/Item/Selected", [{id: _filterItems[i + 1].Id, bkt: _filterItems[i + 1].Bucket}]);
                      //jch need to move the images
                      if (_currentView == 0 || _currentView == 1) { 
                          for (var j = 0; j < _tiles.length; j++) {
                              if (_tiles[j].facetItem.Id == _filterItems[i + 1].Id) {
                                    _tiles[j].Selected(true);
                                    selectedCol = _views[_currentView].GetSelectedCol(_tiles[j], _filterItems[i + 1].Bucket);
                                    selectedRow = _views[_currentView].GetSelectedRow(_tiles[j], _filterItems[i + 1].Bucket);
                                    _views[_currentView].CentreOnSelectedTile(selectedCol, selectedRow);
                              } else {
                                    _tiles[j].Selected(false);
                              }
                          }
                      }
                  }
                  break;
              }
          }
        });
        //Search
        $('.pv-filterpanel-search').on('keyup', function (e) {
            var found = false;
            var foundAlready = [];
            var autocomplete = $('.pv-filterpanel-search-autocomplete');
            var filterRef = FilterCollection;
            var selectRef = SelectStringFacetItem;
            autocomplete.empty();

            //Esc
            if (e.keyCode == 27) {
                $(e.target).blur(); //remove focus
                return;
            }

            for (var i = 0, _iLen = _wordWheelItems.length; i < _iLen; i++) {
                var wwi = _wordWheelItems[i].Value.toLowerCase();
                if (wwi.indexOf(e.target.value.toLowerCase()) >= 0) {
                    if ($.inArray(wwi, foundAlready) == -1) {
                        foundAlready.push(wwi);
                        //Add to autocomplete
                        autocomplete.append('<span facet="' + _wordWheelItems[i].Facet + '">' + _wordWheelItems[i].Value + '</span>');

                        if (e.keyCode == 13) {
                            SelectStringFacetItem(
                                CleanName(_wordWheelItems[i].Facet),
                                CleanName(_wordWheelItems[i].Value)
                            );
                            found = true;
                        }
                    }
                }
            }

            $('.pv-filterpanel-search-autocomplete > span').on('mousedown', function (e) {
                e.preventDefault();
                $('.pv-filterpanel-search').val(e.target.textContent);
                $('.pv-filterpanel-search-autocomplete').hide();
                selectRef(
                    CleanName(e.target.attributes[0].value),
                    CleanName(e.target.textContent)
                );
                filterRef();
            });

            if (foundAlready.length > 0)
                autocomplete.show();

            if (found)
                FilterCollection(false);
        });
        $('.pv-filterpanel-search').on('blur', function (e) {
            e.target.value = '';
            $('.pv-filterpanel-search-autocomplete').hide();
        });
        //Shared canvas events
        var canvas = $('.pv-viewarea-canvas');
        //mouseup event - used to detect item selection, or drag end
        canvas.on('mouseup', function (evt) {
            var offset = $(this).offset();
            var offsetX = evt.clientX - offset.left;
            var offsetY = evt.clientY - offset.top;
            if (!_mouseMove || (_mouseMove.x == 0 && _mouseMove.y == 0))
                $.publish("/PivotViewer/Views/Canvas/Click", [{ x: offsetX, y: offsetY}]);
            _mouseDrag = null;
            _mouseMove = false;
        });
        //mouseout event
        canvas.on('mouseout', function (evt) {
            _mouseDrag = null;
            _mouseMove = false;
        });
        //mousedown - used to detect drag
        canvas.on('mousedown', function (evt) {
            var offset = $(this).offset();
            var offsetX = evt.clientX - offset.left;
            var offsetY = evt.clientY - offset.top;
            _mouseDrag = { x: offsetX, y: offsetY };
        });
        //mousemove - used to detect drag
        canvas.on('mousemove', function (evt) {
            var offset = $(this).offset();
            var offsetX = evt.clientX - offset.left;
            var offsetY = evt.clientY - offset.top;

            if (_mouseDrag == null)
                $.publish("/PivotViewer/Views/Canvas/Hover", [{ x: offsetX, y: offsetY}]);
            else {
                _mouseMove = { x: offsetX - _mouseDrag.x, y: offsetY - _mouseDrag.y };
                _mouseDrag = { x: offsetX, y: offsetY };
                $.publish("/PivotViewer/Views/Canvas/Drag", [_mouseMove]);
            }
        });
        //mousewheel - used for zoom
        canvas.on('mousewheel', function (evt, delta) {
            var offset = $(this).offset();
            var offsetX = evt.clientX - offset.left;
            var offsetY = evt.clientY - offset.top;
            //zoom easing different from filter
            _tileController.SetQuarticEasingOut();

            //Draw helper
            _tileController.DrawHelpers([{ x: offsetX, y: offsetY}]);

            var value = $('.pv-toolbarpanel-zoomslider').slider('option', 'value');
            if (delta > 0) { value = (value < 5 ) ? 5 : value + 5; }
            else if (delta < 0) { value = value - 5; }
 
            // Ensure that its limited between 0 and 20
            value = Math.max(0, Math.min(100, value));
            $('.pv-toolbarpanel-zoomslider').slider('option', 'value', value);
        });
        //http://stackoverflow.com/questions/6458571/javascript-zoom-and-rotate-using-gesturechange-and-gestureend
        canvas.on("touchstart", function (evt) {
            var orig = evt.originalEvent;

            var offset = $(this).offset();
            var offsetX = orig.touches[0].pageX - offset.left;
            var offsetY = orig.touches[0].pageY - offset.top;
            _mouseDrag = { x: offsetX, y: offsetY };
        });
        canvas.on("touchmove", function (evt) {
            try {
                var orig = evt.originalEvent;
                evt.preventDefault();

                //pinch
                if (orig.touches.length > 1) {
                    evt.preventDefault();
                    //Get centre of pinch
                    var minX = 10000000, minY = 10000000;
                    var maxX = 0, maxY = 0;
                    var helpers = [];
                    for (var i = 0; i < orig.touches.length; i++) {
                        helpers.push({ x: orig.touches[i].pageX, y: orig.touches[i].pageY });
                        if (orig.touches[i].pageX < minX)
                            minX = orig.touches[i].pageX;
                        if (orig.touches[i].pageX > maxX)
                            maxX = orig.touches[i].pageX;
                        if (orig.touches[i].pageY < minY)
                            minY = orig.touches[i].pageY;
                        if (orig.touches[i].pageY > maxY)
                            maxY = orig.touches[i].pageY;
                    }
                    var avgX = (minX + maxX) / 2;
                    var avgY = (minY + maxY) / 2;
                    //var delta = orig.scale < 1 ? -1 : 1;
                    _tileController.SetLinearEasingBoth();

                    helpers.push({ x: avgX, y: avgY });
                    _tileController.DrawHelpers(helpers);
                    _tileController.DrawHelperText("Scale: " + orig.scale);
                    $.publish("/PivotViewer/Views/Canvas/Zoom", [{ x: avgX, y: avgY, scale: orig.scale}]);
                    //$.publish("/PivotViewer/Views/Canvas/Zoom", [{ x: avgX, y: avgY, delta: orig.scale - 1}]);
                    return;
                } else {
                    var offset = $(this).offset();
                    var offsetX = orig.touches[0].pageX - offset.left;
                    var offsetY = orig.touches[0].pageY - offset.top;

                    _mouseMove = { x: offsetX - _mouseDrag.x, y: offsetY - _mouseDrag.y };
                    _mouseDrag = { x: offsetX, y: offsetY };
                    $.publish("/PivotViewer/Views/Canvas/Drag", [_mouseMove]);
                }
            }
            catch (err) { Debug.Log(err.message); }
        });
        canvas.on("touchend", function (evt) {
            var orig = evt.originalEvent;
            //Item selected
            if (orig.touches.length == 1 && _mouseDrag == null) {
                var offset = $(this).offset();
                var offsetX = orig.touches[0].pageX - offset.left;
                var offsetY = orig.touches[0].pageY - offset.top;
                if (!_mouseMove || (_mouseMove.x == 0 && _mouseMove.y == 0))
                    $.publish("/PivotViewer/Views/Canvas/Click", [{ x: offsetX, y: offsetY}]);
            }
            _mouseDrag = null;
            _mouseMove = false;
            return;
        });
    };

    FacetItemClick = function (checkbox) {
        if ($(checkbox).prop('checked') == true) {
            $(checkbox.parentElement.parentElement.parentElement).prev().find('.pv-filterpanel-accordion-heading-clear').css('visibility', 'visible');
        }
        FilterCollection(false);
    };

    FacetSliderDrag = function (slider, min, max) {
        var thisWrapped = $(slider);
        var thisMin = thisWrapped.slider('option', 'min'),
                    thisMax = thisWrapped.slider('option', 'max');
        // Treat no info as like 0 (bit dodgy fix later)
        if (min == "(no info)") min = 0;
        if (min > thisMin || max < thisMax) {
            thisWrapped.parent().find('.pv-filterpanel-numericslider-range-val').text(min + " - " + max);
            thisWrapped.slider('values', 0, min);
            thisWrapped.slider('values', 1, max);
            thisWrapped.parent().parent().prev().find('.pv-filterpanel-accordion-heading-clear').css('visibility', 'visible');
        }
        else if (min == thisMin && max == thisMax)
            thisWrapped.parent().parent().prev().find('.pv-filterpanel-accordion-heading-clear').css('visibility', 'hidden');
        FilterCollection(false);
    };

    //Constructor
    $.fn.PivotViewer = function (method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.PivotViewer');
        }
    };
})(jQuery);
