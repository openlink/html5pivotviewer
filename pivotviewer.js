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

///PivotViewer
var PivotViewer = PivotViewer || {};
PivotViewer.Version="v0.9.56-f73755a";
PivotViewer.Models = {};
PivotViewer.Models.Loaders = {};
PivotViewer.Utils = {};
PivotViewer.Views = {};
//Debug
var Debug = Debug || {};
/*	
http://higginsforpresident.net/js/static/jq.pubsub.js
jQuery pub/sub plugin by Peter Higgins (dante@dojotoolkit.org)
Loosely based on Dojo publish/subscribe API, limited in scope. Rewritten blindly.
Original is (c) Dojo Foundation 2004-2010. Released under either AFL or new BSD, see:
http://dojofoundation.org/license for more information.
*/
; (function (d) {

	// the topic/subscription hash
	var cache = {};

	d.publish = function (/* String */topic, /* Array? */args) {
		// summary: 
		//		Publish some data on a named topic.
		// topic: String
		//		The channel to publish on
		// args: Array?
		//		The data to publish. Each array item is converted into an ordered
		//		arguments on the subscribed functions. 
		//
		// example:
		//		Publish stuff on '/some/topic'. Anything subscribed will be called
		//		with a function signature like: function(a,b,c){ ... }
		//
		//	|		$.publish("/some/topic", ["a","b","c"]);
		cache[topic] && d.each(cache[topic], function () {
			this.apply(d, args || []);
		});
	};

	d.subscribe = function (/* String */topic, /* Function */callback) {
		// summary:
		//		Register a callback on a named topic.
		// topic: String
		//		The channel to subscribe to
		// callback: Function
		//		The handler event. Anytime something is $.publish'ed on a 
		//		subscribed channel, the callback will be called with the
		//		published array as ordered arguments.
		//
		// returns: Array
		//		A handle which can be used to unsubscribe this particular subscription.
		//	
		// example:
		//	|	$.subscribe("/some/topic", function(a, b, c){ /* handle data */ });
		//
		if (!cache[topic]) {
			cache[topic] = [];
		}
		cache[topic].push(callback);
		return [topic, callback]; // Array
	};

	d.unsubscribe = function (/* Array */handle) {
		// summary:
		//		Disconnect a subscribed function for a topic.
		// handle: Array
		//		The return value from a $.subscribe call.
		// example:
		//	|	var handle = $.subscribe("/something", function(){});
		//	|	$.unsubscribe(handle);

		var t = handle[0];
		cache[t] && d.each(cache[t], function (idx) {
			if (this == handle[1]) {
				cache[t].splice(idx, 1);
			}
		});
	};

})(jQuery);//
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

Debug.Log = function (message) {
    if (window.console && window.console.log && typeof debug != "undefined" && debug == true) {
        window.console.log(message);
    }
};

//Gets the next 'frame' from the browser (there are several methods) and controls the frame rate
window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

