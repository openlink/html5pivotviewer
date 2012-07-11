//
// Copyright © 2011 LobsterPot Solutions - www.lobsterpot.com.au
// enquiries@lobsterpot.com.au
// 

//PivotViewer
var PivotViewer = PivotViewer || {};
PivotViewer.Models = {};
PivotViewer.Models.Loaders = {};
PivotViewer.Utils = {};
PivotViewer.Views = {};
//Debug
var Debug = Debug || {};/*	
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

})(jQuery);Debug.Log = function (message) {
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
})();PivotViewer.Models.Collection = Object.subClass({
	init: function () {
		var xmlns = "http://schemas.microsoft.com/collection/metadata/2009",
		xmlnsp = "http://schemas.microsoft.com/livelabs/pivot/collection/2009";
		this.CollectionName = "";
		this.BrandImage = "";
		this.FacetCategories = [];
		this.Items = [];
		this.CXMLBase = "";
		this.ImageBase = "";
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
};//Collection loader interface - used so that different types of data sources can be used
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
    init: function (CXMLUri) {
        this.CXMLUri = CXMLUri;
    },
    LoadCollection: function (collection) {
        var collection = collection;
        this._super(collection);

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
                                    if (v == null) {
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
                window.alert(msg);
            }
        });
    }
});//Views interface - all views must implement this
PivotViewer.Views.IPivotViewerView = Object.subClass({
	init: function () {
		this.isActive = false;
		this.init = true;
		this.selected = "";
		this.tiles = [];
	},
	Setup: function (width, height, offsetX, offsetY, tileRatio) { },
	Filter: function (dzTiles, currentFilter, sortFacet) { },
	GetUI: function () { return ''; },
	GetButtonImage: function () { return ''; },
	GetButtonImageSelected: function () { return ''; },
	GetViewName: function () { return ''; },
	Activate: function () { this.isActive = true; },
	Deactivate: function () { this.isActive = false; }
});PivotViewer.Views.TileBasedView = PivotViewer.Views.IPivotViewerView.subClass({
	OffsetTiles: function (offsetX, offsetY) {
		for (var i = 0; i < this.tiles.length; i++) {
			var filterindex = $.inArray(this.tiles[i].facetItem.Id, this.currentFilter);
			//set outer location for all tiles not in the filter
			if (filterindex >= 0) {
				this.tiles[i].destinationx += offsetX;
				this.tiles[i].destinationy += offsetY;
			}
		}
	},

	SetInitialTiles: function (dzTiles, canvasWidth, canvasHeight) {
		var initx = canvasWidth / 2;
		var inity = canvasHeight / 2;
		for (var i = 0; i < dzTiles.length; i++) {
			dzTiles[i].x = initx;
			dzTiles[i].y = inity;
			dzTiles[i].velocityx = 0;
			dzTiles[i].velocityy = 0;
			dzTiles[i].startx = initx;
			dzTiles[i].starty = inity;
			dzTiles[i].destinationx = 0;
			dzTiles[i].destinationy = 0;
			dzTiles[i].width = 1;
			dzTiles[i].height = 1;
		}
	},

	GetRowsAndColumns: function (canvasWidth, canvasHeight, tileRatio, tileCount) {
		// look into creating a series of calcs that will try multiple times changing the gap
		var gap = 0.7;
		var a = tileRatio * (tileCount - Math.pow(gap, 2));
		var b = (canvasHeight + (canvasWidth * tileRatio)) * gap;
		var c = -1 * (canvasHeight * canvasWidth);
		var tileWidth = ((-1 * b) + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		var tileHeight = Math.floor(tileWidth * tileRatio);
		var canvasRows = Math.ceil(canvasHeight / tileHeight);
		var canvasColumns = Math.floor(canvasWidth / tileWidth);
		return { Rows: canvasRows, Columns: canvasColumns, TileWidth: tileWidth, TileHeight: tileHeight };
	},

	SetOuterTileDestination: function (canvasWidth, canvasHeight, tile) {
		//http://mathworld.wolfram.com/Circle-LineIntersection.html
		//http://stackoverflow.com/questions/6091728/line-segment-circle-intersection
		//Get adjusted x and y
		// as x2 and y2 are the origin
		var dx = tile.x - (canvasWidth / 2);
		var dy = tile.y - (canvasHeight / 2);
		var M = dy / dx;
		var theta = Math.atan2(dy, dx)
		tile.destinationx = canvasWidth * Math.cos(theta) + (canvasWidth / 2);
		tile.destinationy = canvasHeight * Math.sin(theta) + (canvasHeight / 2);
	},

	//http://stackoverflow.com/questions/979256/how-to-sort-an-array-of-javascript-objects
	SortBy: function (field, reverse, primer) {

		var key = function (x) {
			if (primer) {
				for (var i = x.facetItem.Facets.length - 1; i > -1; i -= 1) {
					if (x.facetItem.Facets[i].Name == field && x.facetItem.Facets[i].FacetValues.length > 0)
						return primer(x.facetItem.Facets[i].FacetValues[0].Value);
				}
			}
			return null;
		};

		return function (a, b) {
			var A = key(a), B = key(b);
			return (A < B ? -1 : (A > B ? 1 : 0)) * [1, -1][+!!reverse];
		}
	}
});///
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
            var selectedCol = 0;
            var selectedRow = 0;
            var offsetX = 0, offsetY = 0;
            for (var i = 0; i < that.tiles.length; i++) {
                if (that.tiles[i].Contains(evt.x, evt.y)) {
                    selectedItem = that.tiles[i].facetItem.Id;
                    //determine row and column that tile is in in relation to the first tile
                    selectedCol = Math.round((that.tiles[i].x - that.currentOffsetX) / that.tiles[i].width); //Math.floor((that.tiles[i].x - that.tiles[0].x) / that.tiles[i].width);
                    selectedRow = Math.round((that.tiles[i].y - that.currentOffsetY) / that.tiles[i].height);  //Math.floor((that.tiles[i].y - that.tiles[0].y) / that.tiles[i].height); //Math.floor((that.tiles[i].y - that.offsetY) / (that.tiles[i].height + 4));
                    that.tiles[i].Selected(true);
                    offsetX = that.tiles[i].x;
                    offsetY = that.tiles[i].y;
                } else {
                    that.tiles[i].Selected(false);
                }
            }
            //zoom in on selected tile
            if (selectedItem != null && that.selected != selectedItem) {
                that.selected = selectedItem;
                //set the max width and height
                if (that.width < that.height) {
                    that.currentWidth = that.width * that.rowscols.Columns * 0.9; //0.9 to leave 10% space
                    that.currentHeight = (that.height / that.width) * that.currentWidth;
                } else {
                    that.currentHeight = that.height * that.rowscols.Rows * 0.9;
                    that.currentWidth = (that.width / that.height) * that.currentHeight;
                }

                var rowscols = that.GetRowsAndColumns(that.currentWidth - that.offsetX, that.currentHeight - that.offsetY, that.ratio, that.currentFilter.length);

                that.currentOffsetX = ((rowscols.TileWidth * selectedCol) * -1) + (that.width / 2) - (rowscols.TileWidth / 2);
                that.currentOffsetY = ((rowscols.TileHeight * selectedRow) * -1) + (that.height / 2) - (rowscols.TileHeight / 2);

                that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, 1000);
            } else {
                that.selected = selectedItem = null;
                //zoom out
                that.currentOffsetX = that.offsetX;
                that.currentOffsetY = that.offsetY;
                that.currentWidth = that.width;
                that.currentHeight = that.height;
                var rowscols = that.GetRowsAndColumns(that.currentWidth - that.offsetX, that.currentHeight - that.offsetY, that.ratio, that.currentFilter.length);
                that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, 1000);
            }


            $.publish("/PivotViewer/Views/Item/Selected", [selectedItem]);
        });

        $.subscribe("/PivotViewer/Views/Canvas/Hover", function (evt) {
            if (!that.isActive || that.selected.length > 0)
                return;

            for (var i = 0; i < that.tiles.length; i++) {
                if (that.tiles[i].Contains(evt.x, evt.y))
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
            //if on a touch device where ect.scale != undefined then have no delay
            var zoomTime = evt.scale != undefined ? 0 : 1000;
                        
            if (evt.scale != undefined) {
                if (evt.scale >= 1)
                    that.Scale += (evt.scale - 1);
                else {
                    that.Scale -= evt.scale;
                    that.Scale = that.Scale < 1 ? 1 : that.Scale;
                }
            } else if (evt.delta != undefined)
                that.Scale = evt.delta > 0 ? that.Scale / 0.7 : that.Scale * 0.7; //evt.delta > 0 ? that.Scale / evt.delta : that.Scale * Math.abs(evt.delta);

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

            var rowscols = that.GetRowsAndColumns(that.currentWidth - that.offsetX, that.currentHeight - that.offsetY, that.ratio, that.currentFilter.length);
            that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, zoomTime);

            //deselect tiles if zooming out
            if (evt.delta < 0) {
                for (var i = 0; i < that.tiles.length; i++) {
                    that.tiles[i].Selected(false);
                }
                that.selected = "";
                $.publish("/PivotViewer/Views/Item/Selected", [that.selected]);
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
    Setup: function (width, height, offsetX, offsetY, tileRatio) {
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.ratio = tileRatio;
        this.currentWidth = this.width;
        this.currentHeight = this.height;
        this.currentOffsetX = this.offsetX;
        this.currentOffsetY = this.offsetY;
    },
    Filter: function (dzTiles, currentFilter, sortFacet) {
        var that = this;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Grid View Filtered: ' + currentFilter.length);

        this.tiles = dzTiles;
        if (this.init) {
            this.SetInitialTiles(this.tiles, this.width, this.height);
        }

        //Sort
        this.tiles = this.tiles.sort(this.SortBy(sortFacet, false, function (a) {
            return $.isNumeric(a) ? a : a.toUpperCase();
        }));
        this.currentFilter = currentFilter;

        var pt1Timeout = 0;
        //zoom out first
        Debug.Log("this.currentWidth: " + this.currentWidth + " this.width: " + this.width);
        if (this.currentWidth != this.width && !this.init) {
            this.selected = selectedItem = "";
            //zoom out
            this.currentOffsetX = this.offsetX;
            this.currentOffsetY = this.offsetY;
            this.currentWidth = this.width;
            this.currentHeight = this.height;
            var rowscols = this.GetRowsAndColumns(this.currentWidth - this.offsetX, this.currentHeight - this.offsetY, this.ratio, this.tiles.length);
            var clearFilter = [];
            for (var i = 0; i < this.tiles.length; i++) {
                clearFilter.push(this.tiles[i].facetItem.Id);
            }
            this.SetVisibleTilePositions(rowscols, clearFilter, this.currentOffsetX, this.currentOffsetY, true, false, 1000);
            pt1Timeout = 1000;
        }

        setTimeout(function () {
            for (var i = 0; i < that.tiles.length; i++) {
                //setup tiles
                that.tiles[i].startx = that.tiles[i].x;
                that.tiles[i].starty = that.tiles[i].y;
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

            var pt2Timeout = currentFilter.length == that.tiles.length ? 0 : 500;
            //Delay pt2 animation
            setTimeout(function () {
                var rowscols = that.GetRowsAndColumns(that.width - that.offsetX, that.height - that.offsetY, that.ratio, that.currentFilter.length);
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
        var columns = keepColsRows ? this.rowscols.Columns : rowscols.Columns;
        if (!keepColsRows)
            this.rowscols = rowscols;

        var currentColumn = 0;
        var currentRow = 0;
        for (var i = 0; i < this.tiles.length; i++) {
            var filterindex = $.inArray(this.tiles[i].facetItem.Id, filter);
            if (filterindex >= 0) {
                if (initTiles) {
                    //setup tile initial positions
                    this.tiles[i].startx = this.tiles[i].x;
                    this.tiles[i].starty = this.tiles[i].y;
                    this.tiles[i].startwidth = this.tiles[i].width;
                    this.tiles[i].startheight = this.tiles[i].height;
                }

                //set destination positions
                this.tiles[i].destinationwidth = rowscols.TileWidth;
                this.tiles[i].destinationheight = rowscols.TileHeight;
                this.tiles[i].destinationx = (currentColumn * rowscols.TileWidth) + offsetX;
                this.tiles[i].destinationy = (currentRow * rowscols.TileHeight) + offsetY;
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
    }
});///
/// Graph (histogram) View
///
PivotViewer.Views.GraphView = PivotViewer.Views.TileBasedView.subClass({
    init: function () {
        this._super();
        var that = this;
        this.buckets = [];
        this.Scale = 1;
        this.canvasHeightUIAdjusted = 0;

        //Event Handlers
        $.subscribe("/PivotViewer/Views/Canvas/Click", function (evt) {
            if (!that.isActive)
                return;

            var selectedItem = null;
            var selectedCol = 0;
            var selectedRow = 0;
            var found = false;
            for (var i = 0; i < that.tiles.length; i++) {
                if (that.tiles[i].Contains(evt.x, evt.y)) {
                    selectedItem = that.tiles[i].facetItem.Id;
                    //determine row and column that tile is in in relation to the first tile
                    selectedCol = that.tiles[i].x;
                    selectedRow = that.tiles[i].y;
                    that.tiles[i].Selected(true);
                    offsetX = that.tiles[i].x;
                    offsetY = that.tiles[i].y;
                    found = true;
                } else {
                    that.tiles[i].Selected(false);
                }
            }


            //zoom in on selected tile
            if (selectedItem != null && that.selected != selectedItem) {
                that.selected = selectedItem;

                if (that.width < that.height) {
                    var newWidth = that.width * that.rowscols.Columns * 0.9; //0.9 to leave 10% space
                    var newHeight = (that.canvasHeightUIAdjusted / that.width) * newWidth;
                } else {
                    var newHeight = that.canvasHeightUIAdjusted * that.rowscols.Rows * 0.9;
                    var newWidth = (that.width / that.canvasHeightUIAdjusted) * newHeight;
                }

                var scaleY = newHeight / that.canvasHeightUIAdjusted;
                var scaleX = newWidth / (that.width - that.offsetX);
                that.columnWidth = newWidth / that.buckets.length;

                var rowscols = that.GetRowsAndColumns(that.columnWidth, newHeight, that.ratio, that.bigCount);

                that.currentOffsetX = -((selectedCol - that.offsetX) * scaleX) + (that.width / 2) - (rowscols.TileWidth / 2);

                var rowNumber = Math.ceil((that.canvasHeightUIAdjusted - selectedRow) / that.rowscols.TileHeight);
                that.currentOffsetY = 31 + (rowscols.TileHeight * (rowNumber - 1));

                that.SetVisibleTileGraphPositions(rowscols, that.currentOffsetX, that.currentOffsetY, true, true);
                $('.pv-viewarea-graphview-overlay div').fadeOut('slow');
            } else {
                that.selected = selectedItem = null;
                //zoom out
                that.currentOffsetX = that.offsetX;
                that.currentOffsetY = that.offsetY;
                that.currentWidth = that.width;
                that.currentHeight = that.height - 62;

                that.columnWidth = (that.width - that.offsetX) / that.buckets.length;

                var rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.currentHeight, that.ratio, that.bigCount);
                that.SetVisibleTileGraphPositions(rowscols, that.offsetX, that.offsetY, true, true);
                $('.pv-viewarea-graphview-overlay div').fadeIn('slow');
            }


            $.publish("/PivotViewer/Views/Item/Selected", [selectedItem]);
            if (!found) {
                var bucketNumber = Math.floor((evt.x - that.offsetX) / that.columnWidth);
                $.publish("/PivotViewer/Views/Item/Filtered", [{ Facet: that.sortFacet, Item: that.buckets[bucketNumber].startRange}]);
            }
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
                if (that.tiles[i].Contains(evt.x, evt.y))
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
            //if on a touch device where ect.scale != undefined then have no delay
            var zoomTime = evt.scale != undefined ? 0 : 1000;

            if (evt.scale != undefined) {
                if (evt.scale >= 1)
                    that.Scale += (evt.scale - 1);
                else {
                    that.Scale -= evt.scale;
                    that.Scale = that.Scale < 1 ? 1 : that.Scale;
                }
            } else if (evt.delta != undefined)
                that.Scale = evt.delta > 0 ? that.Scale / 0.7 : that.Scale * 0.7; //evt.delta > 0 ? that.Scale / evt.delta : that.Scale * Math.abs(evt.delta);

            if (that.Scale == NaN)
                that.Scale = 1;

            var newWidth = (that.width - that.offsetX) * that.Scale;
            var newHeight = (that.height - that.offsetY - 62) * that.Scale;



            //if trying to zoom out too far, reset to min
            if (newWidth < that.width || that.Scale == 1) {
                that.currentOffsetX = that.offsetX;
                that.currentOffsetY = that.offsetY;
                that.currentWidth = that.width - that.offsetX;
                that.currentHeight = that.height - that.offsetY - 62;
                that.columnWidth = (that.width - that.offsetX) / that.buckets.length;
                that.Scale = 1;
                $('.pv-viewarea-graphview-overlay div').fadeIn('slow');
            } else {
                
                //adjust position to base scale - then scale out to new scale
                //Move the scaled position to the mouse location
                that.currentOffsetX = evt.x - (((evt.x - that.currentOffsetX) / oldScale) * that.Scale);
                //Work out the scaled position of evt.y and then calc the difference between the actual evt.y
                //Still needs a slight tweak as there is something still offsetting it slightly
                that.currentOffsetY = ((that.canvasHeightUIAdjusted - evt.y + that.offsetY) * that.Scale) - (that.canvasHeightUIAdjusted + that.offsetY - evt.y); // newHeight - scaledPositionY; //((that.canvasHeightUIAdjusted - evt.y) * that.Scale) - scaledPositionY;
                that.currentWidth = newWidth;
                that.currentHeight = newHeight;
                that.columnWidth = newWidth / that.buckets.length;
                $('.pv-viewarea-graphview-overlay div').fadeOut('slow');
            }

            var rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.currentHeight, that.ratio, that.bigCount);
            that.SetVisibleTileGraphPositions(rowscols, that.currentOffsetX, that.currentOffsetY, true, true);

            //deselect tiles if zooming out
            if (evt.delta < 0) {
                for (var i = 0; i < that.tiles.length; i++) {
                    that.tiles[i].Selected(false);
                }
                that.selected = null;
                $.publish("/PivotViewer/Views/Item/Selected", [that.selected]);
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
    Setup: function (width, height, offsetX, offsetY, tileRatio) {
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.ratio = tileRatio;
        this.currentWidth = this.width;
        this.currentHeight = this.height;
        this.currentOffsetX = this.offsetX;
        this.currentOffsetY = this.offsetY;
        this.rowscols = null;
        this.bigCount = 0;
    },
    Filter: function (dzTiles, currentFilter, sortFacet) {
        var that = this;
        if (!Modernizr.canvas)
            return;

        Debug.Log('Graph View Filtered: ' + currentFilter.length);

        this.sortFacet = sortFacet;
        this.tiles = dzTiles;

        //Sort
        this.tiles = dzTiles.sort(this.SortBy(this.sortFacet, false, function (a) {
            return $.isNumeric(a) ? a : a.toUpperCase();
        }));
        this.currentFilter = currentFilter;

        this.buckets = this.Bucketize(dzTiles, currentFilter, this.sortFacet);

        this.columnWidth = (this.width - this.offsetX) / this.buckets.length;
        this.canvasHeightUIAdjusted = this.height - 62;

        //Find biggest bucket to determine tile size, rows and cols
        //Also create UI elements
        var uiElements = [];
        this.bigCount = 0;
        for (var i = 0; i < this.buckets.length; i++) {
            var styleClass = i % 2 == 0 ? "graphview-bucket-dark" : "graphview-bucket-light";
            uiElements[i] = "<div class='pv-viewarea-graphview-overlay-bucket " + styleClass + "' id='pv-viewarea-graphview-overlay-bucket-" + i + "' style='width: " + (Math.floor(this.columnWidth) - 4) + "px; height:" + this.height + "px; left:" + ((i * this.columnWidth) - 2) + "px;'>";
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
            this.tiles[i].startx = this.tiles[i].x;
            this.tiles[i].starty = this.tiles[i].y;
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

        var pt2Timeout = currentFilter.length == this.tiles.length ? 0 : 500;
        //Delay pt2 animation
        setTimeout(function () {
            that.rowscols = that.GetRowsAndColumns(that.columnWidth - 2, that.canvasHeightUIAdjusted, that.ratio, that.bigCount);
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
    /// Sets the tiles position based on the GetRowsAndColumns layout function
    SetVisibleTileGraphPositions: function (rowscols, offsetX, offsetY, initTiles, keepColsRows) {
        var columns = keepColsRows ? this.rowscols.Columns : rowscols.Columns;
        if (!keepColsRows)
            this.rowscols = rowscols;

        for (var i = 0; i < this.buckets.length; i++) {
            var currentColumn = 0;
            var currentRow = 0;
            for (var j = 0, _jLen = this.tiles.length; j < _jLen; j++) {
                if ($.inArray(this.tiles[j].facetItem.Id, this.buckets[i].Ids) >= 0) {

                    if (initTiles) {
                        //setup tile initial positions
                        this.tiles[j].startx = this.tiles[j].x;
                        this.tiles[j].starty = this.tiles[j].y;
                        this.tiles[j].startwidth = this.tiles[j].width;
                        this.tiles[j].startheight = this.tiles[j].height;
                    }

                    this.tiles[j].destinationwidth = rowscols.TileWidth;
                    this.tiles[j].destinationheight = rowscols.TileHeight;
                    this.tiles[j].destinationx = (i * this.columnWidth) + (currentColumn * rowscols.TileWidth) + offsetX;
                    this.tiles[j].destinationy = this.canvasHeightUIAdjusted - rowscols.TileHeight - (currentRow * rowscols.TileHeight) + offsetY;
                    this.tiles[j].start = PivotViewer.Utils.Now();
                    this.tiles[j].end = this.tiles[j].start + 1000;

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
    Bucketize: function (dzTiles, filterList, orderBy) {
        var bkts = [];
        for (var i = 0; i < dzTiles.length; i++) {
            if ($.inArray(dzTiles[i].facetItem.Id, filterList) >= 0) {
                var hasValue = false;
                for (var j = 0; j < dzTiles[i].facetItem.Facets.length; j++) {
                    if (dzTiles[i].facetItem.Facets[j].Name == orderBy && dzTiles[i].facetItem.Facets[j].FacetValues.length > 0) {
                        var val = dzTiles[i].facetItem.Facets[j].FacetValues[0].Value;
                        var found = false;
                        for (var k = 0; k < bkts.length; k++) {
                            if (bkts[k].startRange == val) {
                                bkts[k].Ids.push(dzTiles[i].facetItem.Id);
                                found = true;
                            }
                        }
                        if (!found)
                            bkts.push({ startRange: val, endRange: val, Ids: [dzTiles[i].facetItem.Id] });

                        hasValue = true;
                    }
                }
                //If not hasValue then add it as a (no info) item
                if (!hasValue) {
                    var val = "(no info)";
                    var found = false;
                    for (var k = 0; k < bkts.length; k++) {
                        if (bkts[k].startRange == val) {
                            bkts[k].Ids.push(dzTiles[i].facetItem.Id);
                            found = true;
                        }
                    }
                    if (!found)
                        bkts.push({ startRange: val, endRange: val, Ids: [dzTiles[i].facetItem.Id] });
                }
            }
        }

        var current = 0;
        while (bkts.length > 8) {
            if (current < bkts.length - 1) {
                bkts[current].endRange = bkts[current + 1].endRange;
                for (var i = 0; i < bkts[current + 1].Ids.length; i++) {
                    bkts[current].Ids.push(bkts[current + 1].Ids[i]);
                }
                bkts.splice(current + 1, 1);
                current++;
            } else
                current = 0;
        }

        return bkts;
    }
});//Image Controller interface - all image handlers must implement this
PivotViewer.Views.IImageController = Object.subClass({
    init: function () { },
    Setup: function (basePath) { },
    GetImagesAtLevel: function (id, level) { },
    Width: 0,
    Height: 0
});PivotViewer.Views.LoadImageSetHelper = Object.subClass({
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
});///
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
        this._maxLevel = 0;

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
                var items = $(xml).find("I");
                if (items.length == 0)
                    return;
                
                //If collection itself contains size information, use first one for now
                var dzcSize = $(items[0]).find('Size');
                if (dzcSize.length > 0) {
                    //calculate max level
                    that.Width = parseInt(dzcSize.attr("Width"));
                    that.Height = parseInt(dzcSize.attr("Height"));
                    var maxDim = that.Width > that.Height ? that.Width : that.Height;
                    that._maxLevel = Math.ceil(Math.log(maxDim) / Math.log(2));
                }

                //lets assume that each of the items have the same dzi properties, so just get the first one
                var dziSource = $(items[0]).attr('Source');
                $.ajax({
                    type: "GET",
                    url: that._baseUrl + "/" + dziSource,
                    dataType: "xml",
                    success: function (dzixml) {
                        //In case we find a dzi, recalculate sizes
                        var image = $(dzixml).find("Image");
                        if (image.length == 0)
                            return;

                        var jImage = $(image[0]);
                        that._tileSize = jImage.attr('TileSize');
                        that._tileFormat = jImage.attr('Format');
                        that._collageMaxLevel = jImage.attr('MaxLevel');

                        //calculate max level
                        var size = jImage.children().first();
                        that.Width = parseInt(size.attr("Width"));
                        that.Height = parseInt(size.attr("Height"));
                        var maxDim = that.Width > that.Height ? that.Width : that.Height;
                        that._maxLevel = Math.ceil(Math.log(maxDim) / Math.log(2));

                    },
                    complete: function (jqXHR, textStatus) {
                        //At this point we either have size info from collection or first dzi, so continue
                        for (var i = 0; i < items.length; i++) {
                            //Create an item image collection
                            var source = $(items[i]).attr('Source');
                            var itemId = $(items[i]).attr('Id');
                            var dzN = $(items[i]).attr('N');
                            var dzId = source.substring(source.lastIndexOf("/") + 1).replace(/\.xml/gi, "").replace(/\.dzi/gi, "");
                            var basePath = source.substring(0, source.lastIndexOf("/"));
                            if (basePath.length > 0)
                                basePath = basePath + '/';
                            that._items.push(new PivotViewer.Views.DeepZoomItem(itemId, dzId, dzN, basePath));
                        }

                        //Loaded DeepZoom collection
                        $.publish("/PivotViewer/ImageController/Collection/Loaded", null);
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        //Make sure throbber is removed else everyone thinks the app is still running
                        $('.pv-loading').remove();
                        //No need to throw alert
                    }
                });
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
                window.alert (msg);
            }
        });
    },

    GetImagesAtLevel: function (id, level) {
        //if the request level is greater than the collections max then set to max
        //level = (level > _maxLevel ? _maxLevel : level);

        //For PoC max level is 8
        level = (level > 7 ? 7 : level);
        level = (level <= 0 ? 6 : level);

        //find imageId
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].ItemId == id) {

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
                    var imageList = this.GetImageList(this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/6/", 6); ;
                    var newLevel = new PivotViewer.Views.LoadImageSetHelper();
                    newLevel.LoadImages(imageList);
                    this._items[i].Levels.push(newLevel);
                    return null;
                }
                else if (this._items[i].Levels.length < level && !this._zooming) {
                    //requested level does not exist, and the Levels list is smaller than the requested level
                    var imageList = this.GetImageList(this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/" + level + "/", level);
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
                        var imageList = this.GetImageList(this._baseUrl + "/" + this._items[i].BasePath + this._items[i].DZId + "_files/" + j + "/", j);
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

    GetImageList: function (basePath, level) {
        var fileNames = [];

        var levelWidth = Math.ceil(this.Width / Math.pow(2, this._maxLevel - level));
        var levelHeight = Math.ceil(this.Height / Math.pow(2, this._maxLevel - level));
        //based on the width for this level, get the slices based on the DZ Tile Size
        var hslices = Math.ceil(levelWidth / this._tileSize);
        var vslices = Math.ceil(levelHeight / this._tileSize);

        //Construct list of file names based on number of vertical and horizontal images
        for (var i = 0; i < hslices; i++) {
            for (var j = 0; j < vslices; j++) {
                fileNames.push(basePath + i + "_" + j + "." + this._tileFormat);
            }
        }
        return fileNames;
    }
});

PivotViewer.Views.DeepZoomItem = Object.subClass({
    init: function (ItemId, DZId, DZn, BasePath) {
        this.ItemId = ItemId,
        this.DZId = DZId,
        this.DZN = parseInt(DZn),
        this.BasePath = BasePath,
        this.Levels = [];
    }
});///
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
            this._tiles.push(tile);
        }
        return this._tiles;
    },

    AnimateTiles: function () {
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
                var now = PivotViewer.Utils.Now() - this._tiles[i].start,
                end = this._tiles[i].end - this._tiles[i].start;
                //use the easing function to determine the next position
                if (now <= end) {
                    //at least one tile is moving
                    //isAnimating = true;

                    //if the position is different from the destination position then zooming is happening
                    if (this._tiles[i].x != this._tiles[i].destinationx || this._tiles[i].y != this._tiles[i].destinationy)
                        isZooming = true;

                    this._tiles[i].x = this._easing.ease(
                        now, 										// curr time
                        this._tiles[i].startx, 							// start position
                        this._tiles[i].destinationx - this._tiles[i].startx, // relative end position
                        end											// end time
                    );

                    this._tiles[i].y = this._easing.ease(
                    now,
                    this._tiles[i].starty,
                    this._tiles[i].destinationy - this._tiles[i].starty,
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
                    this._tiles[i].x = this._tiles[i].destinationx;
                    this._tiles[i].y = this._tiles[i].destinationy;
                    this._tiles[i].width = this._tiles[i].destinationwidth;
                    this._tiles[i].height = this._tiles[i].destinationheight;
                }

                //check if the destination will be in the visible area
                if (this._tiles[i].destinationx + this._tiles[i].destinationwidth < 0 || this._tiles[i].destinationx > context.canvas.width || this._tiles[i].destinationy + this._tiles[i].destinationheight < 0 || this._tiles[i].destinationy > context.canvas.height)
                    this._tiles[i].destinationVisible = false;
                else
                    this._tiles[i].destinationVisible = true;
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
            if (this._tiles[i].x + this._tiles[i].width > 0 && this._tiles[i].x < context.canvas.width && this._tiles[i].y + this._tiles[i].height > 0 && this._tiles[i].y < context.canvas.height) {
                if (isAnimating)
                    this._tiles[i].DrawEmpty();
                else
                    this._tiles[i].Draw();
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
                that.AnimateTiles();
            });
        } else {
            this._started = false;
            return;
        }
    },

    BeginAnimation: function () {
        if (!this._started && this._tiles.length > 0) {
            this._breaks = false;
            this.AnimateTiles();
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
    GetTileRaio: function () {
        return this._imageController.Height / this._imageController.Width;
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
    },

    Draw: function () {
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
                this._images(this.facetItem, this.context, this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            }
            else if (this._images.length > 0 && this._images[0] instanceof Image) {
                //if the collection contains an image
                for (var i = 0; i < this._images.length; i++) {
                    //only clearing a small portion of the canvas
                    //http://www.html5rocks.com/en/tutorials/canvas/performance/
                    //this.context.fillRect(this.x, this.y, this.width, this.height);
                    this.context.drawImage(this._images[i], this.x + 2, this.y + 2, this.width - 4, this.height - 4);
                }
            }
        }
        else {
            this.DrawEmpty();
        }

        if (this._selected) {
            //draw a blue border
            this.context.beginPath();
            this.context.rect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            this.context.lineWidth = 4;
            this.context.strokeStyle = "#92C4E1";
            this.context.stroke();
        }
    },
    //http://simonsarris.com/blog/510-making-html5-canvas-useful
    Contains: function (mx, my) {
        return (this.x <= mx) && (this.x + this.width >= mx) &&
        (this.y <= my) && (this.y + this.height >= my);
    },
    DrawEmpty: function () {
        if (this._controller.DrawLevel == undefined) {
            //draw an empty square
            this.context.beginPath();
            this.context.fillStyle = "#D7DDDD";
            this.context.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            this.context.rect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            this.context.lineWidth = 1;
            this.context.strokeStyle = "white";
            this.context.stroke();
        } else {
            //use the controllers blank tile
            this._controller.DrawLevel(this.facetItem, this.context, this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        }
    },
    CollectionRoot: "",
    now: null,
    end: null,
    x: 0,
    y: 0,
    startx: 0,
    starty: 0,
    destinationx: 0,
    destinationy: 0,
    width: 0,
    height: 0,
    startwidth: 0,
    startheight: 0,
    destinationwidth: 0,
    destinationheight: 0,
    destinationVisible: true,
    context: null,
    facetItem: null,
    Selected: function (selected) { this._selected = selected }
});//PivotViewer jQuery extension
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