//PivotViewer 0.4.4
var PivotViewer = PivotViewer || {};
PivotViewer.Models = {};
PivotViewer.Models.Loaders = {};
PivotViewer.Utils = {};
PivotViewer.Views = {};
//Debug
var Debug = Debug || {};
(function (d) {

	// the topic/subscription hash
	var cache = {};

	// String: topic, Array?: args
	d.publish = function (topic, args) {
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
            .replace(/\)/gi, "\\)");
};

PivotViewer.Utils.EscapeItemId = function (itemId) {
    return itemId
            .replace(/\s+/gi, "|")
            .replace(/'/gi, "")
            .replace(/\(/gi, "")
            .replace(/\)/gi, "")
            .replace(/\./gi, "");
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
		this._type = Type != null && Type != undefined ? Type : PivotViewer.Models.FacetType.String;
		this.IsFilterVisible = IsFilterVisible != null && IsFilterVisible != undefined ? IsFilterVisible : true;
		this.IsMetaDataVisible = IsMetaDataVisible != null && IsMetaDataVisible != undefined ? IsMetaDataVisible : true;
		this.IsWordWheelVisible = IsWordWheelVisible != null && IsWordWheelVisible != undefined ? IsWordWheelVisible : true;
		this.CustomSort;
	},
	getType: function () {
		switch (this._type) {
			case "String":
				return PivotViewer.Models.FacetType.String;
				break;
		}
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
		this.Img = Img,
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
                        PivotViewer.Models.FacetType.String,
                        facetElement.attr(namespacePrefix + ":IsFilterVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsFilterVisible").toLowerCase() == "true" ? true : false) : false,
                        facetElement.attr(namespacePrefix + ":IsMetaDataVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsMetaDataVisible").toLowerCase() == "true" ? true : false) : false,
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
                                        var fValue = new PivotViewer.Models.FacetValue(v);
                                        f.AddFacetValue(fValue);
                                    }
                                }
                            }
                            item.Facets.push(f);
                        }
                        collection.Items.push(item);
                    }
                }
                $.publish("/PivotViewer/Models/Collection/Loaded", null);
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
		var tileHeight = tileWidth * tileRatio;
		var canvasRows = Math.floor(canvasHeight / tileHeight);
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
});/// Grid view
///
PivotViewer.Views.GridView = PivotViewer.Views.TileBasedView.subClass({
	init: function () {
		this._super();
		var that = this;
		//Event Handlers
		$.subscribe("/PivotViewer/Views/Canvas/Click", function (evt) {
			if (!that.isActive)
				return;

			var selectedItem = "";
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
			if (selectedItem.length > 0 && that.selected != selectedItem) {
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

				//			that.currentOffsetX = offsetX;
				//			that.currentOffsetY = offsetY;

				that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, 1000);
			} else {
				that.selected = selectedItem = "";
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

			var preWidth = that.currentWidth;
			var preHeight = that.currentHeight;
			//150% zoom
			//var newWidth = that.currentWidth + ((that.currentWidth * 0.5) * (evt.delta >= 0 ? 1 : -1));

			if (evt.scale > 0)//that.prevScale < evt.scale)
				that.currentScale += Math.abs(evt.scale - that.prevScale);
			else
				that.currentScale -= Math.abs(that.prevScale - evt.scale);


			var newWidth = that.width;
			if (evt.scale != undefined)
				newWidth = that.width * (evt.scale + that.prevScale); //(evt.scale * that.currentScale);
			else if (evt.delta != undefined)
			// + delta = zoom in
				newWidth = that.currentWidth + ((that.currentWidth * 0.5) * (evt.delta >= 0 ? 1 : -1));
			else
				return;


			that.prevScale = evt.scale;

			//if trying to zoom out too far, reset to min
			if (newWidth < that.width) {
				that.currentOffsetX = that.offsetX;
				that.currentOffsetY = that.offsetY;
				that.currentWidth = that.width;
				that.currentHeight = that.height;
				that.prevScale = 0;
			}
			else {

				that.currentWidth = newWidth;
				//keep original ratio
				that.currentHeight = (preHeight / preWidth) * that.currentWidth;

				//if trying to zoom too far in, set to max
				if ((that.currentWidth / that.rowscols.Columns) > that.width) {
					that.currentWidth = that.width * that.rowscols.Columns;
					//keep height ratio
					that.currentHeight = (preHeight / preWidth) * that.currentWidth;
				}
				//if trying to zoom too far in, set to max height
				if ((that.currentHeight / that.rowscols.Rows) > that.height) {
					that.currentHeight = that.height * that.rowscols.Rows;
					//keep height ratio
					that.currentWidth = (preWidth / preHeight) * that.currentHeight;
				}

				//Work out the percentage of the total width evt.x
				//multiply that with the difference in width
				//add the offset
				that.currentOffsetX = ((((evt.x - that.offsetX) / that.width) * (that.currentWidth - that.width)) * -1) + that.offsetX;
				that.currentOffsetY = ((((evt.y - that.offsetY) / that.height) * (that.currentHeight - that.height)) * -1) + that.offsetY;


				//			if (evt.delta >= 0) {
				//				that.currentOffsetX = ((((evt.x - that.offsetX) / that.width) * (that.currentWidth - that.width)) * -1) + that.offsetX;
				//			} else {
				//				that.currentOffsetX = ((((evt.x - that.offsetX) / that.width) * (that.currentWidth - that.width)) * -1) + that.offsetX;
				//			}

				/*
				//The x and y offset is the difference is width, multiplied by the percentage of the mouse position to the width/height
				var mouseXPercent = Math.round(((evt.x - that.offsetX) / ((that.width - that.offsetX) / 10))) / 10;
				var mouseYPercent = Math.round(((evt.y - that.offsetY) / ((that.height - that.offsetY) / 10))) / 10;
				if (evt.delta >= 0) {
				that.currentOffsetX -= (that.width / 2) - evt.x;// (that.currentWidth - preWidth) * mouseXPercent;
				that.currentOffsetY -= (that.currentHeight - preHeight) * mouseYPercent;
				} else {
				that.currentOffsetX += (preWidth - that.currentWidth) * mouseXPercent;
				that.currentOffsetY += (preHeight - that.currentHeight) * mouseYPercent;
				}

				//bounds adjustment
				//LHS out
				if (that.currentOffsetX > that.offsetX)
				that.currentOffsetX = that.offsetX;
				//RHS out
				if ((that.currentOffsetX + that.currentWidth) < that.width)
				that.currentOffsetX = that.offsetX;
				//Top out
				if (that.currentOffsetY > that.offsetY)
				that.currentOffsetY = that.offsetY;
				//Bottom out
				if ((that.currentOffsetY + that.currentHeight) < that.height)
				that.currentOffsetY = that.offsetY;
				*/
			}

			var rowscols = that.GetRowsAndColumns(that.currentWidth - that.offsetX, that.currentHeight - that.offsetY, that.ratio, that.currentFilter.length);
			that.SetVisibleTilePositions(rowscols, that.currentFilter, that.currentOffsetX, that.currentOffsetY, true, true, 100);

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
			if (dragX < 0 && (that.currentOffsetX - that.offsetX) < -1 * (that.currentWidth - that.width)) {
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
			return a.toUpperCase()
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
					that.tiles[i].start = Now();
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
		return '../media/GridView.png';
	},
	GetButtonImageSelected: function () {
		return '../media/GridViewSelected.png';
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
				this.tiles[i].start = Now();
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
});
/// Graph (histogram) View
///
PivotViewer.Views.GraphView = PivotViewer.Views.TileBasedView.subClass({
	init: function () {
		this._super();
		var that = this;
		this.buckets = [];
		this.canvasHeightUIAdjusted = 0;

		//Event Handlers
		$.subscribe("/PivotViewer/Views/Canvas/Click", function (evt) {
			if (!that.isActive)
				return;

			var selectedItem = "";
			for (var i = 0; i < that.tiles.length; i++) {
				if (that.tiles[i].Contains(evt.x, evt.y)) {
					selectedItem = that.tiles[i].facetItem.Id;
					break;
				}
			}

			if (selectedItem.length > 0)
				$.publish("/PivotViewer/Views/Item/Selected", [selectedItem]);
			else {
				var bucketNumber = Math.floor(evt.x / that.columnWidth);
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

		//var rowscols = GetRowsAndColumns(width, height, 1, currentFilter.length);

		//Sort
		this.tiles = dzTiles.sort(this.SortBy(this.sortFacet, false, function (a) {
			return a.toUpperCase()
		}));
		this.currentFilter = currentFilter;

		this.buckets = this.Bucketize(dzTiles, currentFilter, this.sortFacet);

		this.columnWidth = (this.width - this.offsetX) / this.buckets.length;
		this.canvasHeightUIAdjusted = this.height - 62;

		//Find biggest bucket to determine tile size, rows and cols
		//Also create UI elements
		var uiElements = [];
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
				SetOuterTileDestination(this.width, this.height, this.tiles[i]);
				this.tiles[i].start = Now();
				this.tiles[i].end = this.tiles[i].start + 1000;
			}
		}

		var pt2Timeout = currentFilter.length == this.tiles.length ? 0 : 500;
		//Delay pt2 animation
		setTimeout(function () {
			var renderWidth = that.width - that.offsetX;
			var renderHeight = that.height - that.offsetY;
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
		return '../media/GraphView.png';
	},
	GetButtonImageSelected: function () {
		return '../media/GraphViewSelected.png';
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
			for (var j = this.tiles.length - 1; j > -1; j -= 1) {
				if ($.inArray(this.tiles[j].facetItem.Id, this.buckets[i].Ids) >= 0) {

					if (initTiles) {
						//setup tile initial positions
						this.tiles[i].startx = this.tiles[i].x;
						this.tiles[i].starty = this.tiles[i].y;
						this.tiles[i].startwidth = this.tiles[i].width;
						this.tiles[i].startheight = this.tiles[i].height;
					}

					this.tiles[j].destinationwidth = rowscols.TileWidth;
					this.tiles[j].destinationheight = rowscols.TileHeight;
					this.tiles[j].destinationx = (i * this.columnWidth) + (currentColumn * rowscols.TileWidth) + offsetX;
					this.tiles[j].destinationy = this.canvasHeightUIAdjusted - rowscols.TileHeight - (currentRow * rowscols.TileHeight) + offsetY;
					this.tiles[j].start = Now();
					this.tiles[j].end = this.tiles[j].start + 1000;

					if (currentColumn == rowscols.Columns - 1) {
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
});
///
/// Deep Zoom Controller
/// used to create the initial deep zoom tiles and their animation based on the locations set in the views
///
PivotViewer.Views.DeepZoomController = function () {
    var _tiles = [],
        _started = false,
        _breaks = false,
        _easing = new Easing.Easer({ type: "circular", side: "both" }),
        _imageController,
        _isZooming = false,
        _canvasContext,
        _helpers = [],
        _helperText = "";

    InitDZController = function (pivotCollectionItems, baseCollectionPath, canvasContext) {

        _imageController = new PivotViewer.Views.DeepZoomImageController();
        for (var i = 0; i < pivotCollectionItems.length; i++) {
            var tile = new PivotViewer.Views.DeepZoomTile(_imageController);
            tile.facetItem = pivotCollectionItems[i];
            tile.CollectionRoot = baseCollectionPath.replace(/\\/gi, "/").replace(/\.xml/gi, "");
            _canvasContext = canvasContext;
            tile.context = _canvasContext;
            _tiles.push(tile);
        }
        //Init DZ images
        _imageController.Init(baseCollectionPath.replace("\\", "/"));

        return _tiles;
    };

    AnimateTiles = function () {
        _started = true;

        if (_tiles.length > 0 && _tiles[0].context != null) {
            var context = _tiles[0].context;
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);

            //TODO investigate this for performance: http://stackoverflow.com/questions/7787219/javascript-ios5-javascript-execution-exceeded-timeout

            var isZooming = false;
            //Set tile properties
            for (var i = 0; i < _tiles.length; i++) {
                var now = Now() - _tiles[i].start,
                end = _tiles[i].end - _tiles[i].start;
                //use the easing function to determine the next position
                if (now <= end) {

                    //if the position is different from the destination position then zooming is happening
                    if (_tiles[i].x != _tiles[i].destinationx || _tiles[i].y != _tiles[i].destinationy)
                        isZooming = true;

                    _tiles[i].x = _easing.ease(
                        now, 										// curr time
                        _tiles[i].startx, 							// start position
                        _tiles[i].destinationx - _tiles[i].startx, // relative end position
                        end											// end time
                    );

                    _tiles[i].y = _easing.ease(
                    now,
                    _tiles[i].starty,
                    _tiles[i].destinationy - _tiles[i].starty,
                    end
                );

                    //if the width/height is different from the destination width/height then zooming is happening
                    if (_tiles[i].width != _tiles[i].destinationWidth || _tiles[i].height != _tiles[i].destinationHeight)
                        isZooming = true;

                    _tiles[i].width = _easing.ease(
                    now,
                    _tiles[i].startwidth,
                    _tiles[i].destinationwidth - _tiles[i].startwidth,
                    end
                );

                    _tiles[i].height = _easing.ease(
                    now,
                    _tiles[i].startheight,
                    _tiles[i].destinationheight - _tiles[i].startheight,
                    end
                );
                } else {
                    _tiles[i].x = _tiles[i].destinationx;
                    //_tiles[i].startx = _tiles[i].destinationx;

                    _tiles[i].y = _tiles[i].destinationy;
                    //_tiles[i].starty = _tiles[i].destinationy;

                    _tiles[i].width = _tiles[i].destinationwidth;
                    //_tiles[i].startwidth = _tiles[i].destinationwidth;

                    _tiles[i].height = _tiles[i].destinationheight;
                    //_tiles[i].startheight = _tiles[i].destinationheight;
                }

                //check if the destination will be in the visible area
                if (_tiles[i].destinationx + _tiles[i].destinationwidth < 0 || _tiles[i].destinationx > context.canvas.width || _tiles[i].destinationy + _tiles[i].destinationheight < 0 || _tiles[i].destinationy > context.canvas.height)
                    _tiles[i].destinationVisible = false;
                else
                    _tiles[i].destinationVisible = true;
            }
        }

        //fire zoom event
        if (_isZooming != isZooming) {
            _isZooming = isZooming;
            $.publish("/PivotViewer/DeepZoom/Zoom", [_isZooming]);
        }

        //one properties set then draw
        for (var i = 0; i < _tiles.length; i++) {
            //only draw if in visible area
            if (_tiles[i].x + _tiles[i].width > 0 && _tiles[i].x < context.canvas.width && _tiles[i].y + _tiles[i].height > 0 && _tiles[i].y < context.canvas.height)
                _tiles[i].Draw();
        }

        //Helpers
        if (debug) {
            //Draw point if one requested
            if (_helpers.length > 0) {
                for (var i = 0; i < _helpers.length; i++) {
                    _canvasContext.beginPath();
                    _canvasContext.moveTo(_helpers[i].x, _helpers[i].y);
                    _canvasContext.arc(_helpers[i].x + 1, _helpers[i].y + 1, 10, 0, Math.PI * 2, true);
                    _canvasContext.fillStyle = "#FF0000";
                    _canvasContext.fill();
                    _canvasContext.beginPath();
                    _canvasContext.rect(_helpers[i].x + 25, _helpers[i].y - 40, 50, 13);
                    _canvasContext.fillStyle = "white";
                    _canvasContext.fill();
                    _canvasContext.fillStyle = "black";
                    _canvasContext.fillText(_helpers[i].x + ", " + _helpers[i].y, _helpers[i].x + 30, _helpers[i].y - 30);
                }
            }

            if (_helperText.length > 0) {
                _canvasContext.beginPath();
                _canvasContext.rect(220, 5, 500, 14);
                _canvasContext.fillStyle = "white";
                _canvasContext.fill();
                _canvasContext.fillStyle = "black";
                _canvasContext.fillText(_helperText, 225, 14);
            }
        }

        // request new frame
        if (!_breaks) {
            requestAnimFrame(function () {
                AnimateTiles();
            });
        } else {
            _started = false;
            return;
        }
    };

    Now = function () {
        if (Date.now)
            return Date.now();
        else
            return (new Date().getTime());
    };

    return {
        Init: InitDZController,
        BeginAnimation: function () {
            if (!_started && _tiles.length > 0) {
                _breaks = false;
                AnimateTiles();
            }
        },
        StopAnimation: function () {
            _breaks = true;
        },
        SetLinearEasingBoth: function () {
            _easing = new Easing.Easer({ type: "linear", side: "both" });
        },
        SetCircularEasingBoth: function () {
            _easing = new Easing.Easer({ type: "circular", side: "both" });
        },
        SetQuarticEasingOut: function () {
            _easing = new Easing.Easer({ type: "quartic", side: "out" });
        },
        GetTileRaio: function () {
            return _imageController.Height() / _imageController.Width();
        },
        DrawHelpers: function (helpers) {
            _helpers = helpers;
        },
        DrawHelperText: function (text) {
            _helperText = text;
        }
    };
};

///
/// Deep Zoom Tile
/// Used to contain the details of an individual tile, and to draw the tile on a given canvas context
///
PivotViewer.Views.DeepZoomTile = Object.subClass({
    init: function (DZController) {
        if (!(this instanceof PivotViewer.Views.DeepZoomTile)) {
            return new PivotViewer.Views.DeepZoomTile(DZController);
        }
        this._controller = DZController;
        this._image = new Image();
        this._imageLoaded = false;
        this._selected = false;
        this._controller = DZController;
        this._level = 0;
        this._images = null;

        this._image.onload = function () {
            this._imageLoaded = true;
        };
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
            //if (thisLevel != _level || _images == null) {
            this._level = thisLevel;
            this._images = this._controller.GetImagesAtLevel(this.facetItem.Img, this._level);
            //}
        }

        if (this._images != null) {
            //determine width and height
            //			var width = this.width; // -4;
            //			var height = this.height;// -4;
            //			if (_controller.Width() > _controller.Height())
            //				height = (_controller.Height() / _controller.Width()) * height;
            //			else
            //				width = (_controller.Height() / _controller.Width()) * width;

            for (var i = 0; i < this._images.length; i++) {
                this.context.drawImage(this._images[i], this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            }
        }
        else {
            //draw an empty square
            this.context.beginPath();
            this.context.rect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            this.context.lineWidth = 1;
            this.context.strokeStyle = "black";
            this.context.stroke();
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
});

///
/// Deep Zoom Image Getter
/// Retrieves and caches images
///
PivotViewer.Views.DeepZoomImageController = function () {
    var _items = [],
        _collageItems = [],
        _baseUrl = "",
        _collageUrl = "",
        _collageMaxLevel = 0,
        _tileSize = 256,
        _width = 0,
        _height = 0,
        _tileFormat = "jpg",
        _maxLevel = 0,
        _zooming = false;

    initDZ = function (deepzoomCollection) {
        //get base URL
        _baseUrl = deepzoomCollection.substring(0, deepzoomCollection.lastIndexOf("/"));
        _collageUrl = deepzoomCollection.substring(deepzoomCollection.lastIndexOf("/") + 1).replace('.xml', '_files');
        //load dzi and start creating array of id's and DeepZoomLevels
        $.ajax({
            type: "GET",
            url: deepzoomCollection,
            dataType: "xml",
            success: function (xml) {
                var items = $(xml).find("I");
                if (items.length == 0)
                    return;
                //lets assume that each of the items have the same dzi properties, so just get the first one
                var dziSource = $(items[0]).attr('Source');
                $.ajax({
                    type: "GET",
                    url: _baseUrl + "/" + dziSource,
                    dataType: "xml",
                    success: function (dzixml) {
                        var image = $(dzixml).find("Image");
                        if (image.length == 0)
                            return;

                        var jImage = $(image[0]);
                        _tileSize = jImage.attr('TileSize');
                        _tileFormat = jImage.attr('Format');
                        _collageMaxLevel = jImage.attr('MaxLevel');
                        //calculate max level
                        var size = jImage.children().first();
                        _width = parseInt(size.attr("Width"));
                        _height = parseInt(size.attr("Height"));
                        var maxDim = _width > _height ? _width : _height;
                        _maxLevel = Math.ceil(Math.log(maxDim) / Math.log(2));

                        //create all images
                        for (var i = 0; i < items.length; i++) {
                            //Create an item image collection
                            var source = $(items[i]).attr('Source');
                            var itemId = $(items[i]).attr('Id');
                            var dzN = $(items[i]).attr('N');
                            var dzId = source.substring(source.lastIndexOf("/") + 1).replace(/\.xml/gi, "").replace(/\.dzi/gi, "");
                            var basePath = source.substring(0, source.lastIndexOf("/"));
                            if (basePath.length = 0)
                                basePath = '/';
                            _items.push(new PivotViewer.Views.DeepZoomItem(itemId, dzId, dzN, basePath));
                        }

                        //Loaded DeepZoom collection
                        $.publish("/PivotViewer/DeepZoom/Collection/Loaded", null);
                    }
                });
            }
        });
    };

    getImageLevel = function (id, level) {
        //if the request level is greater than the collections max then set to max
        //level = (level > _maxLevel ? _maxLevel : level);

        //For PoC max level is 8
        level = (level > 7 ? 7 : level);
        level = (level <= 0 ? 6 : level);

        //find imageId
        for (var i = 0; i < _items.length; i++) {
            if (_items[i].ItemId == id) {


                //to work out collage image
                //convert image n to base 2
                //convert to array and put even and odd bits into a string
                //convert strings to base 10 - this represents the tile row and col
                var baseTwo = _items[i].DZN.toString(2);
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

                if ((_items[i].Levels == undefined || _items[i].Levels.length == 0) && !_zooming) {
                    //create 0 level
                    var imageList = getImageList(_baseUrl + "/" + _items[i].BasePath + _items[i].DZId + "_files/6/", 6); ;
                    var newLevel = new PivotViewer.Views.DeepZoomLevel();
                    newLevel.LoadImages(imageList);
                    _items[i].Levels.push(newLevel);
                    return null;
                }
                else if (_items[i].Levels.length < level && !_zooming) {
                    //requested level does not exist, and the Levels list is smaller than the requested level
                    var imageList = getImageList(_baseUrl + "/" + _items[i].BasePath + _items[i].DZId + "_files/" + level + "/", level);
                    var newLevel = new PivotViewer.Views.DeepZoomLevel();
                    newLevel.LoadImages(imageList);
                    _items[i].Levels.splice(level, 0, newLevel);
                }

                //get best loaded level to return
                for (var j = level; j > -1; j--) {
                    if (_items[i].Levels[j] != undefined && _items[i].Levels[j].IsLoaded()) {
                        return _items[i].Levels[j].GetImages();
                    }
                    //if request level has not been requested yet
                    if (j == level && _items[i].Levels[j] == undefined && !_zooming) {
                        //create array of images to getagePath.replace('.dzi', '').replace('\/\/', '\/');
                        var imageList = getImageList(_baseUrl + "/" + _items[i].BasePath + _items[i].DZId + "_files/" + j + "/", j);
                        //create level
                        var newLevel = new PivotViewer.Views.DeepZoomLevel();
                        newLevel.LoadImages(imageList);
                        _items[i].Levels.splice(j, 0, newLevel);
                    }
                }

                return null;
            }
        }
        return null;
    };

    getImageList = function (basePath, level) {
        var fileNames = [];

        var levelWidth = Math.ceil(_width / Math.pow(2, _maxLevel - level));
        var levelHeight = Math.ceil(_height / Math.pow(2, _maxLevel - level));
        //based on the width for this level, get the slices based on the DZ Tile Size
        var hslices = Math.ceil(levelWidth / _tileSize);
        var vslices = Math.ceil(levelHeight / _tileSize);

        //Construct list of file names based on number of vertical and horizontal images
        for (var i = 0; i < hslices; i++) {
            for (var j = 0; j < vslices; j++) {
                fileNames.push(basePath + i + "_" + j + "." + _tileFormat);
            }
        }
        return fileNames;
    }

    //Events
    $.subscribe("/PivotViewer/DeepZoom/Zoom", function (evt) {
        _zooming = evt;
    });

    return {
        Init: initDZ,
        GetImagesAtLevel: getImageLevel,
        Width: function () { return _width; },
        Height: function () { return _height; }
    };
};

PivotViewer.Views.DeepZoomItem = function (ItemId, DZId, DZn, BasePath) {
    var _itemId = ItemId,
        _dzId = DZId,
        _n = parseInt(DZn),
        _basePath = BasePath,
        _levels = [];
    return {
        ItemId: _itemId,
        DZId: _dzId,
        DZN: _n,
        BasePath: _basePath,
        Levels: _levels
    };
};

PivotViewer.Views.DeepZoomLevel = function () {
    var _images = [],
        _loaded = false;

    //Load an array of urls
    loadImages = function (images) {
        for (var i = 0; i < images.length; i++) {
            var img = new Image();
            img.src = images[i];
            img.onload = function () {
                _loaded = true;
            };
            _images.push(img);
        }
    };

    isLoaded = function () {
        if (!_loaded) {
            //check if the images have loaded
            var loadedCount = 0;
            for (var i = 0; i < _images.length; i++) {
                if (_images[i].complete)
                    loadedCount++;
            }
            if (loadedCount == _images.length)
                _loaded = true;
        }
        return _loaded;
    }

    return {
        LoadImages: loadImages,
        IsLoaded: function () { return _loaded; },
        GetImages: function () { return _images; }
    }
};//PivotViewer jQuery extension
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
        var DZXML = defaults.PivotCollection.ImageBase;
        if(!(DZXML.indexOf('http', 0) >= 0 || DZXML.indexOf('www.', 0) >= 0))
            DZXML = defaults.PivotCollection.CXMLBase.substring(0, defaults.PivotCollection.CXMLBase.lastIndexOf('/') + 1) + DZXML;
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