PivotViewer.Utils.EscapeMetaChars = function (jQuerySelector) {
    //!"#$%&'()*+,./:;<=>?@[\]^`{|}~
    return jQuerySelector
            .replace(/\|/gi, "\\|")
            .replace(/\//gi, "\\/")
            .replace(/'/gi, "\\'")
            .replace(/,/gi, "\\,")
            .replace(/:/gi, "\\:")
            .replace(/\(/gi, "\\(")
            .replace(/\)/gi, "\\)")
            .replace(/\+/gi, "\\+")
            .replace(/\+/gi, "\\-")
            .replace(/\+/gi, "\\_")
            .replace(/\+/gi, "\\%");
};

PivotViewer.Utils.EscapeItemId = function (itemId) {
    return itemId
            .replace(/\s+/gi, "|")
            .replace(/'/gi, "")
            .replace(/\(/gi, "")
            .replace(/\)/gi, "")
            .replace(/\./gi, "");
};

PivotViewer.Utils.Now = function () {
    if (Date.now)
        return Date.now();
    else
        return (new Date().getTime());
};

// Provided the minimum number is < 1000000
PivotViewer.Utils.Min = function (values) {
    var min = 1000000;
    for (var i = 0, _iLen = values.length; i < _iLen; i++)
        min = min > values[i] ? values[i] : min;
    return min;
}

// Provided the maximum number is > -1000000
PivotViewer.Utils.Max = function (values) {
    var max = -1000000;
    for (var i = 0, _iLen = values.length; i < _iLen; i++)
        max = max < values[i] ? values[i] : max;
    return max;
}

PivotViewer.Utils.Histogram = function (values) {
    if (!values instanceof Array)
        return null;

    var min = PivotViewer.Utils.Min(values);
    var max = PivotViewer.Utils.Max(values);

    var bins = (Math.floor(Math.pow(2 * values.length, 1 / 3)) + 1) * 2;
    if (bins > 10)
        bins = 10;
    var stepSize = ((max + 1) - (min - 1)) / bins;

    var histogram = [];
    for (var i = 0; i < bins; i++) {
        var minRange = min + (i * stepSize);
        var maxRange = min + ((i + 1) * stepSize);
        histogram.push([]);
        for (var j = 0, _jLen = values.length; j < _jLen; j++) {
            if (minRange <= values[j] && maxRange > values[j])
                histogram[i].push(values[j]);
        }
    }
    return { Histogram: histogram, Min: min, Max: max, BinCount: bins };
};

// A simple class creation library.
// From Secrets of the JavaScript Ninja
// Inspired by base2 and Prototype
(function () {
    var initializing = false,
    // Determine if functions can be serialized
    fnTest = /xyz/.test(function () { xyz; }) ? /\b_super\b/ : /.*/;

    // Create a new Class that inherits from this class
    Object.subClass = function (prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var proto = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            proto[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function (name, fn) {
            return function () {
                var tmp = this._super;

                // Add a new ._super() method that is the same method
                // but on the super-class
                this._super = _super[name];

                // The method only need to be bound temporarily, so we
                // remove it when we're done executing
                var ret = fn.apply(this, arguments);
                this._super = tmp;

                return ret;
            };
        })(name, prop[name]) :
        prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if (!initializing && this.init)
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = proto;

        // Enforce the constructor to be what we expect
        Class.constructor = Class;

        // And make this class extendable
        Class.subClass = arguments.callee;

        return Class;
    };
})();
//
//  HTML5 PivotViewer
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

PivotViewer.Models.Collection = Object.subClass({
	init: function () {
		var xmlns = "http://schemas.microsoft.com/collection/metadata/2009",
		xmlnsp = "http://schemas.microsoft.com/livelabs/pivot/collection/2009";
		this.CollectionName = "";
		this.BrandImage = "";
		this.FacetCategories = [];
		this.Items = [];
		this.CXMLBase = "";
		this.ImageBase = "";
                this.CopyrightName = "";
                this.CopyrightHref = "";
	},
	GetItemById: function (Id) {
		for (var i = 0; i < this.Items.length; i++) {
			if (this.Items[i].Id == Id)
				return this.Items[i];
		}
		return null;
	},

	GetFacetCategoryByName: function (categoryName) {
		for (var i = 0; i < this.FacetCategories.length; i++) {
			if (this.FacetCategories[i].Name == categoryName)
				return this.FacetCategories[i];
		}
		return null;
	}
});

//PivotViewer.Models
PivotViewer.Models.FacetCategory = Object.subClass({
	init: function (Name, Format, Type, IsFilterVisible, IsMetaDataVisible, IsWordWheelVisible, CustomSort) {
		this.Name = Name;
		this.Format = Format;
		this.Type = Type != null && Type != undefined ? Type : PivotViewer.Models.FacetType.String;
		this.IsFilterVisible = IsFilterVisible != null && IsFilterVisible != undefined ? IsFilterVisible : true;
		this.IsMetaDataVisible = IsMetaDataVisible != null && IsMetaDataVisible != undefined ? IsMetaDataVisible : true;
		this.IsWordWheelVisible = IsWordWheelVisible != null && IsWordWheelVisible != undefined ? IsWordWheelVisible : true;
		this.CustomSort;
	}
});

PivotViewer.Models.FacetCategorySort = Object.subClass({
	init: function (Name) {
		this.Name = Name;
		this.SortValues = [];
	}
});

PivotViewer.Models.Item = Object.subClass({
	init: function (Img, Id, Href, Name) {
		this.Img = parseInt(Img),
		this.Id = Id,
		this.Href = Href,
		this.Name = Name,
		this.Description,
		this.Facets = [];
	}
});

PivotViewer.Models.Facet = Object.subClass({
	init: function (Name) {
		this.Name = Name;
		this.FacetValues = [];
	},
	AddFacetValue: function (facetValue) {
		this.FacetValues.push(facetValue);
	}
});

PivotViewer.Models.FacetValue = Object.subClass({
	init: function (Value) {
		this.Value = Value;
		this.Href = "";
	}
});

PivotViewer.Models.FacetType = {
	String: "String",
	LongString: "LongString",
	Number: "Number",
	DateTime: "DateTime",
	Link: "Link"
};
//
//  HTML5 PivotViewer
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

///  Collection loader interface - used so that different types of data sources can be used
PivotViewer.Models.Loaders.ICollectionLoader = Object.subClass({
    init: function () { },
    LoadCollection: function (collection) {
        if (!collection instanceof PivotViewer.Models.Collection) {
            throw "collection not an instance of PivotViewer.Models.Collection.";
        }
    }
});

//CXML loader
PivotViewer.Models.Loaders.CXMLLoader = PivotViewer.Models.Loaders.ICollectionLoader.subClass({
    init: function (CXMLUri, proxy) {
        this.CXMLUriNoProxy = CXMLUri;
        if (proxy)
            this.CXMLUri = proxy + CXMLUri;
        else 
            this.CXMLUri = CXMLUri;
    },
    LoadCollection: function (collection) {
        var collection = collection;
        this._super(collection);

        collection.CXMLBaseNoProxy = this.CXMLUriNoProxy;
        collection.CXMLBase = this.CXMLUri;

        $.ajax({
            type: "GET",
            url: this.CXMLUri,
            dataType: "xml",
            success: function (xml) {
                Debug.Log('CXML loaded');
                var collectionRoot = $(xml).find("Collection")[0];
                //get namespace local name
                var namespacePrefix = "P";

                if (collectionRoot == undefined) {
                    //Make sure throbber is removed else everyone thinks the app is still running
                    $('.pv-loading').remove();
 
                    //Throw an alert so the user knows something is wrong
                    var msg = '';
                    msg = msg + 'Error parsing CXML Collection\r\n\r\n';
                    msg = msg + '\r\nPivot Viewer cannot continue until this problem is resolved\r\r';
                    var t=setTimeout(function(){window.alert(msg)},1000)
                    throw "Error parsing CXML Collection";
                }

                for (var i = 0; i < collectionRoot.attributes.length; i++) {
                    if (collectionRoot.attributes[i].value == "http://schemas.microsoft.com/livelabs/pivot/collection/2009") {
                        namespacePrefix = collectionRoot.attributes[i].localName != undefined ? collectionRoot.attributes[i].localName : collectionRoot.attributes[i].baseName;
                        break;
                    }
                }
                collection.CollectionName = $(collectionRoot).attr("Name");
                collection.BrandImage = $(collectionRoot).attr(namespacePrefix + ":BrandImage") != undefined ? $(collectionRoot).attr(namespacePrefix + ":BrandImage") : "";

                //FacetCategory
                var facetCategories = $(xml).find("FacetCategory");
                for (var i = 0; i < facetCategories.length; i++) {
                    var facetElement = $(facetCategories[i]);

                    var facetCategory = new PivotViewer.Models.FacetCategory(
                    facetElement.attr("Name"),
                        facetElement.attr("Format"),
                        facetElement.attr("Type"),
                        facetElement.attr(namespacePrefix + ":IsFilterVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsFilterVisible").toLowerCase() == "true" ? true : false) : true,
                        facetElement.attr(namespacePrefix + ":IsMetaDataVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsMetaDataVisible").toLowerCase() == "true" ? true : false) : true,
                        facetElement.attr(namespacePrefix + ":IsWordWheelVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsWordWheelVisible").toLowerCase() == "true" ? true : false) : false
                        );

                    //Add custom sort order
                    var sortOrder = facetElement.find(namespacePrefix + "\\:SortOrder");
                    var sortValues = sortOrder.find(namespacePrefix + "\\:SortValue");

                    if (sortOrder.length == 0) {
                        //webkit doesn't seem to like the P namespace
                        sortOrder = facetElement.find("SortOrder");
                        sortValues = sortOrder.find("SortValue");
                    }

                    if (sortOrder.length == 1) {
                        var customSort = new PivotViewer.Models.FacetCategorySort(sortOrder.attr("Name"));
                        for (var j = 0; j < sortValues.length; j++) {
                            customSort.SortValues.push($(sortValues[j]).attr("Value"));
                        }
                        facetCategory.CustomSort = customSort;
                    }
                    collection.FacetCategories.push(facetCategory);
                }
                //Items
                var facetItems = $(xml).find("Items");
                if (facetItems.length == 1) {
                    collection.ImageBase = $(facetItems[0]).attr("ImgBase");
                    var facetItem = $(facetItems[0]).find("Item");
                    if (facetItem.length == 0) {
                        //Make sure throbber is removed else everyone thinks the app is still running
                        $('.pv-loading').remove();
 
                        //Throw an alert so the user knows something is wrong
                        var msg = '';
                        msg = msg + 'There are no items in the CXML Collection\r\n\r\n';
                        var t=setTimeout(function(){window.alert(msg)},1000)
                    } else {
                        for (var i = 0; i < facetItem.length; i++) {
                            var item = new PivotViewer.Models.Item(
                                $(facetItem[i]).attr("Img").replace("#", ""),
                                $(facetItem[i]).attr("Id"),
                                $(facetItem[i]).attr("Href"),
                                $(facetItem[i]).attr("Name")
                            );
                            var description = $(facetItem[i]).find("Description");
                            if (description.length == 1 && description[0].childNodes.length)
                                item.Description = description[0].childNodes[0].nodeValue;
                            var facets = $(facetItem[i]).find("Facet");
                            for (var j = 0; j < facets.length; j++) {
                                var f = new PivotViewer.Models.Facet(
                                    $(facets[j]).attr("Name")
                                );
               
                                var facetChildren = $(facets[j]).children();
                                for (var k = 0; k < facetChildren.length; k++) {
                                    if (facetChildren[k].nodeType == 1) {
                                        var v = $.trim($(facetChildren[k]).attr("Value"));
                                        if (v == null || v == "") {
                                            var fValue = new PivotViewer.Models.FacetValue($(facetChildren[k]).attr("Name"));
                                            fValue.Href = $(facetChildren[k]).attr("Href");
                                            f.AddFacetValue(fValue);
                                        } else {
                                            //convert strings to numbers so histogram can work
                                            if (facetChildren[k].nodeName == "Number") {
                                                var fValue = new PivotViewer.Models.FacetValue(parseFloat(v));
                                                f.AddFacetValue(fValue);
                                            } else {
                                                var fValue = new PivotViewer.Models.FacetValue(v);
                                                f.AddFacetValue(fValue);
                                            }
                                        }
                                    }
                                }
                                item.Facets.push(f);
                            }
                            collection.Items.push(item);
                        }
                    }
                }
                //Extensions
                var extension = $(xml).find("Extension");
                if (extension.length == 1) {
                    var collectionCopyright = $(extension[0]).find('d1p1\\:Copyright, Copyright');
                    if (collectionCopyright != undefined) { 
                        collection.CopyrightName = $(collectionCopyright[0]).attr("Name");
                        collection.CopyrightHref = $(collectionCopyright[0]).attr("Href");
                    }
                }

                $.publish("/PivotViewer/Models/Collection/Loaded", null);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //Make sure throbber is removed else everyone thinks the app is still running
                $('.pv-loading').remove();

                //Throw an alert so the user knows something is wrong
                var msg = '';
                msg = msg + 'Error loading CXML Collection\r\n\r\n';
                msg = msg + 'URL        : ' + this.url + '\r\n';
                msg = msg + 'Statuscode : ' + jqXHR.status + '\r\n';
                msg = msg + 'Details    : ' + errorThrown + '\r\n';
                msg = msg + '\r\nPivot Viewer cannot continue until this problem is resolved\r\r';
                var t=setTimeout(function(){window.alert(msg)},1000)
            }
        });
    }
});
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

///Views interface - all views must implement this
PivotViewer.Views.IPivotViewerView = Object.subClass({
	init: function () {
		this.isActive = false;
		this.init = true;
		this.selected = "";
		this.tiles = [];
	},
	Setup: function (width, height, offsetX, offsetY, tileMaxRatio) { },
	Filter: function (dzTiles, currentFilter, sortFacet) { },
	GetUI: function () { return ''; },
	GetButtonImage: function () { return ''; },
	GetButtonImageSelected: function () { return ''; },
	GetViewName: function () { return ''; },
	Activate: function () { this.isActive = true; },
	Deactivate: function () { this.isActive = false; }
});
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

