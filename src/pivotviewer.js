//PivotViewer jQuery extension
(function ($) {
    var _views = [],
        _facetItemTotals = [], //used to store the counts of all the string facets - used when resetting the filters
        _facetNumericItemTotals = [], //used to store the counts of all the numeric facets - used when resetting the filters
        _wordWheelItems = [], //used for quick access to search values
        _currentView = 0,
        _loadingInterval,
        _tileController,
        _tiles = [],
        _imageController,
        _mouseDrag = null,
        _mouseMove = null,
        _viewerState = { View: null, Facet: null, Filters: [] },
        _self = null,
        _silderPrev = 0,
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
                        //Filters
                        else {
                            var filter = { Facet: splitItem[0], Predicates: [] };
                            var filters = splitItem[1].split('_');
                            for (var j = 0, _jLen = filters.length; j < _jLen; j++) {
                                var pred = filters[j].split('.');
                                if (pred.length == 2)
                                    filter.Predicates.push({ Operator: pred[0], Value: pred[1] });
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

        //select first view
        if (_viewerState.View != null)
            SelectView(_viewerState.View, true);
        else
            SelectView(0, true);

        //Begin tile animation
        _tileController.BeginAnimation();
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
        var thatRef = _silderPrev;
        $('.pv-toolbarpanel-zoomslider').slider({
            max: 10,
            slide: function (event, ui) {
                var val = ui.value < thatRef ? ui.value * -1 : ui.value;
                $.publish("/PivotViewer/Views/Canvas/Zoom", [{ x: 201, y: 0, delta: 0.75 * val}]);
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

        //filter panel
        var filterPanel = $('.pv-filterpanel');
        filterPanel.append("<div class='pv-filterpanel-clearall'>Clear All</div>")
            .append("<input class='pv-filterpanel-search' type='text' placeholder='Search...' /><div class='pv-filterpanel-search-autocomplete'></div>")
            .css('height', mainPanelHeight - 13 + 'px');
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
        $('.pv-infopanel-controls').append("<div><div class='pv-infopanel-controls-navleft'></div><div class='pv-infopanel-controls-navbar'></div><div class='pv-infopanel-controls-navright'></div></div>");
        infoPanel.append("<div class='pv-infopanel-heading'></div>");
        infoPanel.append("<div class='pv-infopanel-details'></div>");
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
                        var currrentItemFacet = currentItem.Facets[j];
                        //If the facet is found then add it's values to the list
                        if (currrentItemFacet.Name == currentFacetCategory.Name) {
                            for (var k = 0; k < currrentItemFacet.FacetValues.length; k++) {
                                if (currentFacetCategory.Type == PivotViewer.Models.FacetType.String) {
                                    var found = false;
                                    var itemId = PivotViewer.Utils.EscapeItemId("pv-facet-item-" + currrentItemFacet.Name + "__" + currrentItemFacet.FacetValues[k].Value);
                                    for (var n = _facetItemTotals.length - 1; n > -1; n -= 1) {
                                        if (_facetItemTotals[n].itemId == itemId) {
                                            _facetItemTotals[n].count += 1;
                                            found = true;
                                            break;
                                        }
                                    }

                                    if (!found)
                                        _facetItemTotals.push({ itemId: itemId, itemValue: currrentItemFacet.FacetValues[k].Value, facet: currrentItemFacet.Name, count: 1 });
                                }
                                else if (currentFacetCategory.Type == PivotViewer.Models.FacetType.Number) {
                                    //collect all the numbers to update the histogram
                                    var numFound = false;
                                    for (var n = 0; n < _facetNumericItemTotals.length; n++) {
                                        if (_facetNumericItemTotals[n].Facet == currentItem.Facets[j].Name) {
                                            _facetNumericItemTotals[n].Values.push(currrentItemFacet.FacetValues[k].Value);
                                            numFound = true;
                                            break;
                                        }
                                    }
                                    if (!numFound)
                                        _facetNumericItemTotals.push({ Facet: currrentItemFacet.Name, Values: [currrentItemFacet.FacetValues[k].Value] });
                                }
                            }
                            hasValue = true;
                        }
                    }

                    if (!hasValue) {
                        //Create (no info) value
                        var found = false;
                        var itemId = PivotViewer.Utils.EscapeItemId("pv-facet-item-" + currentFacetCategory.Name + "__(no info)");
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
                        var currrentItemFacet = currentItem.Facets[j];
                        //If the facet is found then add it's values to the list
                        if (currrentItemFacet.Name == currentFacetCategory.Name) {
                            for (var k = 0; k < currrentItemFacet.FacetValues.length; k++) {
                                if (currentFacetCategory.Type == PivotViewer.Models.FacetType.String) {
                                    _wordWheelItems.push({ Facet: currrentItemFacet.Name, Value: currrentItemFacet.FacetValues[k].Value });
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
                facets[i + 1] = "<h3><a href='#'>";
                facets[i + 1] += PivotCollection.FacetCategories[i].Name;
                facets[i + 1] += "</a><div class='pv-filterpanel-accordion-heading-clear' facetType='" + PivotCollection.FacetCategories[i].Type + "'>&nbsp;</div></h3>";
                facets[i + 1] += "<div id='pv-cat-" + PivotViewer.Utils.EscapeItemId(PivotCollection.FacetCategories[i].Name) + "'>";

                //Create facet controls
                if (PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.String) {
                    //Sort
                    if (PivotCollection.FacetCategories[i].CustomSort != undefined || PivotCollection.FacetCategories[i].CustomSort != null)
                        facets[i + 1] += "<span class='pv-filterpanel-accordion-facet-sort' customSort='" + PivotCollection.FacetCategories[i].CustomSort.Name + "'>Sort: " + PivotCollection.FacetCategories[i].CustomSort.Name + "</span>";
                    else
                        facets[i + 1] += "<span class='pv-filterpanel-accordion-facet-sort'>Sort: A-Z</span>";
                    facets[i + 1] += CreateStringFacet(PivotCollection.FacetCategories[i].Name);
                }
                else if (PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.Number)
                    facets[i + 1] += "<div id='pv-filterpanel-category-numberitem-" + PivotCollection.FacetCategories[i].Name.replace(/\s+/gi, "|") + "'></div>";

                facets[i + 1] += "</div>";
                //Add to sort
                sort[i] = "<option value='" + PivotViewer.Utils.EscapeItemId(PivotCollection.FacetCategories[i].Name) + "' label='" + PivotCollection.FacetCategories[i].Name + "'>" + PivotCollection.FacetCategories[i].Name + "</option>";
            }
        }
        facets[facets.length] = "</div>";
        $(".pv-filterpanel").append(facets.join(''));
        //Default sorts
        for (var i = 0; i < PivotCollection.FacetCategories.length; i++) {
            if (PivotCollection.FacetCategories[i].IsFilterVisible)
                SortFacetItems(PivotCollection.FacetCategories[i].Name);
        }
        $(".pv-filterpanel-accordion").css('height', ($(".pv-filterpanel").height() - $(".pv-filterpanel-search").height() - 50) + "px");
        $(".pv-filterpanel-accordion").accordion({
            fillSpace: true
        });
        $('.pv-toolbarpanel-sortcontrols').append('<select class="pv-toolbarpanel-sort">' + sort.join('') + '</select>');

        //setup numeric facets
        for (var i = 0; i < _facetNumericItemTotals.length; i++)
            CreateNumberFacet(PivotViewer.Utils.EscapeItemId(_facetNumericItemTotals[i].Facet), _facetNumericItemTotals[i].Values);
    };

    /// Create the individual controls for the facet
    CreateStringFacet = function (facetName) {
        var facetControls = ["<ul class='pv-filterpanel-accordion-facet-list'>"];
        for (var i = 0; i < _facetItemTotals.length; i++) {
            if (_facetItemTotals[i].facet == facetName) {
                facetControls[i + 1] = "<li class='pv-filterpanel-accordion-facet-list-item'  id='" + _facetItemTotals[i].itemId + "'>";
                facetControls[i + 1] += "<input itemvalue='" + _facetItemTotals[i].itemValue.replace(/\s+/gi, "|") + "' itemfacet='" + facetName.replace(/\s+/gi, "|") + "' class='pv-facet-facetitem' type='checkbox' />"
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
                FilterCollection();
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

        //init the views interfaces
        for (var i = 0; i < _views.length; i++) {
            try {
                if (_views[i] instanceof PivotViewer.Views.IPivotViewerView) {
                    _views[i].Setup(width, height, offsetX, offsetY, _tileController.GetTileRaio());
                    viewPanel.append("<div class='pv-viewpanel-view' id='pv-viewpanel-view-" + i + "'>" + _views[i].GetUI() + "</div>");
                    $('.pv-toolbarpanel-viewcontrols').append("<div class='pv-toolbarpanel-view' id='pv-toolbarpanel-view-" + i + "' title='" + _views[i].GetViewName() + "'><img id='pv-viewpanel-view-" + i + "-image' src='" + _views[i].GetButtonImage() + "' alt='" + _views[i].GetViewName() + "' /></div>");
                } else {
                    alert('View does not inherit from PivotViewer.Views.IPivotViewerView');
                }
            } catch (ex) { alert(ex.Message); }
        }
    };

    /// Set the currrent view
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
        _views[viewNumber].Activate();
        _views[viewNumber].init = init;

        _currentView = viewNumber;
        FilterCollection();
    };

    ///Sorts the facet items based on a specific sort type
    SortFacetItems = function (facetName) {
        //get facets
        var facetList = $("#pv-cat-" + PivotViewer.Utils.EscapeMetaChars(PivotViewer.Utils.EscapeItemId(facetName)) + " ul");
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
        if (_viewerState.Facet != null)
            $('.pv-toolbarpanel-sort').val(_viewerState.Facet).attr('selected', 'selected');

        //Filters
        for (var i = 0, _iLen = _viewerState.Filters.length; i < _iLen; i++) {
            for (var j = 0, _jLen = _viewerState.Filters[i].Predicates.length; j < _jLen; j++) {
                var operator = _viewerState.Filters[i].Predicates[j].Operator;
                if (operator == "GT" || operator == "GE" || operator == "LT" || operator == "LE") {
                    var s = $('#pv-filterpanel-numericslider-' + PivotViewer.Utils.EscapeItemId(_viewerState.Filters[i].Facet));
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
                        PivotViewer.Utils.EscapeItemId(_viewerState.Filters[i].Facet),
                        PivotViewer.Utils.EscapeItemId(_viewerState.Filters[i].Predicates[j].Value)
                    );
                } else if (operator == "NT") {
                    //No Info string facet
                    SelectStringFacetItem(
                        PivotViewer.Utils.EscapeItemId(_viewerState.Filters[i].Facet),
                        "(no|info)"
                    );
                }
            }
        }
    };

    //Selects a string facet
    SelectStringFacetItem = function (facet, value) {
        var cb = $('.pv-facet-facetitem[itemfacet="' + facet + '"][itemvalue="' + value + '"]');
        cb.attr('checked', 'checked');
        cb.parent().parent().parent().prev().find('.pv-filterpanel-accordion-heading-clear').css('visibility', 'visible');
    };

    /// Filters the collection of items and updates the views
    FilterCollection = function () {
        var filterItems = [];
        var foundItemsCount = [];
        var selectedFacets = [];
        var sort = $('.pv-toolbarpanel-sort option:selected').text();

        //Filter String facet items
        var checked = $('.pv-facet-facetitem:checked');

        //Turn off clear all button
        $('.pv-filterpanel-clearall').css('visibility', 'hidden');

        //Filter String facet items
        //create an array of selected facets and values to compare to all items.
        var stringFacets = [];
        for (var i = 0; i < checked.length; i++) {
            var facet = $(checked[i]).attr('itemfacet').replace(/\|/gi, " ");
            var facetValue = $(checked[i]).attr('itemvalue').replace(/\|/gi, " ");

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
                var numbFacet = $('#pv-filterpanel-category-numberitem-' + PivotViewer.Utils.EscapeMetaChars(PivotCollection.FacetCategories[i].Name.replace(/\s+/gi, "|")));
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

            for (var j = 0, _jLen = PivotCollection.Items[i].Facets.length; j < _jLen; j++) {
                //String facets
                for (var k = 0, _kLen = stringFacets.length; k < _kLen; k++) {
                    if (PivotCollection.Items[i].Facets[j].Name == stringFacets[k].facet) {
                        for (var m = 0, _mLen = PivotCollection.Items[i].Facets[j].FacetValues.length; m < _mLen; m++) {
                            for (var n = 0, _nLen = stringFacets[k].facetValue.length; n < _nLen; n++) {
                                if (PivotCollection.Items[i].Facets[j].FacetValues[m].Value == stringFacets[k].facetValue[n])
                                    foundCount++;
                            }
                        }
                    }
                }
            }

            //if the item was not in the string filters then exit early
            if (foundCount != stringFacets.length)
                continue;

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

            //Date facets

            //Item is in all filters
            filterItems.push(PivotCollection.Items[i].Id);

            if ((stringFacets.length + numericFacets.length) > 0)
                $('.pv-filterpanel-clearall').css('visibility', 'visible');
        }


        $('.pv-viewpanel-view').hide();
        $('#pv-viewpanel-view-' + _currentView).show();
        //Filter the facet counts and remove empty facets
        FilterFacets(filterItems, selectedFacets);

        //Update breadcrumb
        UpdateBreadcrumbNavigation(stringFacets, numericFacets);

        //Filter view
        _tileController.SetCircularEasingBoth();
        _views[_currentView].Filter(_tiles, filterItems, sort);
        $.publish("/PivotViewer/Views/Item/Deselected", null);
        DeselectInfoPanel();
    };

    /// Filters the facet panel items and updates the counts
    FilterFacets = function (filterItems, selectedFacets) {
        //if all the items are visible then update all
        if (filterItems.length == PivotCollection.Items.length) {
            //String facets
            for (var i = _facetItemTotals.length - 1; i > -1; i -= 1) {
                var item = $('#' + PivotViewer.Utils.EscapeMetaChars(_facetItemTotals[i].itemId));
                item.show();
                item.find('span').last().text(_facetItemTotals[i].count);
            }
            //Numeric facets
            //re-create the histograms
            for (var i = 0; i < _facetNumericItemTotals.length; i++)
                CreateNumberFacet(PivotViewer.Utils.EscapeItemId(_facetNumericItemTotals[i].Facet), _facetNumericItemTotals[i].Values);
            return;
        }

        var filterList = []; //used for string facets
        var numericFilterList = []; //used for number facets

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
                                            var filteredItem = { item: '#' + PivotViewer.Utils.EscapeMetaChars(PivotViewer.Utils.EscapeItemId('pv-facet-item-' + item.Facets[j].Name + '__' + item.Facets[j].FacetValues[k].Value)), count: 1 };
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
                        var filteredItem = { item: '#' + PivotViewer.Utils.EscapeMetaChars(PivotViewer.Utils.EscapeItemId('pv-facet-item-' + PivotCollection.FacetCategories[m].Name + '__(no info)')), count: 1 };
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
            CreateNumberFacet(PivotViewer.Utils.EscapeItemId(numericFilterList[i].Facet), numericFilterList[i].Values);
    };

    UpdateBreadcrumbNavigation = function (stringFacets, numericFacets) {
        var bc = $('.pv-toolbarpanel-facetbreadcrumb');
        bc.empty();

        if (stringFacets.length == 0)
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
        $('.pv-infopanel-heading').text("");
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

    //Events
    //Collection loading complete
    $.subscribe("/PivotViewer/Models/Collection/Loaded", function (event) {
        InitTileCollection();
    });

    //Image Collection loading complete
    $.subscribe("/PivotViewer/ImageController/Collection/Loaded", function (event) {
        InitPivotViewer();
    });

    //Item selected - show the info panel
    $.subscribe("/PivotViewer/Views/Item/Selected", function (evt) {

        if (evt == undefined || evt == null) {
            DeselectInfoPanel();
            return;
        }

        //if (evt.length > 0) {
        var selectedItem = GetItem(evt);
        if (selectedItem != null) {
            var alternate = true;
            $('.pv-infopanel-heading').text(selectedItem.Name);
            var infopanelDetails = $('.pv-infopanel-details');
            infopanelDetails.empty();
            if (selectedItem.Description != undefined && selectedItem.Description.length > 0) {
                infopanelDetails.append("<div class='pv-infopanel-detail-description' style='height:100px;'>" + selectedItem.Description + "</div><div class='pv-infopanel-detail-description-more'>More</div>");
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
                    detailDOM[detailDOMIndex] = "<div class='pv-infopanel-detail " + (alternate ? "detail-dark" : "detail-light") + "'><div class='pv-infopanel-detail-item detail-item-title'>" + selectedItem.Facets[i].Name + "</div>";
                    for (var j = 0; j < selectedItem.Facets[i].FacetValues.length; j++) {
                        detailDOM[detailDOMIndex] += "<div class='pv-infopanel-detail-item detail-item-value" + (IsFilterVisible ? " detail-item-value-filter" : "") + "'>";
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
            infopanelDetails.append(detailDOM.join(''));
            $('.pv-infopanel').fadeIn();
            infopanelDetails.css('height', ($('.pv-infopanel').height() - ($('.pv-infopanel-controls').height() + $('.pv-infopanel-heading').height()) - 20) + 'px');
            return;
        }

    });

    //Filter the facet list
    $.subscribe("/PivotViewer/Views/Item/Filtered", function (evt) {
        if (evt == undefined || evt == null)
            return;

        var cb = $(PivotViewer.Utils.EscapeMetaChars(PivotViewer.Utils.EscapeItemId("#pv-facet-item-" + evt.Facet + "__" + evt.Item)) + " input");
        cb.attr('checked', 'checked');
        FacetItemClick(cb[0]);
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
            FilterCollection();
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

            if (cb.attr('checked') == 'checked' && checked.length <= 1)
                cb.removeAttr('checked');
            else
                cb.attr('checked', 'checked');

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
                $(checked[i]).removeAttr('checked');
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
            FilterCollection();
        });
        //Facet clear click
        $('.pv-filterpanel-accordion-heading-clear').on('click', function (e) {
            //Get facet type
            var facetType = this.attributes['facetType'].value;
            if (facetType == "String") {
                //get selected items in current group
                var checked = $(this.parentElement).next().find('.pv-facet-facetitem:checked');
                for (var i = 0; i < checked.length; i++) {
                    $(checked[i]).removeAttr('checked');
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
            FilterCollection();
            $(this).css('visibility', 'hidden');
        });
        //Numeric facet type slider drag
        $('.ui-slider-range').on('mousedown', function (e) {
            //drag it
        });
        //Info panel
        $('.pv-infopanel-details').on('click', '.detail-item-value-filter', function (e) {
            $.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: $(this).parent().children().first().text(), Item: $(this).text()}]);
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
        //Saerch
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
                                PivotViewer.Utils.EscapeItemId(_wordWheelItems[i].Facet),
                                PivotViewer.Utils.EscapeItemId(_wordWheelItems[i].Value)
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
                    PivotViewer.Utils.EscapeItemId(e.target.attributes[0].value),
                    PivotViewer.Utils.EscapeItemId(e.target.textContent)
                );
                filterRef();
            });

            if (foundAlready.length > 0)
                autocomplete.show();

            if (found)
                FilterCollection();
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
            //send zoom event
            $.publish("/PivotViewer/Views/Canvas/Zoom", [{ x: offsetX, y: offsetY, delta: delta}]);
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
        if ($(checkbox).attr('checked') == 'checked') {
            $(checkbox.parentElement.parentElement.parentElement).prev().find('.pv-filterpanel-accordion-heading-clear').css('visibility', 'visible');
        }
        FilterCollection();
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