//PivotViewer jQuery extension
(function ($) {
	var _views = [],
		_facetItemTotals = [],
		_currentView = 0,
		_loadingInterval,
		_deepZoomController,
		_deepZoomTiles = [],
		_mouseDrag = null,
		_mouseMove = null;

	var defaults = {
		CXML: "",
		PivotCollection: new PivotViewer.Models.Collection(),
		_self: null
	};
	var methods = {
		init: function (options) {
			defaults._self = this;
			defaults.CXML = options.CXML;
			defaults._self.addClass('pv-wrapper');
			InitPreloader();

			if (options.Loader == undefined)
				throw "Collection loader is undefined.";
			if (options.Loader instanceof PivotViewer.Models.Loaders.ICollectionLoader)
				options.Loader.LoadCollection(defaults.PivotCollection);
			else
				throw "Collection loader does not inherit from PivotViewer.Models.Loaders.ICollectionLoader.";
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
		defaults._self.append("<div class='pv-loading'><img src='Content/images/loading.gif' alt='Loading' /><span>Loading...</span></div>");
		$('.pv-loading').css('top', ($('.pv-wrapper').height() / 2) - 33 + 'px');
		$('.pv-loading').css('left', ($('.pv-wrapper').width() / 2) - 43 + 'px');
	};

	InitDeepZoom = function () {
		InitUI();
		//init DZ Controller
		var DZXML = defaults.CXML.substring(0, defaults.CXML.lastIndexOf('/') + 1) + defaults.PivotCollection.ImageBase;
		var canvasContext = $('.pv-viewarea-canvas')[0].getContext("2d");
		_deepZoomController = new PivotViewer.Views.DeepZoomController();
		_deepZoomTiles = _deepZoomController.Init(defaults.PivotCollection.Items, DZXML, canvasContext);
		_deepZoomController.BeginAnimation();
	};

	InitPivotViewer = function () {
		CreateFacetList();
		CreateViews();
		AttachEventHandlers();

		//loading completed
		$('.pv-loading').remove();

		//select first view
		SelectView(0);
	};

	InitUI = function () {
		//toolbar
		var toolbarPanel = "<div class='pv-toolbarpanel'>";

		var brandImage = defaults.PivotCollection.BrandImage;
		if (brandImage.length > 0)
			toolbarPanel += "<img class='pv-toolbarpanel-brandimage' src='" + brandImage + "'></img>";
		toolbarPanel += "<span class='pv-toolbarpanel-name'>" + defaults.PivotCollection.CollectionName + "</span>";
		toolbarPanel += "<div class='pv-toolbarpanel-zoomcontrols'><div class='pv-toolbarpanel-zoomslider'></div></div>";
		toolbarPanel += "<div class='pv-toolbarpanel-viewcontrols'></div>";
		toolbarPanel += "<div class='pv-toolbarpanel-sortcontrols'></div>";
		toolbarPanel += "</div>";
		defaults._self.append(toolbarPanel);

		//main panel
		defaults._self.append("<div class='pv-mainpanel'></div>");
		var mainPanelHeight = $('.pv-wrapper').height() - $('.pv-toolbarpanel').height() - 6;
		$('.pv-mainpanel').css('height', mainPanelHeight + 'px');
		$('.pv-mainpanel').append("<div class='pv-filterpanel'></div>");
		$('.pv-mainpanel').append("<div class='pv-viewpanel'><canvas class='pv-viewarea-canvas' width='" + defaults._self.width() + "' height='" + mainPanelHeight + "px'></canvas></div>");
		$('.pv-mainpanel').append("<div class='pv-infopanel'></div>");

		//filter panel
		$('.pv-filterpanel').append("<div class='pv-filterpanel-clearall'>Clear All</div>");
		$('.pv-filterpanel').append("<input class='pv-filterpanel-search' type='text' placeholder='Search...' />");
		$('.pv-filterpanel').css('height', mainPanelHeight - 13 + 'px');
		$('.pv-filterpanel-search').css('width', $('.pv-filterpanel').width() - 12 + 'px');
		//view panel
		//$('.pv-viewpanel').css('left', $('.pv-filterpanel').width() + 28 + 'px');
		//info panel
		$('.pv-infopanel').css('left', (($('.pv-mainpanel').offset().left + $('.pv-mainpanel').width()) - 205) + 'px');
		$('.pv-infopanel').css('height', mainPanelHeight - 28 + 'px');
		$('.pv-infopanel').append("<div class='pv-infopanel-controls'></div>");
		$('.pv-infopanel-controls').append("<div><div class='pv-infopanel-controls-navleft'></div><div class='pv-infopanel-controls-navbar'></div><div class='pv-infopanel-controls-navright'></div></div>");
		$('.pv-infopanel').append("<div class='pv-infopanel-heading'></div>");
		$('.pv-infopanel').append("<div class='pv-infopanel-details'></div>");
		$('.pv-infopanel').hide();
	};

	//Creates facet list for the filter panel
	//Adds the facets into the filter select list
	CreateFacetList = function () {
		//build list of all facets - used to get id references of all facet items and store the counts
		for (var i = 0; i < defaults.PivotCollection.Items.length; i++) {
			for (var m = 0; m < defaults.PivotCollection.FacetCategories.length; m++) {
				if (defaults.PivotCollection.FacetCategories[m].IsFilterVisible) {
					var hasValue = false;
					for (var j = 0; j < defaults.PivotCollection.Items[i].Facets.length; j++) {
						//If the facet is found then add it's values to the list
						if (defaults.PivotCollection.Items[i].Facets[j].Name == defaults.PivotCollection.FacetCategories[m].Name) {
							for (var k = 0; k < defaults.PivotCollection.Items[i].Facets[j].FacetValues.length; k++) {
								var found = false;
								var itemId = PivotViewer.Utils.EscapeItemId("pv-facet-item-" + defaults.PivotCollection.Items[i].Facets[j].Name + "__" + defaults.PivotCollection.Items[i].Facets[j].FacetValues[k].Value);
								for (var n = _facetItemTotals.length - 1; n > -1; n -= 1) {
									if (_facetItemTotals[n].itemId == itemId) {
										_facetItemTotals[n].count += 1;
										found = true;
										break;
									}
								}

								if (!found)
									_facetItemTotals.push({ itemId: itemId, itemValue: defaults.PivotCollection.Items[i].Facets[j].FacetValues[k].Value, facet: defaults.PivotCollection.Items[i].Facets[j].Name, count: 1 });
							}
							hasValue = true;
						}
					}

					if (!hasValue) {
						//Create (no info) value
						var found = false;
						var itemId = PivotViewer.Utils.EscapeItemId("pv-facet-item-" + defaults.PivotCollection.FacetCategories[m].Name + "__(no info)");
						for (var n = _facetItemTotals.length - 1; n > -1; n -= 1) {
							if (_facetItemTotals[n].itemId == itemId) {
								_facetItemTotals[n].count += 1;
								found = true;
								break;
							}
						}

						if (!found)
							_facetItemTotals.push({ itemId: itemId, itemValue: "(no info)", facet: defaults.PivotCollection.FacetCategories[m].Name, count: 1 });
					}
				}
			}
		}

		var facets = ["<div class='pv-filterpanel-accordion'>"];
		var sort = [];
		for (var i = 0; i < defaults.PivotCollection.FacetCategories.length; i++) {
			if (defaults.PivotCollection.FacetCategories[i].IsFilterVisible) {
				facets[i + 1] = "<h3><a href='#'>";
				facets[i + 1] += defaults.PivotCollection.FacetCategories[i].Name;
				facets[i + 1] += "</a><div class='pv-filterpanel-accordion-heading-clear'>&nbsp;</div></h3>";
				facets[i + 1] += "<div id='pv-cat-" + PivotViewer.Utils.EscapeItemId(defaults.PivotCollection.FacetCategories[i].Name) + "'>";

				//Sort
				if (defaults.PivotCollection.FacetCategories[i].CustomSort != undefined || defaults.PivotCollection.FacetCategories[i].CustomSort != null)
					facets[i + 1] += "<span class='pv-filterpanel-accordion-facet-sort' customSort='" + defaults.PivotCollection.FacetCategories[i].CustomSort.Name + "'>Sort: " + defaults.PivotCollection.FacetCategories[i].CustomSort.Name + "</span>";
				else
					facets[i + 1] += "<span class='pv-filterpanel-accordion-facet-sort'>Sort: A-Z</span>";

				facets[i + 1] += CreateFacet(defaults.PivotCollection.FacetCategories[i].Name);
				facets[i + 1] += "</div>";
				//Add to sort
				sort[i] = "<option value='" + PivotViewer.Utils.EscapeItemId(defaults.PivotCollection.FacetCategories[i].Name) + "' label='" + defaults.PivotCollection.FacetCategories[i].Name + "'>" + defaults.PivotCollection.FacetCategories[i].Name + "</option>";
			}
		}
		facets[facets.length] = "</div>";
		$(".pv-filterpanel").append(facets.join(''));
		//Default sorts
		for (var i = 0; i < defaults.PivotCollection.FacetCategories.length; i++) {
			if (defaults.PivotCollection.FacetCategories[i].IsFilterVisible)
				SortFacetItems(defaults.PivotCollection.FacetCategories[i].Name);
		}
		$(".pv-filterpanel-accordion").css('height', ($(".pv-filterpanel").height() - $(".pv-filterpanel-search").height() - 40) + "px");
		$(".pv-filterpanel-accordion").accordion({
			fillSpace: true
		});
		$('.pv-toolbarpanel-sortcontrols').append('<select class="pv-toolbarpanel-sort">' + sort.join('') + '</select>');
	};

	/// Create the individual controls for the facet
	CreateFacet = function (facetName) {
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

	/// Creates and initialises the views - including plug-in views
	/// Init shared canvas
	CreateViews = function () {

		var viewPanel = $('.pv-viewpanel');
		var width = defaults._self.width();
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
					_views[i].Setup(width, height, offsetX, offsetY, _deepZoomController.GetTileRaio());
					viewPanel.append("<div class='pv-viewpanel-view' id='pv-viewpanel-view-" + i + "'>" + _views[i].GetUI() + "</div>");
					$('.pv-toolbarpanel-viewcontrols').append("<div class='pv-toolbarpanel-view' id='pv-toolbarpanel-view-" + i + "' title='" + _views[i].GetViewName() + "'><img id='pv-viewpanel-view-" + i + "-image' src='" + _views[i].GetButtonImage() + "' alt='" + _views[i].GetViewName() + "' /></div>");
				} else {
					alert('View does not inherit from PivotViewer.Views.IPivotViewerView');
				}
			} catch (ex) { alert(ex.Message); }
		}
	};

	/// Set the currrent view
	SelectView = function (viewNumber) {
		//Deselect all views
		for (var i = 0; i < _views.length; i++) {
			if (viewNumber != i) {
				$('#pv-viewpanel-view-' + i + '-image').attr('src', _views[i].GetButtonImage());
				_views[i].Deactivate();
			}
		}
		$('#pv-viewpanel-view-' + viewNumber + '-image').attr('src', _views[viewNumber].GetButtonImageSelected());
		_views[viewNumber].Activate();

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
			var facet = defaults.PivotCollection.GetFacetCategoryByName(facetName);
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

	/// Filters the collection of items and updates the views
	FilterCollection = function () {
		var checked = $('.pv-facet-facetitem:checked');
		var filterItems = [];
		var foundItemsCount = [];
		var selectedFacets = [];
		var sort = $('.pv-toolbarpanel-sort option:selected').text();

		if (checked.length == 0) {
			for (i in defaults.PivotCollection.Items) {
				filterItems.push(defaults.PivotCollection.Items[i].Id);
			}
			$('.pv-filterpanel-clearall').css('visibility', 'hidden');
			$('.pv-filterpanel-accordion-heading-clear').css('visibility', 'hidden');
		} else {
			for (var i = 0; i < checked.length; i++) {
				var facet = $(checked[i]).attr('itemfacet').replace(/\|/gi, " ");
				var facetValue = $(checked[i]).attr('itemvalue').replace(/\|/gi, " ");
				var foundItems = GetItemIds(facet, facetValue);

				for (var j = 0; j < foundItems.length; j++) {
					var found = false;
					for (var k = 0; k < foundItemsCount.length; k++) {
						if (foundItems[j] == foundItemsCount[k].Id) {
							foundItemsCount[k].count++;
							found = true;
						}
					}
					if (!found)
						foundItemsCount.push({ Id: foundItems[j], count: 1 });
				}

				//Add to selected facets list - this is then used to filter the facet list counts
				if ($.inArray(facet, selectedFacets) < 0)
					selectedFacets.push(facet);

			}

			for (var i = 0; i < foundItemsCount.length; i++) {
				if (foundItemsCount[i].count == selectedFacets.length)
					filterItems.push(foundItemsCount[i].Id);
			}

			$('.pv-filterpanel-clearall').css('visibility', 'visible');
		}
		$('.pv-viewpanel-view').hide();
		$('#pv-viewpanel-view-' + _currentView).show();
		//Filter the facet counts and remove empty facets
		FilterFacets(filterItems, selectedFacets);

		//Filter view
		_deepZoomController.SetCircularEasingBoth();
		_views[_currentView].Filter(_deepZoomTiles, filterItems, sort);
		$.publish("/PivotViewer/Views/Item/Deselected", null);
		DeselectInfoPanel();
	};

	/// Filters the facet panel items and updates the counts
	FilterFacets = function (filterItems, selectedFacets) {
		//if all the items are visible then update all
		if (filterItems.length == defaults.PivotCollection.Items.length) {
			for (var i = _facetItemTotals.length - 1; i > -1; i -= 1) {
				var item = $('#' + PivotViewer.Utils.EscapeMetaChars(_facetItemTotals[i].itemId));
				item.show();
				item.find('span').last().text(_facetItemTotals[i].count);
			}
			return;
		}

		var filterList = [];
		//Create list of items to display
		for (var i = filterItems.length - 1; i > -1; i -= 1) {
			var item = defaults.PivotCollection.GetItemById(filterItems[i]);
			for (var m = 0; m < defaults.PivotCollection.FacetCategories.length; m++) {
				if (defaults.PivotCollection.FacetCategories[m].IsFilterVisible) {
					//If it's a visible filter then determine if it has a value
					var hasValue = false;
					for (var j = item.Facets.length - 1; j > -1; j -= 1) {
						if (item.Facets[j].Name == defaults.PivotCollection.FacetCategories[m].Name) {
							//If not in the selected facet list then determine count
							if ($.inArray(item.Facets[j].Name, selectedFacets) < 0) {
								if (defaults.PivotCollection.GetFacetCategoryByName(item.Facets[j].Name).IsFilterVisible) {
									for (var k = item.Facets[j].FacetValues.length - 1; k > -1; k -= 1) {
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
								}
							}
							hasValue = true;
						}
					}

					if (!hasValue) {
						//increment count for (no info)
						var filteredItem = { item: '#' + PivotViewer.Utils.EscapeMetaChars(PivotViewer.Utils.EscapeItemId('pv-facet-item-' + defaults.PivotCollection.FacetCategories[m].Name + '__(no info)')), count: 1 };
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
		for (var i = 0; i < defaults.PivotCollection.Items.length; i++) {
			var found = false;
			for (var j = 0; j < defaults.PivotCollection.Items[i].Facets.length; j++) {
				if (defaults.PivotCollection.Items[i].Facets[j].Name == facetName) {
					for (var k = 0; k < defaults.PivotCollection.Items[i].Facets[j].FacetValues.length; k++) {
						if (value == defaults.PivotCollection.Items[i].Facets[j].FacetValues[k].Value)
							foundId.push(defaults.PivotCollection.Items[i].Id);
					}
					found = true;
				}
			}
			if (!found && value == "(no info)") {
				foundId.push(defaults.PivotCollection.Items[i].Id);
			}
		}
		return foundId;
	};

	GetItem = function (itemId) {
		for (var i = 0; i < defaults.PivotCollection.Items.length; i++) {
			if (defaults.PivotCollection.Items[i].Id == itemId)
				return defaults.PivotCollection.Items[i];
		}
		return null;
	};

	//Events
	//Collection loading complete
	$.subscribe("/PivotViewer/Models/Collection/Loaded", function (event) {
		InitDeepZoom();
	});

	//DeepZoom Collection loading complete
	$.subscribe("/PivotViewer/DeepZoom/Collection/Loaded", function (event) {
		InitPivotViewer();
	});

	//Item selected - show the info panel
	$.subscribe("/PivotViewer/Views/Item/Selected", function (evt) {

		if (evt == undefined || evt == null)
			return;

		if (evt.length > 0) {
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
					for (var j = 0; j < defaults.PivotCollection.FacetCategories.length; j++) {
						if (defaults.PivotCollection.FacetCategories[j].Name == selectedItem.Facets[i].Name && defaults.PivotCollection.FacetCategories[j].IsMetaDataVisible) {
							IsMetaDataVisible = true;
							IsFilterVisible = defaults.PivotCollection.FacetCategories[j].IsFilterVisible;
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
		}
		DeselectInfoPanel();
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
				SelectView(parseInt(viewId));
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
			//deselect all items
			var checked = $('.pv-facet-facetitem:checked');
			for (var i = 0; i < checked.length; i++) {
				$(checked[i]).removeAttr('checked');
			}
			FilterCollection();
		});
		//Facet clear click
		$('.pv-filterpanel-accordion-heading-clear').on('click', function (e) {
			//get selected items in current group
			var checked = $(this.parentElement).next().find('.pv-facet-facetitem:checked');
			for (var i = 0; i < checked.length; i++) {
				$(checked[i]).removeAttr('checked');
			}
			FilterCollection();
			$(this).css('visibility', 'hidden');
		});
		//Info panel
		$('.pv-infopanel-details').on('click', '.detail-item-value-filter', function (e) {
			$.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: $(this).parent().children().first().text(), Item: $(this).text()}]);
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
			_deepZoomController.SetQuarticEasingOut();

			//Draw helper
			_deepZoomController.DrawHelpers([{ x: offsetX, y: offsetY}]);
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
					_deepZoomController.SetLinearEasingBoth();

					helpers.push({ x: avgX, y: avgY });
					_deepZoomController.DrawHelpers(helpers);
					_deepZoomController.DrawHelperText("Scale: " + orig.scale);
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