PivotViewer.Views.TileBasedView = PivotViewer.Views.IPivotViewerView.subClass({
	OffsetTiles: function (offsetX, offsetY) {
		for (var i = 0; i < this.tiles.length; i++) {
			var filterindex = $.inArray(this.tiles[i].facetItem.Id, this.currentFilter);
			//set outer location for all tiles not in the filter
			if (filterindex >= 0) {
                               this.tiles[i]._locations[0].destinationx += offsetX;
                               this.tiles[i]._locations[0].destinationy += offsetY;
			}
		}
	},

	SetInitialTiles: function (dzTiles, canvasWidth, canvasHeight) {
		var initx = canvasWidth / 2;
		var inity = canvasHeight / 2;
		for (var i = 0; i < dzTiles.length; i++) {
			dzTiles[i]._locations[0].x = initx;
			dzTiles[i]._locations[0].y = inity;
			dzTiles[i].velocityx = 0;
			dzTiles[i].velocityy = 0;
			dzTiles[i]._locations[0].startx = initx;
			dzTiles[i]._locations[0].starty = inity;
			dzTiles[i]._locations[0].destinationx = 0;
			dzTiles[i]._locations[0].destinationy = 0;
			dzTiles[i].width = 1;
			dzTiles[i].height = 1;
		}
	},

	GetRowsAndColumns: function (canvasWidth, canvasHeight, tileMaxRatio, tileCount) {
		// look into creating a series of calcs that will try multiple times changing the gap
		var gap = 0.7;
		var a = tileMaxRatio * (tileCount - Math.pow(gap, 2));
		var b = (canvasHeight + (canvasWidth * tileMaxRatio)) * gap;
		var c = -1 * (canvasHeight * canvasWidth);
		var tileMaxWidth = ((-1 * b) + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		var tileHeight = Math.floor(tileMaxWidth * tileMaxRatio);
		var canvasRows = Math.ceil(canvasHeight / tileHeight);
		var canvasColumns = Math.floor(canvasWidth / tileMaxWidth);
                var paddingX = canvasWidth - (canvasColumns * tileMaxWidth);
		return { Rows: canvasRows, Columns: canvasColumns, TileMaxWidth: tileMaxWidth, TileHeight: tileHeight, PaddingX : paddingX };
	},

	SetOuterTileDestination: function (canvasWidth, canvasHeight, tile) {
		//http://mathworld.wolfram.com/Circle-LineIntersection.html
		//http://stackoverflow.com/questions/6091728/line-segment-circle-intersection
		//Get adjusted x and y
		// as x2 and y2 are the origin
		var dx = tile._locations[0].x - (canvasWidth / 2);
		var dy = tile._locations[0].y - (canvasHeight / 2);
		var M = dy / dx;
		var theta = Math.atan2(dy, dx)
		tile._locations[0].destinationx = canvasWidth * Math.cos(theta) + (canvasWidth / 2);
		tile._locations[0].destinationy = canvasHeight * Math.sin(theta) + (canvasHeight / 2);
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
                                                    for (var k = 0; k < filterValues.length; k++) {
                                                        if (filterValues[k].facet == field)
                                                             for (var l = 0; l < filterValues[k].facetValue.length; l++) {
                                                                 if ( x.facetItem.Facets[i].FacetValues[j].Value == filterValues[k].facetValue[l])  
					                             return primer(x.facetItem.Facets[i].FacetValues[j].Value);
                                                             }
                                                    }
                                                }
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
/// Grid view
///
PivotViewer.Views.GridView = PivotViewer.Views.TileBasedView.subClass({
    init: function () {
        this.Scale = 1;
        this._super();
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
    Filter: function (dzTiles, currentFilter, sortFacet, stringFacets) {
        var that = this;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Grid View Filtered: ' + currentFilter.length);

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

        this.init = false;
    },
    GetUI: function () {
        if (Modernizr.canvas)
            return "";
        else
            return "<div class='pv-viewpanel-unabletodisplay'><h2>Unfortunately this view is unavailable as your browser does not support this functionality.</h2>Please try again with one of the following supported browsers: IE 9+, Chrome 4+, Firefox 2+, Safari 3.1+, iOS Safari 3.2+, Opera 9+<br/><a href='http://caniuse.com/#feat=canvas'>http://caniuse.com/#feat=canvas</a></div>";
    },
    GetButtonImage: function () {
        return 'Content/images/GridView.png';
    },
    GetButtonImageSelected: function () {
        return 'Content/images/GridViewSelected.png';
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
/// Graph (histogram) View
///
PivotViewer.Views.GraphView = PivotViewer.Views.TileBasedView.subClass({
    init: function () {
        this._super();
        var that = this;
        this.buckets = [];
        this.Scale = 1;
        this.canvasHeightUIAdjusted = 0;
        this.titleSpace = 62;

        //Event Handlers
        $.subscribe("/PivotViewer/Views/Canvas/Click", function (evt) {
            if (!that.isActive)
                return;

            var selectedItem = null;
            var selectedTile = null;
            var selectedLoc = null;
            for (var i = 0; i < that.tiles.length; i++) {
	        var loc = that.tiles[i].Contains(evt.x, evt.y);
                if ( loc >= 0 ) {
                    selectedTile = that.tiles[i];
                    selectedItem = that.tiles[i].facetItem.Id;
                    selectedLoc = loc;
                } else {
                    that.tiles[i].Selected(false);
                }
            }
	    that.handleSelection (selectedItem, selectedTile, evt.x, selectedLoc);
	});

        $.subscribe("/PivotViewer/Views/Canvas/Hover", function (evt) {
            if (!that.isActive)
                return;
            $('.pv-viewarea-graphview-overlay-bucket').removeClass('graphview-bucket-hover');
            //determine bucket and select
            var bucketNumber = Math.floor((evt.x - that.offsetX) / that.columnWidth);
            var bucketDiv = $('#pv-viewarea-graphview-overlay-bucket-' + bucketNumber);
            bucketDiv.addClass('graphview-bucket-hover');
            //determine tile
            for (var i = 0; i < that.tiles.length; i++) {
	        var loc = that.tiles[i].Contains(evt.x, evt.y);
                if (loc >= 0) {
                    that.tiles[i].Selected(true);
                    that.tiles[i].selectedLoc = loc;
                }
                else
                    that.tiles[i].Selected(false);
            }
        });

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
            var newHeight = that.height * that.Scale;

            //if trying to zoom out too far, reset to min
            if (newWidth < that.width || that.Scale == 1) {
                that.currentOffsetX = that.offsetX;
                that.currentOffsetY = that.offsetY;
                that.currentWidth = that.width;
                that.currentHeight = that.height;
                that.canvasHeightUIAdjusted = that.height - that.offsetY - that.titleSpace;
                that.columnWidth = (that.width - that.offsetX) / that.buckets.length;
                that.Scale = 1;
                $('.pv-viewarea-graphview-overlay div').fadeIn('slow');
            } else {
                //adjust position to base scale - then scale out to new scale
                //Move the scaled position to the mouse location
                that.currentOffsetX = evt.x - (((evt.x - that.currentOffsetX) / oldScale) * that.Scale);

                //Work out the scaled position of evt.y and then calc the difference between the actual evt.y
                var scaledPositionY = ((evt.y - that.currentOffsetY) / oldScale) * that.Scale;
                that.currentOffsetY = evt.y - scaledPositionY;
                that.canvasHeightUIAdjusted = newHeight - (((that.offsetY + that.titleSpace)/oldScale) * that.Scale);

                that.currentWidth = newWidth;
                that.currentHeight = newHeight;
                that.columnWidth = newWidth / that.buckets.length;
                $('.pv-viewarea-graphview-overlay div').fadeOut('slow');
            }

            that.rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.canvasHeightUIAdjusted, that.maxRatio, that.bigCount);
            if (that.rowscols.TileHeight < 10 ) that.rowscols.TileHeight = 10;
            that.SetVisibleTileGraphPositions(that.rowscols, that.currentOffsetX, that.currentOffsetY, true, true);

            //deselect tiles if zooming back to min size
            if (that.Scale == 1 && oldScale != 1) {
                for (var i = 0; i < that.tiles.length; i++) {
                    that.tiles[i].Selected(false);
                    that.tiles[i].selectedLoc = 0;
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
            if (dragY > 0 && (that.currentOffsetY + that.canvasHeightUIAdjusted) > that.currentHeight + that.offsetY) {
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
        this.rowscols = null;
        this.bigCount = 0;
    },
    Filter: function (dzTiles, currentFilter, sortFacet, stringFacets) {
        var that = this;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Graph View Filtered: ' + currentFilter.length);

        this.sortFacet = sortFacet;
        this.tiles = dzTiles;

        //Sort
        this.tiles = dzTiles.sort(this.SortBy(this.sortFacet, false, function (a) {
            return $.isNumeric(a) ? a : a.toUpperCase();
        }, stringFacets));
        this.currentFilter = currentFilter;

        this.buckets = this.Bucketize(dzTiles, currentFilter, this.sortFacet, stringFacets);

        this.columnWidth = (this.width - this.offsetX) / this.buckets.length;
        this.canvasHeightUIAdjusted = this.height -this.offsetY - this.titleSpace;

        //Find biggest bucket to determine tile size, rows and cols
        //Also create UI elements
        var uiElements = [];
        this.bigCount = 0;
       for (var i = 0; i < this.buckets.length; i++) {
            var styleClass = i % 2 == 0 ? "graphview-bucket-dark" : "graphview-bucket-light";
            uiElements[i] = "<div class='pv-viewarea-graphview-overlay-bucket " + styleClass + "' id='pv-viewarea-graphview-overlay-bucket-" + i + "' style='width: " + (Math.floor(this.columnWidth) - 4) + "px; height:" + (this.height - 2) + "px; left:" + ((i * this.columnWidth) - 2) + "px;'>";
            if (this.buckets[i].startRange == this.buckets[i].endRange)
                uiElements[i] += "<div class='pv-viewarea-graphview-overlay-buckettitle' style='top: " + (this.canvasHeightUIAdjusted + 4) + "px;'>" + this.buckets[i].startRange + "</div></div>";
            else
                uiElements[i] += "<div class='pv-viewarea-graphview-overlay-buckettitle' style='top: " + (this.canvasHeightUIAdjusted + 4) + "px;'>" + this.buckets[i].startRange + "<br/>to<br/>" + this.buckets[i].endRange + "</div></div>";

            if (this.bigCount < this.buckets[i].Ids.length) {
                this.bigCount = this.buckets[i].Ids.length;
            }
        }

        //remove previous elements
        var graphViewOverlay = $('.pv-viewarea-graphview-overlay');
        graphViewOverlay.css('left', this.offsetX + 'px');
        $('.pv-viewarea-graphview-overlay div').fadeOut('slow', function () { $(this).remove(); });
        graphViewOverlay.append(uiElements.join(''));
        $('.pv-viewarea-graphview-overlay div').fadeIn('slow');

        for (var i = 0; i < this.tiles.length; i++) {
            //setup tiles
            this.tiles[i]._locations[0].startx = this.tiles[i]._locations[0].x;
            this.tiles[i]._locations[0].starty = this.tiles[i]._locations[0].y;
            this.tiles[i].startwidth = this.tiles[i].width;
            this.tiles[i].startheight = this.tiles[i].height;

            var filterindex = $.inArray(this.tiles[i].facetItem.Id, currentFilter);
            //set outer location for all tiles not in the filter
            if (filterindex < 0) {
                this.SetOuterTileDestination(this.width, this.height, this.tiles[i]);
                this.tiles[i].start = PivotViewer.Utils.Now();
                this.tiles[i].end = this.tiles[i].start + 1000;
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
        
        var pt2Timeout = currentFilter.length == this.tiles.length ? 0 : 500;
        //Delay pt2 animation
        setTimeout(function () {
            // Clear selection
            var value = $('.pv-toolbarpanel-zoomslider').slider('option', 'value');
            if (value > 0) { 
                this.selected = selectedItem = "";
                //zoom out
                this.currentOffsetX = this.offsetX;
                this.currentOffsetY = this.offsetY;
                // Zoom using the slider event
                $('.pv-toolbarpanel-zoomslider').slider('option', 'value', 1);
            }
            that.rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.canvasHeightUIAdjusted - that.offsetY, that.maxRatio, that.bigCount);
            if (that.rowscols.TileHeight < 10 ) that.rowscols.TileHeight = 10;
            for (var i = 0; i < that.tiles.length; i++) {
                that.tiles[i].origwidth = that.rowscols.TileHeight / that.tiles[i]._controller.GetRatio(that.tiles[i].facetItem.Img);
                that.tiles[i].origheight = that.rowscols.TileHeight;
            }
            that.SetVisibleTileGraphPositions(that.rowscols, that.offsetX, that.offsetY, false, false);

        }, pt2Timeout);

        this.init = false;
    },
    GetUI: function () {
        if (Modernizr.canvas)
            return "<div class='pv-viewarea-graphview-overlay'></div>";
        else
            return "<div class='pv-viewpanel-unabletodisplay'><h2>Unfortunately this view is unavailable as your browser does not support this functionality.</h2>Please try again with one of the following supported browsers: IE 9+, Chrome 4+, Firefox 2+, Safari 3.1+, iOS Safari 3.2+, Opera 9+<br/><a href='http://caniuse.com/#feat=canvas'>http://caniuse.com/#feat=canvas</a></div>";
    },
    GetButtonImage: function () {
        return 'Content/images/GraphView.png';
    },
    GetButtonImageSelected: function () {
        return 'Content/images/GraphViewSelected.png';
    },
    GetViewName: function () {
        return 'Graph View';
    },
    GetSortedFilter: function () {
      var itemArray = [];
      for (i = 0; i < this.buckets.length; i++) {
          for (j = 0; j < this.buckets[i].Ids.length; j++) {
             var obj = new Object ();
             obj.Id = this.buckets[i].Ids[j];
             obj.Bucket = i;
             itemArray.push(obj);
          }
      }
      return itemArray;
    },
    /// Sets the tiles position based on the GetRowsAndColumns layout function
    SetVisibleTileGraphPositions: function (rowscols, offsetX, offsetY, initTiles, keepColsRows) {
        var columns = (keepColsRows && this.rowscols)  ? this.rowscols.Columns : rowscols.Columns;
        if (!keepColsRows)
            this.rowscols = rowscols;

        var startx = [];
        var starty = [];

        // First clear all tile locations greater that 1
        for (var l = 0; l < this.tiles.length; l++) {
            this.tiles[l].firstFilterItemDone = false;
            while (this.tiles[l]._locations.length > 1) 
                this.tiles[l]._locations.pop();   
        }
             
        for (var i = 0; i < this.buckets.length; i++) {
            var currentColumn = 0;
            var currentRow = 0;
            for (var j = 0, _jLen = this.tiles.length; j < _jLen; j++) {
                if ($.inArray(this.tiles[j].facetItem.Id, this.buckets[i].Ids) >= 0) {

                    if (!this.tiles[j].firstFilterItemDone) {
                        if (initTiles) {
                            //setup tile initial positions
                            this.tiles[j]._locations[0].startx = this.tiles[j]._locations[0].x;
                            this.tiles[j]._locations[0].starty = this.tiles[j]._locations[0].y;
                            this.tiles[j].startwidth = this.tiles[j].width;
                            this.tiles[j].startheight = this.tiles[j].height;
                        }
                   
                        this.tiles[j].destinationwidth = rowscols.TileMaxWidth;
                        this.tiles[j].destinationheight = rowscols.TileHeight;
                        this.tiles[j]._locations[0].destinationx = (i * this.columnWidth) + (currentColumn * rowscols.TileMaxWidth) + offsetX;
                        this.tiles[j]._locations[0].destinationy = this.canvasHeightUIAdjusted - rowscols.TileHeight - (currentRow * rowscols.TileHeight) + offsetY;
                        this.tiles[j].start = PivotViewer.Utils.Now();
                        this.tiles[j].end = this.tiles[j].start + 1000;
                        this.tiles[j].firstFilterItemDone = true;
                    } else {
                        tileLocation = new PivotViewer.Views.TileLocation();
                        tileLocation.startx = this.tiles[j]._locations[0].startx;
                        tileLocation.starty = this.tiles[j]._locations[0].starty;
                        tileLocation.x = this.tiles[j]._locations[0].x;
                        tileLocation.y = this.tiles[j]._locations[0].y;
                        tileLocation.destinationx = (i * this.columnWidth) + (currentColumn * rowscols.TileMaxWidth) + offsetX;
                        tileLocation.destinationy = this.canvasHeightUIAdjusted - rowscols.TileHeight - (currentRow * rowscols.TileHeight) + offsetY;
                        this.tiles[j]._locations.push(tileLocation);
                    }

                    if (currentColumn == columns - 1) {
                        currentColumn = 0;
                        currentRow++;
                    }
                    else
                        currentColumn++;
                }
            }
        }
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
    // These need fixing
    GetSelectedCol: function (tile, bucket) {
        var that = this;
        var selectedLoc = 0;
        for (i = 0; i < bucket; i++) {
          if ($.inArray(tile.facetItem.Id, this.buckets[i].Ids) > 0)
            selectedLoc++;
        }
        //var selectedLoc = tile.selectedLoc;
        //Need to account for padding in each column...
        padding = that.rowscols.PaddingX;
        colsInBar = that.rowscols.Columns;
        tileMaxWidth = that.rowscols.TileMaxWidth;
        selectedBar = Math.floor((tile._locations[selectedLoc].x - that.currentOffsetX) / ((tileMaxWidth * colsInBar) + padding));
        selectedColInBar = Math.round(((tile._locations[selectedLoc].x - that.currentOffsetX) - (selectedBar * (colsInBar * tileMaxWidth + padding))) / tileMaxWidth);
        selectedCol = (selectedBar * colsInBar) + selectedColInBar;
        return selectedCol;
    },
    GetSelectedRow: function (tile, bucket) {
        var that = this;
        var selectedLoc = 0;
        for (i = 0; i < bucket; i++) {
          if ($.inArray(tile.facetItem.Id, this.buckets[i].Ids) > 0)
            selectedLoc++;
        }
        //var selectedLoc = tile.selectedLoc;
        selectedRow = Math.round((that.canvasHeightUIAdjusted - (tile._locations[selectedLoc].y - that.currentOffsetY)) / tile.height);
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

        //var rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.canvasHeightUIAdjusted, that.maxRatio, that.bigCount);
        that.rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.canvasHeightUIAdjusted, that.maxRatio, that.bigCount);
        if (that.rowscols.TileHeight < 10 ) that.rowscols.TileHeight = 10;
        var bucket = Math.floor(selectedCol/ that.rowscols.Columns);
        var padding = that.rowscols.PaddingX * bucket;

        that.currentOffsetX = ((that.rowscols.TileMaxWidth * selectedCol) * -1) + (that.width / 2) - (that.rowscols.TileMaxWidth / 2) - padding;

        //that.currentOffsetY = rowscols.TileHeight * (selectedRow - 1) - (that.canvasHeightUIAdjusted / 2) - (rowscols.TileHeight / 2);  
        that.currentOffsetY = - that.rowscols.TileHeight * ((that.rowscols.Rows / 2) - (selectedRow + 1)) - ( that.canvasHeightUIAdjusted / 2 ) - (that.rowscols.TileHeight / 2);

        that.SetVisibleTileGraphPositions(that.rowscols, that.currentOffsetX, that.currentOffsetY, true, true);
    },
    handleSelection: function (selectedItem, selectedTile, clickX, selectedLoc) {
        var that = this;
            var selectedCol = 0;
            var selectedRow = 0;
            var found = false;
            var dontFilter = false;
            var offsetX = 0, offsetY = 0;

            //First get the position of the selected tile
            if ( selectedItem != null && selectedTile !=null) {
                //determine row and column that tile is in in relation to the first tile
                //Actual position not really row/column so different from similarly 
                //named variables in gridview.js
                selectedX = selectedTile._locations[selectedLoc].x;
                selectedY = selectedTile._locations[selectedLoc].y;
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
                selectedTile.selectedLoc = selectedLoc;
                found = true;

                //Used for scaling and centering 
                //Need to account for paddingin each column...
                padding = that.rowscols.PaddingX;
                colsInBar = that.rowscols.Columns;
                tileMaxWidth = that.rowscols.TileMaxWidth;
                selectedBar = Math.floor((selectedTile._locations[selectedLoc].x - that.currentOffsetX) / ((selectedTile.width * colsInBar) + padding));
                selectedColInBar = Math.round(((selectedTile._locations[selectedLoc].x - that.currentOffsetX) - (selectedBar * (colsInBar * tileMaxWidth + padding))) / tileMaxWidth);
                selectedCol = (selectedBar * colsInBar) + selectedColInBar;
                selectedRow = Math.round((that.canvasHeightUIAdjusted - (selectedTile._locations[selectedLoc].y - that.currentOffsetY)) / selectedTile.height);
                tileHeight = selectedTile.height;
                tileWidth = selectedTile.height / selectedTile._controller.GetRatio(selectedTile.facetItem.Img);
                tileOrigHeight = selectedTile.origheight;
                tileOrigWidth = selectedTile.origwidth;
                canvasHeight = selectedTile.context.canvas.height
                canvasWidth = selectedTile.context.canvas.width - ($('.pv-filterpanel').width() + $('.pv-infopanel').width());
            }

            // If an item is selected then zoom out but don't set the filter
            // based on clicking in a bar in the graph.
            if (that.selected != null && that.selected != "" && !found)
               dontFilter = true;

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

// Also need to scale the backgound colums...
// leave for now - tricky

              //  if (that.width < that.height) {
              //      var newWidth = that.width * that.rowscols.Columns * 0.6; //0.6 to leave 10% space
              //      var newHeight = (that.canvasHeightUIAdjusted / that.width) * newWidth;
              //  } else {
              //      var newHeight = that.canvasHeightUIAdjusted * that.rowscols.Rows * 0.6;
              //      var newWidth = (that.width / that.canvasHeightUIAdjusted) * newHeight;
              //  }

            //    var scaleY = newHeight / that.canvasHeightUIAdjusted;
            //    var scaleX = newWidth / (that.width - that.offsetX);
            //    that.columnWidth = newWidth / that.buckets.length;
//                that.columnWidth = that.currentWidth / that.buckets.length;

                //var rowscols = that.GetRowsAndColumns(that.columnWidth, newHeight, that.maxRatio, that.bigCount);
//                var rowscols = that.GetRowsAndColumns(that.columnWidth, that.currentHeight, that.maxRatio, that.bigCount);

                //that.currentOffsetX = -((selectedCol - that.offsetX) * scaleX) + (that.width / 2) - (rowscols.TileMaxWidth / 2);
 //               that.currentOffsetX = -((selectedCol) * (that.currentWidth/that.width)) - that.currentOffsetX + (that.width / 2) - (rowscols.TileMaxWidth / 2);

//                var rowNumber = Math.ceil((that.canvasHeightUIAdjusted - selectedRow) / that.rowscols.TileHeight);
//                that.currentOffsetY = 31 + (rowscols.TileHeight * (rowNumber - 1)l* that.currentWidth/that.width);

//                that.SetVisibleTileGraphPositions(rowscols, that.currentOffsetX, that.currentOffsetY, true, true);
                $('.pv-viewarea-graphview-overlay div').fadeOut('slow');
            } else {
                that.selected = selectedItem = "";
                selectedBar = 0;
                //zoom out
                that.currentOffsetX = that.offsetX;
                that.currentOffsetY = that.offsetY;

                // Zoom using the slider event
                var value = $('.pv-toolbarpanel-zoomslider').slider('option', 'value');
                value = 0; 
                $('.pv-toolbarpanel-zoomslider').slider('option', 'value', value);

                $('.pv-viewarea-graphview-overlay div').fadeIn('slow');
            }
             $.publish("/PivotViewer/Views/Item/Selected", [{id: selectedItem, bkt: selectedBar}]);

        if (!found && !dontFilter) {
            var bucketNumber = Math.floor((clickX - that.offsetX) / that.columnWidth);
            $.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: that.sortFacet, Item: that.buckets[bucketNumber].startRange, MaxRange: that.buckets[bucketNumber].endRange, Values: that.buckets[bucketNumber].Values, ClearFacetFilters:true}]);
        }
    }
});
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

///Image Controller interface - all image handlers must implement this
PivotViewer.Views.IImageController = Object.subClass({
    init: function () { },
    Setup: function (basePath) { },
    GetImagesAtLevel: function (id, level) { },
    Width: 0,
    Height: 0
});
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

PivotViewer.Views.LoadImageSetHelper = Object.subClass({
    init: function () {
        this._images = [],
        this._loaded = false;
    },

    //Load an array of urls
    LoadImages: function (images) {
        var that = this;
        for (var i = 0; i < images.length; i++) {
            var img = new Image();
            img.src = images[i];
            img.onload = function () {
                that._loaded = true;
            };
            this._images.push(img);
        }
    },
    GetImages: function () { return this._images; },
    IsLoaded: function () { return this._loaded; }
});
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
/// Deep Zoom Image Getter
/// Retrieves and caches images
///
PivotViewer.Views.DeepZoomImageController = PivotViewer.Views.IImageController.subClass({
    init: function () {
        this._items = [];
        this._collageItems = [];
        this._baseUrl = "";
        this._collageMaxLevel = 0;
        this._tileSize = 256;
        this._format = "";
        this._ratio = 1;
        this.MaxRatio = 1;

        this._zooming = false;
        var that = this;

        //Events
        $.subscribe("/PivotViewer/ImageController/Zoom", function (evt) {
            that._zooming = evt;
        });
    },
    Setup: function (deepzoomCollection) {
        //get base URL
        this._baseUrl = deepzoomCollection.substring(0, deepzoomCollection.lastIndexOf("/"));
        this._collageUrl = deepzoomCollection.substring(deepzoomCollection.lastIndexOf("/") + 1).replace('.xml', '_files');
        var that = this;
        //load dzi and start creating array of id's and DeepZoomLevels
        $.ajax({
            type: "GET",
            url: deepzoomCollection,
            dataType: "xml",
            success: function (xml) {
                var collection = $(xml).find("Collection");
                that._tileSize = $(collection).attr("TileSize");
                that._format = $(collection).attr('Format');
                that._collageMaxLevel = $(collection).attr('MaxLevel');

                var items = $(xml).find("I");
                if (items.length == 0)
                    return;
                
                //If collection itself contains size information, use first one for now
                var dzcSize = $(items[0]).find('Size');
                if (dzcSize.length > 0) {
                    //calculate max level
                    that.MaxWidth = parseInt(dzcSize.attr("Width"));
// Use height of first image for now...
                    that.Height = parseInt(dzcSize.attr("Height"));
                    that.MaxRatio = that.Height/that.MaxWidth;
                   // for ( i = 0; i < items.length; i++ ) {
                    //    itemSize = $(items[i]).find("Size");
                     //   if (itemSize.length > 0) {
                      //      itemWidth = parseInt(itemSize.attr("Width"));
                       //     if (itemWidth > that.MaxWidth)
                        //        that.MaxWidth = itemWidth;
                         //}
                    //}
                    //var maxDim = that.MaxWidth > that.Height ? that.MaxWidth : that.Height;
                    //that._maxLevel = Math.ceil(Math.log(maxDim) / Math.log(2));

                    for ( i = 0; i < items.length; i++ ) {
                        itemSize = $(items[i]).find("Size");
                        var width = parseInt(itemSize.attr("Width"));
                        var height = parseInt(itemSize.attr("Height"));
                        var maxDim = width > height ? width : height;
                        var maxLevel = Math.ceil(Math.log(maxDim) / Math.log(2));

                        that._ratio = height / width;
                        var dziSource = $(items[i]).attr('Source');
                        var itemId = $(items[i]).attr('Id');
                        var dzN = $(items[i]).attr('N');
                        var dzId = dziSource.substring(dziSource.lastIndexOf("/") + 1).replace(/\.xml/gi, "").replace(/\.dzi/gi, "");
                         var basePath = dziSource.substring(0, dziSource.lastIndexOf("/"));
                         if (basePath.length > 0)
                             basePath = basePath + '/';
                        that._items.push(new PivotViewer.Views.DeepZoomItem(itemId, dzId, dzN, basePath, that._ratio, width, height, maxLevel));
                        if (width > that.MaxWidth)
                            that.MaxWidth = width;
                        if (that._ratio < that.MaxRatio)  // i.e. biggest width cf height upside down....
                            that.MaxRatio = that._ratio;
                    }
                }
                 //Loaded DeepZoom collection
                 $.publish("/PivotViewer/ImageController/Collection/Loaded", null);
             },
             error: function(jqXHR, textStatus, errorThrown) {
                //Make sure throbber is removed else everyone thinks the app is still running
                $('.pv-loading').remove();

                //Throw an alert so the user knows something is wrong
                var msg = '';
                msg = msg + 'Error loading from DeepZoom Cache\r\n\r\n';
                msg = msg + 'URL        : ' + this.url + '\r\n';
                msg = msg + 'Statuscode : ' + jqXHR.status + '\r\n';
                msg = msg + 'Details    : ' + errorThrown + '\r\n';
                msg = msg + '\r\nPivot Viewer cannot continue until this problem is resolved\r\r';
                var t=setTimeout(function(){window.alert(msg)},1000)
            }
        });
    },

    GetImagesAtLevel: function (id, level) {
        //if the request level is greater than the collections max then set to max
        //level = (level > _maxLevel ? _maxLevel : level);

        //For PoC max level is 8
        //level = (level > 8 ? 8 : level);
        level = (level <= 0 ? 6 : level);

        //find imageId
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
                level = (level > this._items[i].MaxLevel ? this._items[i].MaxLevel : level);

                //to work out collage image
                //convert image n to base 2
                //convert to array and put even and odd bits into a string
                //convert strings to base 10 - this represents the tile row and col
                var baseTwo = this._items[i].DZN.toString(2);
                var even = "", odd = "";
                for (var b = 0; b < baseTwo.length; b++) {
                    if (b % 2 == 0)
                        even += baseTwo[b];
                    else
                        odd += baseTwo[b];
                }
                dzCol = parseInt(even, 2);
                dzRow = parseInt(odd, 2);
                //for the zoom level work out the DZ tile where it came from

                if ((this._items[i].Levels == undefined || this._items[i].Levels.length == 0) && !this._zooming) {
                    //create 0 level
                    var imageList = this.GetImageList(i, this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/6/", 6); ;
                    var newLevel = new PivotViewer.Views.LoadImageSetHelper();
                    newLevel.LoadImages(imageList);
                    this._items[i].Levels.push(newLevel);
                    return null;
                }
                else if (this._items[i].Levels.length < level && !this._zooming) {
                    //requested level does not exist, and the Levels list is smaller than the requested level
                    var imageList = this.GetImageList(i, this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/" + level + "/", level);
                    var newLevel = new PivotViewer.Views.LoadImageSetHelper();
                    newLevel.LoadImages(imageList);
                    this._items[i].Levels.splice(level, 0, newLevel);
                }

                //get best loaded level to return
                for (var j = level; j > -1; j--) {
                    if (this._items[i].Levels[j] != undefined && this._items[i].Levels[j].IsLoaded()) {
                        return this._items[i].Levels[j].GetImages();
                    }
                    //if request level has not been requested yet
                    if (j == level && this._items[i].Levels[j] == undefined && !this._zooming) {
                        //create array of images to getagePath.replace('.dzi', '').replace('\/\/', '\/');
                        var imageList = this.GetImageList(i, this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/" + j + "/", j);
                        //create level
                        var newLevel = new PivotViewer.Views.LoadImageSetHelper();
                        newLevel.LoadImages(imageList);
                        this._items[i].Levels.splice(j, 0, newLevel);
                    }
                }

                return null;
            }
        }
        return null;
    },

    GetImageList: function (itemIndex, basePath, level) {
        var fileNames = [];

        var tileSize = this._tileSize;
        var tileFormat = this._format;
        var ratio = this._items[itemIndex].Ratio;
        var height = this._items[itemIndex].Height;
        var maxLevel = this._items[itemIndex].MaxLevel;

        var levelWidth = Math.ceil( (height/ratio) / Math.pow(2, maxLevel - level));
        var levelHeight = Math.ceil(height / Math.pow(2, maxLevel - level));
        //based on the width for this level, get the slices based on the DZ Tile Size
        var hslices = Math.ceil(levelWidth / tileSize);
        var vslices = Math.ceil(levelHeight / tileSize);

        //Construct list of file names based on number of vertical and horizontal images
        for (var i = 0; i < hslices; i++) {
            for (var j = 0; j < vslices; j++) {
                fileNames.push(basePath + i + "_" + j + "." + tileFormat);
            }
        }
        return fileNames;
    },

    GetWidthForImage: function( id, height ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return Math.floor(height / this._items[i].Ratio);
            }
        }
    },

    GetDzi: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               dziName = this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + ".dzi";
               return dziName;
            }
        }
    },

    GetMaxLevel: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return this._items[i].MaxLevel;
            }
        }
    },

    GetWidth: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return this._items[i].Width;
            }
        }
    },

    GetHeight: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return this._items[i].Height;
            }
        }
    },
    GetRatio: function( id ) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {
               return this._items[i].Ratio;
            }
        }
    }
});

PivotViewer.Views.DeepZoomItem = Object.subClass({    init: function (ItemId, DZId, DZn, BasePath, Ratio, Width, Height, MaxLevel) {
        this.ItemId = ItemId,
        this.DZId = DZId,
        this.DZN = parseInt(DZn),
        this.BasePath = BasePath,
        this.Levels = [];    //jch                    
        this.Ratio = Ratio;  
        this.Width = Width;
        this.Height = Height;
        this.MaxLevel = MaxLevel;
    }
});
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
/// Tile Controller
/// used to create the initial tiles and their animation based on the locations set in the views
///
PivotViewer.Views.TileController = Object.subClass({
    init: function (ImageController) {
        this._tiles = [];
        this._helpers = [];
        this._helperText = "";
        this._easing = new Easing.Easer({ type: "circular", side: "both" });
        this._imageController = ImageController;
    },
    initTiles: function (pivotCollectionItems, baseCollectionPath, canvasContext) {
        //Set the initial state for the tiles
        for (var i = 0; i < pivotCollectionItems.length; i++) {
            var tile = new PivotViewer.Views.Tile(this._imageController);
            tile.facetItem = pivotCollectionItems[i];
            tile.CollectionRoot = baseCollectionPath.replace(/\\/gi, "/").replace(/\.xml/gi, "");
            this._canvasContext = canvasContext;
            tile.context = this._canvasContext;
            tileLocation = new PivotViewer.Views.TileLocation();
            tile._locations.push(tileLocation);
            this._tiles.push(tile);
        }
        return this._tiles;
    },

    AnimateTiles: function (doInitialSelection, selectedId) {
        var that = this;
        this._started = true;
        var context = null;
        var isAnimating = false;

        if (this._tiles.length > 0 && this._tiles[0].context != null) {
            context = this._tiles[0].context;

            //TODO Seen this error, investigate this for performance: http://stackoverflow.com/questions/7787219/javascript-ios5-javascript-execution-exceeded-timeout

            var isZooming = false;
            //Set tile properties
            for (var i = 0; i < this._tiles.length; i++) {
                //for each tile location...
                for (l = 0; l < this._tiles[i]._locations.length; l++) {
                     var now = PivotViewer.Utils.Now() - this._tiles[i].start,
                     end = this._tiles[i].end - this._tiles[i].start;
                     //use the easing function to determine the next position
                     if (now <= end) {
                         //at least one tile is moving
                         //isAnimating = true;
 
                         //if the position is different from the destination position then zooming is happening
                         if (this._tiles[i]._locations[l].x != this._tiles[i]._locations[l].destinationx || this._tiles[i]._locations[l].y != this._tiles[i]._locations[l].destinationy)
                             isZooming = true;
 
                         this._tiles[i]._locations[l].x = this._easing.ease(
                             now, 										// curr time
                             this._tiles[i]._locations[l].startx,                                                       // start position
                            this._tiles[i]._locations[l].destinationx - this._tiles[i]._locations[l].startx, // relative end position

                             end											// end time
                         );
 
                         this._tiles[i]._locations[l].y = this._easing.ease(
                         now,
                         this._tiles[i]._locations[l].starty,
                         this._tiles[i]._locations[l].destinationy - this._tiles[i]._locations[l].starty,
                         end
                     );
 
                         //if the width/height is different from the destination width/height then zooming is happening
                         if (this._tiles[i].width != this._tiles[i].destinationWidth || this._tiles[i].height != this._tiles[i].destinationHeight)
                             isZooming = true;
 
                         this._tiles[i].width = this._easing.ease(
                         now,
                         this._tiles[i].startwidth,
                         this._tiles[i].destinationwidth - this._tiles[i].startwidth,
                         end
                     );
 
                         this._tiles[i].height = this._easing.ease(
                         now,
                         this._tiles[i].startheight,
                         this._tiles[i].destinationheight - this._tiles[i].startheight,
                         end
                     );
                     } else {
                         this._tiles[i]._locations[l].x = this._tiles[i]._locations[l].destinationx;
                         this._tiles[i]._locations[l].y = this._tiles[i]._locations[l].destinationy;
                         this._tiles[i].width = this._tiles[i].destinationwidth;
                         this._tiles[i].height = this._tiles[i].destinationheight;
			 // if now and end are numbers when we get here then the animation 
			 // has finished
			 if (!isNaN(now) && !isNaN(end) && doInitialSelection) {
                             var selectedTile = "";
                             for ( t = 0; t < this._tiles.length; t ++ ) {
                                 if (this._tiles[t].facetItem.Id == selectedId) {
                                    selectedTile = this._tiles[t];
                                    break;
                                 }
                             }
	                     if (selectedId && selectedTile) 
                        	$.publish("/PivotViewer/Views/Canvas/Click", [{ x: selectedTile._locations[selectedTile.selectedLoc].destinationx, y: selectedTile._locations[selectedTile.selectedLoc].destinationy}]);
                                doInitialSelection = false;
                                selectedId = 0;
                        }
                     }
 
                     //check if the destination will be in the visible area
                     if (this._tiles[i]._locations[l].destinationx + this._tiles[i].destinationwidth < 0 || this._tiles[i]._locations[l].destinationx > context.canvas.width || this._tiles[i]._locations[l].destinationy + this._tiles[i].destinationheight < 0 || this._tiles[i]._locations[l].destinationy > context.canvas.height)
                         this._tiles[i].destinationVisible = false;
                     else
                         this._tiles[i].destinationVisible = true;
                 }
             }
         }

        //fire zoom event
        if (this._isZooming != isZooming) {
            this._isZooming = isZooming;
            $.publish("/PivotViewer/ImageController/Zoom", [this._isZooming]);
        }

        //If animating then (most likely) all tiles will need to be updated, so clear the entire canvas
        //if (isAnimating) {
            //Clear drawing area
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        //}

        //once properties set then draw
        for (var i = 0; i < this._tiles.length; i++) {
            //only draw if in visible area
            for (var l = 0; l < this._tiles[i]._locations.length; l++) {
                if (this._tiles[i]._locations[l].x + this._tiles[i].width > 0 && this._tiles[i]._locations[l].x < context.canvas.width && this._tiles[i]._locations[l].y + this._tiles[i].height > 0 && this._tiles[i]._locations[l].y < context.canvas.height) {
                if (isAnimating)
                    this._tiles[i].DrawEmpty(l);
                else
                    this._tiles[i].Draw(l);
                }
            }
        }

        //Helpers
        /*
        if (debug) {
            //Draw point if one requested
            if (this._helpers.length > 0) {
                for (var i = 0; i < this._helpers.length; i++) {
                    this._canvasContext.beginPath();
                    this._canvasContext.moveTo(this._helpers[i].x, this._helpers[i].y);
                    this._canvasContext.arc(this._helpers[i].x + 1, this._helpers[i].y + 1, 10, 0, Math.PI * 2, true);
                    this._canvasContext.fillStyle = "#FF0000";
                    this._canvasContext.fill();
                    this._canvasContext.beginPath();
                    this._canvasContext.rect(this._helpers[i].x + 25, this._helpers[i].y - 40, 50, 13);
                    this._canvasContext.fillStyle = "white";
                    this._canvasContext.fill();
                    this._canvasContext.fillStyle = "black";
                    this._canvasContext.fillText(this._helpers[i].x + ", " + this._helpers[i].y, this._helpers[i].x + 30, this._helpers[i].y - 30);
                }
            }

            if (this._helperText.length > 0) {
                this._canvasContext.beginPath();
                this._canvasContext.rect(220, 5, 500, 14);
                this._canvasContext.fillStyle = "white";
                this._canvasContext.fill();
                this._canvasContext.fillStyle = "black";
                this._canvasContext.fillText(this._helperText, 225, 14);
            }
        }
        */

        // request new frame
        if (!this._breaks) {
            requestAnimFrame(function () {
                that.AnimateTiles(doInitialSelection, selectedId);
            });
        } else {
            this._started = false;
            return;
        }
    },

    BeginAnimation: function (doInitialSelection, viewerStateSelected) {
        if (!this._started && this._tiles.length > 0) {
            this._breaks = false;
            this.AnimateTiles(doInitialSelection, viewerStateSelected);
        }
    },
    StopAnimation: function () {
        this._breaks = true;
    },
    SetLinearEasingBoth: function () {
        this._easing = new Easing.Easer({ type: "linear", side: "both" });
    },
    SetCircularEasingBoth: function () {
        this._easing = new Easing.Easer({ type: "circular", side: "both" });
    },
    SetQuarticEasingOut: function () {
        this._easing = new Easing.Easer({ type: "quartic", side: "out" });
    },
    GetMaxTileRatio: function () {
    //    return this._imageController.Height / this._imageController.MaxWidth;
        return this._imageController.MaxRatio;
    },
    DrawHelpers: function (helpers) {
        this._helpers = helpers;
    },
    DrawHelperText: function (text) {
        this._helperText = text;
    }
});

///
/// Tile
/// Used to contain the details of an individual tile, and to draw the tile on a given canvas context
///
PivotViewer.Views.Tile = Object.subClass({
    init: function (TileController) {
        if (!(this instanceof PivotViewer.Views.Tile)) {
            return new PivotViewer.Views.Tile(TileController);
        }
        this._controller = TileController;
        this._imageLoaded = false;
        this._selected = false;
        this._level = 0;
        this._images = null;
        this._locations = [];
    },

    IsSelected: function () {
       return this._selected;
    },

    Draw: function (loc) {
        //Is the tile destination in visible area?
        //If not, then re-use the old level images
        if (this.destinationVisible) {
            //Determine level
            var biggest = this.width > this.height ? this.width : this.height;
            var thisLevel = Math.ceil(Math.log(biggest) / Math.log(2));


            if (thisLevel == Infinity || thisLevel == -Infinity)
                thisLevel = 0;

            //TODO: Look at caching last image to avoid using _controller
            this._level = thisLevel;
            //if(this._level > 6)
                this._images = this._controller.GetImagesAtLevel(this.facetItem.Img, this._level);
        }
        if (this._images != null) {
            if (typeof this._images == "function") {
                //A DrawLevel function returned - invoke
                this._images(this.facetItem, this.context, this._locations[loc].x + 4, this._locations[loc].y + 4, this.width - 8, this.height - 8);
            }

            else if (this._images.length > 0 && this._images[0] instanceof Image) {
                //if the collection contains an image
                var completeImageHeight = this._controller.GetHeight(this.facetItem.Img);
                //var completeImageWidth = this._controller.GetWidth(this.facetItem.Img);
                //var levelWidth = Math.ceil(completeImageWidth / Math.pow(2, this._controller.GetMaxLevel(this.facetItem.Img) - this._level));

                var displayHeight = this.height - 8;
                var displayWidth = Math.ceil(this._controller.GetWidthForImage(this.facetItem.Img, displayHeight));
               
                //Narrower images need to be centered 
                blankWidth = (this.width - 8) - displayWidth;
                for (var i = 0; i < this._images.length; i++) {
                    // We need to know where individual image tiles go
                    var source = this._images[i].src;
                    var tileSize = this._controller._tileSize;
                    var n = source.match(/[0-9]+_[0-9]+/g);
                    var xPosition = parseInt(n[n.length - 1].substring(0, n[n.length - 1].indexOf("_")));
                    var yPosition = parseInt(n[n.length - 1].substring(n[n.length - 1].indexOf("_") + 1));

                    //Get image level
                    n = source.match (/_files\/[0-9]+\//g);
                    var imageLevel = parseInt(n[0].substring(7, n[0].length - 1));
                    var levelHeight = Math.ceil(completeImageHeight / Math.pow(2, this._controller.GetMaxLevel(this.facetItem.Img) - imageLevel));

                    //Image will need to be scaled to get the displayHeight
                    var scale = displayHeight / levelHeight;
               
                    var offsetx = (Math.floor(blankWidth/2)) + 4 + xPosition * Math.floor(tileSize * scale);
                    var offsety = 4 + Math.floor((yPosition * tileSize * scale));
               
                    var imageTileHeight = Math.ceil(this._images[i].height * scale);
                    var imageTileWidth = Math.ceil(this._images[i].width * scale);

                    // Creates a grid artfact across the image so comment out for now
                    //only clearing a small portion of the canvas
                    //this.context.fillRect(offsetx + this.x, offsety + this.y, imageTileWidth, imageTileHeight);
                    this.context.drawImage(this._images[i], offsetx + this._locations[loc].x , offsety + this._locations[loc].y, imageTileWidth, imageTileHeight);
                }
                if (this._selected) {
                    //draw a blue border
                    this.context.beginPath();
                    var offsetx = (Math.floor(blankWidth/2)) + 4;
                    var offsety = 4;
                    this.context.rect(offsetx + this._locations[this.selectedLoc].x , offsety + this._locations[this.selectedLoc].y, displayWidth, displayHeight);
                    this.context.lineWidth = 4;
                    this.context.strokeStyle = "#92C4E1";
                    this.context.stroke();
                }
            }
        }
        else {
            this.DrawEmpty(loc);
        }
    },
    //http://simonsarris.com/blog/510-making-html5-canvas-useful
    Contains: function (mx, my) {
        var foundIt = false;
        var loc = -1;
        for ( i = 0; i < this._locations.length; i++) {
            foundIt = (this._locations[i].x <= mx) && (this._locations[i].x + this.width >= mx) &&
        (this._locations[i].y <= my) && (this._locations[i].y + this.height >= my);
            if (foundIt)
              loc = i;
        }
        return loc;
    },
    DrawEmpty: function (loc) {
        if (this._controller.DrawLevel == undefined) {
            //draw an empty square
            this.context.beginPath();
            this.context.fillStyle = "#D7DDDD";
            this.context.fillRect(this._locations[loc].x + 4, this._locations[loc].y + 4, this.width - 8, this.height - 8);
            this.context.rect(this._locations[loc].x + 4, this._locations[loc].y + 4, this.width - 8, this.height - 8);
            this.context.lineWidth = 1;
            this.context.strokeStyle = "white";
            this.context.stroke();
        } else {
            //use the controllers blank tile
            this._controller.DrawLevel(this.facetItem, this.context, this._locations[loc].x + 4, this._locations[loc].y + 4, this.width - 8, this.height - 8);
        }
    },
    CollectionRoot: "",
    now: null,
    end: null,
    width: 0,
    height: 0,
    origwidth: 0,
    origheight: 0,
    ratio: 1,
    startwidth: 0,
    startheight: 0,
    destinationwidth: 0,
    destinationheight: 0,
    destinationVisible: true,
    context: null,
    facetItem: null,
    firstFilterItemDone: false,
    selectedLoc: 0,
    Selected: function (selected) { this._selected = selected }
});
///
/// Tile Location
/// Used to contain the location of a tile as in the graph view a tile can appear multiple times
///
PivotViewer.Views.TileLocation = Object.subClass({
    init: function () {
    },
    x: 0,
    y: 0,
    startx: 0,
    starty: 0,
    destinationx: 0,
    destinationy: 0,
});
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
        viewerStateSelected = _viewerState.Selection;

        //select first view
        if (_viewerState.View != null)
            SelectView(_viewerState.View, true);
        else
            SelectView(0, true);

        //Begin tile animation
        _tileController.BeginAnimation(true, viewerStateSelected);
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
        $('.pv-infopanel-controls').append("<div><div class='pv-infopanel-controls-navleft'></div><div class='pv-infopanel-controls-navleftdisabled'></div><div class='pv-infopanel-controls-navbar'></div><div class='pv-infopanel-controls-navright'></div><div class='pv-infopanel-controls-navrightdisabled'></div></div>");
        $('.pv-infopanel-controls-navleftdisabled').hide();
        $('.pv-infopanel-controls-navrightdisabled').hide();
        infoPanel.append("<div class='pv-infopanel-heading'></div>");
        infoPanel.append("<div class='pv-infopanel-details'></div>");
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
                                if (currentFacetCategory.Type == PivotViewer.Models.FacetType.String) {
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
                if (PivotCollection.FacetCategories[i].Type == PivotViewer.Models.FacetType.String ) {
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
                    _views[i].Setup(width, height, offsetX, offsetY, _tileController.GetMaxTileRatio());
                    viewPanel.append("<div class='pv-viewpanel-view' id='pv-viewpanel-view-" + i + "'>" + _views[i].GetUI() + "</div>");
                    $('.pv-toolbarpanel-viewcontrols').append("<div class='pv-toolbarpanel-view' id='pv-toolbarpanel-view-" + i + "' title='" + _views[i].GetViewName() + "'><img id='pv-viewpanel-view-" + i + "-image' src='" + _views[i].GetButtonImage() + "' alt='" + _views[i].GetViewName() + "' /></div>");
                } else {
                    alert('View does not inherit from PivotViewer.Views.IPivotViewerView');
                }
            } catch (ex) { alert(ex.Message); }
        }
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
        _views[viewNumber].Activate();
        _views[viewNumber].init = init;

        _currentView = viewNumber;
        _selectedItem = "";
        FilterCollection();
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
            $('.pv-toolbarpanel-sort').val(_viewerState.Facet).attr('selected', 'selected');
	    _currentSort = $('.pv-toolbarpanel-sort option:selected').text();
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
        _views[_currentView].Filter(_tiles, filterItems, sort, stringFacets);

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

        if (evt === undefined || evt === null || evt === "") {
            DeselectInfoPanel();
            _selectedItem = "";
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
            infopanelDetails.css('height', ($('.pv-infopanel').height() - ($('.pv-infopanel-controls').height() + $('.pv-infopanel-heading').height() + $('.pv-infopanel-copyright').height()) - 20) + 'px');
            _selectedItem = selectedItem;
            _selectedItemBkt = evt.bkt;

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
                    var checkedValues = $('.pv-facet-facetitem[itemfacet="' + evt.Facet + '"]')
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
	    _currentSort = $('.pv-toolbarpanel-sort option:selected').text();
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
            FilterCollection();
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
            FilterCollection();
            $(this).css('visibility', 'hidden');
        });
        //Numeric facet type slider drag
        $('.ui-slider-range').on('mousedown', function (e) {
            //drag it
        });
        //Info panel
        $('.pv-infopanel-details').on('click', '.detail-item-value-filter', function (e) {
            $.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: $(this).parent().children().first().text(), Item: $(this).text(), Values: null, ClearFacetFilters: true }]);
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
        FilterCollection();
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
